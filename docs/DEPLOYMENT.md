# Deployment — Ek Nai Pehal NGO Platform

This document describes how to actually deploy this specific codebase — its two independent apps, the environment variables each requires, and the failure modes that were encountered and diagnosed during development, so they don't need to be rediscovered.

## Topology

```
client/  →  Vercel            (static Vite build, served from a CDN)
server/  →  Render or Railway  (long-lived Node process — server.js awaits connectDB() before listening)
MongoDB  →  MongoDB Atlas      (managed, independent of both)
Razorpay →  Orders + Checkout API (test mode for staging, live mode for production)
```

`client/` and `server/` deploy independently, on independent schedules, with no shared build artifacts. The only coupling between them is the versioned REST contract documented in `API_DOCUMENTATION.md` — a frontend copy change can ship without touching the backend, and a backend bugfix can ship without a frontend rebuild.

---

## Prerequisites

- A MongoDB Atlas cluster (or equivalent MongoDB instance reachable from the backend host) with a connection string.
- A Razorpay account, in Test Mode for staging/QA and Live Mode for production — these are genuinely different key pairs, not a mode flag on the same keys.
- A bcrypt hash of the intended admin password (generate with `bcryptjs`'s `hashSync`, not stored as plaintext anywhere, including in shell history — generate it in a throwaway Node REPL).
- A Google Gemini API key, for the chatbot feature (`services/geminiService.js`).

---

## Backend Deployment (Render / Railway)

### Environment Variables

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` — this flips `config/cookieOptions.js` to `Secure; SameSite=None` and enables `trust proxy` in `app.js` |
| `PORT` | Usually injected by the platform; `config/env.js` defaults to `5000` if unset |
| `MONGODB_URI` | Full Atlas connection string, including credentials |
| `CLIENT_ORIGIN` | **Comma-separated, exact-match list** of every origin allowed to call this API — must include the deployed frontend's exact scheme+host+port. `config/env.js` has a *default* value for local development; production deployments must set this explicitly. A real incident during development traced a broken donation form directly back to this value being present only in the code's default and missing from the actual deployed `.env` — the browser's CORS preflight failed with no request ever reaching the server logs, which looked like a routing bug until the actual cause (a missing env var, not missing code) was found. |
| `LOG_LEVEL` | `info` in production (`config/logger.js`, pino) |
| `GEMINI_API_KEY` | Chatbot |
| `ADMIN_EMAIL` | The single admin account's email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash — **never** the plaintext password |
| `ADMIN_JWT_SECRET` | Long, random, unique per environment — rotating this invalidates every existing admin session immediately, which is a feature during an incident response, not a bug |
| `ADMIN_JWT_EXPIRES_IN` | e.g. `24h` — also determines the cookie's `maxAge` via `parseDurationToMs` in `cookieOptions.js` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test keys for staging, live keys for production — **never mix the two**, and never commit either to source control |

### Boot Sequence

`server.js`:
```js
const startServer = async () => {
  await connectDB();
  app.listen(env.PORT, () => logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`));
};
```

The server **will not start listening** if `connectDB()` fails — `config/db.js` calls `process.exit(1)` on a connection error. This is deliberate: a misconfigured `MONGODB_URI` fails loudly and immediately at boot, rather than starting an API that would serve broken responses for every database-touching route. If a deployment appears to hang or the platform reports a failed health check, check the connection string first.

### Reverse Proxy Awareness

`app.js`:
```js
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

Render/Railway/Vercel all sit one reverse-proxy hop in front of the Node process. Without this, `express-rate-limit` either sees every request as coming from the proxy's single IP (rate-limiting all users together) or throws a validation error outright. `1`, not `true`, is used deliberately — it trusts exactly one hop's `X-Forwarded-For` value, not an arbitrary attacker-suppliable chain of proxies.

### Cookies Require HTTPS in Production

Since `config/cookieOptions.js` sets `Secure: true` whenever `NODE_ENV=production`, the backend **must** actually be served over HTTPS in production, or browsers will silently refuse to set the cookie at all — admin login would appear to succeed (200 response) but no session would ever persist. Render/Railway serve HTTPS by default; this only becomes a problem if fronting the API with a custom reverse proxy that terminates TLS incorrectly.

---

## Frontend Deployment (Vercel)

### Environment Variables

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | The deployed backend's full API URL, e.g. `https://api.eknaipehal.org/api` |
| `VITE_RAZORPAY_KEY_ID` | The **same public** Key ID configured server-side — this is the intentionally-public half of the Razorpay key pair, safe to ship inside the client bundle. Never set `VITE_RAZORPAY_KEY_SECRET` — Vite bundles anything prefixed `VITE_` directly into shipped JS, so the secret would become publicly visible in the browser if it were ever given that prefix. |

### Build

```
npm run build   # vite build, output to dist/
```

### SPA Routing Configuration

Vercel must be configured to serve `index.html` for every non-asset path — this project uses `react-router-dom`'s client-side routing, so a hard refresh on, say, `/admin/dashboard` or `/donate/receipt/<id>` needs the CDN to still return `index.html` (letting React Router take over) rather than 404ing at the edge before React ever runs. A `vercel.json` rewrite rule (`{"source": "/(.*)", "destination": "/index.html"}`) or Vercel's framework-preset SPA handling covers this.

---

## Razorpay Setup

1. **Staging/QA**: use Razorpay's documented test card numbers — these never move real money and behave identically to production for the purposes of exercising the full order-create → Checkout → verify flow.
2. **Going live**: switching from test to live keys is a pure environment-variable change on both sides (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` on the backend, `VITE_RAZORPAY_KEY_ID` on the frontend) — no code change is required, since the integration was built directly against Razorpay's standard Orders + Checkout API, not a test-mode-specific code path.
3. Razorpay's own dashboard should have the production domain configured wherever it expects an allowed origin/webhook URL, once live keys are activated.

---

## Deployment Order

For a first deployment (or a breaking API contract change), deploy the **backend first**, confirm its health check / a manual `GET /api/health` succeeds, then deploy the frontend pointed at that backend's URL. For a routine deployment where the API contract hasn't changed, either side can deploy independently, in any order — this is a direct consequence of the two apps having no build-time coupling.

---

## Production Checklist

- [ ] `NODE_ENV=production` set on the backend
- [ ] `CLIENT_ORIGIN` set explicitly (not relying on the code's development default) and matches the frontend's exact deployed URL
- [ ] `MONGODB_URI` points to the production Atlas cluster, not a dev/staging database
- [ ] `ADMIN_JWT_SECRET` is unique to this environment (not reused from staging)
- [ ] `ADMIN_PASSWORD_HASH` corresponds to the intended production password, generated fresh
- [ ] `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are **live** keys, not test keys
- [ ] `VITE_API_BASE_URL` on the frontend points at the production backend
- [ ] `VITE_RAZORPAY_KEY_ID` matches the backend's live `RAZORPAY_KEY_ID`
- [ ] Backend is served over HTTPS (required for `Secure` cookies to actually be set)
- [ ] A manual end-to-end test donation (small amount, live keys) completes and produces a downloadable receipt + certificate before announcing launch

---

## Troubleshooting

**Donation/contact/volunteer forms fail with a browser console CORS error, and nothing shows up in the backend's request logs.** This means the browser's preflight (`OPTIONS`) request was rejected before the actual request was ever sent — check `CLIENT_ORIGIN` first. This exact symptom was diagnosed and resolved once already during this project's development, and the root cause was a missing (not merely misconfigured) environment variable on the deployed backend.

**Admin login appears to succeed but the session doesn't persist / immediately looks logged out.** Confirm the backend is actually served over HTTPS — `Secure` cookies are silently dropped by browsers over plain HTTP in production mode.

**Admin logout appears to "work" (redirects to the login page) but a fresh page load still shows the admin as logged in.** This exact symptom occurred once during development and was traced to the CSRF cookie being unreadable by the SPA's own pages due to an incorrect `Path` scope — see `SECURITY.md`'s Cookie Configuration section for the full diagnosis. If this recurs, verify `admin_csrf`'s `Path` is `/`, not `/api/admin`.

**A payment succeeds at Razorpay but no receipt is available.** Check whether `POST /api/payments/verify` was ever actually called — if a donor's browser closed before Razorpay's `handler` callback fired, this system has no webhook fallback (a known, documented limitation — see `SECURITY.md`) and the `Transaction` remains at `status: 'created'` even though Razorpay captured the funds. This requires manual reconciliation against the Razorpay dashboard until a webhook handler is built.

---

## Monitoring Recommendations

- Structured request logging already exists (`pino`/`pino-http`, `config/logger.js`) — the next step is piping these logs to the hosting platform's built-in aggregation or an external service, which requires no code change.
- No error-tracking service (e.g. Sentry) is currently wired in — recommended before scaling admin usage or donation volume meaningfully beyond current levels, so unhandled exceptions are surfaced proactively rather than discovered via a support request.
- `logger.error` calls in `paymentController.createOrder` specifically flag orphaned Razorpay orders (a successful Razorpay call whose corresponding `Transaction.create()` failed) — these log lines are structured with the `razorpayOrderId` field specifically so they're greppable/alertable once log aggregation exists.
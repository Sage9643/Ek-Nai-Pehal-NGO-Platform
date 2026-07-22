# Security — Ek Nai Pehal NGO Platform

This document explains the actual security implementation in this codebase: what mechanism protects what, why it was built that way, one real vulnerability that existed and was fixed during development, and the trade-offs that remain, deliberately.

---

## Authentication: JWT in an httpOnly Cookie

`controllers/admin/adminAuthController.js`'s `adminLogin` signs a JWT with `jsonwebtoken`:

```js
jwt.sign({ email: env.ADMIN_EMAIL, role: 'admin' }, env.ADMIN_JWT_SECRET, { expiresIn: env.ADMIN_JWT_EXPIRES_IN })
```

and sets it as `admin_token` via `res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions())`. Every subsequent request to a protected admin route runs through `middleware/adminAuth.js`, which reads `req.cookies[AUTH_COOKIE_NAME]`, calls `jwt.verify(token, secret)`, and either sets `req.admin = decoded` or throws a 401.

**Why a cookie, and why httpOnly specifically:** this system's admin panel originally stored the JWT in `sessionStorage`, which is readable by any JavaScript executing on the page. A single XSS bug — in this codebase or in any third-party dependency pulled into the bundle — would have been sufficient to exfiltrate the entire admin session. An httpOnly cookie removes that read surface entirely: no `document.cookie` access, no `sessionStorage.getItem`, nothing client-side JS can do to read the token. The browser attaches it automatically to matching requests and that's the only way it ever moves.

There is exactly one admin account in this system (`env.ADMIN_EMAIL` / `env.ADMIN_PASSWORD_HASH`), not a `User` collection with roles. This is a deliberate scope decision, not an oversight — see `ENGINEERING_DECISIONS.md`.

---

## Cookie Configuration

All cookie flags are computed in one file, `config/cookieOptions.js`, and every place a cookie is set or cleared (`adminAuthController.js`'s `adminLogin`/`adminLogout`) calls into these same functions — there is no second, inconsistent set of flags anywhere else in the codebase.

```js
const baseCookieOptions = {
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};
```

`SameSite=None; Secure` in production is not optional — the client (Vercel) and API (Render/Railway) are different domains, so a cross-site cookie is required for the auth flow to work at all. `SameSite=Lax` in development works because `localhost:5173` and `localhost:5000` count as the same "site" for `SameSite` purposes (the site definition ignores port).

The two cookies this app sets have **different `Path` values, and this difference was the subject of a real bug**:

```js
const authCookieOptions = (maxAge) => ({ ...baseCookieOptions, path: '/api/admin', httpOnly: true, maxAge });
const csrfCookieOptions = (maxAge) => ({ ...baseCookieOptions, path: '/', httpOnly: false, maxAge });
```

`admin_token` is scoped to `Path=/api/admin` because it is httpOnly and only ever needs to be *automatically attached* to requests targeting that path — it is never read by JavaScript, so restricting its path is pure hygiene with no downside.

`admin_csrf` **must** be `Path=/`. Cookie visibility to `document.cookie` is governed by the same path-matching algorithm as cookie attachment to HTTP requests, but evaluated against the *current page's URL*, not the URL of whatever request is being made. The original implementation scoped both cookies to `Path=/api/admin` — which meant `admin_csrf` was completely invisible to `document.cookie` on every real page of the SPA (`/admin/login`, `/admin/dashboard`, etc.), since the SPA never actually navigates to a page literally at `/api/admin`. This silently broke `X-CSRF-Token` on every single admin mutation, including logout. It was diagnosed with a real headless-browser test proving `document.cookie` returned an empty string on `/admin/dashboard` despite a successful login — not by code inspection alone — and fixed by giving the CSRF cookie site-wide visibility while leaving the auth cookie's tighter scope untouched.

---

## CSRF Protection: Double-Submit Cookie

`middleware/csrfProtection.js`:

```js
const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const error = new Error('Invalid or missing CSRF token');
    error.statusCode = 403;
    return next(error);
  }
  next();
};
```

Mounted once, router-wide, in `routes/adminRoutes.js`: `router.use(adminAuth); router.use(csrfProtection);` — placed after the public `/login` route (which doesn't have a CSRF cookie yet) and before every other route, so no future route can accidentally be added without this check.

**Why this is necessary at all:** moving from a bearer-token scheme to cookies reintroduces CSRF risk that the bearer-token approach didn't have, because `SameSite=None` (required for the cross-domain production setup) allows the auth cookie to attach to cross-site requests. The double-submit pattern closes this: an attacker's page can trigger a cross-site request (the browser dutifully attaches `admin_token`), but it cannot read the `admin_csrf` cookie's value — cookie reads via `document.cookie` are same-origin-scoped — so it cannot forge a matching `X-CSRF-Token` header.

`client/src/admin/services/adminApi.js` implements the client side: `withCredentials: true` on the axios instance, plus a request interceptor that reads `admin_csrf` from `document.cookie` and attaches it as `X-CSRF-Token` on every non-GET/HEAD/OPTIONS request.

---

## Authorization

Every admin route is gated by the same two middleware, hoisted once at the router level — there is no per-route variance in how authorization is checked, which removes an entire class of "someone forgot to add auth to this new route" bugs. There are no role distinctions in this system (single admin account); "authorization" here means exactly "is this request carrying a valid admin session," nothing finer-grained.

---

## Input Validation

Every mutating public and admin route runs an `express-validator` chain, collected by `middleware/validate.js` into a consistent `400` with per-field messages. Representative examples actually in this codebase:
- `body('donorEmail').isEmail().normalizeEmail()` — payment and donation routes
- `body('donorPhone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/)` — Indian mobile format, optional field correctly treats an empty string as "not provided" rather than a validation failure
- `body('amount').isFloat({ min: 1 }).toFloat()` — payment amount, coerced to a number server-side rather than trusted as a string
- `body('razorpay_signature').trim().notEmpty()` — verify endpoint requires all three Razorpay fields present before any signature logic runs

## Password Handling

The single admin password is never stored in plaintext — `env.ADMIN_PASSWORD_HASH` is a bcrypt hash, generated once (outside the running application) and set as an environment variable. `adminLogin` calls `bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)`; the plaintext password never persists anywhere, including logs.

---

## NoSQL Injection Prevention

No route in this codebase spreads `req.body` or `req.query` directly into a Mongoose query filter (`Model.find(req.body)` does not exist anywhere in this project). Every field consumed from user input is explicitly destructured, validated by `express-validator`, and passed as an individually-named, schema-typed field into `Model.create()`/`Model.find({specificField: value})`. This is what closes the injection class structurally — an attacker cannot smuggle a `{$gt: ''}`-style operator object into a query filter, because no query filter in this codebase is ever built from raw, unfiltered request data.

## XSS Prevention

React escapes all rendered text content by default; `dangerouslySetInnerHTML` does not appear anywhere in this codebase. PDF generation (`services/pdfService.js`, `services/receiptService.js`) uses `pdfkit`'s text-drawing API (`doc.text(...)`), which has no markup-interpretation surface at all — a donor's `donorName` or `message` field is drawn as literal glyphs on a page, never parsed as HTML or executed as script, even in the one place user-supplied strings end up in a generated document.

## Security Headers (Helmet)

`app.js` mounts `helmet()` first in the middleware chain — before CORS, before body parsing — so every response, including error responses, carries Helmet's default header set (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`, etc.). Defaults are used rather than a hand-tuned CSP, since this server serves JSON and PDF binaries, not HTML pages — Helmet's default CSP has essentially no practical downside here and no custom policy has been needed.

## Rate Limiting

`middleware/rateLimiters.js` defines six limiters, each scoped to a real, distinct abuse profile rather than one number applied everywhere:

| Limiter | Scope | Why this specific number |
|---|---|---|
| `loginLimiter` (10 / 15 min) | `POST /admin/login` | Highest-value brute-force target — one hardcoded account, no 2FA/lockout beyond this limiter |
| `chatLimiter` (15 / **1 min**) | `POST /chat` | Each call costs a real Gemini API request — a cost/quota concern, hence the much shorter window than every other limiter |
| `formLimiter` (5 / 15 min) | volunteer/donation/contact | Loose enough for a genuine retry after a validation typo, tight enough to blunt scripted spam |
| `paymentLimiter` (10 / 15 min) | create-order, verify | Same cost-shaped reasoning as `chatLimiter` — each call hits Razorpay's API |
| `transactionLookupLimiter` (30 / 15 min) | transaction GET + both PDF downloads | Added specifically to blunt MongoDB ObjectId enumeration (see Threat Model below) |
| `globalLimiter` (300 / 15 min) | every `/api/*` route | Defense-in-depth ceiling |

`app.js` sets `trust proxy` to `1` (not `true`) in production, since Render/Railway/Vercel sit one reverse-proxy hop in front of the app — without this, `express-rate-limit` would either see every request as coming from the same proxy IP (limiting all users together) or throw a validation error. Using `1` instead of `true` means only the first hop's `X-Forwarded-For` value is trusted, not an arbitrary attacker-supplied chain.

---

## Payment Verification: The Core Trust Boundary of This System

The single most consequential trust decision in this codebase: **the frontend's report that a Razorpay payment succeeded is never trusted for anything.** `paymentController.verifyPayment` independently recomputes:

```js
crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
```

and compares it to what the client submitted using `crypto.timingSafeEqual`, not `===` — a straight string comparison would leak information about how many leading bytes matched via response-timing differences; `timingSafeEqual` is constant-time regardless of where the mismatch occurs. Only if this recomputed signature matches does `Transaction.status` ever become `'paid'`, and that transition happens inside a single atomic `findOneAndUpdate` (see `DATABASE_SCHEMA.md` for the full concurrency reasoning) — so even a compromised or buggy frontend cannot mark a donation as paid, and two racing verify calls cannot double-process the same payment.

---

## Threat Model & Known Limitations

**Transaction/receipt access control relies on MongoDB `_id` guessability.** This system has no donor accounts, by design — a receipt link's only "credential" is the `Transaction`'s MongoDB ObjectId. ObjectIds are *not* cryptographically random: a 4-byte timestamp, a 5-byte value fixed for the entire lifetime of a given server process, and a 3-byte counter that increments by exactly 1 per document created on that process. Anyone who makes one real, trivial donation obtains a valid reference point and could, in principle, enumerate nearby IDs to view other donors' names and amounts (never signatures or contact details — `getTransaction`'s response deliberately excludes those). This is mitigated with `transactionLookupLimiter`, added specifically for this reason, but not eliminated — the durable fix (an opaque, cryptographically random access token distinct from the Mongo `_id`) is a genuine schema/behavior change, tracked as a future improvement rather than done speculatively.

**No webhook-based payment confirmation.** The system relies entirely on the synchronous Checkout `handler` callback. If a donor's browser tab closes after Razorpay captures the payment but before the `handler` fires, funds are captured at Razorpay while this system's `Transaction` remains stuck at `'created'` forever. The `verifiedVia` field and the `processing` status already exist in the schema specifically so a webhook handler can close this gap later with zero migration.

**No 2FA or account lockout on the single admin account**, beyond `loginLimiter`. Acceptable at the current single-admin scale; would need revisiting before supporting multiple admins with differing trust levels.

**No file upload feature exists anywhere in this application** — event and gallery images are referenced by URL/path string, not uploaded binaries — so file-upload-specific risks (unrestricted file types, path traversal, stored malware) simply do not apply to this codebase's current feature set.

## Future Security Improvements

- Opaque, cryptographically random transaction access tokens (replacing ObjectId-based access).
- Razorpay webhook signature verification as a second confirmation path.
- Multi-admin support with per-admin credentials and an audit log of who changed what.
- Automated dependency vulnerability scanning in CI (not currently wired in).
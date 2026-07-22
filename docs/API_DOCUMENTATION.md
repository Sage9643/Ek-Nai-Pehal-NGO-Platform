# API Documentation — Ek Nai Pehal NGO Platform

Base URL: `{VITE_API_BASE_URL}/api` (e.g. `http://localhost:5000/api` in development).

## Response Envelope

Defined once in `server/utils/apiResponse.js` and used by every controller — no endpoint in this codebase constructs its own response shape:

```js
// success
{ success: true, message?: string, data?: any, count?: number, pagination?: {...} }
// failure
{ success: false, message: string, errors?: [...] }
```

`errors` is populated specifically by `express-validator` failures (an array of `{field, message}`); every other failure path (`AppError`, Mongoose errors, unhandled exceptions) sets only `message`.

---

## Public Endpoints

### `POST /api/volunteers`

| | |
|---|---|
| **Purpose** | Submit a volunteer application |
| **Authentication** | None |
| **Rate limiting** | `formLimiter` — 5 requests / 15 min / IP |
| **Validation** | `routes/volunteerRoutes.js`: `name` (2–100 chars), `email` (valid + normalized), `phone` (10-digit Indian mobile, `/^[6-9]\d{9}$/`), `college` (2–150 chars), `motivation` (10–1000 chars) |
| **Controller** | `controllers/volunteerController.js` → `createVolunteer` |
| **Services called** | None — direct Mongoose call |
| **Collections touched** | `volunteers` (insert) |
| **Side effects** | None (no email notification yet — explicitly deferred) |

**Request**
```json
{ "name": "Aditi Rao", "email": "aditi@example.com", "phone": "9876543210", "college": "Delhi University", "motivation": "I want to help teach underprivileged children." }
```

**Response `201`**
```json
{ "success": true, "message": "Volunteer application submitted successfully", "data": { "_id": "...", "name": "Aditi Rao", "createdAt": "..." } }
```

**Error responses**: `400` (validation failure), `429` (rate limited).

---

### `POST /api/donations`

| | |
|---|---|
| **Purpose** | Submit an in-kind donation inquiry (books, clothes, stationery, etc.) — **not** a payment |
| **Authentication** | None |
| **Rate limiting** | `formLimiter` |
| **Validation** | `name`, `email`, `phone`, `donationType` (enum — no longer includes "Financial Support", superseded by the Transaction/Razorpay flow), `message` (optional) |
| **Controller** | `controllers/donationController.js` → `createDonation` |
| **Services called** | None |
| **Collections touched** | `donations` (insert, `status: 'Pending'` by default) |
| **Side effects** | None |

**Request**
```json
{ "name": "Rohan Verma", "email": "rohan@example.com", "phone": "9123456780", "donationType": "Books", "message": "5 boxes of NCERT textbooks, grades 6-8" }
```

**Response `201`**
```json
{ "success": true, "message": "Donation inquiry submitted successfully", "data": { "_id": "...", "status": "Pending" } }
```

---

### `POST /api/contact`

| | |
|---|---|
| **Purpose** | General contact form |
| **Authentication** | None |
| **Rate limiting** | `formLimiter` |
| **Validation** | `name`, `email`, `subject` (3–200 chars), `message` (10–2000 chars) |
| **Controller** | `controllers/contactController.js` |
| **Collections touched** | `contactqueries` (insert) |

---

### `GET /api/events`

| | |
|---|---|
| **Purpose** | Paginated public event listing |
| **Authentication** | None |
| **Rate limiting** | `globalLimiter` only (read-only, no per-endpoint limiter) |
| **Query params** | `page` (default 1), `limit` (default 9, capped at 50 via `parsePagination(query, 9, 50)`), `category` (optional, matches the `Event.category` enum) |
| **Controller** | `controllers/eventController.js` → `getEvents` |
| **Services called** | `utils/pagination.js` → `parsePagination`, `buildPaginationMeta` |
| **Collections touched** | `events` (`.find().sort({date:-1}).skip().limit().lean()`, `.countDocuments()`, run concurrently via `Promise.all`) |
| **Side effects** | None |

**Response `200`**
```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [ { "_id": "...", "title": "...", "date": "...", "category": "Education" } ],
  "count": 9,
  "pagination": { "page": 1, "limit": 9, "total": 42, "totalPages": 5 }
}
```

---

### `GET /api/gallery`

Identical shape to `GET /api/events`, sorted by `createdAt` descending instead of `date`, default `limit=12`. Controller: `controllers/galleryController.js`.

---

### `POST /api/chat`

| | |
|---|---|
| **Purpose** | Send a message to the Gemini-backed chatbot, grounded with static NGO context plus the 20 most recent events |
| **Authentication** | None |
| **Rate limiting** | `chatLimiter` — 15 requests / **1 minute** / IP (tight, since every call costs a real Gemini API request — a cost/quota concern rather than a spam concern, which is why this limiter's window differs from every other limiter's 15-minute window) |
| **Validation** | `message` (1–1000 chars) |
| **Controller** | `controllers/chatController.js` |
| **Services called** | `services/geminiService.js` |
| **Collections touched** | `events` (read-only, last 20, for grounding context) |
| **Side effects** | Outbound call to Google's Gemini API |

---

## Payment Endpoints (Razorpay Donation Flow)

### `POST /api/payments/create-order`

| | |
|---|---|
| **Purpose** | Create a Razorpay order and a corresponding `Transaction` record in `status: 'created'` — the first step of the payment flow, not the payment itself |
| **Authentication** | None (public, account-free donation flow) |
| **Rate limiting** | `paymentLimiter` — 10 requests / 15 min / IP (same cost-shaped reasoning as `chatLimiter`: each call is a real Razorpay API request) |
| **Validation** | `routes/paymentRoutes.js`: `donorName` (2–100), `donorEmail` (valid + normalized), `donorPhone` (optional, 10-digit Indian mobile), `amount` (`isFloat({min:1})`, coerced via `.toFloat()`), `message` (optional, ≤1000 chars) |
| **Controller** | `controllers/paymentController.js` → `createOrder` |
| **Services called** | `services/razorpayService.js` → `createOrder` (which itself re-validates `amountInRupees` is finite and >0 as a defense-in-depth check independent of the route-level validation) |
| **Collections touched** | `transactions` (insert, `status: 'created'`) |
| **Side effects** | Outbound call to Razorpay's Orders API; **note**: if the Razorpay call succeeds but the subsequent `Transaction.create()` fails, this is logged via `logger.error` with the orphaned `razorpayOrderId` for manual reconciliation — this specific failure mode is a known, documented, accepted gap (see `ENGINEERING_DECISIONS.md`), not an oversight |

**Request**
```json
{ "donorName": "Ananya Sharma", "donorEmail": "ananya@example.com", "donorPhone": "9876543210", "amount": 2500, "message": "In memory of my grandmother" }
```

**Response `201`** — `amount` is in **rupees**, never paise (see `DATABASE_SCHEMA.md` for the full unit-boundary explanation):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { "orderId": "order_QwErTy123", "transactionId": "665f...", "amount": 2500, "currency": "INR", "keyId": "rzp_live_..." }
}
```

---

### `POST /api/payments/verify`

| | |
|---|---|
| **Purpose** | Server-side signature verification — the *only* code path that can ever set `Transaction.status = 'paid'` |
| **Authentication** | None |
| **Rate limiting** | `paymentLimiter` |
| **Validation** | `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` all required, non-empty strings |
| **Controller** | `controllers/paymentController.js` → `verifyPayment` |
| **Services called** | `razorpayService.verifyCheckoutSignature` (HMAC-SHA256 recomputation + `crypto.timingSafeEqual`), `receiptService.generateReceiptNumber` (only on a successful, newly-claimed verification) |
| **Collections touched** | `transactions` (read via `findOne`, then either `updateOne` on failure or an atomic `findOneAndUpdate` on success), `counters` (atomic `$inc`, only on success) |
| **Side effects** | None beyond the database writes — no email/webhook side effects exist yet |
| **Idempotency** | Safe to call more than once for the same order. A second call against an already-`paid` transaction returns the existing result without re-processing; a second call racing the first for the same `'created'`→`'paid'` transition loses the atomic claim and falls back to re-reading the winner's result — verified with a genuine forced-concurrency test during development |

**Request**
```json
{ "razorpay_order_id": "order_QwErTy123", "razorpay_payment_id": "pay_AbCdEf456", "razorpay_signature": "3f2a...e91b" }
```

**Response `200` (success)**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": { "transactionId": "665f...", "receiptNumber": "ENP-20260717-000042", "status": "paid", "amount": 2500, "donorName": "Ananya Sharma" }
}
```

**Error responses**:
- `404` — no `Transaction` matches `razorpay_order_id`
- `400` — `"This payment attempt already failed. Please start a new donation."` (retry against a terminally-failed order)
- `400` — `"Payment verification failed"` (signature mismatch; the `Transaction` is simultaneously marked `status: 'failed'` server-side)

---

### `GET /api/payments/:transactionId`

| | |
|---|---|
| **Purpose** | Fetch a transaction's public-facing summary, consumed by `DonationReceipt.jsx` |
| **Authentication** | None — **the `transactionId` (a MongoDB ObjectId) is the only access control on this endpoint.** This is a deliberate, documented trade-off; see `SECURITY.md` |
| **Rate limiting** | `transactionLookupLimiter` — 30 requests / 15 min / IP, added specifically to blunt ObjectId enumeration |
| **Controller** | `controllers/paymentController.js` → `getTransaction` |
| **Collections touched** | `transactions` (read-only) |
| **Response fields** | `transactionId, status, donorName, amount, currency, receiptNumber, razorpayPaymentId, createdAt, updatedAt` — **deliberately excludes** `razorpaySignature` and donor contact fields (`donorEmail`, `donorPhone`) to minimize exposure beyond what the receipt page actually needs to display |

**Error responses**: `404` (no matching transaction), `400` (malformed ObjectId — handled generically by `errorHandler.js`'s `CastError` mapping, not a custom check in this controller).

---

### `GET /api/payments/:transactionId/receipt.pdf`

| | |
|---|---|
| **Purpose** | Stream a server-generated PDF receipt |
| **Authentication** | None (same trade-off as above) |
| **Rate limiting** | `transactionLookupLimiter` |
| **Controller** | `controllers/paymentController.js` → `getReceiptPdf` |
| **Services called** | `receiptService.getReceiptPdfForTransaction` → `buildReceiptDocument` → `pdfService` primitives → `streamPdfToResponse` |
| **Business rule** | Only returns a document if `Transaction.status === 'paid'`; otherwise `400`. A `paid`-only rule is enforced here, not just cosmetically hidden on the frontend, so directly hitting this URL for an unpaid transaction correctly fails server-side. |
| **Response** | `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="receipt-<id>.pdf"` |

---

### `GET /api/payments/:transactionId/certificate.pdf`

Identical contract to the receipt endpoint, calling `receiptService.getCertificatePdfForTransaction` → `buildCertificateDocument` instead. Same `paid`-only rule, same rate limiter, same access-control trade-off.

---

## Admin Endpoints

All routes under `/api/admin` except `/login` are mounted behind `router.use(adminAuth); router.use(csrfProtection);` in `routes/adminRoutes.js` — hoisted once at the router level rather than repeated per-route, so a newly added route can't accidentally be added without them.

### `POST /api/admin/login`

| | |
|---|---|
| **Authentication** | None (this endpoint *establishes* the session) |
| **Rate limiting** | `loginLimiter` — 10 requests / 15 min / IP |
| **Validation** | `email` (valid + normalized), `password` (non-empty) |
| **Controller** | `controllers/admin/adminAuthController.js` → `adminLogin` |
| **Logic** | Compares `email` to `env.ADMIN_EMAIL`; `bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)`; on success, signs a JWT and sets two cookies (see `SECURITY.md` for the exact flags) |
| **Side effects** | Sets `admin_token` (httpOnly) and `admin_csrf` (readable) cookies |

**Response `200`**: `{ "data": { "email": "admin@example.com" } }` — the JWT itself is never present in the response body, only in the `Set-Cookie` header.

### `POST /api/admin/logout`

Clears both cookies via `res.clearCookie` with matching flags to how they were set. No request body.

### `GET /api/admin/me`

Returns `{ data: { email } }` if the session cookie is valid, `401` otherwise. Used by `AdminAuthContext` on mount to determine `isAuthenticated` without ever being able to read the httpOnly JWT client-side.

### `GET /api/admin/dashboard`

Aggregate counts (`volunteerCount`, `contactCount`, `eventCount`) and a merged `recentActivity` array across those three collections. **Note:** this endpoint predates the payment feature and does not include donation/transaction figures — those are served separately by the transaction stats endpoint below; extending this endpoint is listed as a future improvement in `ARCHITECTURE.md`.

### Volunteers / Contact Requests / Events / Donations / Gallery — CRUD Family

Each resource follows this exact contract (verified identical across all five by the `pagination.js` extraction during the code-quality audit):

- `GET /api/admin/<resource>?page=&limit=&search=` → `{ data: { <resource>: [...], pagination: {...} } }`
- `POST /api/admin/<resource>` → create (events, gallery only)
- `PUT /api/admin/<resource>/:id` → update (events, gallery)
- `PUT /api/admin/donations/:id/status` → transition a donation's admin-managed status
- `DELETE /api/admin/<resource>/:id` → delete

Search is an unanchored, case-insensitive regex across the resource's relevant text fields (e.g. name/email/phone for volunteers) — **deliberately not backed by a MongoDB text index**, since a text index can't accelerate an arbitrary substring match anyway (see `DATABASE_SCHEMA.md`).

### `GET /api/admin/transactions`

| | |
|---|---|
| **Purpose** | Paginated, searchable, filterable, sortable list of verified Razorpay donations |
| **Controller** | `controllers/admin/transactionAdminController.js` → `getTransactions` |
| **Query params** | `page`, `limit`, `search` (matches `donorName`, `donorEmail`, `razorpayPaymentId`, `receiptNumber`), `status` (exact match against `Transaction.TRANSACTION_STATUSES`), `sortBy` (`createdAt` \| `amount`), `sortOrder` (`asc` \| `desc`) |
| **Collections touched** | `transactions` (`.find().sort().skip().limit().lean()` + `.countDocuments()`, concurrent via `Promise.all`) |

### `GET /api/admin/transactions/stats`

| | |
|---|---|
| **Purpose** | Aggregate figures for `AdminTransactions.jsx`'s stat cards |
| **Controller** | `controllers/admin/transactionAdminController.js` → `getTransactionStats` |
| **Logic** | `Transaction.aggregate([{$match:{status:'paid'}}, {$group:{_id:null, totalAmount:{$sum:'$amount'}}}])` for the total, plus three parallel `countDocuments` calls (`paid`, `{$in:['created','processing']}`, `failed`) — all four run concurrently via `Promise.all` |
| **Business rule** | `totalAmount`/`successfulCount` only ever count `status: 'paid'` — an attempted-but-unverified donation never contributes to these figures, mirroring the exact same rule enforced for receipt/certificate eligibility |

**Response `200`**
```json
{ "success": true, "data": { "totalAmount": 184500, "successfulCount": 73, "pendingCount": 4, "failedCount": 11 } }
```

---

## Rate Limit Reference

| Limiter | Window | Max | Applies to |
|---|---|---|---|
| `loginLimiter` | 15 min | 10 | `POST /admin/login` |
| `chatLimiter` | 1 min | 15 | `POST /chat` |
| `formLimiter` | 15 min | 5 | volunteer / donation / contact submissions |
| `paymentLimiter` | 15 min | 10 | create-order, verify |
| `transactionLookupLimiter` | 15 min | 30 | transaction GET + both PDF downloads |
| `globalLimiter` | 15 min | 300 | every `/api/*` route, defense-in-depth |

All limiters use `express-rate-limit`'s standard `RateLimit-*` response headers (draft-7), disable the legacy `X-RateLimit-*` headers, and return the standard failure envelope with a limiter-specific message on `429`.
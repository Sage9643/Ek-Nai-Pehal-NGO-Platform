# Architecture — Ek Nai Pehal NGO Platform

This document describes how this specific codebase is put together: its folder structure, the exact request lifecycle for each major flow, the middleware execution order as it actually exists in `app.js`, and the architectural decisions that shape the rest of the system. It assumes the reader is a developer joining this project, not someone learning what a REST API is.

---

## 1. System Topology

┌─────────────────────────┐ HTTPS/JSON ┌──────────────────────────┐
│ client/ (Vite/React) │ ───────────────────────────▶│ server/ (Express/Node) │
│ Deployed: Vercel │◀─────────────────────────── │ Deployed: Render/Railway│
└─────────────────────────┘ └───────────┬──────────────┘
│ Mongoose
▼
┌──────────────────────────┐
│ MongoDB Atlas │
│ 7 collections │
└──────────────────────────┘
│
▼
┌──────────────────────────┐
│ Razorpay API │
│ (Orders + Checkout) │
└──────────────────────────┘

`client/` and `server/` are two independent npm projects with no shared code, no shared types, and no build-time coupling. They agree on a contract (documented in `API_DOCUMENTATION.md`) and nothing else. This is why `client/services/api.js` and `client/admin/services/adminApi.js` exist as the *only* two places `axios` is configured — every other file that needs to talk to the backend imports from one of those two modules rather than instantiating its own HTTP client.

---

## 2. Backend Folder Structure and Layer Responsibilities

server/
├── server.js Entry point: connectDB() must resolve before app.listen()
├── app.js Express app assembly: middleware order, route mounting
├── config/
│ ├── env.js envalid schema — validates all required env vars at boot
│ ├── db.js mongoose.connect(), exits process on failure
│ ├── logger.js pino logger instance
│ └── cookieOptions.js Single source of truth for cookie flags (see SECURITY.md)
├── middleware/
│ ├── adminAuth.js Verifies admin_token JWT from cookie, populates req.admin
│ ├── csrfProtection.js Double-submit CSRF check for mutating admin routes
│ ├── rateLimiters.js 6 named limiters, each scoped to one abuse profile
│ ├── validate.js Runs express-validator's collected errors into a 400
│ ├── errorHandler.js Final middleware; maps AppError/CastError/etc. to JSON
│ └── requestLogger.js pino-http request logging
├── models/ Mongoose schemas (see DATABASE_SCHEMA.md)
├── routes/ Route definitions + validation chains, one file per resource
├── controllers/ HTTP orchestration — one file per resource
│ └── admin/ Admin-only controllers (auth, dashboard, per-resource CRUD)
├── services/
│ ├── razorpayService.js Order creation + signature verification (Razorpay SDK boundary)
│ ├── receiptService.js Receipt-number generation + PDF document builders
│ └── pdfService.js Generic pdfkit primitives (header/footer/field/streaming)
└── utils/
├── AppError.js Operational error class (statusCode + isOperational flag)
├── apiResponse.js sendSuccess/sendError — the response envelope
└── pagination.js Shared page/limit/skip + totalPages computation

**The controller/service boundary is enforced by what each layer is allowed to know.** A controller (e.g. `paymentController.createOrder`) knows about `req`, `res`, and `next` — it reads the request, calls into one or more services/models, and shapes a response. A service (e.g. `razorpayService.createOrder`) knows nothing about HTTP at all — it takes plain arguments, returns plain values or throws `AppError`, and is callable from a script or a test with no Express context. This is why Razorpay order creation, PDF generation, and receipt-number generation all live in `services/` rather than inline in `paymentController.js`: they are pieces of business logic that don't need `req`/`res` to do their job, and keeping them ignorant of HTTP concerns is what makes them independently testable (this is exactly how they were verified throughout development — by calling them directly with stubbed arguments, never spinning up a full HTTP server for logic tests).

---

## 3. Complete Request Lifecycle

### 3a. Public, unauthenticated request (example: `POST /api/donations`)

Browser (DonationForm.jsx)
│ createDonation(payload) — client/src/services/api.js
▼
app.js middleware chain (applies to every request, in this exact order):

helmet() → security headers on every response, including errors
cors({ origin: getClientOrigins() })
express.json() / express.urlencoded()
cookieParser()
requestLogger → pino-http
globalLimiter → 300 req / 15 min per IP, defense-in-depth
▼
routes/donationRoutes.js
│ formLimiter → 5 req / 15 min per IP (spam-specific, tighter than global)
│ donationValidation (express-validator chain)
│ validate → collects validator errors into a 400 if any
▼
controllers/donationController.js createDonation()
│ Donation.create(req.body) — direct Mongoose call; no service layer needed here,
│ since there's no business logic beyond persistence
▼
utils/apiResponse.js sendSuccess()
▼
Client receives { success: true, message, data: donation }

### 3b. Admin, authenticated, mutating request (example: `PUT /api/admin/events/:id`)

Browser (AdminEvents.jsx)
│ adminApi.put('/events/:id', payload) — withCredentials: true
│ request interceptor attaches X-CSRF-Token from document.cookie (admin_csrf)
▼
app.js middleware chain (steps 1–6 as above, identical for every request)
▼
routes/adminRoutes.js
│ router.use(adminAuth) → verifies admin_token cookie, sets req.admin, or 401
│ router.use(csrfProtection) → compares X-CSRF-Token header to admin_csrf cookie, or 403
│ eventValidation, validate
▼
controllers/admin/eventAdminController.js updateEvent()
│ Event.findByIdAndUpdate(...)
▼
sendSuccess() → Client

`adminAuth` and `csrfProtection` are mounted once, at the router level, *after* the public `/login` route but *before* every other admin route (`router.use(adminAuth); router.use(csrfProtection);` in `adminRoutes.js`). This is deliberate: hoisting them removes the possibility of a new route being added without them, which was a real risk when each route individually listed `adminAuth` as a per-route middleware (the pattern used before a Phase 2 cleanup).

### 3c. Admin login sequence

POST /api/admin/login
│ loginLimiter (10 req / 15 min — the single highest-value brute-force target in this system,
│ since there is exactly one hardcoded admin account with no 2FA)
│ loginValidation, validate
▼
adminAuthController.adminLogin()
│ compare email to env.ADMIN_EMAIL
│ bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)
│ jwt.sign({ email, role: 'admin' }, env.ADMIN_JWT_SECRET, { expiresIn })
│ crypto.randomBytes(32) → CSRF token
▼
res.cookie(AUTH_COOKIE_NAME, jwt, authCookieOptions()) → httpOnly, Path=/api/admin
res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions()) → NOT httpOnly, Path=/
▼
Client: AdminAuthContext.login() sets isAuthenticated=true, email
→ ProtectedRoute now renders the protected admin page

### 3d. Payment sequence (the most consequential flow in this system)

DonationPaymentForm.jsx
│ 1. loadRazorpayScript() — idempotent, cached, self-healing on failure
│ 2. createPaymentOrder({donorName, donorEmail, donorPhone, amount, message})
▼
POST /api/payments/create-order
│ paymentLimiter, createOrderValidation, validate
▼
paymentController.createOrder()
│ razorpayService.createOrder({ amountInRupees, receiptId: crypto.randomUUID() })
│ → defensive validation (finite, >0) INSIDE the service, independent of the
│ controller-level validation — a second line of defense if this service
│ is ever called from somewhere other than this controller
│ → Razorpay SDK: instance.orders.create({ amount: amountInRupees * 100, ... })
│ Transaction.create({ ...donor fields, amount (rupees), razorpayOrderId: order.id, status: 'created' })
▼
Client receives { orderId, transactionId, amount, currency, keyId }
│
▼
new window.Razorpay({ key: keyId, amount: amount * 100, order_id: orderId, handler, ... }).open()
│ (Razorpay's hosted Checkout UI takes over; donor completes payment)
▼
Razorpay invokes the handler callback client-side with
{ razorpay_order_id, razorpay_payment_id, razorpay_signature }
│ THIS DATA IS NEVER TRUSTED — it is forwarded verbatim to the backend
▼
POST /api/payments/verify
│ paymentLimiter, verifyPaymentValidation, validate
▼
paymentController.verifyPayment()
│ Transaction.findOne({ razorpayOrderId }) → 404 if no match
│ if status === 'paid' → return existing result (idempotent)
│ if status === 'failed' → reject, "start a new donation"
│ razorpayService.verifyCheckoutSignature({orderId, paymentId, signature})
│ → crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(${orderId}|${paymentId})
│ → crypto.timingSafeEqual(expected, received)
│ if !valid:
│ Transaction.updateOne({_id, status:'created'}, {$set:{status:'failed', failureReason}})
│ → 400
│ if valid:
│ receiptNumber = await receiptService.generateReceiptNumber() ← generated BEFORE the claim
│ Transaction.findOneAndUpdate( ← SINGLE ATOMIC WRITE
│ {_id, status: 'created'},
│ {$set: {status:'paid', razorpayPaymentId, razorpaySignature, verifiedVia:'checkout', receiptNumber}},
│ {new: true}
│ )
│ if claimed === null → a concurrent request already won this race; re-fetch and
│ return that result instead of re-processing
▼
Client receives { transactionId, receiptNumber, status:'paid', amount, donorName }
→ navigate(/donate/receipt/${transactionId})

The atomic `findOneAndUpdate` scoped to `status: 'created'` is what makes this sequence safe under real concurrency (two near-simultaneous verify calls for the same order, e.g. a client retry after a slow response). This was verified with a genuine forced-concurrency test during development, not just reasoned about — both requests were made to pass the idempotency pre-check simultaneously, and the result confirmed exactly one write ever succeeds.

### 3e. Receipt / certificate generation flow

GET /api/payments/:transactionId/receipt.pdf
│ transactionLookupLimiter
▼
paymentController.getReceiptPdf()
│ receiptService.getReceiptPdfForTransaction(transactionId)
│ │ Transaction.findById(transactionId) → 404 if missing
│ │ if status !== 'paid' → 400 ("only available for a paid donation")
│ │ buildReceiptDocument({receiptNumber, transactionId: razorpayPaymentId,
│ │ donorName, amount, currency, paidAt})
│ │ → pdfService.createDocument()
│ │ → pdfService.drawHeader(doc, {subtitle:'DONATION RECEIPT'})
│ │ → pdfService.drawField(...) × 6 (receipt no., transaction id, donor, amount, date, status)
│ │ → pdfService.drawFooter(doc, {})
│ │ → returns the un-ended pdfkit document
▼
pdfService.streamPdfToResponse(doc, res, {filename, disposition:'attachment'})
│ sets Content-Type: application/pdf, Content-Disposition: attachment
│ doc.pipe(res); doc.end()
▼
Browser downloads the PDF

The certificate endpoint follows the identical shape, calling `buildCertificateDocument` instead — a deliberately separate, reusable function (not a boolean flag inside `buildReceiptDocument`) so a future physical-donation "Completed" status hook (documented but not yet built) can call `buildCertificateDocument` directly with its own data, with zero changes to this file.

### 3f. Error handling flow

Every controller wraps its logic in `try { ... } catch (error) { next(error); }` — there is no controller in this codebase that handles its own error response formatting. `middleware/errorHandler.js` is the single place that translates:
- `AppError` (thrown deliberately, e.g. `throw new AppError('Transaction not found', 404)`) → its own `statusCode` and `message`
- Mongoose `ValidationError` → 400 with field-level messages
- Mongoose `CastError` (e.g. a malformed ObjectId in a URL param) → 400
- Anything else → 500, logged via `pino`, generic message to the client (no stack traces leaked)

This is why routes with an `:id` param (e.g. `GET /api/payments/:transactionId`) don't need explicit ID-format validation in their `express-validator` chain — an invalid ID naturally throws a `CastError` at the Mongoose layer, which `errorHandler.js` already converts into a clean 400, consistently, everywhere in the codebase.

---

## 4. Frontend Component Hierarchy

<App> location-aware; hides Navbar/Footer/ChatWidget on /admin/*
├─ <Routes>
│ ├─ Public routes: Home, About, Programs, Events, Gallery, Volunteer, Donate, Contact
│ │ Donate.jsx
│ │ ├─ <DonationPaymentForm /> real payments (Razorpay)
│ │ └─ <DonationForm /> in-kind inquiries (no payment)
│ ├─ /donate/receipt/:transactionId → <DonationReceipt /> (public, no auth — see SECURITY.md)
│ └─ /admin/* → <AdminSection> mounts <AdminAuthProvider> ONLY for this subtree
│ ├─ /admin/login → <AdminLogin>
│ └─ every other /admin/* route wrapped in <ProtectedRoute>
│ ├─ <AdminDashboard>
│ ├─ <AdminVolunteers> / <AdminContactRequests> / <AdminEvents>
│ ├─ <AdminDonations> (in-kind inquiries, admin-managed status)
│ ├─ <AdminTransactions> (verified payments, read-only + PDF downloads)
│ └─ <AdminGallery>
│ Each list page: <AdminLayout> → <SearchBar> + filter/sort
│ → <DataTable> (columns render prop) → <Pagination>
│ → <TableActions> per row → <ViewDetailsModal> on demand


`AdminSection` (a layout route rendering `<AdminAuthProvider><Outlet/></AdminAuthProvider>`) exists specifically so that `AdminAuthProvider`'s `useEffect` (which fires `GET /api/admin/me`) only ever runs when React Router has actually matched a `/admin/*` path. Wrapping the whole `<App>` in this provider was the original implementation, and it caused a real production regression: every public page load silently checked for an admin session. The fix was structural, not a conditional — moving the provider into the route tree itself.

---

## 5. Design Principles Actually Followed in This Codebase

1. **A service exists only when there's real logic to isolate.** `donationController.js` calls `Donation.create()` directly — no `donationService.js` exists, because there's nothing to isolate beyond persistence. `paymentController.js` delegates to `razorpayService`/`receiptService` because those genuinely encapsulate non-trivial logic (HMAC verification, atomic receipt numbering, PDF construction) that has its own reasons to change independently of the HTTP layer.
2. **Every list endpoint follows one shape.** Public: `page/limit/(optional filter)` → `{data, count, pagination}`. Admin: `page/limit/search/(filters)/sort` → `{data: {resource, pagination}}`. A new admin list page is built by copying `AdminDonations.jsx`/`donationAdminController.js` and swapping field names — not by inventing a new contract.
3. **Nothing client-reported is trusted for anything consequential.** Payment success, admin identity, and CSRF validity are all re-derived server-side from cryptographic or session state, never taken at face value from the request body.
4. **Cross-cutting concerns are middleware, not repeated code.** Rate limiting, auth, CSRF, and error formatting are each written once and composed via Express's middleware chain — no controller reimplements any of them.

---

## 6. Scalability Considerations

- **Stateless auth** (JWT in a cookie, no server-side session store) means the API server can be horizontally scaled behind a load balancer without sticky sessions — the one caveat is that `express-rate-limit`'s default in-memory store is per-instance, so multiple instances would need a shared store (e.g. `rate-limit-redis`) to enforce limits correctly across all of them. Not needed at current scale (single instance), documented here for when it is.
- **MongoDB indexes** exist on every field that's actually sorted or filtered on (see `DATABASE_SCHEMA.md`) — this was done incrementally, tied to real queries, not speculatively.
- **The `Counter` collection's atomic-increment pattern** scales correctly under concurrent writes without any additional locking, since it relies entirely on MongoDB's native atomicity guarantees rather than application-level coordination.
- **Not yet addressed**: the frontend bundle exceeds Vite's 500kB advisory warning — route-based code-splitting (`React.lazy` + `Suspense` around the admin route tree, which a public visitor never needs to download) is the natural next step and hasn't been done, since it wasn't yet a measured problem at this traffic scale.

## 7. Future Architecture Improvements

- Razorpay webhook handler as a second, asynchronous path to `verifyPayment`'s logic (the `Transaction.verifiedVia` field and `processing` status already exist for this — see `ENGINEERING_DECISIONS.md`).
- Opaque, cryptographically random transaction-access tokens, replacing reliance on MongoDB `_id` guessability (see `SECURITY.md`).
- Extending `dashboardController.js` to include donation/transaction aggregate figures, currently only available on `AdminTransactions`'s dedicated stats endpoint.
- Route-based code-splitting for the admin bundle.
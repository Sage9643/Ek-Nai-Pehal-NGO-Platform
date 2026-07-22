# Engineering Decisions — Ek Nai Pehal NGO Platform

A record of every non-obvious decision made in this codebase: what alternatives existed, why they were rejected, what was chosen instead, and what trade-off was consciously accepted. Written for an interviewer or a future maintainer asking "why is this built this way, and did you consider X?"

---

## 1. Why a REST API, not GraphQL

**Alternatives considered:** GraphQL would let the frontend request exactly the fields it needs per view, and would unify the query language across the very heterogeneous set of resources this app has (volunteers, events, gallery, donations, transactions).

**Why REST was chosen:** this project has no over-fetching problem to solve. Every list endpoint already returns a small, purpose-built shape (`{data, count, pagination}`), and every resource has 3–5 operations at most (list, create, update, delete, maybe a status transition). GraphQL's real value — composing many nested resources in one round trip, letting clients shape arbitrary queries — doesn't apply here, since there are no nested/relational resources to compose (see decision 3 below). Adopting GraphQL would mean maintaining a schema definition layer, a resolver layer, and a client-side query layer for a problem this app doesn't have, in exchange for tooling most of the team would need to learn from scratch.

**Trade-off accepted:** the frontend sometimes receives fields it doesn't render (e.g. `createdAt`/`updatedAt` on list views that only show a formatted date). Negligible cost at this payload size.

---

## 2. Why MongoDB (Mongoose), not a relational database

**Alternatives considered:** PostgreSQL with a schema-per-resource relational design.

**Why MongoDB:** every collection in this system is genuinely document-shaped and independent — a `Volunteer` application, a `ContactQuery`, an `Event`, a `Gallery` image, a `Donation` inquiry, and a `Transaction` don't need to be joined against each other for any current feature. A relational database's core strength — enforcing referential integrity across related tables — isn't being paid for here, because there are no relationships to enforce. Mongoose's schema validation gives type-safety and validation rules (enums, length bounds, regex patterns) without needing a migration system for a schema that, in this project's actual history, has only ever needed additive changes (new optional fields), never a structural rework of an existing collection.

**Trade-off accepted:** if a future feature genuinely needed a relational query (e.g. "all transactions belonging to this donor account"), that would require either an application-level join (two queries) or introducing a reference field and rethinking the access pattern — this is accepted as a real cost, deferred until such a feature is actually needed, rather than paid upfront for a flexibility this app doesn't yet require.

---

## 3. Why `Donation` and `Transaction` are separate collections, not one polymorphic model

**Alternatives considered:** a single `Donation` model with an optional `payment` sub-document, populated only for financial donations.

**Why they're separate:** a `Donation` is a lead moving through a human-managed workflow (`Pending → Accepted → Scheduled → Received → Completed`) with no money ever verified or moved electronically. A `Transaction` only exists once a real payment attempt has started, and its most consequential field (`status: 'paid'`) can only ever be set by one function (`paymentController.verifyPayment`), after an independent cryptographic signature check. These are not "the same entity with an optional extra field" — they have entirely different integrity guarantees. A polymorphic model would force every future consumer (the admin UI, receipt/certificate generation, dashboard analytics) to branch on "does this document represent a real payment or just a pledge?" at read time, scattered across every place that reads the collection. Splitting them makes that distinction a schema-level fact, checked once, rather than a runtime condition repeated everywhere.

**Trade-off accepted:** the admin panel has two separate list pages (`AdminDonations`, `AdminTransactions`) rather than one unified "all donations" view. Considered a reasonable cost, since an admin genuinely thinks about these as different workflows (chasing down a physical item pickup vs. reconciling a payment), not a single mental model artificially split by the schema.

---

## 4. Why JWT for admin sessions, and why it moved from `sessionStorage` to an httpOnly cookie

**Alternatives considered:** server-side session store (e.g. `express-session` + Redis); OAuth/SSO via a third-party identity provider.

**Why JWT:** a single-admin system with no need for session revocation-at-scale, multi-device session listing, or role changes mid-session doesn't need the operational overhead of a session store — a signed, stateless token that a middleware can verify without a database round-trip is simpler and sufficient. OAuth/SSO would be solving a multi-user identity problem this system doesn't have (one hardcoded admin account, by design — see decision 8).

**Why it moved to a cookie:** the original implementation stored the JWT in `sessionStorage`, readable by any JavaScript on the page — a single XSS bug anywhere (this codebase or a dependency) would leak the entire session. Moving to an httpOnly cookie removed that read surface entirely.

**Trade-off accepted, and where it bit:** cookies attach automatically to requests, including cross-site ones under `SameSite=None` (required since the client and API are different domains in production) — so this change *required* adding CSRF protection, which a bearer-token scheme wouldn't have needed. That CSRF cookie was then itself the subject of a real bug (see `SECURITY.md`'s Cookie Configuration section) — scoping it to the same `Path` as the auth cookie made it invisible to the SPA's own pages, silently breaking every admin mutation including logout, diagnosed with an actual headless-browser test rather than by inspection.

---

## 5. Why the double-submit CSRF cookie pattern, not a synchronizer token stored server-side

**Alternatives considered:** a server-side CSRF token stored per-session (synchronizer token pattern), issued on page load and validated against server state.

**Why double-submit:** this system has no server-side session store at all (JWT is stateless, by decision 4) — introducing one purely to hold a CSRF token would reintroduce exactly the operational cost that avoiding a session store was meant to avoid. The double-submit pattern needs no server-side state: the CSRF cookie's value *is* the token, and the security property comes from same-origin cookie-read restrictions, not from the server remembering anything about this specific session beyond what the JWT already encodes.

**Trade-off accepted:** double-submit is considered slightly weaker than a synchronizer token in threat models involving cookie-injection via a sibling subdomain — not a realistic concern for this system's actual deployment topology (a single API domain, no subdomain cookie-scoping in play).

---

## 6. Why `AdminAuthProvider` is scoped to `/admin`, not the app root

**Alternatives considered:** a top-level provider with an `if (isAdminRoute)` conditional inside it to skip the session check on public pages.

**Why the layout-route approach was chosen instead:** the conditional approach still mounts the provider (and its `useEffect`) for the entire app's lifetime — it just skips *acting* on public routes, which is fragile (easy to forget re-adding the guard if the effect is ever refactored) and doesn't reflect the actual intent, which is "this state has no business existing outside `/admin`." React Router's nested layout routes let a provider's mount lifecycle be scoped to a URL subtree structurally — `AdminSection` renders `<AdminAuthProvider><Outlet/></AdminAuthProvider>` only when a `/admin/*` path is actually matched, so the `GET /api/admin/me` check *cannot* fire on a public page, by construction, not by a conditional that could be bypassed by a future code change.

**What this fixed:** the original app-root-wrapped version caused a real regression — every public page load fired an admin session check, and combined with the `adminApi` response interceptor's 401-redirect logic, could redirect a public visitor to `/admin/login` unexpectedly.

---

## 7. Why receipt numbers use an atomic `Counter` collection, not `countDocuments() + 1`

**Alternatives considered:** deriving the next receipt number from `Transaction.countDocuments({...}) + 1` at verification time.

**Why the counter pattern was chosen:** counting-then-incrementing is a classic read-then-write race. Two concurrent `verify` calls (e.g. a donor's client retrying after a slow response) could both read the same count and both compute the same "next" number, producing duplicate receipt numbers — a real correctness bug for a receipt number that's supposed to be unique. `Counter.findOneAndUpdate({...}, {$inc:{seq:1}}, {upsert:true})` is a single atomic instruction at the MongoDB engine level; concurrent increments against the same document are serialized by the database itself, making duplicate numbers structurally impossible rather than merely unlikely.

**Why the counter is keyed by date:** this is what makes the daily reset to `000001` automatic. A new day's counter key simply doesn't exist yet; MongoDB treats a missing numeric field as `0` before applying `$inc`, so the first increment of a new day always starts fresh. No cron job, no manual reset step, no possibility of forgetting to reset it — the reset is a structural consequence of the key design, not a separate mechanism that could fail independently.

---

## 8. Why the receipt number is generated *inside* the same atomic write as the `paid` transition, not in a follow-up `.save()`

This was a specific, later refinement, made after the initial implementation generated the receipt number *after* a separate atomic status-transition write.

**The problem with the original approach:** if the process crashed, or the second write failed, between "status successfully set to `paid`" and "receipt number successfully saved," a `Transaction` could be left permanently `paid` with a `null` receiptNumber — an inconsistent state needing manual backfill, and one that would also break `getReceiptPdfForTransaction`'s "paid transactions always have a receipt" assumption.

**Why a MongoDB multi-document transaction/session was rejected as the fix:** a full ACID transaction requires session management and explicit retry-on-conflict handling for `TransientTransactionError`, for a single-document consistency problem. That's disproportionate machinery for what turned out to have a much simpler fix.

**What was actually done:** generate the receipt number *before* attempting the atomic claim, and include it in the *same* `$set` object as the `status: 'paid'` transition — so "become paid" and "receive a receipt number" happen as one indivisible write. There is no longer any window where a `Transaction` can be `paid` with a missing receipt number, even under a crash immediately after the write.

**Trade-off explicitly accepted:** if a request loses the atomic-claim race to a concurrent verify call for the same order, the receipt number it generated *before* losing is simply discarded — never assigned to any document. This shows up as an occasional skipped slot in the daily sequence (e.g. `000004` is never issued to anyone). Since receipt numbers were only ever promised to be unique and sortable, not gapless, this is a cosmetic trade-off, and it was chosen deliberately over the alternative of eliminating the atomic claim mechanism itself (which is what actually prevents duplicate processing).

---

## 9. Why a service layer exists for `razorpayService`/`receiptService`/`pdfService`, but not for every resource

**Alternatives considered:** a uniform service layer for every resource (`donationService.js`, `eventService.js`, etc.), for architectural consistency.

**Why a uniform service layer was rejected:** `donationController.createDonation` is a single `Donation.create(req.body)` call — there is no business logic to isolate from the HTTP layer. Introducing a `donationService.js` that just wraps that one line would be indirection with no corresponding benefit — a reader would have to jump to a second file to learn there's nothing there. Services in this codebase exist specifically where there's logic that (a) doesn't need `req`/`res` to function, and (b) has a real reason to be called, tested, or reasoned about independently of the HTTP request that happens to trigger it. Razorpay order creation, HMAC signature verification, atomic receipt numbering, and PDF document construction all meet that bar; a single `Model.create()` call does not.

**Trade-off accepted:** the codebase is not uniformly layered — some controllers call models directly, others go through services. This is treated as a feature, not an inconsistency: the presence or absence of a service layer for a given resource is itself a signal to a reader about how much logic actually lives there.

---

## 10. Why React Context (`AdminAuthContext`), not Redux/Zustand/Recoil

**Alternatives considered:** a global state management library for the admin session and/or shared UI state.

**Why Context was sufficient:** this application's only genuinely cross-cutting client state is admin authentication (`isAuthenticated`, `email`, `loading`) — a single `Context` scoped to the `/admin` route subtree (see decision 6) handles this cleanly with no additional dependency. Every other piece of state in this app (form inputs, list-page search/filter/sort/pagination, modal open/closed) is local to the component that owns it and has no reason to be shared globally. A state management library earns its place when many unrelated component trees need to read and write the same state with complex update patterns — that problem doesn't exist here.

**Trade-off accepted:** if this application later needed to share, say, a shopping-cart-like state across many unrelated components, Context alone might become unwieldy (re-render cost when the whole context value changes) — that point hasn't been reached, and introducing a library ahead of that need would be complexity paid for a problem the app doesn't have yet.

---

## 11. Why PDF generation happens server-side (`pdfkit`), not client-side

**Alternatives considered:** generating the receipt/certificate PDF in the browser (e.g. with `jsPDF`) from whatever donation data the client currently has in memory.

**Why server-side:** a receipt/certificate is meant to represent a *verified* fact (a payment that the server independently confirmed), not whatever the client happens to believe at render time. Generating it server-side, on request, directly from the `Transaction` document — after re-checking `status === 'paid'` inside `receiptService` itself — means the document's contents can never diverge from the actual database record, and the `paid`-only business rule is enforced at the one place that matters, not duplicated (and potentially forgotten) on the frontend. It also means the PDF generation logic is testable in isolation, with no browser/DOM dependency at all — which is exactly how it was verified during development (calling the builder functions directly and inspecting the resulting PDF bytes).

**Trade-off accepted:** PDF generation adds a server-side dependency (`pdfkit`) and a small amount of CPU work per download request, versus offloading that work to the client. Considered clearly worth it given the integrity argument above.

---

## 12. Why the pagination helper (`utils/pagination.js`) was extracted *after* 8 duplicated implementations existed, not designed upfront

**Alternatives considered:** building a shared pagination utility from the very first controller that needed pagination.

**Why extraction was deferred:** the exact right shape of a shared abstraction is easiest to get right once several real call sites exist to generalize from — extracting after one example risks guessing an interface that doesn't actually fit the second or third use case (for instance, the public endpoints needed an additional `maxLimit` cap that the admin endpoints didn't, which only became a clear, generalizable requirement once both variants existed side-by-side). Once eight genuinely identical implementations existed — verified byte-for-byte identical via direct inspection — extracting them into `parsePagination`/`buildPaginationMeta` became a purely mechanical, low-risk, behavior-preserving refactor, verified against the original formulas (including the `maxLimit`-capping variant) before being wired into all eight call sites.

**Trade-off accepted:** for a period during development, this duplication existed uncorrected. Accepted as the right order of operations — premature abstraction based on a single example is a more expensive mistake to unwind than temporary duplication.

---

## 13. Why Razorpay, not Stripe or a custom payment gateway integration

**Why Razorpay:** the target user base is India-based (an NGO operating in Noida), and Razorpay is the dominant, well-documented payment gateway for Indian donors, with native support for UPI — the payment method most Indian donors actually prefer over card payments. Stripe's India support is comparatively limited for a project at this scale and audience. Building a custom integration with individual banks/payment networks would be reinventing a solved, security-critical problem for no benefit.

**Trade-off accepted:** the codebase is coupled to Razorpay's specific API shapes (`orders.create`, the Checkout `handler` callback contract, the `orderId|paymentId` HMAC scheme) — swapping payment providers later would require rewriting `razorpayService.js` and the Checkout-integration parts of `DonationPaymentForm.jsx`, though the `Transaction` model itself (rupee-denominated, provider-agnostic field names like `status`/`amount`) was deliberately kept independent enough that this would be a contained rewrite, not a full data-model migration.

---

## 14. Why this folder structure (`routes/controllers/services/models` per top-level concern, `admin/` as a sub-namespace rather than a separate app)

**Alternatives considered:** a fully separate admin API (its own Express app/port), or a feature-folder structure (`features/events/{routes,controller,model}.js` instead of `routes/eventRoutes.js` + `controllers/eventController.js` + `models/Event.js`).

**Why one API with an `admin/` sub-namespace inside `controllers/`, not a separate app:** the admin and public APIs share the same middleware infrastructure (Helmet, CORS, rate limiting, error handling) and the same database connection — running them as separate processes would duplicate all of that for no isolation benefit, since there's no deployment reason (traffic pattern, scaling need) to split them apart at this scale.

**Why layer-first folders (`routes/`, `controllers/`, `models/`) rather than feature-first folders:** this codebase has few enough resources (7 collections, ~10 route files) that layer-first folders stay easy to navigate — "where does validation happen for X" always means "open `routes/xRoutes.js`," consistently, everywhere. Feature-first folders pay off more as the number of resources grows large enough that a layer-first folder becomes unwieldy to scroll through; this project hasn't reached that point.

## Future Scalability of These Decisions

Every trade-off above was written down specifically so a future maintainer doesn't have to rediscover *why* something is the way it is before deciding whether it's still the right call. As this project grows (more admins, higher donation volume, additional payment providers, a mobile app consuming the same API), several of these decisions have a documented "what would change" already built in: the `Transaction.verifiedVia`/`processing` fields exist for webhooks before webhooks exist; the service-layer boundary exists so new business logic has an obvious home; the flat, join-free schema exists because nothing has needed a join yet, not because joins were rejected outright.

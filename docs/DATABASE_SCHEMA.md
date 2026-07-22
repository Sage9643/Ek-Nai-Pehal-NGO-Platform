# Database Schema — Ek Nai Pehal NGO Platform

MongoDB via Mongoose. Seven collections. This document explains *why* the schema is shaped this way, not just what fields exist — the field lists themselves are in the model files (`server/models/*.js`), which are the actual source of truth if this document ever drifts from them.

## Why No Relational Joins

Nothing in this schema references another collection via a foreign key, and there is no `populate()` call anywhere in the codebase. This isn't an oversight — it reflects the actual shape of the domain: a `Volunteer` application, a `ContactQuery`, an `Event`, a `Gallery` image, a `Donation` inquiry, and a `Transaction` are all independent facts about the world that happen to be tracked by the same organization. None of them need to reference each other to be useful. If a future feature required, say, linking a `Transaction` to a donor account, that would be the point at which a real reference field earns its place — introducing one now, speculatively, would be exactly the kind of premature structure this project deliberately avoids (see `ENGINEERING_DECISIONS.md`).

---

## `Volunteer`

**Why it exists:** captures a volunteer application as a standalone lead, with no dependency on any other collection.

| Field | Type | Validation |
|---|---|---|
| name | String | 2–100 chars |
| email | String | RFC-shaped regex |
| phone | String | `/^[6-9]\d{9}$/` — Indian mobile format |
| college | String | 2–150 chars |
| motivation | String | 10–1000 chars |
| createdAt/updatedAt | Date | `timestamps: true` |

**Index:** `{ createdAt: -1 }` — every read of this collection (the admin list) sorts newest-first; this index lets MongoDB satisfy that sort directly rather than an in-memory sort once the collection grows past a few thousand documents.

**Query pattern:** paginated list with free-text search across `name`/`email`/`phone` via an unanchored case-insensitive regex (`buildVolunteerFilter` in `volunteerAdminController.js`). This search is **deliberately not backed by a text index** — a standard MongoDB text index accelerates whole-word/prefix matching, not arbitrary substring matching (`/rah/i` matching "Farhan"), so adding one here would provide no real speedup, only false confidence that the search is "indexed."

**Lifecycle:** create → (optionally) delete. No status workflow — a volunteer application doesn't have intermediate states in this system yet.

---

## `ContactQuery`

**Why it exists:** general-purpose contact form submissions, structurally identical in spirit to `Volunteer` (a lead, no workflow).

| Field | Type |
|---|---|
| name, email, subject, message | String, each with length bounds enforced in the schema |

**Index:** `{ createdAt: -1 }`. Same non-indexed-search reasoning as `Volunteer`.

---

## `Event`

**Why it exists:** public-facing event content, plus the admin CRUD surface that manages it.

| Field | Type | Notes |
|---|---|---|
| title, description, image | String | `image` is validated as either an absolute URL or a `/image/...`-prefixed local path |
| category | String enum | `Education`, `Workshop`, `Community`, `Celebration`, `Visit` |
| date | Date | the event's actual date — distinct from `createdAt`, which is when the record was created in the admin panel |

**Indexes:**
- `{ date: -1 }` — the public `GET /api/events` endpoint sorts by event date
- `{ createdAt: -1 }` — the admin list sorts by record-creation date instead (an admin managing content cares about "what did I add most recently," not the event's calendar date)
- `{ category: 1 }` — both the public category filter and the admin search touch this field

Having two separate sort-supporting indexes for the same collection is intentional: the public and admin views genuinely want different orderings, and each needs its own index to avoid an in-memory sort.

---

## `Gallery`

| Field | Type |
|---|---|
| title, description, image | String |
| featured | Boolean |

**Index:** `{ featured: 1, createdAt: -1 }` — a single compound index that serves both "list newest first" and a potential future "show featured images first" query without a second index or a secondary in-memory sort step.

---

## `Donation` (in-kind inquiries — not payments)

**Why it exists, and why it's separate from `Transaction`:** a `Donation` represents an expressed *intent* to give physical items (books, clothes, stationery), tracked through a human-managed workflow. No money is ever verified or moved through this model. This is fundamentally different from a `Transaction`, which only exists once a real payment attempt has started and whose most important field can only be set by one cryptographically-verified code path. Merging the two into a single polymorphic schema would have forced every future consumer (admin UI, certificates, receipts, analytics) to branch on "is this actually a payment or just a pledge?" at read time — keeping them separate makes that distinction a schema-level fact instead of a runtime check scattered across the codebase.

| Field | Type | Notes |
|---|---|---|
| name, email, phone, message | String | donor contact + optional note |
| donationType | String enum | `Books`, `Stationery`, `Educational Material`, `Clothes`, `Toys`, `Sports Equipment`, `Other` — **no longer includes "Financial Support"**, which was removed from the selectable options once the real Razorpay payment flow (`Transaction`) existed, to avoid a donor "donating money" through a path that charges nothing and issues no receipt |
| status | String enum | `Pending → Accepted → Scheduled → Received → Completed`, transitioned only by an admin via `PUT /api/admin/donations/:id/status` |

**Index:** `{ createdAt: -1 }`.

**Lifecycle:** created by a public donor → admin reviews and progresses `status` as the physical donation is coordinated and received. Nothing about this lifecycle involves Razorpay or any payment verification.

---

## `Transaction` (verified Razorpay payments)

**Why it exists:** the single source of truth for every donation that involved real money moving through Razorpay. Every field on this model exists because a specific piece of the payment flow needs it — nothing here is speculative.

| Field | Type | Why |
|---|---|---|
| donorName, donorEmail, donorPhone | String | captured at order-creation time |
| amount | Number | **always rupees.** This is a deliberate unit boundary: Razorpay's API requires paise, but every other consumer of this field (admin UI, receipts, certificates, the `Transaction` document itself) reads and writes rupees. The conversion to paise happens in exactly two places in the whole codebase — `razorpayService.createOrder` (for the Orders API call) and `DonationPaymentForm.jsx` (for the Checkout options) — both computed independently from this same rupee value, never chained. |
| currency | String enum | `['INR']` only — deliberately restrictive; extending it later is a one-line enum change, not a migration |
| razorpayOrderId | String, **unique** | the stable link to Razorpay's side of this transaction for its entire lifecycle |
| razorpayPaymentId | String, nullable | only populated once an actual payment attempt has occurred |
| razorpaySignature | String, nullable | stored for audit only — **never re-trusted** after the initial verification; the signature is not re-checked on every subsequent read |
| status | String enum | `created → processing → paid → failed → refunded`. `processing` and `refunded` are not currently reachable by any code path — they exist so that a future webhook handler or refund feature needs zero schema migration when built |
| verifiedVia | String enum | `checkout` \| `webhook` — defaults to `checkout` (the only implemented path today); exists for the same future-proofing reason as above |
| failureReason | String | populated only when `status` transitions to `failed` |
| receiptNumber | String, **unique + sparse** | format `ENP-YYYYMMDD-XXXXXX`; sparse because the vast majority of documents (anything not yet `paid`) never have one, and a plain unique index would reject multiple `null` values |
| message | String | optional donor note, mirrors `Donation.message` for UI consistency |

**Indexes:**
- `{ razorpayOrderId: 1 }` unique — this is what makes `Transaction.findOne({razorpayOrderId})` in `verifyPayment` a fast, correct lookup, and the uniqueness constraint itself is a second line of defense against ever creating two `Transaction` documents for the same Razorpay order
- `{ status: 1, createdAt: -1 }` — serves both the admin's "recent transactions" list and any status-filtered view from one index
- `{ createdAt: -1 }` — general recency sort
- `{ receiptNumber: 1 }` unique + sparse — guarantees no two transactions can ever share a receipt number, as a database-level backstop independent of the atomic-counter logic that generates them (see below)

**Lifecycle:**
```
created  →  (signature verified)  →  paid       (terminal, success)
         →  (signature invalid)   →  failed     (terminal — a retry requires a NEW order/transaction)
```
There is no code path that transitions a `Transaction` out of `paid` or `failed` today. `processing`/`refunded` are reachable only by future code, not by anything currently deployed.

**Concurrency guarantee:** the `paid` transition and the `receiptNumber` assignment happen in a **single atomic `findOneAndUpdate`**, scoped to `{_id, status: 'created'}`. This is what prevents two near-simultaneous `verify` calls for the same order from both succeeding, both generating a receipt number, or leaving the document in an inconsistent `paid`-with-no-receiptNumber state if a crash occurred between two separate writes. This was a specific, deliberate design decision made *after* an initial version generated the receipt number in a second write following the status transition — see `ENGINEERING_DECISIONS.md` for the full reasoning and the accepted trade-off (an occasional skipped, never-issued receipt-number slot in the daily sequence).

---

## `Counter`

**Why it exists:** pure infrastructure backing the atomic, race-safe generation of `Transaction.receiptNumber`. Not a business entity — nothing in the admin UI displays a `Counter` document directly.

| Field | Type |
|---|---|
| _id | String — a caller-defined key, e.g. `receipt-20260716` |
| seq | Number |

**How it's used:** `receiptService.generateReceiptNumber()` calls
```js
Counter.findOneAndUpdate({ _id: `receipt-${YYYYMMDD}` }, { $inc: { seq: 1 } }, { new: true, upsert: true })
```
`$inc` is a single atomic instruction at the MongoDB engine level — two concurrent calls against the same key are serialized by the database itself, so they can never observe or write the same `seq` value. Because the key is **date-scoped**, the daily reset to `000001` happens automatically: a new day's key simply doesn't exist yet, and MongoDB treats a missing numeric field as `0` before applying `$inc`, so the first call of a new day always starts the sequence fresh — no cron job, no manual reset step, no possibility of forgetting to reset it.

---

## Query Patterns Summary

| Pattern | Where it's used | How it's served |
|---|---|---|
| Paginated list, sorted, no filter | Public `GET /events`, `GET /gallery` | `.sort().skip().limit().lean()` + `.countDocuments()`, concurrent via `Promise.all` |
| Paginated list, searchable, sorted | Every admin `GET /admin/<resource>` | Same, plus a `$or` regex filter built per-resource (`buildXFilter` functions) |
| Paginated, searchable, status-filterable, sortable | `GET /admin/transactions` | Same shape, plus an exact-match `status` filter and a caller-chosen `sortBy`/`sortOrder` (validated against an allow-list, `SORTABLE_FIELDS`, before being interpolated into the sort object) |
| Aggregate totals | `GET /admin/transactions/stats` | One `$match`+`$group` aggregation pipeline for the sum, three parallel `countDocuments` calls for the status breakdown |
| Single-document atomic transition | `POST /payments/verify` | `findOneAndUpdate` scoped by both `_id` and current `status`, so the write only succeeds if the document is still in the expected state |
| Atomic increment | Receipt numbering | `findOneAndUpdate` with `$inc` and `upsert: true` |

## Performance Considerations

- Every list endpoint uses `.lean()` for read-only queries, which skips Mongoose document hydration (no change-tracking, no virtuals, no getters) — a meaningful win at list-view scale since these documents are only ever serialized straight to JSON, never mutated in place.
- `Promise.all` is used everywhere two or more independent queries are needed for one response (a list + its count, or the four aggregate figures on the stats endpoint) — sequential `await`s would double the latency of every such endpoint for no benefit, since none of these queries depend on each other's results.
- No collection in this system currently approaches a size where these indexes would need revisiting — they were all added because a specific, real query needed them, not speculatively ahead of scale.
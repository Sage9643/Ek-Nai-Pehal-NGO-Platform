const mongoose = require('mongoose');

/**
 * Generic atomic counter collection.
 *
 * Each document is keyed by a caller-chosen string (e.g. a date-scoped key
 * like `receipt-20260716`) and holds a single incrementing `seq`. Callers
 * MUST update it via `findOneAndUpdate` with `$inc` and `upsert: true` (see
 * services/receiptService.js) — never by reading `seq`, adding 1 in
 * application code, and writing it back. That read-then-write pattern is
 * exactly the race condition this collection exists to eliminate: two
 * concurrent payments could read the same `seq` and both compute the same
 * "next" number. `findOneAndUpdate` + `$inc` is atomic at the MongoDB
 * level, so concurrent callers are always serialized into strictly
 * distinct values, even under heavy concurrent payment traffic.
 *
 * Using a date-scoped key (rather than one single global document) is also
 * what makes the daily reset automatic: the first increment against a new
 * day's key always starts from an implicit 0 (MongoDB treats a missing
 * numeric field as 0 before applying $inc), with no separate reset logic
 * required anywhere.
 */
const counterSchema = new mongoose.Schema(
  {
    // e.g. "receipt-20260716" — the caller defines the key's meaning and
    // scope entirely; this model has no opinion about what it's counting.
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    // Counters are transient bookkeeping, not user-facing records — no
    // need for createdAt/updatedAt noise on every increment.
    timestamps: false,
  }
);

module.exports = mongoose.model('Counter', counterSchema);
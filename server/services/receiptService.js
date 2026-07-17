const Counter = require('../models/Counter');

/**
 * Format a Date as YYYYMMDD, in UTC, so the receipt-number date component
 * is stable regardless of the server's local timezone.
 */
const formatDateYYYYMMDD = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Generate the next receipt number for the given day, in the form
 * ENP-YYYYMMDD-XXXXXX (e.g. ENP-20260716-000001).
 *
 * Uses the shared Counter collection, keyed by a date-scoped string
 * (`receipt-YYYYMMDD`), updated via findOneAndUpdate + $inc — this is
 * atomic at the MongoDB level, so concurrent payments completing at the
 * same moment still receive strictly distinct, gapless-per-day sequence
 * numbers. Because the key itself is date-scoped, the sequence resets to
 * 1 automatically on the first call of each new day — there is no
 * separate "reset" step to run or forget.
 *
 * Must only be called once per transaction, at the moment its status is
 * being flipped to 'paid' — never speculatively for a 'created' or
 * 'processing' transaction, since receipt numbers are meant to correspond
 * 1:1 with confirmed donations.
 *
 * @param {Date} [date] - defaults to now; accepts an explicit date mainly
 *   to make this function deterministic in tests.
 * @returns {Promise<string>}
 */
const generateReceiptNumber = async (date = new Date()) => {
  const datePart = formatDateYYYYMMDD(date);
  const counterKey = `receipt-${datePart}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequencePart = String(counter.seq).padStart(6, '0');

  return `ENP-${datePart}-${sequencePart}`;
};

module.exports = { generateReceiptNumber, formatDateYYYYMMDD };
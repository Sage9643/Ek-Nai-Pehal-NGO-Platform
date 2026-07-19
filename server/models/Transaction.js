
const mongoose = require('mongoose');
 
/**
 * Lifecycle:
 *   created    -> order created with Razorpay, no payment attempted yet
 *   processing -> reserved for future async/webhook-driven confirmations
 *                 (e.g. UPI intents); not entered during Phase 3's
 *                 synchronous checkout-verify flow, but present now so a
 *                 later webhook integration needs zero schema changes
 *   paid       -> signature verified server-side; the ONLY status that
 *                 counts toward dashboard totals/analytics/receipts
 *   failed     -> signature mismatch or a Razorpay-reported failure
 *   refunded   -> reserved for future refund support; no refund logic or
 *                 UI exists yet, the enum value just avoids a migration
 *                 when that lands
 */
const TRANSACTION_STATUSES = ['created', 'processing', 'paid', 'failed', 'refunded'];
 
const transactionSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
      minlength: [2, 'Donor name must be at least 2 characters'],
      maxlength: [100, 'Donor name cannot exceed 100 characters'],
    },
 
    donorEmail: {
      type: String,
      required: [true, 'Donor email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
 
    donorPhone: {
      type: String,
      trim: true,
      default: '',
    },
 
    // Stored in the donation's actual currency unit (e.g. rupees for INR),
    // NOT in the smallest unit (paise) Razorpay's API itself expects — the
    // conversion to/from paise happens only at the Razorpay SDK call sites
    // in razorpayService.js, keeping this schema human-readable everywhere
    // it's read (admin UI, receipts, certificates, future CSV export).
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
 
    currency: {
      type: String,
      enum: {
        values: ['INR'],
        message: 'Only INR is currently supported',
      },
      default: 'INR',
      uppercase: true,
      trim: true,
    },
 
    // Set at order-creation time; the single stable identifier tying this
    // record to Razorpay's side for the entire lifecycle, including any
    // future webhook events (which are delivered keyed by order/payment id,
    // not by our internal _id).
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      unique: true,
      trim: true,
    },
 
    // Only populated once a payment attempt has actually happened.
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },
 
    // Stored for audit purposes only — never re-used as the source of
    // truth after the initial verification (the server-recomputed HMAC is
    // the only thing that ever flips status to 'paid').
    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
    },
 
    status: {
      type: String,
      enum: {
        values: TRANSACTION_STATUSES,
        message: `Status must be one of: ${TRANSACTION_STATUSES.join(', ')}`,
      },
      default: 'created',
    },
 
    // How this transaction's current status was last confirmed. Defaults
    // to the synchronous checkout-verify flow used in Phase 3; a future
    // webhook handler can set this to 'webhook' when it updates the same
    // record, with no schema change required.
    verifiedVia: {
      type: String,
      enum: ['checkout', 'webhook'],
      default: 'checkout',
    },
 
    // Populated only when a payment fails, for admin troubleshooting.
    failureReason: {
      type: String,
      trim: true,
      default: '',
    },
 
    // Set only when status transitions to 'paid'. Format: ENP-YYYYMMDD-XXXXXX
    // (see services/receiptService.js for the race-safe generator). Sparse
    // + unique so many documents can share the "not yet issued" (missing)
    // state without violating the uniqueness constraint.
    receiptNumber: {
      type: String,
      trim: true,
    
    },
 
    // Optional donor note, mirrors the equivalent field on the Donation
    // inquiry model for consistency.
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);
 
// Admin transaction list is always sorted newest-first and frequently
// filtered by status (e.g. "show only paid") — compound index serves both
// from one index, avoiding a collection scan as volume grows.
transactionSchema.index({ status: 1, createdAt: -1 });
 
// Dashboard "recent transactions" widget and monthly-trend aggregation both
// sort/group by createdAt independent of status.
transactionSchema.index({ createdAt: -1 });
 
// Receipt numbers must be unique once issued; sparse allows the (many)
// non-paid documents to omit this field without tripping the unique index.
transactionSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
 
module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.TRANSACTION_STATUSES = TRANSACTION_STATUSES;
 

const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { env } = require('../config/env');
const logger = require('../config/logger');
const razorpayService = require('../services/razorpayService');
const receiptService = require('../services/receiptService');
const { streamPdfToResponse } = require('../services/pdfService');

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for a financial donation and records a
 * 'created' Transaction tied to it via razorpayOrderId. Nothing about
 * payment success is decided here — this only sets up the attempt; see
 * verifyPayment for the only place status ever advances past 'created'.
 *
 * Ordering note: the Razorpay order must be created FIRST, since
 * Transaction.razorpayOrderId is required — we can't persist a Transaction
 * without an order id to attach it to. This means a failure between the
 * two calls (Razorpay succeeds, our own DB write fails) can leave an
 * orphaned Razorpay order with no local record. That's logged loudly for
 * manual reconciliation rather than silently swallowed; a distributed
 * transaction/saga to fully close this gap would be disproportionate
 * engineering for this project's scale.
 */
const createOrder = async (req, res, next) => {
  try {
    const { donorName, donorEmail, donorPhone, amount, message } = req.body;

    const order = await razorpayService.createOrder({
      amountInRupees: amount,
      receiptId: `order-${crypto.randomUUID()}`,
      notes: { donorName, donorEmail },
    });

    let transaction;
    try {
      transaction = await Transaction.create({
        donorName,
        donorEmail,
        donorPhone,
        amount,
        razorpayOrderId: order.id,
        message,
      });
    } catch (persistError) {
      logger.error(
        { err: persistError, razorpayOrderId: order.id },
        'Razorpay order created but Transaction record failed to persist — orphaned order needs manual reconciliation'
      );
      throw persistError;
    }

    sendSuccess(res, {
      statusCode: 201,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        transactionId: transaction._id,
        amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 * Server-side signature verification — the ONLY place a Transaction is
 * ever allowed to transition to 'paid'. The frontend's own report that
 * "the payment succeeded" is never trusted; Razorpay's signature is
 * recomputed here independently (see razorpayService.verifyCheckoutSignature).
 *
 * Concurrency: uses an atomic conditional update (findOneAndUpdate scoped
 * to status: 'created') to claim the transaction, so two near-simultaneous
 * verify calls for the same order (e.g. a client-side retry after a slow
 * response) can never both pass through and both process the same payment
 * — exactly the same class of race the atomic Counter increment (see
 * receiptService.js) protects against, applied here to the transaction's
 * own status transition. The receipt number is generated before the claim
 * and written in the SAME atomic update as the 'paid' transition, so a
 * transaction can never end up 'paid' with a missing receiptNumber, even
 * if the process crashed immediately after — the only cost is that a
 * losing concurrent request's receipt number is discarded unused, which
 * only ever skips a slot in the daily sequence (numbers are guaranteed
 * unique and sortable, not gapless).
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    const transaction = await Transaction.findOne({ razorpayOrderId: orderId });

    if (!transaction) {
      throw new AppError('No matching donation order found', 404);
    }

    // Idempotency: a duplicate verify call for an already-settled order
    // (e.g. the client retried after a network hiccup on the first
    // response) returns the existing result instead of re-processing.
    if (transaction.status === 'paid') {
      return sendSuccess(res, {
        message: 'Payment already verified',
        data: {
          transactionId: transaction._id,
          receiptNumber: transaction.receiptNumber,
          status: transaction.status,
          amount: transaction.amount,
          donorName: transaction.donorName,
        },
      });
    }

    if (transaction.status === 'failed') {
      throw new AppError(
        'This payment attempt already failed. Please start a new donation.',
        400
      );
    }

    const isValid = razorpayService.verifyCheckoutSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      await Transaction.updateOne(
        { _id: transaction._id, status: 'created' },
        {
          $set: {
            status: 'failed',
            razorpayPaymentId: paymentId || null,
            razorpaySignature: signature || null,
            failureReason: 'Signature verification failed',
          },
        }
      );

      throw new AppError('Payment verification failed', 400);
    }

    // Generate the receipt number BEFORE attempting the atomic claim, and
    // fold it into the SAME $set as the status transition below, so
    // "become paid" and "get a receipt number" happen as one indivisible
    // write — there is no longer a window where a transaction can be
    // 'paid' with a null receiptNumber, even if the process crashed or a
    // later write failed right after this line.
    //
    // Trade-off (accepted): if this request loses the race to a
    // concurrent verify call for the same order (see below), the receipt
    // number generated here is simply never assigned to anything and the
    // daily sequence skips it. Receipt numbers are only guaranteed unique
    // and sortable, not gapless, so this is a cosmetic gap, not a
    // correctness issue — and it only occurs in the rare case of two
    // concurrent verify calls for the very same order.
    const receiptNumber = await receiptService.generateReceiptNumber();

    // Atomic claim: only succeeds for whichever concurrent request gets
    // here first while status is still 'created'. A losing request gets
    // `claimed === null` and falls through to the idempotent branch below
    // instead of double-processing — and its receiptNumber above is
    // simply discarded (see trade-off note above).
    const claimed = await Transaction.findOneAndUpdate(
      { _id: transaction._id, status: 'created' },
      {
        $set: {
          status: 'paid',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          verifiedVia: 'checkout',
          receiptNumber,
        },
      },
      { new: true }
    );

    if (!claimed) {
      const latest = await Transaction.findById(transaction._id);
      return sendSuccess(res, {
        message: 'Payment already verified',
        data: {
          transactionId: latest._id,
          receiptNumber: latest.receiptNumber,
          status: latest.status,
          amount: latest.amount,
          donorName: latest.donorName,
        },
      });
    }

    sendSuccess(res, {
      message: 'Payment verified successfully',
      data: {
        transactionId: claimed._id,
        receiptNumber: claimed.receiptNumber,
        status: claimed.status,
        amount: claimed.amount,
        donorName: claimed.donorName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:transactionId
 * Fetches a transaction's public-facing summary — used by the donation
 * receipt page to render on-screen details before offering the PDF
 * downloads. Deliberately excludes razorpaySignature and donor contact
 * details (email/phone); the transactionId itself (an unguessable Mongo
 * ObjectId, known only to the donor via their post-payment redirect) is
 * the only access control here, consistent with this being a public,
 * account-free donation flow.
 */
const getTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    sendSuccess(res, {
      data: {
        transactionId: transaction._id,
        status: transaction.status,
        donorName: transaction.donorName,
        amount: transaction.amount,
        currency: transaction.currency,
        receiptNumber: transaction.receiptNumber,
        razorpayPaymentId: transaction.razorpayPaymentId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:transactionId/receipt.pdf
 * Streams a server-generated receipt PDF. All 'paid'-only enforcement
 * lives in receiptService.getReceiptPdfForTransaction — this controller
 * is purely the HTTP-shaped wrapper around it.
 */
const getReceiptPdf = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const doc = await receiptService.getReceiptPdfForTransaction(transactionId);

    streamPdfToResponse(doc, res, {
      filename: `receipt-${transactionId}.pdf`,
      disposition: 'attachment',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:transactionId/certificate.pdf
 * Streams a server-generated donation certificate PDF.
 */
const getCertificatePdf = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const doc = await receiptService.getCertificatePdfForTransaction(transactionId);

    streamPdfToResponse(doc, res, {
      filename: `certificate-${transactionId}.pdf`,
      disposition: 'attachment',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getTransaction,
  getReceiptPdf,
  getCertificatePdf,
};
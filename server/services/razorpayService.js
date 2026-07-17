const Razorpay = require('razorpay');
const crypto = require('crypto');
const { env } = require('../config/env');
 
const RUPEES_TO_PAISE = 100;
 
let razorpayInstance = null;
 
/**
 * Lazily construct the Razorpay SDK client. Lazy so a server started
 * without Razorpay keys configured (e.g. before .env is filled in on a
 * fresh checkout) can still boot and serve every other route — the
 * failure is deferred to the moment a payment is actually attempted,
 * rather than crashing the whole process at startup.
 */
const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;
 
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      'Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)'
    );
  }
 
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
 
  return razorpayInstance;
};
 
/**
 * Create a Razorpay order for the given rupee amount.
 *
 * Razorpay's API expects amounts in the smallest currency unit (paise for
 * INR). This is the ONLY place in the codebase that conversion happens —
 * every other layer (Transaction model, admin UI, receipts, certificates)
 * works exclusively in rupees, so a bug here can't silently propagate a
 * unit mismatch elsewhere.
 *
 * @param {Object} params
 * @param {number} params.amountInRupees
 * @param {string} params.receiptId - our own reference string, distinct
 *   from the donation receipt number generated later on successful
 *   verification; Razorpay just uses this as an opaque merchant reference.
 * @param {Object} [params.notes]
 */
const createOrder = async ({ amountInRupees, receiptId, notes = {} }) => {
  // Defense-in-depth: the controller already validates the incoming amount,
  // but this service function is also callable directly (e.g. from a
  // future job/script), so it must not trust its caller either.
  if (typeof amountInRupees !== 'number' || !Number.isFinite(amountInRupees)) {
    throw new Error('amountInRupees must be a finite number');
  }
 
  if (amountInRupees <= 0) {
    throw new Error('amountInRupees must be greater than 0');
  }
 
  const instance = getRazorpayInstance();
 
  const order = await instance.orders.create({
    amount: Math.round(amountInRupees * RUPEES_TO_PAISE),
    currency: 'INR',
    receipt: receiptId,
    notes,
  });
 
  return order;
};
 
/**
 * Constant-time comparison of an expected vs. received HMAC signature.
 * Shared by the checkout-verify flow below and, later, a webhook handler —
 * whose signature is computed differently (HMAC over the raw request body
 * using a separate webhook secret, rather than over `orderId|paymentId`
 * using the API key secret) but which still ultimately needs this exact
 * same "does this match, safely" check. Keeping the comparison itself
 * separate from how each signature is *derived* is what lets a webhook
 * handler be added later without touching this function or its callers.
 */
const verifySignature = (expected, received) => {
  if (!expected || !received) return false;
 
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
 
  // timingSafeEqual throws on length mismatch rather than returning false,
  // so that case must be handled explicitly first.
  if (expectedBuffer.length !== receivedBuffer.length) return false;
 
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
 
/**
 * Verify a Razorpay Checkout.js payment signature.
 *
 * Per Razorpay's documented scheme, the checkout signature is
 * HMAC-SHA256(`${orderId}|${paymentId}`, key_secret). This MUST be
 * recomputed here, server-side — the frontend's own report that "the
 * payment succeeded" is never trusted as the source of truth.
 */
const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
 
  return verifySignature(expected, signature);
};
 
module.exports = {
  getRazorpayInstance,
  createOrder,
  verifySignature,
  verifyCheckoutSignature,
  RUPEES_TO_PAISE,
};
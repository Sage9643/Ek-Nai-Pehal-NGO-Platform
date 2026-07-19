const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { paymentLimiter, transactionLookupLimiter } = require('../middleware/rateLimiters');
const {
  createOrder,
  verifyPayment,
  getTransaction,
  getReceiptPdf,
  getCertificatePdf,
} = require('../controllers/paymentController');

const router = express.Router();

const createOrderValidation = [
  body('donorName')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('donorEmail')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('donorPhone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0')
    .toFloat(),
  body('message')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
];

const verifyPaymentValidation = [
  body('razorpay_order_id').trim().notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').trim().notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').trim().notEmpty().withMessage('razorpay_signature is required'),
];

// Order creation and verification both call out to Razorpay (or gate the
// only path to a 'paid' transition) — same cost/quota-shaped concern as
// the chatbot's Gemini calls, so both share paymentLimiter rather than the
// looser formLimiter used by the plain inquiry forms.
router.post('/create-order', paymentLimiter, createOrderValidation, validate, createOrder);
router.post('/verify', paymentLimiter, verifyPaymentValidation, validate, verifyPayment);

// Read-only lookups for the donation receipt page. Rate-limited via
// transactionLookupLimiter (see middleware/rateLimiters.js) — these
// endpoints have no authentication, and MongoDB ObjectIds are guessable
// enough (fixed per-process random bytes + a small incrementing counter)
// that unrestricted access would let someone enumerate other donors'
// names and amounts. Malformed :transactionId values are handled by the
// existing Mongoose CastError -> 400 path in errorHandler.js, consistent
// with how every other :id route in this codebase behaves.
router.get('/:transactionId', transactionLookupLimiter, getTransaction);
router.get('/:transactionId/receipt.pdf', transactionLookupLimiter, getReceiptPdf);
router.get('/:transactionId/certificate.pdf', transactionLookupLimiter, getCertificatePdf);

module.exports = router;
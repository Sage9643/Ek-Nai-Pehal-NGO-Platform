const Counter = require('../models/Counter');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const {
  ORG_NAME,
  BRAND,
  PAGE_MARGIN,
  createDocument,
  drawHeader,
  drawFooter,
  drawField,
} = require('./pdfService');

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

/**
 * Format a rupee amount for display on receipts/certificates. Kept here
 * (not in pdfService) since it's donation-display logic, not a generic
 * PDF-building concern.
 */
const formatCurrency = (amount, currency = 'INR') => {
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
};

/**
 * Format a Date for display on receipts/certificates (UTC, human-readable).
 */
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' UTC';
};

/**
 * Build a receipt PDF document for a verified financial donation.
 *
 * Receipts exist ONLY for financial donations — a physical/in-kind
 * donation inquiry never involves a payment, so it never has a receipt
 * (see buildCertificateDocument below, which both donation types share).
 * Deliberately takes plain fields rather than requiring a live Transaction
 * document, so it stays reusable/testable independent of Mongoose — the
 * Transaction-aware wrapper (getReceiptPdfForTransaction) below is what
 * actually fetches from the database.
 *
 * @param {Object} data
 * @param {string} data.receiptNumber
 * @param {string} [data.transactionId] - Razorpay payment ID
 * @param {string} data.donorName
 * @param {number} data.amount
 * @param {string} [data.currency]
 * @param {Date|string} data.paidAt
 * @returns {import('pdfkit')} an un-ended pdfkit document — caller streams it
 */
const buildReceiptDocument = ({ receiptNumber, transactionId, donorName, amount, currency, paidAt }) => {
  if (!receiptNumber) {
    throw new AppError('Cannot build a receipt without a receipt number', 400);
  }

  const doc = createDocument();
  drawHeader(doc, { subtitle: 'DONATION RECEIPT' });

  drawField(doc, 'Receipt Number:', receiptNumber);
  drawField(doc, 'Transaction ID:', transactionId || '—');
  drawField(doc, 'Donor Name:', donorName);
  drawField(doc, 'Amount:', formatCurrency(amount, currency));
  drawField(doc, 'Date & Time:', formatDateTime(paidAt));
  drawField(doc, 'Payment Status:', 'Paid');

  doc.moveDown(1.5);
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(BRAND.text)
    .text(
      `Thank you for your generous contribution to ${ORG_NAME}. This receipt confirms a successfully verified donation.`,
      { width: doc.page.width - 150 }
    );

  drawFooter(doc, {});

  return doc;
};

/**
 * Build a certificate PDF — shared by BOTH financial donations (once a
 * Transaction reaches status 'paid') and physical donations (once a
 * Donation inquiry reaches status 'Completed'). Deliberately model-
 * agnostic: it has no dependency on either Mongoose schema and does not
 * re-check any status itself — callers are responsible for only invoking
 * this once their own model's completion rule is satisfied.
 *
 * @param {Object} data
 * @param {string} data.donorName
 * @param {string} data.referenceNumber - receipt number (financial) or
 *   certificate number (physical)
 * @param {Date|string} data.date
 * @param {string} [data.amount] - pre-formatted amount string; omit for
 *   physical donations, which have no monetary value to display
 * @param {string} [data.donationSummary] - e.g. "Books, Stationery" for
 *   physical donations; omit for financial donations
 * @returns {import('pdfkit')} an un-ended pdfkit document — caller streams it
 */
const buildCertificateDocument = ({ donorName, referenceNumber, date, amount, donationSummary }) => {
  if (!donorName || !referenceNumber) {
    throw new AppError('Cannot build a certificate without a donor name and reference number', 400);
  }

  const doc = createDocument();
  drawHeader(doc, { subtitle: 'CERTIFICATE OF APPRECIATION' });

  doc.moveDown(2);
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(BRAND.forest)
    .text('Certificate of Appreciation', { align: 'center' });

  doc.moveDown(1.5);
  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(BRAND.text)
    .text('This certificate is proudly presented to', { align: 'center' });

  doc.moveDown(0.5);
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor(BRAND.saffron)
    .text(donorName, { align: 'center' });

  doc.moveDown(1);
  const contribution = amount
    ? `a generous donation of ${amount}`
    : `a generous donation of ${donationSummary || 'essential items'}`;

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(BRAND.text)
    .text(`in recognition of ${contribution} toward ${ORG_NAME}'s mission.`, {
      align: 'center',
      width: doc.page.width - 150,
    });

  doc.moveDown(2);
  doc.x = PAGE_MARGIN;
  drawField(doc, 'Reference Number:', referenceNumber);
  drawField(doc, 'Date:', formatDateTime(date));

  drawFooter(doc, {
    note: `This certificate was generated by ${ORG_NAME} and is valid without a signature.`,
  });

  return doc;
};

/**
 * Fetch a Transaction and build its receipt PDF, enforcing the business
 * rule that a receipt only ever exists for a verified payment. This is the
 * Transaction-model-aware layer — buildReceiptDocument above stays plain
 * and reusable, this function is what actually touches the database.
 *
 * @param {string} transactionId - Mongo _id of the Transaction
 * @returns {Promise<import('pdfkit')>}
 */
const getReceiptPdfForTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.status !== 'paid') {
    throw new AppError('A receipt is only available for a successfully paid donation', 400);
  }

  return buildReceiptDocument({
    receiptNumber: transaction.receiptNumber,
    transactionId: transaction.razorpayPaymentId,
    donorName: transaction.donorName,
    amount: transaction.amount,
    currency: transaction.currency,
    paidAt: transaction.updatedAt || transaction.createdAt,
  });
};

/**
 * Fetch a Transaction and build its certificate PDF, enforcing the same
 * 'paid'-only rule as the receipt. A future Donation-status-Completed
 * controller will call buildCertificateDocument directly with its own
 * data instead of via this function, since it has no Transaction to fetch.
 *
 * @param {string} transactionId - Mongo _id of the Transaction
 * @returns {Promise<import('pdfkit')>}
 */
const getCertificatePdfForTransaction = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.status !== 'paid') {
    throw new AppError('A certificate is only available for a successfully paid donation', 400);
  }

  return buildCertificateDocument({
    donorName: transaction.donorName,
    referenceNumber: transaction.receiptNumber,
    date: transaction.updatedAt || transaction.createdAt,
    amount: formatCurrency(transaction.amount, transaction.currency),
  });
};

module.exports = {
  generateReceiptNumber,
  formatDateYYYYMMDD,
  buildReceiptDocument,
  buildCertificateDocument,
  getReceiptPdfForTransaction,
  getCertificatePdfForTransaction,
};
const Transaction = require('../../models/Transaction');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const DEFAULT_LIMIT = 10;
const SORTABLE_FIELDS = ['createdAt', 'amount'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTransactionFilter = (query) => {
  const { search = '', status = '' } = query;
  const filter = {};

  const term = search.trim();
  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    filter.$or = [
      { donorName: regex },
      { donorEmail: regex },
      { razorpayPaymentId: regex },
      { receiptNumber: regex },
    ];
  }

  const trimmedStatus = status.trim();
  if (trimmedStatus && Transaction.TRANSACTION_STATUSES.includes(trimmedStatus)) {
    filter.status = trimmedStatus;
  }

  return filter;
};

/**
 * GET /api/admin/transactions
 * Paginated, searchable, filterable, sortable list of donation
 * transactions (financial donations only — see models/Transaction.js for
 * why this is deliberately a separate collection from Donation inquiries).
 */
const getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildTransactionFilter(req.query);
    const skip = (page - 1) * limit;

    const sortBy = SORTABLE_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/transactions/stats
 * Aggregate figures for the AdminTransactions page's stat cards. Only
 * 'paid' transactions ever count toward totalAmount/successfulCount —
 * mirroring the same rule already enforced for receipt/certificate
 * eligibility in receiptService.js, so a donation only "counts" once it's
 * actually been verified, never while merely attempted or failed.
 */
const getTransactionStats = async (req, res, next) => {
  try {
    const [totals, successfulCount, pendingCount, failedCount] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
      ]),
      Transaction.countDocuments({ status: 'paid' }),
      Transaction.countDocuments({ status: { $in: ['created', 'processing'] } }),
      Transaction.countDocuments({ status: 'failed' }),
    ]);

    sendSuccess(res, {
      data: {
        totalAmount: totals[0]?.totalAmount || 0,
        successfulCount,
        pendingCount,
        failedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, getTransactionStats };
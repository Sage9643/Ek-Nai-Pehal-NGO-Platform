const Donation = require('../../models/Donation');

const DEFAULT_LIMIT = 10;
const DONATION_STATUSES = ['Pending', 'Accepted', 'Scheduled', 'Received', 'Completed'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDonationFilter = (query) => {
  const { search = '' } = query;
  const term = search.trim();

  if (!term) return {};

  const regex = new RegExp(escapeRegex(term), 'i');

  return {
    $or: [
      { name: regex },
      { email: regex },
      { phone: regex },
      { donationType: regex },
    ],
  };
};

/**
 * GET /api/admin/donations
 */
const getDonations = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildDonationFilter(req.query);
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      Donation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Donation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        donations,
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
 * PUT /api/admin/donations/:id/status
 */
const updateDonationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!DONATION_STATUSES.includes(status)) {
      const error = new Error(`Status must be one of: ${DONATION_STATUSES.join(', ')}`);
      error.statusCode = 400;
      return next(error);
    }

    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Donation status updated successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/donations/:id
 */
const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      const error = new Error('Donation not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDonations,
  updateDonationStatus,
  deleteDonation,
  DONATION_STATUSES,
};

const Donation = require('../models/Donation');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/donations
 * Submit a donation inquiry
 */
const createDonation = async (req, res, next) => {
  try {
    const donation = await Donation.create(req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Donation inquiry submitted successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDonation };

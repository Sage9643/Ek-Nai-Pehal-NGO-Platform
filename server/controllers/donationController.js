const Donation = require('../models/Donation');

/**
 * POST /api/donations
 * Submit a donation inquiry
 */
const createDonation = async (req, res, next) => {
  try {
    const donation = await Donation.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Donation inquiry submitted successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDonation };

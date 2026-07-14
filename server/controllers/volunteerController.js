const Volunteer = require('../models/Volunteer');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/volunteers
 * Register a new volunteer
 */
const createVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.create(req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Volunteer registered successfully',
      data: volunteer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createVolunteer };

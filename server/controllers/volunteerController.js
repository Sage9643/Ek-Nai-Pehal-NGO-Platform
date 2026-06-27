const Volunteer = require('../models/Volunteer');

/**
 * POST /api/volunteers
 * Register a new volunteer
 */
const createVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Volunteer registered successfully',
      data: volunteer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createVolunteer };

const Event = require('../models/Event');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/events
 * Fetch all events sorted by most recent first
 */
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: -1 });

    sendSuccess(res, {
      message: 'Events fetched successfully',
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents };

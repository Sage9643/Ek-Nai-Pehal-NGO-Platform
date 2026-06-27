const Event = require('../models/Event');

/**
 * GET /api/events
 * Fetch all events sorted by most recent first
 */
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date:-1 });

    res.status(200).json({
      success: true,
      message: 'Events fetched successfully',
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents };

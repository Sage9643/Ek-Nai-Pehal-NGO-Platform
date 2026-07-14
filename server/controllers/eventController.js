const Event = require('../models/Event');
const { sendSuccess } = require('../utils/apiResponse');

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 50;

/**
 * GET /api/events?page=1&limit=9&category=Education
 * Fetch events sorted by most recent first, paginated.
 *
 * Backward compatible: `data` remains the events array (existing frontend
 * code reading `res.data` keeps working); `pagination` and `count` are
 * additive fields consumers can opt into.
 */
const getEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    sendSuccess(res, {
      message: 'Events fetched successfully',
      data: events,
      count: events.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents };
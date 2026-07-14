const Event = require('../../models/Event');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const DEFAULT_LIMIT = 10;
const EVENT_CATEGORIES = ['Education', 'Workshop', 'Community', 'Celebration', 'Visit'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildEventFilter = (query) => {
  const { search = '' } = query;
  const term = search.trim();

  if (!term) return {};

  const regex = new RegExp(escapeRegex(term), 'i');

  return {
    $or: [{ title: regex }, { category: regex }],
  };
};

/**
 * GET /api/admin/events
 */
const getEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildEventFilter(req.query);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data: {
        events,
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
 * POST /api/admin/events
 */
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/events/:id
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    sendSuccess(res, {
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/events/:id
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    sendSuccess(res, { message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  EVENT_CATEGORIES,
};

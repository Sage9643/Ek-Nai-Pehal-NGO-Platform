const Volunteer = require('../../models/Volunteer');
const ContactQuery = require('../../models/ContactQuery');
const Event = require('../../models/Event');

const RECENT_PER_SOURCE = 5;
const RECENT_TOTAL = 10;

/**
 * GET /api/admin/dashboard
 * Return aggregate counts and merged recent activity from existing collections.
 */
const getDashboard = async (req, res, next) => {
  try {
    const [volunteerCount, contactCount, eventCount, volunteers, contacts, events] =
      await Promise.all([
        Volunteer.countDocuments(),
        ContactQuery.countDocuments(),
        Event.countDocuments(),
        Volunteer.find()
          .sort({ createdAt: -1 })
          .limit(RECENT_PER_SOURCE)
          .select('name email createdAt')
          .lean(),
        ContactQuery.find()
          .sort({ createdAt: -1 })
          .limit(RECENT_PER_SOURCE)
          .select('name subject createdAt')
          .lean(),
        Event.find()
          .sort({ createdAt: -1 })
          .limit(RECENT_PER_SOURCE)
          .select('title category createdAt')
          .lean(),
      ]);

    const recentActivity = [
      ...volunteers.map((item) => ({
        type: 'volunteer',
        id: item._id,
        title: item.name,
        subtitle: item.email,
        createdAt: item.createdAt,
      })),
      ...contacts.map((item) => ({
        type: 'contact',
        id: item._id,
        title: item.name,
        subtitle: item.subject,
        createdAt: item.createdAt,
      })),
      ...events.map((item) => ({
        type: 'event',
        id: item._id,
        title: item.title,
        subtitle: item.category,
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, RECENT_TOTAL);

    res.status(200).json({
      volunteerCount,
      contactCount,
      eventCount,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };

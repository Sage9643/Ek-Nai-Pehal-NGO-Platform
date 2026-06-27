const ContactQuery = require('../../models/ContactQuery');

const DEFAULT_LIMIT = 10;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildContactFilter = (query) => {
  const { search = '' } = query;
  const term = search.trim();

  if (!term) return {};

  const regex = new RegExp(escapeRegex(term), 'i');

  return {
    $or: [{ name: regex }, { email: regex }, { subject: regex }],
  };
};

/**
 * GET /api/admin/contact-requests
 */
const getContactRequests = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildContactFilter(req.query);
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      ContactQuery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactQuery.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        contacts,
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
 * DELETE /api/admin/contact-requests/:id
 */
const deleteContactRequest = async (req, res, next) => {
  try {
    const contact = await ContactQuery.findByIdAndDelete(req.params.id);

    if (!contact) {
      const error = new Error('Contact request not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Contact request deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getContactRequests, deleteContactRequest };

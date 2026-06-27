const Volunteer = require('../../models/Volunteer');

const DEFAULT_LIMIT = 10;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildVolunteerFilter = (query) => {
  const { search = '' } = query;
  const term = search.trim();

  if (!term) return {};

  const regex = new RegExp(escapeRegex(term), 'i');

  return {
    $or: [{ name: regex }, { email: regex }, { phone: regex }],
  };
};

/**
 * GET /api/admin/volunteers
 */
const getVolunteers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildVolunteerFilter(req.query);
    const skip = (page - 1) * limit;

    const [volunteers, total] = await Promise.all([
      Volunteer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Volunteer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        volunteers,
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
 * DELETE /api/admin/volunteers/:id
 */
const deleteVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);

    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVolunteers, deleteVolunteer };

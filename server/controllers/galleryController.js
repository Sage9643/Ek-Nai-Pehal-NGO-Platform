const Gallery = require('../models/Gallery');
const { sendSuccess } = require('../utils/apiResponse');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

/**
 * GET /api/gallery?page=1&limit=12
 * Fetch gallery images sorted by most recent first, paginated.
 *
 * Backward compatible: `data` remains the images array; `pagination` and
 * `count` are additive fields.
 */
const getGallery = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      Gallery.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Gallery.countDocuments(),
    ]);

    sendSuccess(res, {
      message: 'Gallery images fetched successfully',
      data: images,
      count: images.length,
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

module.exports = { getGallery };
const Gallery = require('../../models/Gallery');

const DEFAULT_LIMIT = 10;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildGalleryFilter = (query) => {
  const { search = '' } = query;
  const term = search.trim();

  if (!term) return {};

  const regex = new RegExp(escapeRegex(term), 'i');

  return {
    $or: [{ title: regex }, { description: regex }],
  };
};

/**
 * GET /api/admin/gallery
 */
const getGalleryImages = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1);
    const filter = buildGalleryFilter(req.query);
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      Gallery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Gallery.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        images,
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
 * POST /api/admin/gallery
 */
const createGalleryImage = async (req, res, next) => {
  try {
    const image = await Gallery.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Gallery image added successfully',
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/gallery/:id
 */
const updateGalleryImage = async (req, res, next) => {
  try {
    const image = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!image) {
      const error = new Error('Gallery image not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Gallery image updated successfully',
      data: image,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/gallery/:id
 */
const deleteGalleryImage = async (req, res, next) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);

    if (!image) {
      const error = new Error('Gallery image not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
};

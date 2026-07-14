const Gallery = require('../models/Gallery');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/gallery
 * Fetch all gallery images sorted by most recent first
 */
const getGallery = async (req, res, next) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });

    sendSuccess(res, {
      message: 'Gallery images fetched successfully',
      data: images,
      count: images.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGallery };

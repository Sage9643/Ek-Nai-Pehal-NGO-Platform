const ContactQuery = require('../models/ContactQuery');

/**
 * POST /api/contact
 * Submit a contact query
 */
const createContactQuery = async (req, res, next) => {
  try {
    const contactQuery = await ContactQuery.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Contact query submitted successfully',
      data: contactQuery,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createContactQuery };

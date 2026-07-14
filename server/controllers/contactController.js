const ContactQuery = require('../models/ContactQuery');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/contact
 * Submit a contact query
 */
const createContactQuery = async (req, res, next) => {
  try {
    const contactQuery = await ContactQuery.create(req.body);

    sendSuccess(res, {
      statusCode: 201,
      message: 'Contact query submitted successfully',
      data: contactQuery,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createContactQuery };

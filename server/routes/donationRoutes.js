const express = require('express');
const { body, validationResult } = require('express-validator');
const { createDonation } = require('../controllers/donationController');

const router = express.Router();

const DONATION_TYPES = [
  'Books',
  'Stationery',
  'Educational Material',
  'Clothes',
  'Financial Support',
];

const donationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('donationType')
    .trim()
    .notEmpty()
    .withMessage('Donation type is required')
    .isIn(DONATION_TYPES)
    .withMessage(`Donation type must be one of: ${DONATION_TYPES.join(', ')}`),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array().map((e) => e.msg).join(', '));
    error.statusCode = 400;
    return next(error);
  }
  next();
};

router.post('/', donationValidation, validate, createDonation);

module.exports = router;

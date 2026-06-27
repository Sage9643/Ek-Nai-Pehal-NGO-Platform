const express = require('express');
const { body, validationResult } = require('express-validator');
const { createVolunteer } = require('../controllers/volunteerController');

const router = express.Router();

const volunteerValidation = [
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
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number'),
  body('college')
    .trim()
    .notEmpty()
    .withMessage('College or organization is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('College name must be between 2 and 150 characters'),
  body('motivation')
    .trim()
    .notEmpty()
    .withMessage('Motivation is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Motivation must be between 10 and 1000 characters'),
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

router.post('/', volunteerValidation, validate, createVolunteer);

module.exports = router;

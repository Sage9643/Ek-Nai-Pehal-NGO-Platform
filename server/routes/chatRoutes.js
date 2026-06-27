const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendChatMessage } = require('../controllers/chatController');

const router = express.Router();

const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
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

router.post('/', chatValidation, validate, sendChatMessage);

module.exports = router;

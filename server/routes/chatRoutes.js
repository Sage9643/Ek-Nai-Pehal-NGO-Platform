const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
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

router.post('/', chatValidation, validate, sendChatMessage);

module.exports = router;

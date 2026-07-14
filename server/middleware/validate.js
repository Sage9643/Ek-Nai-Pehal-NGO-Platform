const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Shared express-validator result handler.
 * Attaches field-level errors for richer client feedback.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(
      new AppError(
        errors.map((e) => e.message).join(', '),
        400,
        errors
      )
    );
  }

  next();
};

module.exports = validate;

const logger = require('../config/logger');
const { env } = require('../config/env');
const { sendError } = require('../utils/apiResponse');

/**
 * Global error handling middleware.
 * Must be registered after all routes in app.js.
 *
 * Usage in controllers:
 *   next(error) — forwards any error to this handler
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Mongoose validation error (schema rules failed)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = errors.map((e) => e.message).join(', ');
  }

  // Mongoose invalid ObjectId (e.g. GET /events/invalid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error (unique index violation)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Log unexpected server errors; operational 4xx are logged at warn level
  if (statusCode >= 500) {
    logger.error({ err, url: req.originalUrl, method: req.method }, message);
  } else if (!err.isOperational) {
    logger.warn({ err, url: req.originalUrl, method: req.method }, message);
  }

  const payload = { statusCode, message, errors };

  if (env.NODE_ENV === 'development' && err.stack) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
      stack: err.stack,
    });
  }

  return sendError(res, payload);
};

module.exports = errorHandler;

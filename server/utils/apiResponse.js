/**
 * Consistent API response helpers.
 *
 * Success shape:  { success: true, message?, data?, count? }
 * Error shape:     { success: false, message, errors? }
 */

const sendSuccess = (res, { statusCode = 200, message, data, count } = {}) => {
  const body = { success: true };

  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (count !== undefined) body.count = count;

  return res.status(statusCode).json(body);
};

const sendError = (res, { statusCode = 500, message, errors } = {}) => {
  const body = { success: false, message: message || 'Internal Server Error' };

  if (errors) body.errors = errors;

  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };

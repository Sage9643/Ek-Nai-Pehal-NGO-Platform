const jwt = require('jsonwebtoken');
const { AUTH_COOKIE_NAME } = require('../config/cookieOptions');

/**
 * Verify JWT for admin-protected routes.
 * Reads the token from the httpOnly `admin_token` cookie (not a Bearer
 * header) — see config/cookieOptions.js for why cookie-based auth was
 * chosen over client-readable storage.
 */
const adminAuth = (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      const error = new Error('Access denied. No token provided.');
      error.statusCode = 401;
      return next(error);
    }

    const decoded = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
    );

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      return next(err);
    }
    next(error);
  }
};

module.exports = adminAuth;
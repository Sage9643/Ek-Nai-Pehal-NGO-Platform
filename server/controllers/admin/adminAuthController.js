const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');
const {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_MS,
  authCookieOptions,
  csrfCookieOptions,
} = require('../../config/cookieOptions');

/**
 * POST /api/admin/login
 * Authenticate admin using env credentials, then issue two cookies:
 *  - admin_token: httpOnly JWT, invisible to JS (session credential)
 *  - admin_csrf:  readable random token the client must echo back in an
 *                 X-CSRF-Token header on mutating requests (see
 *                 middleware/csrfProtection.js)
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_JWT_SECRET) {
      return next(new AppError('Admin authentication is not configured', 500));
    }

    if (email !== env.ADMIN_EMAIL) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = jwt.sign(
      { email: env.ADMIN_EMAIL, role: 'admin' },
      env.ADMIN_JWT_SECRET,
      { expiresIn: env.ADMIN_JWT_EXPIRES_IN }
    );

    const csrfToken = crypto.randomBytes(32).toString('hex');

    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions(ADMIN_COOKIE_MAX_AGE_MS));
    res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions(ADMIN_COOKIE_MAX_AGE_MS));

    sendSuccess(res, {
      message: 'Login successful',
      data: { email: env.ADMIN_EMAIL },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/logout
 * Clears both auth cookies server-side. Client JS cannot clear an httpOnly
 * cookie itself, so this round trip is required (not just a client-side
 * state reset).
 */
const adminLogout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions(0));
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions(0));

  sendSuccess(res, { message: 'Logged out successfully' });
};

/**
 * GET /api/admin/me
 * Lets the client discover who is logged in (and whether the session cookie
 * is still valid) without ever being able to read the JWT itself.
 */
const getCurrentAdmin = (req, res) => {
  sendSuccess(res, { data: { email: req.admin.email } });
};

module.exports = { adminLogin, adminLogout, getCurrentAdmin };
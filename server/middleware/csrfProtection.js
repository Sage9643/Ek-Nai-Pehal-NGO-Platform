const { CSRF_COOKIE_NAME } = require('../config/cookieOptions');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF protection for cookie-based admin auth.
 *
 * On login, the server sets a random CSRF token in a *readable* cookie.
 * The client must echo that same value back in an `X-CSRF-Token` header on
 * every mutating request. An attacker's page can trigger a cross-site
 * request (since SameSite=None allows the auth cookie to attach), but it
 * cannot read this cookie's value cross-origin to forge a matching header —
 * so the request fails this check.
 *
 * Must run AFTER adminAuth (so req.admin/auth cookie already validated) and
 * only meaningfully applies to state-changing methods.
 */
const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const error = new Error('Invalid or missing CSRF token');
    error.statusCode = 403;
    return next(error);
  }

  next();
};

module.exports = csrfProtection;
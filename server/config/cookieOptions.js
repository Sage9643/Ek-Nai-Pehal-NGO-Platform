const { env } = require('./env');

const AUTH_COOKIE_NAME = 'admin_token';
const CSRF_COOKIE_NAME = 'admin_csrf';

const isProd = env.NODE_ENV === 'production';

/**
 * Client (Vercel) and API (Render/Railway) live on different domains in
 * production, so the auth cookie must be sent cross-site: that requires
 * SameSite=None, which in turn requires Secure. In development the client
 * and API are both on localhost (different ports don't count as a
 * different "site"), so SameSite=Lax works over plain HTTP.
 */
const baseCookieOptions = {
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

/** Parse a jsonwebtoken-style duration string ("24h", "15m", "7d") to ms. */
const parseDurationToMs = (value, fallbackMs) => {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(value).trim());
  if (!match) return fallbackMs;

  const amount = parseInt(match[1], 10);
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[match[2]];
};

const ADMIN_COOKIE_MAX_AGE_MS = parseDurationToMs(
  env.ADMIN_JWT_EXPIRES_IN,
  24 * 60 * 60 * 1000 // fallback: 24 hours
);

/**
 * Options for the httpOnly JWT cookie — never readable by client JS, only
 * ever auto-attached by the browser to requests it actually targets, so
 * scoping it to /api/admin is correct and slightly reduces its exposure.
 */
const authCookieOptions = (maxAge = ADMIN_COOKIE_MAX_AGE_MS) => ({
  ...baseCookieOptions,
  path: '/api/admin',
  httpOnly: true,
  maxAge,
});

/**
 * Options for the CSRF double-submit cookie — deliberately NOT httpOnly,
 * since the client must read it via document.cookie and echo it back in a
 * request header. Cookie visibility to document.cookie is governed by the
 * cookie's Path matching the CURRENT PAGE's path, not the path of whatever
 * API request is being made — so scoping this to /api/admin (like the auth
 * cookie) would make it invisible on every real page of the SPA (which is
 * served at /admin/login, /admin/dashboard, etc., never at /api/admin).
 * It must be Path=/ so it's readable wherever the frontend actually runs.
 */
const csrfCookieOptions = (maxAge = ADMIN_COOKIE_MAX_AGE_MS) => ({
  ...baseCookieOptions,
  path: '/',
  httpOnly: false,
  maxAge,
});

module.exports = {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_MS,
  authCookieOptions,
  csrfCookieOptions,
};
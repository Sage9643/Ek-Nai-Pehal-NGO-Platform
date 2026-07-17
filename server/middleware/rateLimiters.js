const rateLimit = require('express-rate-limit');

/**
 * Centralized rate limiters.
 *
 * Each limiter is scoped to the endpoint(s) it protects so limits can be
 * tuned independently as usage patterns emerge. All limiters:
 *  - use the standard `RateLimit-*` response headers (draft-7)
 *  - disable the legacy `X-RateLimit-*` headers
 *  - return the app's standard error envelope so clients don't need
 *    special-case handling for 429s.
 */

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

/**
 * Admin login: the highest-value target for brute-forcing (single hardcoded
 * account, no lockout/2FA today). Kept tight — a legitimate admin will not
 * fail login 10 times in 15 minutes.
 */
const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/**
 * Chatbot: every request costs a real Gemini API call. Without a limit here,
 * a single client can exhaust the API quota/budget in seconds.
 */
const chatLimiter = buildLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: 'You are sending messages too quickly. Please slow down.',
});

/**
 * Public lead-capture forms (volunteer / donation / contact). Loose enough
 * for a genuine visitor to retry after a validation error, tight enough to
 * blunt scripted spam of the database.
 */
const formLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many submissions from this device. Please try again later.',
});

/**
 * Payment endpoints (create-order / verify). Order creation calls
 * Razorpay's API per request — the same cost/quota concern as the
 * chatbot's Gemini calls, not a spam concern like the inquiry forms — so
 * it gets its own limiter rather than reusing formLimiter's looser budget.
 * Verify is included under the same limiter since it's part of the same
 * per-donation-attempt flow and should be governed by the same ceiling.
 */
const paymentLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many payment attempts. Please try again later.',
});

/**
 * Blanket API-wide limiter as defense-in-depth against generic scraping/DoS
 * on read endpoints (events, gallery) that have no other throttle.
 */
const globalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests from this IP. Please try again later.',
});

module.exports = {
  loginLimiter,
  chatLimiter,
  formLimiter,
  paymentLimiter,
  globalLimiter,
};
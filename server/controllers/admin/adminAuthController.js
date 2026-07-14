const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * POST /api/admin/login
 * Authenticate admin using env credentials and return JWT
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

    sendSuccess(res, {
      message: 'Login successful',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/admin/login
 * Authenticate admin using env credentials and return JWT
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_JWT_SECRET) {
      const error = new Error('Admin authentication is not configured');
      error.statusCode = 500;
      return next(error);
    }

    if (email !== process.env.ADMIN_EMAIL) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      return next(error);
    }

    const token = jwt.sign(
      { email: process.env.ADMIN_EMAIL, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin };

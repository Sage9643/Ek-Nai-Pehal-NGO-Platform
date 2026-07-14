const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('./logger');

/**
 * Connect to MongoDB Atlas using the validated MONGODB_URI.
 * Exits the process if the connection fails so the server does not run without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.fatal({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
};

module.exports = connectDB;

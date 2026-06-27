const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas using the MONGODB_URI from environment variables.
 * Exits the process if the connection fails so the server does not run without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

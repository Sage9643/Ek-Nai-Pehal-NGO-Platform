const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    college: {
      type: String,
      required: [true, 'College or organization is required'],
      trim: true,
      minlength: [2, 'College name must be at least 2 characters'],
      maxlength: [150, 'College name cannot exceed 150 characters'],
    },
    motivation: {
      type: String,
      required: [true, 'Motivation is required'],
      trim: true,
      minlength: [10, 'Motivation must be at least 10 characters'],
      maxlength: [1000, 'Motivation cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);

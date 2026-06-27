const mongoose = require('mongoose');

const DONATION_TYPES = [
  'Books',
  'Stationery',
  'Educational Material',
  'Clothes',
  'Toys',
  'Sports Equipment',
  'Financial Support',
  'Other',
];

const donationSchema = new mongoose.Schema(
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

    // NEW
    phone: {
      type: String,
      trim: true,
      default: '',
    },

    donationType: {
      type: String,
      required: [true, 'Donation type is required'],
      enum: {
        values: DONATION_TYPES,
        message: `Donation type must be one of: ${DONATION_TYPES.join(', ')}`,
      },
    },
    amount: {
      type: Number,
      default: null,
      min: [1, 'Amount must be greater than 0'],
    },

    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },

    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Scheduled', 'Received', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Donation', donationSchema);

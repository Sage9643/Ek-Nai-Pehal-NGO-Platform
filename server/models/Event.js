const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Education',
  'Workshop',
  'Community',
  'Celebration',
  'Visit',
];

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
      trim: true,
      validate: {
        validator: function (value) {
          return (
            /^https?:\/\/.+/.test(value) ||
            value.startsWith('/image/')
          );
        },
      message: 'Please provide a valid image path or URL',
    },
  },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: {
        values: EVENT_CATEGORIES,
        message: `Category must be one of: ${EVENT_CATEGORIES.join(', ')}`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);

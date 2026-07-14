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

// Both the public /api/events list and the admin events list sort by date
// (public) or createdAt (admin), newest first — descending indexes let Mongo
// satisfy `.sort()` directly from the index instead of an in-memory sort.
eventSchema.index({ date: -1 });
eventSchema.index({ createdAt: -1 });

// The public Events page filters by category client-side today, but the
// admin search also matches on category — index it so that filter stays
// cheap once it's pushed server-side.
eventSchema.index({ category: 1 });

module.exports = mongoose.model('Event', eventSchema);
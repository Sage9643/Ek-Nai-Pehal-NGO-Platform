const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
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
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Both public and admin gallery lists sort by createdAt descending; a
// compound index with `featured` also serves any "show featured first"
// query without a second scan/sort step.
gallerySchema.index({ featured: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
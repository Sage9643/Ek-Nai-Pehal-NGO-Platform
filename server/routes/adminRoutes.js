const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const adminAuth = require('../middleware/adminAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { loginLimiter } = require('../middleware/rateLimiters');

const { adminLogin, adminLogout, getCurrentAdmin } = require('../controllers/admin/adminAuthController');
const { getDashboard } = require('../controllers/admin/dashboardController');
const { getVolunteers, deleteVolunteer } = require('../controllers/admin/volunteerAdminController');
const { getContactRequests, deleteContactRequest } = require('../controllers/admin/contactAdminController');
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  EVENT_CATEGORIES,
} = require('../controllers/admin/eventAdminController');
const {
  getDonations,
  updateDonationStatus,
  deleteDonation,
  DONATION_STATUSES,
} = require('../controllers/admin/donationAdminController');
const {
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} = require('../controllers/admin/galleryAdminController');
const { getTransactions, getTransactionStats } = require('../controllers/admin/transactionAdminController');

const router = express.Router();

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const eventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('image')
    .trim()
    .notEmpty()
    .withMessage('Event image is required')
    .custom((value) => {
      if (/^https?:\/\/.+/.test(value) || value.startsWith('/image/')) {
        return true;
      }
      throw new Error('Please provide a valid image path (/image/...) or URL');
    }),
  body('date')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Please provide a valid event date'),
  body('category')
    .notEmpty()
    .withMessage('Event category is required')
    .isIn(EVENT_CATEGORIES)
    .withMessage(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`),
];

const statusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(DONATION_STATUSES)
    .withMessage(`Status must be one of: ${DONATION_STATUSES.join(', ')}`),
];

const galleryValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Title must be between 2 and 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),
  body('image')
    .trim()
    .notEmpty()
    .withMessage('Image is required')
    .custom((value) => {
      if (/^https?:\/\/.+/.test(value) || value.startsWith('/image/')) {
        return true;
      }
      throw new Error('Please provide a valid image path (/image/...) or URL');
    }),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false'),
];

router.post('/login', loginLimiter, loginValidation, validate, adminLogin);

// Every route below this point requires a valid session cookie, and every
// mutating route below this point also requires a matching CSRF header
// (see middleware/csrfProtection.js). Hoisting these here removes the
// per-route repetition that existed before.
router.use(adminAuth);
router.use(csrfProtection);

router.post('/logout', adminLogout);
router.get('/me', getCurrentAdmin);

router.get('/dashboard', getDashboard);
router.get('/volunteers', getVolunteers);
router.delete('/volunteers/:id', deleteVolunteer);
router.get('/contact-requests', getContactRequests);
router.delete('/contact-requests/:id', deleteContactRequest);
router.get('/events', getEvents);
router.post('/events', eventValidation, validate, createEvent);
router.put('/events/:id', eventValidation, validate, updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/donations', getDonations);
router.put('/donations/:id/status', statusValidation, validate, updateDonationStatus);
router.delete('/donations/:id', deleteDonation);
router.get('/gallery', getGalleryImages);
router.post('/gallery', galleryValidation, validate, createGalleryImage);
router.put('/gallery/:id', galleryValidation, validate, updateGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);
router.get('/transactions', getTransactions);
router.get('/transactions/stats', getTransactionStats);

module.exports = router;
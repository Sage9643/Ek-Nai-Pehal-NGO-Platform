const express = require('express');

const { body, validationResult } = require('express-validator');

const { adminLogin } = require('../controllers/admin/adminAuthController');

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

const adminAuth = require('../middleware/adminAuth');



const router = express.Router();



const loginValidation = [

  body('email')

    .trim()

    .notEmpty()

    .withMessage('Email is required')

    .isEmail()

    .withMessage('Please provide a valid email address')

    .normalizeEmail(),

  body('password')

    .notEmpty()

    .withMessage('Password is required'),

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



const validate = (req, res, next) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    const error = new Error(errors.array().map((e) => e.msg).join(', '));

    error.statusCode = 400;

    return next(error);

  }

  next();

};



router.post('/login', loginValidation, validate, adminLogin);

router.get('/dashboard', adminAuth, getDashboard);

router.get('/volunteers', adminAuth, getVolunteers);

router.delete('/volunteers/:id', adminAuth, deleteVolunteer);

router.get('/contact-requests', adminAuth, getContactRequests);

router.delete('/contact-requests/:id', adminAuth, deleteContactRequest);

router.get('/events', adminAuth, getEvents);

router.post('/events', adminAuth, eventValidation, validate, createEvent);

router.put('/events/:id', adminAuth, eventValidation, validate, updateEvent);

router.delete('/events/:id', adminAuth, deleteEvent);

router.get('/donations', adminAuth, getDonations);

router.put('/donations/:id/status', adminAuth, statusValidation, validate, updateDonationStatus);

router.delete('/donations/:id', adminAuth, deleteDonation);

router.get('/gallery', adminAuth, getGalleryImages);

router.post('/gallery', adminAuth, galleryValidation, validate, createGalleryImage);

router.put('/gallery/:id', adminAuth, galleryValidation, validate, updateGalleryImage);

router.delete('/gallery/:id', adminAuth, deleteGalleryImage);



module.exports = router;

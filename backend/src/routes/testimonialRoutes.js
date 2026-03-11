const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

// Public routes
router.get('/', testimonialController.getAllTestimonials);
router.get('/:slug', testimonialController.getTestimonialBySlug);

module.exports = router;

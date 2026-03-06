const express = require('express');

const { getDefaultCourseThumbnail } = require('../controllers/settingsController');

const router = express.Router();

// Public settings endpoints
router.get('/default-course-thumbnail', getDefaultCourseThumbnail);

module.exports = router;

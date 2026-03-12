const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const search = require('../controllers/searchController');

// GET /api/search?q=&type=all|courses|users|posts|categories&page=1&limit=10
router.get('/', optionalAuth, search.globalSearch);

// GET /api/search/suggestions?q= (autocomplete)
router.get('/suggestions', optionalAuth, search.getSearchSuggestions);

module.exports = router;

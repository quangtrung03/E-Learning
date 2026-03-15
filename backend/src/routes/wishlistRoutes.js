const express = require('express');
const { protect } = require('../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } = require('../controllers/wishlistController');

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.get('/:courseId/check', checkWishlist);
router.post('/:courseId', addToWishlist);
router.delete('/:courseId', removeFromWishlist);

module.exports = router;

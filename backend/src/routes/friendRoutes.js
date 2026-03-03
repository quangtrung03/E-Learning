const express = require('express');
const { body, param } = require('express-validator');
const {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  unblockUser,
  getFriends
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/', getFriends);

router.get('/requests', getFriendRequests);
router.post(
  '/requests',
  [body('toUserId').isMongoId().withMessage('toUserId không hợp lệ')],
  sendFriendRequest
);
router.put('/requests/:id/accept', [param('id').isMongoId()], acceptFriendRequest);
router.put('/requests/:id/reject', [param('id').isMongoId()], rejectFriendRequest);

router.post('/block', [body('userId').isMongoId().withMessage('userId không hợp lệ')], blockUser);
router.delete('/block/:userId', [param('userId').isMongoId()], unblockUser);

module.exports = router;

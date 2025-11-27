const express = require('express');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  uploadMessageFile,
  upload
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(protect);

// File upload
router.post('/upload', upload.single('file'), uploadMessageFile);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId', sendMessage);
router.put('/conversations/:conversationId/read', markAsRead);

// Messages
router.delete('/:messageId', deleteMessage);

module.exports = router;

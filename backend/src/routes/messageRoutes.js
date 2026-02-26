const express = require('express');
const { body } = require('express-validator');
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

// Validation rules
const sendMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Tin nhắn phải từ 1-2000 ký tự')
    .escape(), // Prevent XSS
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments phải là array'),
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('URL không hợp lệ'),
  body('attachments.*.name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Tên file quá dài')
];

const createConversationValidation = [
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất 1 người tham gia'),
  body('participants.*')
    .isMongoId()
    .withMessage('ID người dùng không hợp lệ')
];

// Protected routes
router.use(protect);

// File upload
router.post('/upload', upload.single('file'), uploadMessageFile);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', createConversationValidation, getOrCreateConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId', sendMessageValidation, sendMessage);
router.put('/conversations/:conversationId/read', markAsRead);

// Messages
router.delete('/:messageId', deleteMessage);

module.exports = router;

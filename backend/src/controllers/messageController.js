const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Block = require('../models/Block');
const { emitToConversation, emitToUser } = require('../services/socketService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Lấy danh sách conversations của user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cuộc trò chuyện'
    });
  }
};

// @desc    Lấy hoặc tạo conversation với user
// @route   POST /api/messages/conversations
// @access  Private
const getOrCreateConversation = async (req, res) => {
  try {
    const { userId, participants } = req.body;

    const targetUserId = userId || (Array.isArray(participants) ? participants[0] : null);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo cuộc trò chuyện với chính mình'
      });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Block check (either direction)
    const blockExists = await Block.findOne({
      $or: [
        { blocker: req.user.id, blocked: targetUserId },
        { blocker: targetUserId, blocked: req.user.id }
      ]
    }).select('_id');

    if (blockExists) {
      return res.status(403).json({
        success: false,
        message: 'Không thể tạo cuộc trò chuyện do bị chặn'
      });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user.id, targetUserId], $size: 2 }
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage');

    // Create new if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, targetUserId],
        type: 'direct'
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar')
        .populate('lastMessage');
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo cuộc trò chuyện'
    });
  }
};

// @desc    Tìm user để bắt đầu chat ("thêm bạn")
// @route   GET /api/messages/users/search?q=...
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim();

    if (q.length < 2) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }

    const regex = new RegExp(escapeRegExp(q), 'i');

    const users = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      $or: [{ name: regex }, { email: regex }]
    })
      .select('name email avatar')
      .limit(10);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm người dùng'
    });
  }
};

// @desc    Lấy messages của conversation
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;
    const requestedLimit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT); // Prevent excessive loading
    const skip = (page - 1) * limit;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện'
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập cuộc trò chuyện này'
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tin nhắn'
    });
  }
};

// @desc    Gửi message
// @route   POST /api/messages/conversations/:conversationId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', fileUrl, fileName } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống'
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện'
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này'
      });
    }

    // Block check: if any other participant has blocked user, or user blocked them
    const otherParticipantIds = (conversation.participants || [])
      .map((p) => p.toString())
      .filter((p) => p !== req.user.id);

    if (otherParticipantIds.length > 0) {
      const blockExists = await Block.findOne({
        $or: [
          { blocker: req.user.id, blocked: { $in: otherParticipantIds } },
          { blocked: req.user.id, blocker: { $in: otherParticipantIds } }
        ]
      }).select('_id');

      if (blockExists) {
        return res.status(403).json({
          success: false,
          message: 'Không thể gửi tin nhắn do bị chặn'
        });
      }
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content: content.trim(),
      type,
      fileUrl,
      fileName
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Update unread count for other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name email avatar');

    // Emit real-time event to conversation participants
    try {
      emitToConversation(conversationId, 'message:received', {
        message,
        conversationId
      });
    } catch (socketError) {
      console.log('Socket emit error (non-critical):', socketError.message);
    }

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi tin nhắn'
    });
  }
};

// @desc    Đánh dấu messages đã đọc
// @route   PUT /api/messages/conversations/:conversationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc trò chuyện'
      });
    }

    // Reset unread count for current user
    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tin nhắn đã đọc'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu tin nhắn'
    });
  }
};

// @desc    Xoá message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xoá tin nhắn này'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Đã xoá tin nhắn'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xoá tin nhắn'
    });
  }
};

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/messages');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// @desc    Upload file trong message
// @route   POST /api/messages/upload
// @access  Private
const uploadMessageFile = async (req, res) => {
  try {
    // Deprecation notice: chat attachments should use Cloudinary upload flow
    // (frontend uploads via /api/upload/* and sends resulting absolute URL)
    res.setHeader('Deprecation', 'true');
    res.setHeader('X-Deprecated-Endpoint', '/api/messages/upload');
    if (req.requestId) {
      res.setHeader('X-Request-Id', req.requestId);
    }
    console.warn(`⚠️ [${req.requestId || 'no-request-id'}] Deprecated endpoint used: POST /api/messages/upload`);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được tải lên'
      });
    }

    const fileUrl = `/uploads/messages/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    res.json({
      success: true,
      deprecated: true,
      message: 'Endpoint /api/messages/upload đã bị deprecate. Hãy dùng upload Cloudinary (/api/upload/*) và gửi URL tuyệt đối trong message.',
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileType,
        fileSize: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải file'
    });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  searchUsers,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  uploadMessageFile,
  upload
};

const { validationResult } = require('express-validator');
const Discussion = require('../models/Discussion');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Tạo discussion mới
// @route   POST /api/discussions
// @access  Private
const createDiscussion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { courseId, title, content, category, tags } = req.body;

    // Kiểm tra course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    ) || course.instructor.toString() === req.user.id || req.user.isAdmin;

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để tham gia thảo luận'
      });
    }

    const discussion = new Discussion({
      course: courseId,
      author: req.user.id,
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await discussion.save();

    // Populate dữ liệu để response
    await discussion.populate([
      { path: 'author', select: 'name avatar' },
      { path: 'course', select: 'title instructor' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo thảo luận thành công',
      data: {
        discussion
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thảo luận',
      error: error.message
    });
  }
};

// @desc    Lấy discussions theo course
// @route   GET /api/courses/:courseId/discussions
// @access  Private
const getDiscussionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      category, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Kiểm tra quyền truy cập course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    const user = await User.findById(req.user.id);
    const hasAccess = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    ) || course.instructor.toString() === req.user.id || req.user.isAdmin;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thảo luận của khóa học này'
      });
    }

    let query = { course: courseId, status: 'active' };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const discussions = await Discussion.find(query)
      .populate('author', 'name avatar')
      .populate('course', 'title')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Discussion.countDocuments(query);

    res.status(200).json({
      success: true,
      count: discussions.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        discussions
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thảo luận',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết discussion
// @route   GET /api/discussions/:id
// @access  Private
const getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'name avatar email')
      .populate('course', 'title instructor')
      .populate('replies.author', 'name avatar')
      .populate('likes', 'name avatar');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    // Kiểm tra quyền truy cập
    const user = await User.findById(req.user.id);
    const hasAccess = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === discussion.course._id.toString()
    ) || discussion.course.instructor.toString() === req.user.id || req.user.isAdmin;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thảo luận này'
      });
    }

    // Cập nhật view count
    discussion.views += 1;
    await discussion.save();

    res.status(200).json({
      success: true,
      data: {
        discussion
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thảo luận',
      error: error.message
    });
  }
};

// @desc    Cập nhật discussion
// @route   PUT /api/discussions/:id
// @access  Private (Author hoặc Admin)
const updateDiscussion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    // Kiểm tra quyền edit
    if (discussion.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể chỉnh sửa thảo luận của mình'
      });
    }

    const { title, content, category, tags } = req.body;

    // Cập nhật fields
    if (title) discussion.title = title;
    if (content) discussion.content = content;
    if (category) discussion.category = category;
    if (tags) discussion.tags = tags;

    discussion.updatedAt = new Date();
    discussion.isEdited = true;

    await discussion.save();

    await discussion.populate([
      { path: 'author', select: 'name avatar' },
      { path: 'course', select: 'title' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thảo luận thành công',
      data: {
        discussion
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thảo luận',
      error: error.message
    });
  }
};

// @desc    Xóa discussion
// @route   DELETE /api/discussions/:id
// @access  Private (Author hoặc Admin)
const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    // Kiểm tra quyền xóa
    if (discussion.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa thảo luận của mình'
      });
    }

    // Soft delete
    discussion.status = 'deleted';
    discussion.deletedAt = new Date();
    discussion.deletedBy = req.user.id;
    await discussion.save();

    res.status(200).json({
      success: true,
      message: 'Xóa thảo luận thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thảo luận',
      error: error.message
    });
  }
};

// @desc    Thêm reply vào discussion
// @route   POST /api/discussions/:id/replies
// @access  Private
const addReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { content, parentReply } = req.body;

    const discussion = await Discussion.findById(req.params.id)
      .populate('course', 'instructor');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    // Kiểm tra quyền truy cập
    const user = await User.findById(req.user.id);
    const hasAccess = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === discussion.course._id.toString()
    ) || discussion.course.instructor.toString() === req.user.id || req.user.isAdmin;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền reply thảo luận này'
      });
    }

    const reply = {
      author: req.user.id,
      content,
      parentReply: parentReply || null,
      createdAt: new Date(),
      likes: [],
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    };

    discussion.replies.push(reply);
    discussion.lastActivity = new Date();
    await discussion.save();

    // Populate reply author
    await discussion.populate('replies.author', 'name avatar');

    const newReply = discussion.replies[discussion.replies.length - 1];

    res.status(201).json({
      success: true,
      message: 'Thêm reply thành công',
      data: {
        reply: newReply
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm reply',
      error: error.message
    });
  }
};

// @desc    Like/Unlike discussion
// @route   POST /api/discussions/:id/like
// @access  Private
const toggleLikeDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    const hasLiked = discussion.likes.includes(req.user.id);

    if (hasLiked) {
      // Unlike
      discussion.likes = discussion.likes.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      // Like
      discussion.likes.push(req.user.id);
    }

    await discussion.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? 'Đã bỏ like' : 'Đã like thảo luận',
      data: {
        liked: !hasLiked,
        likesCount: discussion.likes.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi like/unlike thảo luận',
      error: error.message
    });
  }
};

// @desc    Like/Unlike reply
// @route   POST /api/discussions/:id/replies/:replyId/like
// @access  Private
const toggleLikeReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy reply'
      });
    }

    const hasLiked = reply.likes.includes(req.user.id);

    if (hasLiked) {
      // Unlike
      reply.likes = reply.likes.filter(
        userId => userId.toString() !== req.user.id
      );
    } else {
      // Like
      reply.likes.push(req.user.id);
    }

    await discussion.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? 'Đã bỏ like reply' : 'Đã like reply',
      data: {
        liked: !hasLiked,
        likesCount: reply.likes.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi like/unlike reply',
      error: error.message
    });
  }
};

// @desc    Pin/Unpin discussion (Admin hoặc Instructor)
// @route   PUT /api/discussions/:id/pin
// @access  Private (Admin hoặc Instructor)
const togglePinDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('course', 'instructor');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận'
      });
    }

    // Kiểm tra quyền pin
    const canPin = req.user.isAdmin || 
      discussion.course.instructor.toString() === req.user.id;

    if (!canPin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin hoặc giảng viên mới có thể pin thảo luận'
      });
    }

    discussion.isPinned = !discussion.isPinned;
    discussion.pinnedAt = discussion.isPinned ? new Date() : null;
    discussion.pinnedBy = discussion.isPinned ? req.user.id : null;

    await discussion.save();

    res.status(200).json({
      success: true,
      message: discussion.isPinned ? 'Đã pin thảo luận' : 'Đã bỏ pin thảo luận',
      data: {
        pinned: discussion.isPinned
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi pin/unpin thảo luận',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê discussions của course
// @route   GET /api/courses/:courseId/discussions/stats
// @access  Private (Instructor hoặc Admin)
const getDiscussionStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Kiểm tra quyền
    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thống kê này'
      });
    }

    // Thống kê tổng quan
    const stats = await Discussion.aggregate([
      { $match: { course: course._id, status: 'active' } },
      {
        $group: {
          _id: null,
          totalDiscussions: { $sum: 1 },
          totalReplies: { $sum: { $size: '$replies' } },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
          pinnedDiscussions: {
            $sum: { $cond: ['$isPinned', 1, 0] }
          }
        }
      }
    ]);

    // Thống kê theo category
    const categoryStats = await Discussion.aggregate([
      { $match: { course: course._id, status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalReplies: { $sum: { $size: '$replies' } },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top contributors
    const topContributors = await Discussion.aggregate([
      { $match: { course: course._id, status: 'active' } },
      {
        $group: {
          _id: '$author',
          discussionsCount: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      },
      { $sort: { discussionsCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          author: {
            name: '$author.name',
            avatar: '$author.avatar'
          },
          discussionsCount: 1,
          totalViews: 1,
          totalLikes: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalDiscussions: 0,
          totalReplies: 0,
          totalViews: 0,
          totalLikes: 0,
          pinnedDiscussions: 0
        },
        categoryStats,
        topContributors
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thảo luận',
      error: error.message
    });
  }
};

module.exports = {
  createDiscussion,
  getDiscussionsByCourse,
  getDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  toggleLikeDiscussion,
  toggleLikeReply,
  togglePinDiscussion,
  getDiscussionStats
};
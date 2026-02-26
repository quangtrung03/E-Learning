const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');
const { getUserEnrollment } = require('../utils/enrollmentHelpers');

// @desc    Tạo review mới cho course
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { courseId, rating, comment, anonymous } = req.body;

    // Kiểm tra course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const enrollment = await getUserEnrollment(req.user._id, courseId);

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để có thể đánh giá'
      });
    }

    // Kiểm tra đã review chưa
    const existingReview = await Review.findOne({
      course: courseId,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá khóa học này rồi'
      });
    }

    // Tính completion percentage
    const completionPercentage = enrollment.progress || 0;

    // Build aspects object, only include non-null values
    const aspects = {};
    if (req.body.ratings?.content) aspects.contentQuality = req.body.ratings.content;
    if (req.body.ratings?.instructor) aspects.instructorQuality = req.body.ratings.instructor;
    if (req.body.ratings?.structure) aspects.courseStructure = req.body.ratings.structure;
    if (req.body.ratings?.value) aspects.valueForMoney = req.body.ratings.value;
    if (req.body.ratings?.difficulty) aspects.difficulty = req.body.ratings.difficulty;

    const review = new Review({
      course: courseId,
      user: req.user._id, // Use 'user' not 'reviewer'
      rating: rating, // Use simple number, not object
      comment,
      aspects,
      completionPercentage,
      verified: completionPercentage >= 50, // Mark as verified if >50% complete
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        courseProgress: completionPercentage
      }
    });

    await review.save();

    // Cập nhật rating của course
    await updateCourseRating(courseId);

    // Populate dữ liệu để response
    await review.populate([
      { 
        path: 'user', 
        select: 'name avatar' // Always show user info for now
      },
      { path: 'course', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo đánh giá thành công',
      data: {
        review
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá',
      error: error.message
    });
  }
};

// @desc    Lấy reviews theo course
// @route   GET /api/courses/:courseId/reviews
// @access  Public
const getReviewsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      sortBy = 'helpful', 
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Kiểm tra course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    let query = { course: courseId, status: 'approved' };
    
    if (rating) {
      query['rating.overall'] = parseInt(rating);
    }

    // Sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { reviewDate: -1 };
        break;
      case 'oldest':
        sortOptions = { reviewDate: 1 };
        break;
      case 'rating_high':
        sortOptions = { 'rating.overall': -1 };
        break;
      case 'rating_low':
        sortOptions = { 'rating.overall': 1 };
        break;
      case 'helpful':
      default:
        sortOptions = { helpfulCount: -1, reviewDate: -1 };
        break;
    }

    const reviews = await Review.find(query)
      .populate('reviewer', 'name avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Thống kê rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { course: course._id, status: 'approved' } },
      {
        $group: {
          _id: '$rating.overall',
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } }
    ]);

    // Tạo rating distribution object
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const stat = ratingStats.find(s => s._id === i);
      ratingDistribution[i] = stat ? stat.count : 0;
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      ratingDistribution,
      data: {
        reviews: reviews.map(review => ({
          ...review.toObject(),
          reviewer: review.anonymous ? 
            { name: 'Người dùng ẩn danh' } : 
            review.reviewer
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name avatar email')
      .populate('course', 'title instructor')
      .populate('responses.responder', 'name avatar');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Ẩn thông tin reviewer nếu anonymous
    if (review.anonymous) {
      review.reviewer = { name: 'Người dùng ẩn danh' };
    }

    res.status(200).json({
      success: true,
      data: {
        review
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đánh giá',
      error: error.message
    });
  }
};

// @desc    Cập nhật review
// @route   PUT /api/reviews/:id
// @access  Private (Author only)
const updateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra quyền cập nhật
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể cập nhật đánh giá của mình'
      });
    }

    const { rating, comment, anonymous } = req.body;

    // Cập nhật fields
    if (rating) {
      review.rating.overall = rating;
      if (req.body.ratings) {
        review.rating.content = req.body.ratings.content || rating;
        review.rating.instructor = req.body.ratings.instructor || rating;
        review.rating.difficulty = req.body.ratings.difficulty || review.rating.difficulty;
        review.rating.value = req.body.ratings.value || rating;
      }
    }
    
    if (comment !== undefined) review.comment = comment;
    if (anonymous !== undefined) review.anonymous = anonymous;

    review.updatedAt = new Date();
    review.isEdited = true;

    await review.save();

    // Cập nhật lại rating của course
    await updateCourseRating(review.course);

    await review.populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'course', select: 'title' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: {
        review
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đánh giá',
      error: error.message
    });
  }
};

// @desc    Xóa review
// @route   DELETE /api/reviews/:id
// @access  Private (Author hoặc Admin)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra quyền xóa
    if (review.reviewer.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa đánh giá của mình'
      });
    }

    const courseId = review.course;

    await Review.findByIdAndDelete(req.params.id);

    // Cập nhật lại rating của course
    await updateCourseRating(courseId);

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đánh giá',
      error: error.message
    });
  }
};

// @desc    Đánh dấu review là helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra đã vote chưa
    const hasVoted = review.helpfulVotes.some(
      vote => vote.user.toString() === req.user.id
    );

    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá tính hữu ích của review này rồi'
      });
    }

    // Thêm vote
    review.helpfulVotes.push({
      user: req.user.id,
      isHelpful: req.body.isHelpful !== false, // default true
      votedAt: new Date()
    });

    // Cập nhật helpful count
    review.helpfulCount = review.helpfulVotes.filter(v => v.isHelpful).length;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Đã đánh giá tính hữu ích của review',
      data: {
        helpfulCount: review.helpfulCount,
        totalVotes: review.helpfulVotes.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh giá tính hữu ích',
      error: error.message
    });
  }
};

// @desc    Phản hồi review (Instructor hoặc Admin)
// @route   POST /api/reviews/:id/respond
// @access  Private (Instructor of course hoặc Admin)
const respondToReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { response } = req.body;

    const review = await Review.findById(req.params.id)
      .populate('course', 'instructor title');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra quyền phản hồi
    const canRespond = req.user.isAdmin || 
      review.course.instructor.toString() === req.user.id;

    if (!canRespond) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ giảng viên của khóa học hoặc admin mới có thể phản hồi'
      });
    }

    // Thêm response
    review.responses.push({
      responder: req.user.id,
      response,
      responseDate: new Date()
    });

    await review.save();

    await review.populate('responses.responder', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Phản hồi đánh giá thành công',
      data: {
        response: review.responses[review.responses.length - 1]
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phản hồi đánh giá',
      error: error.message
    });
  }
};

// @desc    Lấy reviews của user
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('course', 'title thumbnail instructor')
      .populate('course.instructor', 'name')
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ reviewer: req.user._id });

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        reviews
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá của bạn',
      error: error.message
    });
  }
};

// @desc    Admin: Lấy tất cả reviews cần moderate
// @route   GET /api/reviews/admin/pending
// @access  Private (Admin)
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ status: 'pending' })
      .populate('reviewer', 'name email')
      .populate('course', 'title instructor')
      .populate('course.instructor', 'name')
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        reviews
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách reviews cần duyệt',
      error: error.message
    });
  }
};

// @desc    Admin: Duyệt hoặc từ chối review
// @route   PUT /api/reviews/:id/moderate
// @access  Private (Admin)
const moderateReview = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    if (action === 'approve') {
      review.status = 'approved';
      review.moderatedAt = new Date();
      review.moderatedBy = req.user.id;
      
      // Cập nhật lại rating của course
      await updateCourseRating(review.course);
    } else if (action === 'reject') {
      review.status = 'rejected';
      review.moderatedAt = new Date();
      review.moderatedBy = req.user.id;
      review.rejectionReason = reason;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá',
      data: {
        review: {
          id: review._id,
          status: review.status
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt đánh giá',
      error: error.message
    });
  }
};

// Helper function để cập nhật rating của course
async function updateCourseRating(courseId) {
  try {
    const stats = await Review.aggregate([
      { $match: { course: courseId, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Course.findByIdAndUpdate(courseId, {
        'rating.average': Math.round(stats[0].averageRating * 10) / 10,
        'rating.count': stats[0].count
      });
    }
  } catch (error) {
    console.error('Error updating course rating:', error);
  }
}

// @desc    Admin: Lấy tất cả reviews với filter
// @route   GET /api/reviews/admin/all
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, course, minRating, maxRating, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (course) query.course = course;
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    const reviews = await Review.find(query)
      .populate('reviewer', 'name email avatar')
      .populate('course', 'title instructor')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Calculate statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total
    };
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusStats,
      data: {
        reviews
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách reviews',
      error: error.message
    });
  }
};

// @desc    Báo cáo review không phù hợp
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { reason, description } = req.body;
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Thêm report vào review
    const report = {
      reportedBy: req.user._id,
      reason,
      description: description || '',
      createdAt: new Date()
    };

    review.reports.push(report);
    review.reportCount = review.reports.length;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Đã báo cáo đánh giá thành công',
      data: {
        review
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi báo cáo đánh giá',
      error: error.message
    });
  }
};

// @desc    Lấy reviews của user
// @route   GET /api/reviews/users/:userId/reviews
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;

    const reviews = await Review.find({ user: userId })
      .populate('course', 'title thumbnail')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy reviews của user',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê reviews theo course
// @route   GET /api/reviews/course/:courseId/stats
// @access  Public
const getReviewStats = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const stats = await Review.aggregate([
      {
        $match: { 
          course: new mongoose.Types.ObjectId(courseId),
          isModerated: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
          }
        }
      });
    }

    const { averageRating, totalReviews, ratings } = stats[0];

    // Tính phân bố rating
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      ratingDistribution[rating]++;
    });

    res.status(200).json({
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê reviews',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getReviewsByCourse,
  getReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  reportReview,
  getUserReviews,
  getReviewStats,
  respondToReview,
  getMyReviews,
  getPendingReviews,
  moderateReview,
  getAllReviews
};
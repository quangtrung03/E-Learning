const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const AdminRequest = require('../models/AdminRequest');
const emailService = require('../config/email-new');

// @desc    Lấy danh sách khóa học cần duyệt
// @route   GET /api/admin/courses/pending
// @access  Private (Admin only)
const getPendingCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ status: 'pending' })
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        courses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khóa học chờ duyệt',
      error: error.message
    });
  }
};

// @desc    Duyệt khóa học
// @route   PUT /api/admin/courses/:id/approve
// @access  Private (Admin only)
const approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể duyệt khóa học đang chờ duyệt'
      });
    }

    course.status = 'approved';
    course.isPublished = true;
    course.approvedBy = req.user.id;
    course.approvedAt = new Date();
    course.rejectionReason = null;

    await course.save();

    // Gửi email thông báo cho instructor
    try {
      const instructor = await User.findById(course.instructor);
      if (instructor) {
        await emailService.sendCourseApprovalEmail({
          to: instructor.email,
          instructorName: instructor.name,
          courseTitle: course.title,
          courseId: course._id
        });
      }
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Đã duyệt khóa học thành công',
      data: {
        course
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt khóa học',
      error: error.message
    });
  }
};

// @desc    Từ chối khóa học
// @route   PUT /api/admin/courses/:id/reject
// @access  Private (Admin only)
const rejectCourse = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    await course.save();

    // Gửi email thông báo cho instructor
    try {
      const instructor = await User.findById(course.instructor);
      if (instructor) {
        await emailService.sendCourseRejectionEmail({
          to: instructor.email,
          instructorName: instructor.name,
          courseTitle: course.title,
          rejectionReason: reason.trim()
        });
      }
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Đã từ chối khóa học',
      data: {
        course
      }
    });rse.approvedBy = req.user.id;
    course.approvedAt = new Date();

    await course.save();

    // TODO: Gửi email thông báo cho instructor

    res.status(200).json({
      success: true,
      message: 'Đã từ chối khóa học',
      data: {
        course
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối khóa học',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê admin
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    // Thống kê user
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const bannedUsers = await User.countDocuments({ isActive: false });

    // Thống kê khóa học
    const totalCourses = await Course.countDocuments({});
    const pendingCourses = await Course.countDocuments({ status: 'pending' });
    const approvedCourses = await Course.countDocuments({ status: 'approved' });
    const rejectedCourses = await Course.countDocuments({ status: 'rejected' });
    const publishedCourses = await Course.countDocuments({ isPublished: true });

    // Thống kê theo tháng (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newCoursesThisMonth = await Course.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          newThisMonth: newUsersThisMonth
        },
        courses: {
          total: totalCourses,
          pending: pendingCourses,
          approved: approvedCourses,
          rejected: rejectedCourses,
          published: publishedCourses,
          newThisMonth: newCoursesThisMonth
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê',
      error: error.message
    });
  }
};

// @desc    Quản lý người dùng - Ban/Unban
// @route   PUT /api/admin/users/:id/toggle-ban
// @access  Private (Admin only)
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép ban admin khác
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không thể ban admin khác'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isActive ? 'Đã kích hoạt lại tài khoản' : 'Đã khóa tài khoản',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái người dùng',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách tất cả người dùng
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'banned') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        users
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách admin requests
// @route   GET /api/admin/admin-requests
// @access  Private (Admin only)
const getAdminRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const requests = await AdminRequest.find({ status })
      .populate('user', 'name email avatar createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminRequest.countDocuments({ status });

    res.status(200).json({
      success: true,
      count: requests.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        requests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách admin requests',
      error: error.message
    });
  }
};

// @desc    Duyệt admin request
// @route   PUT /api/admin/admin-requests/:id/approve
// @access  Private (Admin only)
const approveAdminRequest = async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id).populate('user');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Admin request này đã được xử lý'
      });
    }

    // Cập nhật user thành admin
    await User.findByIdAndUpdate(request.user._id, {
      isAdmin: true,
      adminRequestPending: false
    });

    // Cập nhật request status
    request.status = 'approved';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Đã duyệt thành công. User này giờ là admin.',
      data: {
        request
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt admin request',
      error: error.message
    });
  }
};

// @desc    Từ chối admin request
// @route   PUT /api/admin/admin-requests/:id/reject
// @access  Private (Admin only)
const rejectAdminRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await AdminRequest.findById(req.params.id).populate('user');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Admin request này đã được xử lý'
      });
    }

    // Cập nhật user
    await User.findByIdAndUpdate(request.user._id, {
      adminRequestPending: false
    });

    // Cập nhật request status
    request.status = 'rejected';
    request.processedBy = req.user.id;
    request.processedAt = new Date();
    request.rejectionReason = reason || 'Không đủ điều kiện';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Đã từ chối admin request',
      data: {
        request
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối admin request',
      error: error.message
    });
  }
};

// @desc    Lấy tất cả khóa học (bao gồm draft) - Admin only
// @route   GET /api/admin/courses/all
// @access  Private (Admin only)
const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', category = '', sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    // Build query - Admin có thể xem tất cả courses
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        courses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khóa học',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết khóa học cho admin
// @route   GET /api/admin/courses/:id
// @access  Private (Admin only)
const getCourseDetail = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email avatar')
      .populate('students', 'name email avatar enrolledAt progress')
      .populate('lessons');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khóa học:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết khóa học',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết người dùng cho admin
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'enrolledCourses.course',
        select: 'title category status'
      })
      .populate({
        path: 'createdCourses',
        select: 'title category status students createdAt',
        populate: {
          path: 'students',
          select: 'name'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết người dùng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết người dùng',
      error: error.message
    });
  }
};

// @desc    Cấp quyền admin cho user
// @route   PUT /api/admin/users/:id/make-admin
// @access  Private (Admin only)
const makeUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã là admin'
      });
    }

    user.isAdmin = true;
    user.adminRequestPending = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã cấp quyền admin thành công',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi cấp quyền admin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cấp quyền admin',
      error: error.message
    });
  }
};

module.exports = {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAdminStats,
  toggleUserBan,
  getAllUsers,
  getAllCourses,
  getAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getCourseDetail,
  getUserDetail,
  makeUserAdmin
};

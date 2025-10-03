const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');

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

    // TODO: Gửi email thông báo cho instructor
    
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

    if (course.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể từ chối khóa học đang chờ duyệt'
      });
    }

    course.status = 'rejected';
    course.rejectionReason = reason.trim();
    course.isPublished = false;
    course.approvedBy = req.user.id;
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

module.exports = {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAdminStats,
  toggleUserBan,
  getAllUsers
};

const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const AdminRequest = require('../models/AdminRequest');
const emailService = require('../config/email-new');

// ====================== ADMIN REQUEST MANAGEMENT ======================

// @desc    Gửi yêu cầu làm admin (Bước 1)
// @route   POST /api/admin/request
// @access  Private (User)
const requestAdminRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là admin rồi'
      });
    }

    // Kiểm tra xem user đã có request pending chưa
    const existingRequest = await AdminRequest.findOne({
      user: req.user.id,
      status: { $in: ['pending_validation', 'pending_approval'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu đang chờ xử lý'
      });
    }

    // Tạo admin request mới
    const adminRequest = new AdminRequest({
      user: req.user.id,
      email: user.email
    });

    await adminRequest.save();

    // Gửi email với link validation
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL || 'https://e-learning-five-puce.vercel.app')
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    const validationURL = adminRequest.getValidationURL(frontendUrl);
    
    const emailResult = await emailService.sendEmail(
      user.email,
      '✅ Xác thực yêu cầu trở thành Admin - E-Learning Platform',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Xác thực yêu cầu trở thành Admin</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu trở thành Admin từ tài khoản của bạn.</p>
          <p>Để tiếp tục, vui lòng nhấp vào link dưới đây để điền thông tin chi tiết:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationURL}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Điền thông tin chi tiết
            </a>
          </div>
          <p><strong>Lưu ý:</strong> Link này có hiệu lực trong 24 giờ.</p>
          <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Email này được gửi từ hệ thống E-Learning Platform
          </p>
        </div>
      `
    );

    if (!emailResult.success) {
      console.error('Failed to send admin request email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã gửi link xác thực đến email của bạn. Vui lòng kiểm tra email và hoàn tất thông tin.',
      data: {
        requestId: adminRequest._id,
        validationExpires: adminRequest.validationTokenExpires
      }
    });

  } catch (error) {
    console.error('Error requesting admin role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi yêu cầu admin',
      error: error.message
    });
  }
};

// @desc    Xác thực token và hiển thị form (Bước 2)
// @route   GET /api/admin/validate/:token
// @access  Public
const validateAdminToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const adminRequest = await AdminRequest.findOne({
      validationToken: token
    }).populate('user', 'name email');

    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    if (!adminRequest.isTokenValid()) {
      return res.status(400).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    if (adminRequest.isValidated) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu đã được xác thực rồi'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token hợp lệ',
      data: {
        requestId: adminRequest._id,
        user: adminRequest.user,
        email: adminRequest.email
      }
    });

  } catch (error) {
    console.error('Error validating admin token:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực token',
      error: error.message
    });
  }
};

// @desc    Submit thông tin chi tiết admin request (Bước 3)
// @route   POST /api/admin/submit-request
// @access  Public
const submitAdminRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { 
      token, 
      fullName, 
      citizenId, 
      dateOfBirth, 
      phone, 
      address, 
      occupation, 
      experience, 
      reason 
    } = req.body;

    const adminRequest = await AdminRequest.findOne({
      validationToken: token
    });

    if (!adminRequest || !adminRequest.isTokenValid()) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    if (adminRequest.isValidated) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu đã được xác thực rồi'
      });
    }

    // Kiểm tra CCCD trùng lặp
    const existingCitizenId = await AdminRequest.findOne({
      citizenId,
      _id: { $ne: adminRequest._id }
    });

    if (existingCitizenId) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD này đã được sử dụng cho yêu cầu khác'
      });
    }

    // Cập nhật thông tin chi tiết
    adminRequest.fullName = fullName;
    adminRequest.citizenId = citizenId;
    adminRequest.dateOfBirth = new Date(dateOfBirth);
    adminRequest.phone = phone;
    adminRequest.address = address;
    adminRequest.occupation = occupation;
    adminRequest.experience = experience;
    adminRequest.reason = reason;

    await adminRequest.markAsValidated();

    // GỬI EMAIL CHO ADMIN sau khi user đã điền form đầy đủ
    console.log('📤 Sending notification email to admin...');
    const adminEmailResult = await emailService.sendAdminRequestNotification({
      userName: fullName,
      userEmail: adminRequest.email,
      requestId: adminRequest._id,
      reason: reason
    });
    
    if (adminEmailResult.success) {
      console.log('✅ Admin notification email sent successfully');
    } else {
      console.log('❌ Failed to send admin notification email:', adminEmailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'Đã gửi yêu cầu thành công! Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.',
      data: {
        requestId: adminRequest._id,
        status: adminRequest.status
      }
    });

  } catch (error) {
    console.error('Error submitting admin request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi yêu cầu',
      error: error.message
    });
  }
};

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

// ====================== ADMIN REQUEST APPROVAL MANAGEMENT ======================

// @desc    Lấy danh sách admin requests cần duyệt
// @route   GET /api/admin/requests
// @access  Private (Admin only)
const getAdminRequestsForApproval = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    // Support filtering by specific status or show all
    if (status && status !== 'all' && ['pending_validation', 'pending_approval', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    // If status is not provided or is 'all', don't add status filter (show all)

    const adminRequests = await AdminRequest.find(filter)
      .populate('user', 'name email avatar')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: adminRequests.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        requests: adminRequests
      }
    });

  } catch (error) {
    console.error('Error getting admin requests:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách admin requests',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết admin request
// @route   GET /api/admin/requests/:id
// @access  Private (Admin only)
const getAdminRequestDetail = async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findById(req.params.id)
      .populate('user', 'name email avatar createdAt')
      .populate('processedBy', 'name email');

    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin request'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        request: adminRequest
      }
    });

  } catch (error) {
    console.error('Error getting admin request detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết admin request',
      error: error.message
    });
  }
};

// @desc    Duyệt admin request
// @route   PUT /api/admin/requests/:id/approve
// @access  Private (Admin only)
const approveAdminRequestDetailed = async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findById(req.params.id).populate('user');

    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin request'
      });
    }

    if (adminRequest.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Admin request không ở trạng thái chờ duyệt'
      });
    }

    // Cập nhật user thành admin
    const user = adminRequest.user;
    user.isAdmin = true;
    user.adminRequestPending = false;
    await user.save();

    // Cập nhật admin request
    adminRequest.status = 'approved';
    adminRequest.processedBy = req.user.id;
    adminRequest.processedAt = new Date();
    await adminRequest.save();

    // Gửi email thông báo
    const emailResult = await emailService.sendEmail(
      user.email,
      'Yêu cầu trở thành Admin đã được duyệt - E-Learning Platform',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Chúc mừng! Yêu cầu của bạn đã được duyệt</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Chúng tôi vui mừng thông báo rằng yêu cầu trở thành Admin của bạn đã được <strong style="color: #16a34a;">chấp thuận</strong>.</p>
          <p>Bạn hiện đã có quyền truy cập vào tất cả các chức năng quản trị của hệ thống.</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Quyền hạn mới của bạn bao gồm:</strong></p>
            <ul style="margin: 10px 0 0 20px;">
              <li>Quản lý khóa học</li>
              <li>Quản lý người dùng</li>
              <li>Duyệt yêu cầu admin</li>
              <li>Truy cập báo cáo thống kê</li>
            </ul>
          </div>
          <p>Vui lòng sử dụng quyền hạn này một cách có trách nhiệm.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Email này được gửi từ hệ thống E-Learning Platform
          </p>
        </div>
      `
    );

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'Đã duyệt admin request thành công',
      data: {
        request: adminRequest,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Error approving admin request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt admin request',
      error: error.message
    });
  }
};

// @desc    Từ chối admin request
// @route   PUT /api/admin/requests/:id/reject
// @access  Private (Admin only)
const rejectAdminRequestDetailed = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    const adminRequest = await AdminRequest.findById(req.params.id).populate('user');

    if (!adminRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin request'
      });
    }

    if (adminRequest.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Admin request không ở trạng thái chờ duyệt'
      });
    }

    // Cập nhật admin request
    adminRequest.status = 'rejected';
    adminRequest.processedBy = req.user.id;
    adminRequest.processedAt = new Date();
    adminRequest.rejectionReason = rejectionReason.trim();
    await adminRequest.save();

    // Gửi email thông báo
    const user = adminRequest.user;
    const emailResult = await emailService.sendEmail(
      user.email,
      'Yêu cầu trở thành Admin đã bị từ chối - E-Learning Platform',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Yêu cầu trở thành Admin bị từ chối</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Chúng tôi rất tiếc phải thông báo rằng yêu cầu trở thành Admin của bạn đã bị <strong style="color: #dc2626;">từ chối</strong>.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Lý do từ chối:</strong></p>
            <p style="margin: 8px 0 0 0;">${rejectionReason}</p>
          </div>
          <p>Bạn có thể gửi lại yêu cầu sau khi khắc phục các vấn đề được nêu ra.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Email này được gửi từ hệ thống E-Learning Platform
          </p>
        </div>
      `
    );

    if (!emailResult.success) {
      console.error('Failed to send rejection email:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'Đã từ chối admin request',
      data: {
        request: adminRequest
      }
    });

  } catch (error) {
    console.error('Error rejecting admin request:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối admin request',
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
  makeUserAdmin,
  
  // New admin request controllers
  requestAdminRole,
  validateAdminToken,
  submitAdminRequest,
  getAdminRequestsForApproval,
  getAdminRequestDetail,
  approveAdminRequestDetailed,
  rejectAdminRequestDetailed
};

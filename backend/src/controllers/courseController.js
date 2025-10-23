const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Lấy tất cả khóa học
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtering
    let query = { 
      isPublished: true,
      status: 'approved'
    };
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.level) {
      query.level = req.query.level;
    }
    
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    
    // Sorting
    let sort = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'price-low':
          sort = { price: 1 };
          break;
        case 'price-high':
          sort = { price: -1 };
          break;
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    } else {
      sort = { createdAt: -1 };
    }
    
    const courses = await Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name avatar bio');
    
    const total = await Course.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        page,
        limit,
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

// @desc    Lấy thông tin một khóa học
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio email')
      .populate('lessons', 'title description duration order isPreview');
    
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
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin khóa học',
      error: error.message
    });
  }
};

// @desc    Tạo khóa học mới
// @route   POST /api/courses
// @access  Private (Teacher, Admin)
const createCourse = async (req, res) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    // Gán instructor là user hiện tại
    req.body.instructor = req.user.id;
  // Nếu client không cung cấp status, model default (currently 'pending') sẽ áp dụng.
  // Tránh ép trạng thái cứng để frontend có thể gửi 'draft' khi lưu nháp.
    
    const course = await Course.create(req.body);
    
    // Thêm course vào danh sách createdCourses của user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id }
    });
    
    res.status(201).json({
      success: true,
      data: {
        course
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo khóa học',
      error: error.message
    });
  }
};

// @desc    Cập nhật khóa học
// @route   PUT /api/courses/:id
// @access  Private (Owner, Admin)
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    // Kiểm tra quyền sở hữu (chỉ người tạo khóa học hoặc admin mới được cập nhật)
    const courseInstructor = course.instructor._id ? course.instructor._id.toString() : course.instructor.toString();
    const currentUserId = req.user._id.toString();
    
    if (courseInstructor !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể cập nhật khóa học do mình tạo'
      });
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        course
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật khóa học',
      error: error.message
    });
  }
};

// @desc    Xóa khóa học
// @route   DELETE /api/courses/:id
// @access  Private (Owner, Admin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    // Kiểm tra quyền sở hữu (chỉ người tạo khóa học hoặc admin mới được xóa)
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa khóa học do mình tạo'
      });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    // Xóa course khỏi danh sách createdCourses của user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { createdCourses: req.params.id }
    });
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa khóa học thành công'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa khóa học',
      error: error.message
    });
  }
};

// @desc    Đăng ký khóa học
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Khóa học chưa được công bố'
      });
    }
    
    // Kiểm tra đã đăng ký chưa
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === req.params.id
    );
    
    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký khóa học này rồi'
      });
    }
    
    // Thêm student vào course
    await Course.findByIdAndUpdate(req.params.id, {
      $push: {
        students: {
          student: req.user.id,
          enrolledAt: new Date(),
          progress: 0
        }
      }
    });
    
    // Thêm course vào enrolled courses của user
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        enrolledCourses: {
          course: req.params.id,
          enrolledAt: new Date(),
          progress: 0
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Đăng ký khóa học thành công'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký khóa học',
      error: error.message
    });
  }
};

// @desc    Gửi khóa học để admin duyệt
// @route   PUT /api/courses/:id/submit
// @access  Private (Course Owner)
const submitCourseForApproval = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    // Kiểm tra quyền sở hữu
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể gửi duyệt khóa học do mình tạo'
      });
    }
    
    if (course.status !== 'draft' && course.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi duyệt khóa học đang ở trạng thái draft hoặc bị từ chối'
      });
    }
    
    course.status = 'pending';
    course.rejectionReason = null; // Clear rejection reason khi resubmit
    await course.save();
    
    res.status(200).json({
      success: true,
      message: 'Đã gửi khóa học để admin duyệt',
      data: {
        course
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi khóa học để duyệt',
      error: error.message
    });
  }
};

// @desc    Lấy khóa học của instructor
// @route   GET /api/courses/my-courses
// @access  Private (Authenticated User)
const getMyCourses = async (req, res) => {
  try {
    console.log('🔍 getMyCourses called for user:', req.user._id);
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { instructor: req.user._id };
    console.log('📋 Query:', query);
    
    if (status) {
      query.status = status;
    }
    
    // return plain JS objects and populate instructor for predictable JSON shape
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name avatar')
      .lean();
    
    console.log('📦 Found courses:', courses.length, courses.map(c => c.title));
    
    const total = await Course.countDocuments(query);
    console.log('📊 Total courses:', total);
    
    const response = {
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
    };
    
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy khóa học của bạn',
      error: error.message
    });
  }
};

// @desc    Lấy khóa học đã đăng ký
// @route   GET /api/courses/my-enrolled-courses  
// @access  Private (Authenticated User)
const getMyEnrolledCourses = async (req, res) => {
  try {
    console.log('🔍 getMyEnrolledCourses called for user:', req.user._id);
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Tìm user và populate enrolled courses
    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description category level price finalPrice discount duration status instructor students createdAt',
        populate: {
          path: 'instructor',
          select: 'name'
        }
      })
      .select('enrolledCourses')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Lọc và format data
    const enrolledCourses = user.enrolledCourses
      .filter(enrollment => enrollment.course) // Chỉ lấy courses còn tồn tại
      .slice(skip, skip + parseInt(limit))
      .map(enrollment => ({
        ...enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress
      }));
    
    const total = user.enrolledCourses.filter(enrollment => enrollment.course).length;
    
    res.status(200).json({
      success: true,
      count: enrolledCourses.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        courses: enrolledCourses
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy khóa học đã đăng ký',
      error: error.message
    });
  }
};

module.exports = {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  submitCourseForApproval,
  getMyCourses,
  getMyEnrolledCourses
};

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
      status: req.query.status || 'approved' // Allow override from query params
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
      .populate('instructor', 'name avatar bio')
      .populate('totalStudents'); // Virtual count of enrolled students
    
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
    // If user is authenticated, check if they're enrolled (to allow access to deleted courses)
    let query = Course.findById(req.params.id);
    
    // If no user or not enrolled, apply default deleted filter
    // Otherwise, explicitly include deleted courses for enrolled students
    if (req.user) {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({ 
        user: req.user._id, 
        course: req.params.id,
        status: 'active'
      });
      
      // If enrolled or is admin, allow access to deleted courses
      // NOTE: User model doesn't have `role`; instructors are tracked via Course.instructor (User ref)
      if (enrollment || req.user.isAdmin) {
        query = Course.findById(req.params.id).select('+deleted +deletedAt');
      }
    }
    
    const course = await query
      .populate('instructor', 'name avatar bio email')
      .populate('lessons', 'title description duration order isPreview')
      .populate('totalStudents'); // Virtual count of enrolled students
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    // If course is deleted and user is not enrolled/instructor/admin, deny access
    if (course.deleted && !req.user) {
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
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

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
    const course = await Course.findById(req.params.id).select('+deleted');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    // Check if already deleted
    if (course.deleted) {
      return res.status(400).json({
        success: false,
        message: 'Khóa học đã được xóa trước đó'
      });
    }
    
    // Kiểm tra quyền sở hữu (chỉ người tạo khóa học hoặc admin mới được xóa)
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa khóa học do mình tạo'
      });
    }
    
    // Soft delete: Mark as deleted instead of removing
    course.deleted = true;
    course.deletedAt = Date.now();
    course.deletedBy = req.user._id;
    course.isPublished = false; // Unpublish when deleted
    await course.save();
    
    // Note: We DON'T remove from User.createdCourses to preserve the relationship
    // This allows viewing deleted courses history and potential restore
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa khóa học thành công. Học viên đã đăng ký vẫn có thể truy cập.'
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
    const Enrollment = require('../models/Enrollment');
    const Payment = require('../models/Payment');
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }
    
    if (!course.isPublished || course.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Khóa học không khả dụng'
      });
    }
    
    // Kiểm tra đã đăng ký chưa bằng Enrollment model
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: req.params.id
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký khóa học này rồi'
      });
    }

    // KIỂM TRA THANH TOÁN - Quan trọng!
    let paymentId = null;
    
    if (course.price > 0) {
      const completedPayment = await Payment.findOne({
        user: req.user.id,
        course: req.params.id,
        status: 'completed'
      });

      if (!completedPayment) {
        return res.status(402).json({
          success: false,
          message: 'Vui lòng thanh toán trước khi đăng ký khóa học này',
          data: {
            coursePrice: course.price,
            coursePriceFinal: course.price * (1 - course.discount / 100),
            requiresPayment: true
          }
        });
      }

      paymentId = completedPayment._id;
      console.log(`✅ Payment verified for user ${req.user.id} - Course ${req.params.id}`);
      console.log(`Amount paid: ${completedPayment.amount.final} VND`);
    } else {
      console.log(`🆓 Free course enrollment for user ${req.user.id} - Course ${req.params.id}`);
    }
    
    // Tạo enrollment mới - Single source of truth
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: req.params.id,
      payment: paymentId,
      status: 'active',
      enrolledAt: new Date(),
      progress: 0
    });
    
    res.status(200).json({
      success: true,
      message: 'Đăng ký khóa học thành công',
      data: {
        enrollment,
        course: {
          id: course._id,
          title: course.title,
          price: course.price
        }
      }
    });
    
  } catch (error) {
    console.error('Enroll course error:', error);
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
    const coursesRaw = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name avatar')
      .populate('totalStudents') // Virtual count of enrolled students
      .lean();

    const courses = (coursesRaw || []).map((course) => {
      const price = Number(course?.price || 0);
      const discount = Number(course?.discount || 0);
      const computedFinalPrice = Math.round(price * (1 - discount / 100));
      return {
        ...course,
        finalPrice: typeof course?.finalPrice === 'number' ? course.finalPrice : computedFinalPrice
      };
    });
    
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
    const Enrollment = require('../models/Enrollment');
    console.log('🔍 getMyEnrolledCourses called for user:', req.user._id);
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Lấy enrollments từ Enrollment model
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        select: 'title description category level price finalPrice discount duration status instructor createdAt deleted deletedAt',
        // Explicitly include deleted courses for enrolled students
        match: {}, // Empty match to override the pre-find hook
        populate: {
          path: 'instructor',
          select: 'name'
        },
        // Override the query to include deleted courses
        options: { skipFilter: true }
      })
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Manually fetch courses including deleted ones
    const courseIds = enrollments.map(e => e.course);
    const Course = require('../models/Course');
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select('+deleted +deletedAt')
      .populate('instructor', 'name')
      .lean();
    
    // Map courses back to enrollments
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id.toString()] = course;
    });
    
    // Format data
    const enrolledCourses = enrollments
      .filter(enrollment => courseMap[enrollment.course?.toString()]) // Chỉ lấy courses còn tồn tại
      .map(enrollment => {
        const course = courseMap[enrollment.course.toString()];
        const price = Number(course?.price || 0);
        const discount = Number(course?.discount || 0);
        const computedFinalPrice = Math.round(price * (1 - discount / 100));
        return {
          ...course,
          finalPrice: typeof course?.finalPrice === 'number' ? course.finalPrice : computedFinalPrice,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          status: enrollment.status,
          lastAccessedAt: enrollment.lastAccessedAt,
          lastLessonId: enrollment.lastLesson ? enrollment.lastLesson.toString() : null,
          lastLessonAccessedAt: enrollment.lastLessonAccessedAt || null,
          // Add indicator if course was deleted
          isDeleted: course.deleted || false
        };
      });
    
    const total = await Enrollment.countDocuments({ user: req.user._id });
    
    res.status(200).json({
      success: true,
      count: enrolledCourses.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      data: {
        courses: enrolledCourses
      }
    });
    
  } catch (error) {
    console.error('Error in getMyEnrolledCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy khóa học đã đăng ký',
      error: error.message
    });
  }
};

// @desc    Lấy enrollment của tôi cho 1 khóa học (resume/progress)
// @route   GET /api/courses/:id/enrollment
// @access  Private
const getMyCourseEnrollment = async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.id
    })
      .select('user course status progress enrolledAt completedAt lastAccessedAt lastLesson lastLessonAccessedAt completedLessons')
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enrollment: {
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          lastLessonId: enrollment.lastLesson ? enrollment.lastLesson.toString() : null,
          lastLessonAccessedAt: enrollment.lastLessonAccessedAt || null,
          completedLessonsCount: Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getMyCourseEnrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin ghi danh',
      error: error.message
    });
  }
};

// @desc    Cập nhật bài học gần nhất (resume) cho enrollment của tôi
// @route   PUT /api/courses/:id/enrollment/last-lesson
// @access  Private
const updateMyLastLesson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { lessonId } = req.body;
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu lessonId'
      });
    }

    const Enrollment = require('../models/Enrollment');
    const Lesson = require('../models/Lesson');

    const lesson = await Lesson.findById(lessonId).select('course');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    if (lesson.course.toString() !== req.params.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bài học không thuộc khóa học này'
      });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.id
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    await enrollment.setLastLesson(lessonId);

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật bài học đang học',
      data: {
        lastLessonId: enrollment.lastLesson ? enrollment.lastLesson.toString() : null,
        lastLessonAccessedAt: enrollment.lastLessonAccessedAt || null,
        lastAccessedAt: enrollment.lastAccessedAt
      }
    });
  } catch (error) {
    console.error('Error in updateMyLastLesson:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bài học đang học',
      error: error.message
    });
  }
};

// @desc    Lấy tất cả học viên đã đăng ký khóa học của instructor
// @route   GET /api/courses/my-students
// @access  Private (Instructor/Teacher)
const getMyStudents = async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const Payment = require('../models/Payment');
    
    console.log('🔍 getMyStudents called for user:', req.user._id);

    // Lấy tất cả khóa học của instructor
    const myCourses = await Course.find({ instructor: req.user._id }).select('_id title');
    const courseIds = myCourses.map(c => c._id);

    // Lấy tất cả enrollments cho các khóa học này
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('user', 'name email avatar createdAt createdCourses')
      .populate('course', 'title')
      .lean();

    // Thu thập tất cả học viên unique và extract user IDs
    const studentsMap = new Map();
    const uniqueUserIds = [];
    
    for (const enrollment of enrollments) {
      if (enrollment.user) {
        const studentId = enrollment.user._id.toString();
        
        if (!studentsMap.has(studentId)) {
          uniqueUserIds.push(enrollment.user._id);
          
          studentsMap.set(studentId, {
            _id: enrollment.user._id,
            name: enrollment.user.name,
            email: enrollment.user.email,
            avatar: enrollment.user.avatar,
            joinedAt: enrollment.user.createdAt,
            courses: [],
            totalCoursesEnrolled: 0, // Will be populated from aggregation
            totalCoursesCreated: enrollment.user.createdCourses?.length || 0
          });
        }
        
        // Thêm thông tin khóa học này vào student
        studentsMap.get(studentId).courses.push({
          courseId: enrollment.course._id,
          courseTitle: enrollment.course.title,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          status: enrollment.status,
          lastAccessedAt: enrollment.lastAccessedAt,
          lastLessonId: enrollment.lastLesson ? enrollment.lastLesson.toString() : null,
          lastLessonAccessedAt: enrollment.lastLessonAccessedAt || null
        });
      }
    }

    // FIX N+1: Batch query enrollment counts using aggregation
    if (uniqueUserIds.length > 0) {
      const enrollmentCounts = await Enrollment.aggregate([
        { $match: { user: { $in: uniqueUserIds } } },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]);
      
      // Map counts to students
      enrollmentCounts.forEach(({ _id, count }) => {
        const studentId = _id.toString();
        if (studentsMap.has(studentId)) {
          studentsMap.get(studentId).totalCoursesEnrolled = count;
        }
      });
    }

    const students = Array.from(studentsMap.values());

    // FIX N+1: Batch query all payments for all students in one query
    if (students.length > 0) {
      const studentIds = students.map(s => s._id);
      
      const allPayments = await Payment.find({
        user: { $in: studentIds },
        course: { $in: courseIds },
        status: 'completed'
      }).select('user amount.final createdAt').lean();
      
      // Group payments by student
      const paymentsByStudent = {};
      allPayments.forEach(payment => {
        const studentId = payment.user.toString();
        if (!paymentsByStudent[studentId]) {
          paymentsByStudent[studentId] = [];
        }
        paymentsByStudent[studentId].push(payment);
      });
      
      // Assign payments to students
      students.forEach(student => {
        const studentId = student._id.toString();
        const payments = paymentsByStudent[studentId] || [];
        
        student.totalPaid = payments.reduce((sum, p) => sum + p.amount.final, 0);
        student.paymentHistory = payments.map(p => ({
          amount: p.amount.final,
          date: p.createdAt
        }));
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      data: {
        students
      }
    });

  } catch (error) {
    console.error('Error in getMyStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách học viên',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết doanh thu từng khóa học của instructor
// @route   GET /api/courses/my-revenue
// @access  Private (Instructor/Teacher)
const getMyRevenue = async (req, res) => {
  try {
    console.log('🔍 getMyRevenue called for user:', req.user._id);

    const Payment = require('../models/Payment');
    const Review = require('../models/Review');

    // Lấy tất cả khóa học của instructor
    const myCourses = await Course.find({ instructor: req.user._id })
      .select('title price discount rating createdAt')
      .populate('totalStudents') // Virtual count
      .lean();

    if (myCourses.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: {
          totalRevenue: 0,
          courses: []
        }
      });
    }

    const courseIds = myCourses.map(c => c._id);

    const PLATFORM_FEE_RATE = 0.25;

    // FIX N+1: Batch query all payments for all courses in one query
    const allPayments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    }).select('course amount.final user createdAt completedAt platformFeeAmount instructorNetAmount')
      .populate('user', 'name email avatar')
      .lean();

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthPlatformFee = allPayments.reduce((sum, p) => {
      const timestamp = p.completedAt || p.createdAt;
      if (!timestamp) return sum;
      const date = new Date(timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthKey !== currentMonthKey) return sum;
      const gross = p.amount.final || 0;
      const fee = (p.platformFeeAmount ?? Math.round(gross * PLATFORM_FEE_RATE)) || 0;
      return sum + fee;
    }, 0);

    // FIX N+1: Batch query all reviews for all courses in one query
    const allReviews = await Review.find({ 
      course: { $in: courseIds } 
    }).select('course rating comment user createdAt')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Group payments by course
    const paymentsByCourse = {};
    allPayments.forEach(payment => {
      const courseId = payment.course.toString();
      if (!paymentsByCourse[courseId]) {
        paymentsByCourse[courseId] = [];
      }
      paymentsByCourse[courseId].push(payment);
    });

    // Group reviews by course
    const reviewsByCourse = {};
    allReviews.forEach(review => {
      const courseId = review.course.toString();
      if (!reviewsByCourse[courseId]) {
        reviewsByCourse[courseId] = [];
      }
      reviewsByCourse[courseId].push(review);
    });

    const revenueData = [];
    let totalRevenue = 0;
    let totalPlatformFee = 0;
    let totalNetRevenue = 0;

    for (const course of myCourses) {
      const coursePrice = Number(course?.price || 0);
      const courseDiscount = Number(course?.discount || 0);
      const computedFinalPrice = Math.round(coursePrice * (1 - courseDiscount / 100));

      const courseId = course._id.toString();
      const payments = paymentsByCourse[courseId] || [];
      const reviews = (reviewsByCourse[courseId] || []).slice(0, 5); // Limit to 5 latest

      const courseRevenue = payments.reduce((sum, p) => sum + p.amount.final, 0);
      const coursePlatformFee = payments.reduce((sum, p) => {
        const gross = p.amount.final || 0;
        const fee = (p.platformFeeAmount ?? Math.round(gross * PLATFORM_FEE_RATE)) || 0;
        return sum + fee;
      }, 0);
      const courseNetRevenue = payments.reduce((sum, p) => {
        const gross = p.amount.final || 0;
        const fee = (p.platformFeeAmount ?? Math.round(gross * PLATFORM_FEE_RATE)) || 0;
        const net = (p.instructorNetAmount ?? Math.max(0, gross - fee)) || 0;
        return sum + net;
      }, 0);

      totalRevenue += courseRevenue;
      totalPlatformFee += coursePlatformFee;
      totalNetRevenue += courseNetRevenue;

      // Tính doanh thu theo thời gian
      const revenueByDate = {};
      const revenueByMonth = {};
      const revenueByYear = {};

      payments.forEach(payment => {
        const timestamp = payment.completedAt || payment.createdAt;
        const date = new Date(timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const yearKey = date.getFullYear().toString(); // YYYY

        const gross = payment.amount.final || 0;
        const fee = (payment.platformFeeAmount ?? Math.round(gross * PLATFORM_FEE_RATE)) || 0;
        const net = (payment.instructorNetAmount ?? Math.max(0, gross - fee)) || 0;

        if (!revenueByDate[dateKey]) revenueByDate[dateKey] = { gross: 0, platformFee: 0, net: 0 };
        if (!revenueByMonth[monthKey]) revenueByMonth[monthKey] = { gross: 0, platformFee: 0, net: 0 };
        if (!revenueByYear[yearKey]) revenueByYear[yearKey] = { gross: 0, platformFee: 0, net: 0 };

        revenueByDate[dateKey].gross += gross;
        revenueByDate[dateKey].platformFee += fee;
        revenueByDate[dateKey].net += net;

        revenueByMonth[monthKey].gross += gross;
        revenueByMonth[monthKey].platformFee += fee;
        revenueByMonth[monthKey].net += net;

        revenueByYear[yearKey].gross += gross;
        revenueByYear[yearKey].platformFee += fee;
        revenueByYear[yearKey].net += net;
      });

      revenueData.push({
        courseId: course._id,
        title: course.title,
        price: coursePrice,
        finalPrice: computedFinalPrice,
        studentsCount: course.totalStudents || 0, // Use virtual count
        rating: course.rating,
        revenue: courseRevenue,
        platformFeeAmount: coursePlatformFee,
        netRevenue: courseNetRevenue,
        payments: payments.map(p => ({
          user: p.user,
          amount: p.amount.final,
          platformFeeAmount: (p.platformFeeAmount ?? Math.round((p.amount.final || 0) * PLATFORM_FEE_RATE)) || 0,
          instructorNetAmount: (p.instructorNetAmount ?? Math.max(0, (p.amount.final || 0) - ((p.platformFeeAmount ?? Math.round((p.amount.final || 0) * PLATFORM_FEE_RATE)) || 0))) || 0,
          date: p.completedAt || p.createdAt
        })),
        reviews: reviews,
        analytics: {
          byDate: Object.entries(revenueByDate).map(([date, v]) => ({
            date,
            amount: v.gross,
            platformFeeAmount: v.platformFee,
            netAmount: v.net
          })),
          byMonth: Object.entries(revenueByMonth).map(([month, v]) => ({
            month,
            amount: v.gross,
            platformFeeAmount: v.platformFee,
            netAmount: v.net
          })),
          byYear: Object.entries(revenueByYear).map(([year, v]) => ({
            year,
            amount: v.gross,
            platformFeeAmount: v.platformFee,
            netAmount: v.net
          }))
        }
      });
    }

    // Sort by revenue descending
    revenueData.sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      count: revenueData.length,
      data: {
        totalRevenue,
        totalPlatformFee,
        totalNetRevenue,
        currentMonthKey,
        currentMonthPlatformFee,
        courses: revenueData
      }
    });

  } catch (error) {
    console.error('Error in getMyRevenue:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu doanh thu',
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
  getMyEnrolledCourses,
  getMyCourseEnrollment,
  updateMyLastLesson,
  getMyStudents,
  getMyRevenue
};

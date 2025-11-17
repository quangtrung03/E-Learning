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

    // KIỂM TRA THANH TOÁN - Quan trọng!
    const Payment = require('../models/Payment');
    
    // Nếu khóa học có phí, phải kiểm tra payment
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

      // Log payment info for verification
      console.log(`✅ Payment verified for user ${req.user.id} - Course ${req.params.id}`);
      console.log(`Amount paid: ${completedPayment.amount.final} VND`);
    } else {
      // Khóa học miễn phí - cho phép enroll trực tiếp
      console.log(`🆓 Free course enrollment for user ${req.user.id} - Course ${req.params.id}`);
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
      message: 'Đăng ký khóa học thành công',
      data: {
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

// @desc    Lấy tất cả học viên đã đăng ký khóa học của instructor
// @route   GET /api/courses/my-students
// @access  Private (Instructor/Teacher)
const getMyStudents = async (req, res) => {
  try {
    console.log('🔍 getMyStudents called for user:', req.user._id);

    // Lấy tất cả khóa học của instructor
    const myCourses = await Course.find({ instructor: req.user._id })
      .select('title students')
      .populate({
        path: 'students.student',
        select: 'name email avatar createdAt enrolledCourses createdCourses'
      });

    // Thu thập tất cả học viên unique
    const studentsMap = new Map();
    
    for (const course of myCourses) {
      for (const enrollment of course.students) {
        if (enrollment.student) {
          const studentId = enrollment.student._id.toString();
          
          if (!studentsMap.has(studentId)) {
            studentsMap.set(studentId, {
              _id: enrollment.student._id,
              name: enrollment.student.name,
              email: enrollment.student.email,
              avatar: enrollment.student.avatar,
              joinedAt: enrollment.student.createdAt,
              courses: [],
              totalCoursesEnrolled: enrollment.student.enrolledCourses?.length || 0,
              totalCoursesCreated: enrollment.student.createdCourses?.length || 0
            });
          }
          
          // Thêm thông tin khóa học này vào student
          studentsMap.get(studentId).courses.push({
            courseId: course._id,
            courseTitle: course.title,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress
          });
        }
      }
    }

    const students = Array.from(studentsMap.values());

    // Lấy thông tin thanh toán cho từng student
    const Payment = require('../models/Payment');
    for (const student of students) {
      const payments = await Payment.find({
        user: student._id,
        course: { $in: student.courses.map(c => c.courseId) },
        status: 'completed'
      }).select('amount.final createdAt');
      
      student.totalPaid = payments.reduce((sum, p) => sum + p.amount.final, 0);
      student.paymentHistory = payments.map(p => ({
        amount: p.amount.final,
        date: p.createdAt
      }));
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
      .select('title price finalPrice students rating createdAt')
      .lean();

    const revenueData = [];
    let totalRevenue = 0;

    for (const course of myCourses) {
      // Lấy tất cả payments cho khóa học này
      const payments = await Payment.find({
        course: course._id,
        status: 'completed'
      }).select('amount.final user createdAt').populate('user', 'name email avatar');

      const courseRevenue = payments.reduce((sum, p) => sum + p.amount.final, 0);
      totalRevenue += courseRevenue;

      // Lấy reviews cho khóa học
      const reviews = await Review.find({ course: course._id })
        .select('rating comment user createdAt')
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5);

      // Tính doanh thu theo thời gian
      const revenueByDate = {};
      const revenueByMonth = {};
      const revenueByYear = {};

      payments.forEach(payment => {
        const date = new Date(payment.createdAt);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const yearKey = date.getFullYear().toString(); // YYYY

        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + payment.amount.final;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + payment.amount.final;
        revenueByYear[yearKey] = (revenueByYear[yearKey] || 0) + payment.amount.final;
      });

      revenueData.push({
        courseId: course._id,
        title: course.title,
        price: course.price,
        finalPrice: course.finalPrice,
        studentsCount: course.students?.length || 0,
        rating: course.rating,
        revenue: courseRevenue,
        payments: payments.map(p => ({
          user: p.user,
          amount: p.amount.final,
          date: p.createdAt
        })),
        reviews: reviews,
        analytics: {
          byDate: Object.entries(revenueByDate).map(([date, amount]) => ({ date, amount })),
          byMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount })),
          byYear: Object.entries(revenueByYear).map(([year, amount]) => ({ year, amount }))
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
  getMyStudents,
  getMyRevenue
};

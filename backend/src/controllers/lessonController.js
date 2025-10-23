const { validationResult } = require('express-validator');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Lấy tất cả bài học của một khóa học
// @route   GET /api/courses/:courseId/lessons
// @access  Public (chỉ preview lessons), Private (all lessons if enrolled)
const getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Kiểm tra khóa học có tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    let query = { course: courseId };
    
    // Nếu không đăng nhập hoặc chưa enroll, chỉ xem preview lessons
    if (!req.user) {
      query.isPreview = true;
    } else {
      // Kiểm tra user đã enroll course chưa
      const user = await User.findById(req.user.id);
      const isEnrolled = user.enrolledCourses.some(
        enrollment => enrollment.course.toString() === courseId
      );
      
      // Nếu chưa enroll và không phải instructor/admin, chỉ xem preview
      if (!isEnrolled && course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
        query.isPreview = true;
      }
    }

    const lessons = await Lesson.find(query)
      .populate('course', 'title instructor')
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit)
      .select('-content'); // Không trả về full content trong danh sách

    const total = await Lesson.countDocuments(query);

    res.status(200).json({
      success: true,
      count: lessons.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        lessons
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài học',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết một bài học
// @route   GET /api/lessons/:id
// @access  Private (enrolled students, instructor, admin)
const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor students');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Kiểm tra quyền xem bài học
    const course = lesson.course;
    const user = await User.findById(req.user._id);
    
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === course._id.toString()
    );
    
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    // Nếu là preview lesson thì ai cũng xem được
    if (lesson.isPreview) {
      return res.status(200).json({
        success: true,
        data: { lesson }
      });
    }

    // Kiểm tra quyền truy cập
    if (!isEnrolled && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để xem bài học này'
      });
    }

    res.status(200).json({
      success: true,
      data: { lesson }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy bài học',
      error: error.message
    });
  }
};

// @desc    Tạo bài học mới
// @route   POST /api/courses/:courseId/lessons
// @access  Private (instructor, admin)
const createLesson = async (req, res) => {
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

    const { courseId } = req.params;
    
    // Kiểm tra khóa học có tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Kiểm tra quyền tạo bài học (chỉ instructor hoặc admin)
    const courseInstructor = course.instructor._id ? course.instructor._id.toString() : course.instructor.toString();
    const currentUserId = req.user._id.toString();
    
    if (courseInstructor !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể tạo bài học cho khóa học của mình'
      });
    }

    // Gán course ID
    req.body.course = courseId;

    // Nếu không có order, tự động đặt là lesson cuối cùng + 1
    if (!req.body.order) {
      const lastLesson = await Lesson.findOne({ course: courseId })
        .sort({ order: -1 });
      req.body.order = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create(req.body);

    // Thêm lesson vào course
    await Course.findByIdAndUpdate(courseId, {
      $push: { lessons: lesson._id }
    });

    res.status(201).json({
      success: true,
      data: { lesson }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bài học',
      error: error.message
    });
  }
};

// @desc    Cập nhật bài học
// @route   PUT /api/lessons/:id
// @access  Private (instructor, admin)
const updateLesson = async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Kiểm tra quyền chỉnh sửa
    const courseInstructor = lesson.course.instructor._id ? lesson.course.instructor._id.toString() : lesson.course.instructor.toString();
    const currentUserId = req.user._id.toString();
    
    if (courseInstructor !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể chỉnh sửa bài học của khóa học mình tạo'
      });
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: { lesson }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bài học',
      error: error.message
    });
  }
};

// @desc    Xóa bài học
// @route   DELETE /api/lessons/:id
// @access  Private (instructor, admin)
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Kiểm tra quyền xóa
    if (lesson.course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa bài học của khóa học mình tạo'
      });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    // Xóa lesson khỏi course
    await Course.findByIdAndUpdate(lesson.course._id, {
      $pull: { lessons: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa bài học thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa bài học',
      error: error.message
    });
  }
};

// @desc    Đánh dấu bài học đã hoàn thành
// @route   POST /api/lessons/:id/complete
// @access  Private (enrolled students)
const completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const user = await User.findById(req.user.id);
    const enrollment = user.enrolledCourses.find(
      enrollment => enrollment.course.toString() === lesson.course._id.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để hoàn thành bài học'
      });
    }

    // Kiểm tra đã complete lesson chưa
    const alreadyCompleted = lesson.completedBy.some(
      completion => completion.student.toString() === req.user.id
    );

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã hoàn thành bài học này rồi'
      });
    }

    // Thêm vào danh sách completed
    lesson.completedBy.push({
      student: req.user.id,
      completedAt: new Date()
    });
    await lesson.save();

    // Cập nhật progress của course
    const totalLessons = await Lesson.countDocuments({ course: lesson.course._id });
    const completedLessons = await Lesson.countDocuments({
      course: lesson.course._id,
      'completedBy.student': req.user.id
    });

    const progress = Math.round((completedLessons / totalLessons) * 100);

    // Cập nhật progress trong User
    await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'enrolledCourses.course': lesson.course._id
      },
      {
        $set: { 'enrolledCourses.$.progress': progress }
      }
    );

    // Cập nhật progress trong Course
    await Course.findOneAndUpdate(
      {
        _id: lesson.course._id,
        'students.student': req.user.id
      },
      {
        $set: { 'students.$.progress': progress }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Đã hoàn thành bài học',
      data: {
        progress,
        completedLessons,
        totalLessons
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hoàn thành bài học',
      error: error.message
    });
  }
};

// @desc    Hủy hoàn thành bài học
// @route   DELETE /api/lessons/:id/complete
// @access  Private (enrolled students)
const uncompleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const user = await User.findById(req.user.id);
    const enrollment = user.enrolledCourses.find(
      enrollment => enrollment.course.toString() === lesson.course._id.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để thực hiện thao tác này'
      });
    }

    // Xóa khỏi danh sách completed
    lesson.completedBy = lesson.completedBy.filter(
      completion => completion.student.toString() !== req.user.id
    );
    await lesson.save();

    // Cập nhật progress của course
    const totalLessons = await Lesson.countDocuments({ course: lesson.course._id });
    const completedLessons = await Lesson.countDocuments({
      course: lesson.course._id,
      'completedBy.student': req.user.id
    });

    const progress = Math.round((completedLessons / totalLessons) * 100);

    // Cập nhật progress trong User
    await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'enrolledCourses.course': lesson.course._id
      },
      {
        $set: { 'enrolledCourses.$.progress': progress }
      }
    );

    // Cập nhật progress trong Course
    await Course.findOneAndUpdate(
      {
        _id: lesson.course._id,
        'students.student': req.user.id
      },
      {
        $set: { 'students.$.progress': progress }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Đã hủy hoàn thành bài học',
      data: {
        progress,
        completedLessons,
        totalLessons
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy hoàn thành bài học',
      error: error.message
    });
  }
};

module.exports = {
  getLessonsByCourse,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  uncompleteLesson
};
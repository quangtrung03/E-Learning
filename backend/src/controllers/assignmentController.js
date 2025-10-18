const { validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Lấy tất cả assignments của một khóa học
// @route   GET /api/courses/:courseId/assignments
// @access  Private (Enrolled students and instructors)
const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, type, status } = req.query;

    // Check if user has access to course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Build query
    let query = { course: courseId };
    
    if (type) query.type = type;
    if (status) query.isPublished = status === 'published';

    // If not instructor or admin, only show published assignments
    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      query.isPublished = true;
      query.startDate = { $lte: new Date() };
    }

    const assignments = await Assignment.find(query)
      .populate('instructor', 'name avatar')
      .populate('lesson', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(query);

    // Get user's submissions for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user.id
        }).sort({ attemptNumber: -1 });

        return {
          ...assignment.toObject(),
          userSubmission: submission
        };
      })
    );

    res.status(200).json({
      success: true,
      count: assignments.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        assignments: assignmentsWithSubmissions
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bài tập',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin chi tiết một assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('course', 'title')
      .populate('lesson', 'title');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    // Check access permissions
    const course = await Course.findById(assignment.course._id);
    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.isAdmin;
    const isEnrolled = await User.findById(req.user.id).populate('enrolledCourses.course');
    const hasAccess = isInstructor || isAdmin || 
      isEnrolled.enrolledCourses.some(ec => ec.course._id.toString() === assignment.course._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập bài tập này'
      });
    }

    // If not instructor/admin and assignment not published, deny access
    if (!isInstructor && !isAdmin && !assignment.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Bài tập chưa được công bố'
      });
    }

    // Get user's submissions
    const submissions = await Submission.find({
      assignment: assignment._id,
      student: req.user.id
    }).sort({ attemptNumber: -1 });

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submissions
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bài tập',
      error: error.message
    });
  }
};

// @desc    Tạo assignment mới
// @route   POST /api/assignments
// @access  Private (Instructors and Admins)
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    // Check if user owns the course
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể tạo bài tập cho khóa học của mình'
      });
    }

    // Calculate total points
    const totalPoints = req.body.questions.reduce((sum, question) => sum + (question.points || 1), 0);

    const assignment = await Assignment.create({
      ...req.body,
      instructor: req.user.id,
      totalPoints
    });

    await assignment.populate('instructor', 'name avatar');
    await assignment.populate('course', 'title');

    res.status(201).json({
      success: true,
      data: {
        assignment
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bài tập',
      error: error.message
    });
  }
};

// @desc    Nộp bài assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Students)
const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

    // Check if assignment is published and within time limit
    if (!assignment.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Bài tập chưa được công bố'
      });
    }

    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Đã quá hạn nộp bài'
      });
    }

    // Check attempts limit
    const existingSubmissions = await Submission.find({
      assignment: assignment._id,
      student: req.user.id
    });

    if (existingSubmissions.length >= assignment.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã hết lượt làm bài'
      });
    }

    const attemptNumber = existingSubmissions.length + 1;

    // Check for existing in-progress submission
    const inProgressSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user.id,
      status: 'in-progress'
    });

    if (inProgressSubmission && req.body.startNew !== true) {
      return res.status(400).json({
        success: false,
        message: 'Bạn có bài làm đang thực hiện. Hãy hoàn thành hoặc bắt đầu lại.',
        data: {
          submissionId: inProgressSubmission._id
        }
      });
    }

    // Create new submission
    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user.id,
      attemptNumber,
      startedAt: new Date(),
      totalPoints: assignment.totalPoints,
      answers: req.body.answers || []
    });

    res.status(201).json({
      success: true,
      data: {
        submission
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi nộp bài',
      error: error.message
    });
  }
};

// @desc    Hoàn thành submission
// @route   PUT /api/submissions/:id/complete
// @access  Private
const completeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài làm'
      });
    }

    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập bài làm này'
      });
    }

    if (submission.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Bài làm đã được hoàn thành'
      });
    }

    // Calculate score for auto-gradable questions
    let totalPointsEarned = 0;
    const gradedAnswers = submission.answers.map((answer, index) => {
      const question = submission.assignment.questions[index];
      if (!question) return answer;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'multiple-choice') {
        isCorrect = answer.selectedOptions[0] === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'true-false') {
        isCorrect = answer.selectedOptions[0] === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
      }
      // Essay questions need manual grading

      totalPointsEarned += pointsEarned;

      return {
        ...answer,
        isCorrect,
        pointsEarned
      };
    });

    const score = Math.round((totalPointsEarned / submission.totalPoints) * 100);
    const passed = score >= submission.assignment.passingScore;

    submission.answers = gradedAnswers;
    submission.pointsEarned = totalPointsEarned;
    submission.score = score;
    submission.passed = passed;
    submission.submittedAt = new Date();
    submission.status = 'submitted';
    submission.timeSpent = Math.round((new Date() - submission.startedAt) / 1000);

    await submission.save();

    res.status(200).json({
      success: true,
      data: {
        submission
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hoàn thành bài làm',
      error: error.message
    });
  }
};

module.exports = {
  getAssignmentsByCourse,
  getAssignment,
  createAssignment,
  submitAssignment,
  completeSubmission
};
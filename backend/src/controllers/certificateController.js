const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const crypto = require('crypto');

// @desc    Tạo certificate cho user khi hoàn thành khóa học
// @route   POST /api/certificates/generate
// @access  Private
const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Check if user is enrolled
    const user = await User.findById(req.user.id);
    const enrollment = user.enrolledCourses.find(
      ec => ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    // Check if user has completed the course (>= 80% progress)
    if (enrollment.progress < 80) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần hoàn thành ít nhất 80% khóa học để nhận certificate'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: req.user.id,
      course: courseId
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có certificate cho khóa học này',
        data: {
          certificate: existingCertificate
        }
      });
    }

    // Calculate average score from assignments
    const assignments = await Assignment.find({ course: courseId });
    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) },
      student: req.user.id,
      status: 'submitted'
    });

    let averageScore = 85; // Default score if no assignments
    if (submissions.length > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
      averageScore = Math.round(totalScore / submissions.length);
    }

    // Generate certificate hash for verification
    const certificateData = `${req.user.id}-${courseId}-${Date.now()}`;
    const certificateHash = crypto.createHash('sha256').update(certificateData).digest('hex');

    // Create certificate
    const certificate = await Certificate.create({
      user: req.user.id,
      course: courseId,
      certificateName: `Certificate of Completion - ${course.title}`,
      completionDate: new Date(),
      score: averageScore,
      grade: Certificate.schema.methods.calculateGrade(averageScore),
      certificateUrl: `${process.env.FRONTEND_URL}/certificates/${certificateHash}`,
      certificateHash,
      issuedBy: {
        name: course.instructor.name,
        title: 'Course Instructor',
      },
      courseDuration: course.duration || 0,
      skills: course.whatYouWillLearn || [],
      metadata: {
        totalLessons: course.lessons?.length || 0,
        completedLessons: Math.round((course.lessons?.length || 0) * (enrollment.progress / 100)),
        totalAssignments: assignments.length,
        completedAssignments: submissions.length,
        averageScore,
        timeSpent: enrollment.timeSpent || 0
      }
    });

    await certificate.populate('user', 'name email');
    await certificate.populate('course', 'title category level');

    res.status(201).json({
      success: true,
      message: 'Certificate đã được tạo thành công',
      data: {
        certificate
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo certificate',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách certificates của user
// @route   GET /api/certificates/my-certificates
// @access  Private
const getMyCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;

    const query = { 
      user: req.user.id,
      ...(status && { status })
    };

    const certificates = await Certificate.find(query)
      .populate('course', 'title category level thumbnail')
      .sort({ issueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments(query);

    res.status(200).json({
      success: true,
      count: certificates.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        certificates
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách certificates',
      error: error.message
    });
  }
};

// @desc    Xác thực certificate bằng hash
// @route   GET /api/certificates/verify/:hash
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { hash } = req.params;

    const certificate = await Certificate.findOne({ certificateHash: hash })
      .populate('user', 'name email')
      .populate('course', 'title category level instructor')
      .populate('course.instructor', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate không tồn tại hoặc không hợp lệ'
      });
    }

    if (certificate.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Certificate đã bị thu hồi hoặc hết hạn'
      });
    }

    // Check if expired
    if (certificate.expiryDate && new Date() > certificate.expiryDate) {
      certificate.status = 'expired';
      await certificate.save();
      
      return res.status(400).json({
        success: false,
        message: 'Certificate đã hết hạn'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificate,
        verification: {
          isValid: true,
          verifiedAt: new Date(),
          message: 'Certificate hợp lệ và được xác thực'
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực certificate',
      error: error.message
    });
  }
};

// @desc    Lấy certificate theo ID để hiển thị
// @route   GET /api/certificates/:id
// @access  Public (với điều kiện)
const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title category level instructor')
      .populate('course.instructor', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy certificate'
      });
    }

    // Only allow access to certificate owner or if it's a public share
    const isOwner = req.user && req.user.id === certificate.user._id.toString();
    const isPublicAccess = req.query.public === 'true';

    if (!isOwner && !isPublicAccess) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập certificate này'
      });
    }

    // Update share count if public access
    if (isPublicAccess && !isOwner) {
      certificate.sharedCount += 1;
      certificate.lastSharedAt = new Date();
      await certificate.save();
    }

    res.status(200).json({
      success: true,
      data: {
        certificate
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin certificate',
      error: error.message
    });
  }
};

// @desc    Thu hồi certificate (Admin only)
// @route   PUT /api/certificates/:id/revoke
// @access  Private (Admin)
const revokeCertificate = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy certificate'
      });
    }

    certificate.status = 'revoked';
    certificate.revokedAt = new Date();
    certificate.revokedBy = req.user.id;
    certificate.revokedReason = reason;

    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate đã được thu hồi',
      data: {
        certificate
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thu hồi certificate',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê certificates (Admin)
// @route   GET /api/certificates/admin/stats
// @access  Private (Admin)
const getCertificateStats = async (req, res) => {
  try {
    const stats = await Certificate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await Certificate.aggregate([
      {
        $match: {
          issueDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const topCourses = await Certificate.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        monthlyStats,
        topCourses
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê certificates',
      error: error.message
    });
  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
  getCertificate,
  revokeCertificate,
  getCertificateStats
};
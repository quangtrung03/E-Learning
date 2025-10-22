const { validationResult } = require('express-validator');
const StudyGroup = require('../models/StudyGroup');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Tạo study group mới
// @route   POST /api/study-groups
// @access  Private
const createStudyGroup = async (req, res) => {
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
      courseId, 
      name, 
      description, 
      maxMembers, 
      isPrivate, 
      requireApproval,
      tags,
      studyLevel,
      language,
      timezone,
      rules,
      schedule
    } = req.body;

    // Kiểm tra course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để tạo nhóm học tập'
      });
    }

    // Generate invite code nếu private
    let inviteCode = null;
    if (isPrivate) {
      inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    const studyGroup = new StudyGroup({
      course: courseId,
      creator: req.user.id,
      name,
      description,
      maxMembers: maxMembers || 10,
      isPrivate: isPrivate || false,
      requireApproval: requireApproval || false,
      inviteCode,
      tags: tags || [],
      studyLevel: studyLevel || 'mixed',
      language: language || 'vi',
      timezone: timezone || 'Asia/Ho_Chi_Minh',
      rules: rules || [],
      schedule: schedule || [],
      members: [{
        user: req.user.id,
        role: 'admin',
        joinedAt: new Date(),
        status: 'active'
      }],
      currentMemberCount: 1
    });

    await studyGroup.save();

    // Populate dữ liệu để response
    await studyGroup.populate([
      { path: 'creator', select: 'name avatar' },
      { path: 'course', select: 'title instructor' },
      { path: 'members.user', select: 'name avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm học tập thành công',
      data: {
        studyGroup
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Lấy study groups theo course
// @route   GET /api/courses/:courseId/study-groups
// @access  Private
const getStudyGroupsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      studyLevel, 
      language,
      search,
      sortBy = 'memberCount',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Kiểm tra quyền truy cập course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    const user = await User.findById(req.user.id);
    const hasAccess = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    ) || course.instructor.toString() === req.user.id || req.user.isAdmin;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem nhóm học tập của khóa học này'
      });
    }

    let query = { 
      course: courseId, 
      status: 'active'
    };

    // Chỉ hiển thị public groups hoặc groups mà user đã join
    query.$or = [
      { isPrivate: false },
      { 'members.user': req.user.id }
    ];

    if (studyLevel) query.studyLevel = studyLevel;
    if (language) query.language = language;
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete query.$or;
    }

    const sortOptions = {};
    switch (sortBy) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'name':
        sortOptions.name = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'memberCount':
      default:
        sortOptions.currentMemberCount = sortOrder === 'desc' ? -1 : 1;
        break;
    }

    const studyGroups = await StudyGroup.find(query)
      .populate('creator', 'name avatar')
      .populate('course', 'title')
      .populate('members.user', 'name avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyGroup.countDocuments(query);

    res.status(200).json({
      success: true,
      count: studyGroups.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        studyGroups
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết study group
// @route   GET /api/study-groups/:id
// @access  Private
const getStudyGroup = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id)
      .populate('creator', 'name avatar email')
      .populate('course', 'title instructor')
      .populate('members.user', 'name avatar email')
      .populate('pendingMembers.user', 'name avatar email');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền truy cập
    const isMember = studyGroup.members.some(
      member => member.user._id.toString() === req.user.id
    );
    
    const user = await User.findById(req.user.id);
    const hasAccess = !studyGroup.isPrivate || isMember || 
      studyGroup.course.instructor.toString() === req.user.id || 
      req.user.isAdmin;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem nhóm học tập này'
      });
    }

    // Ẩn một số thông tin nếu không phải member
    let responseData = studyGroup.toObject();
    if (!isMember && studyGroup.isPrivate) {
      delete responseData.inviteCode;
      delete responseData.members;
      responseData.memberCount = studyGroup.currentMemberCount;
    }

    res.status(200).json({
      success: true,
      data: {
        studyGroup: responseData,
        userMembership: isMember ? studyGroup.members.find(
          m => m.user._id.toString() === req.user.id
        ) : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Tham gia study group
// @route   POST /api/study-groups/:id/join
// @access  Private
const joinStudyGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const studyGroup = await StudyGroup.findById(req.params.id)
      .populate('course', 'title');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra user đã enroll course chưa
    const user = await User.findById(req.user.id);
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === studyGroup.course._id.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần đăng ký khóa học để tham gia nhóm học tập'
      });
    }

    // Kiểm tra đã là member chưa
    const isMember = studyGroup.members.some(
      member => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của nhóm này rồi'
      });
    }

    // Kiểm tra group đã full chưa
    if (studyGroup.currentMemberCount >= studyGroup.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Nhóm đã đầy thành viên'
      });
    }

    // Kiểm tra invite code nếu là private group
    if (studyGroup.isPrivate && studyGroup.inviteCode !== inviteCode) {
      return res.status(403).json({
        success: false,
        message: 'Mã mời không chính xác'
      });
    }

    // Kiểm tra pending request
    const hasPendingRequest = studyGroup.pendingMembers.some(
      pending => pending.user.toString() === req.user.id
    );

    if (studyGroup.requireApproval && !hasPendingRequest) {
      // Thêm vào pending list
      studyGroup.pendingMembers.push({
        user: req.user.id,
        requestedAt: new Date(),
        message: req.body.message || ''
      });

      await studyGroup.save();

      return res.status(200).json({
        success: true,
        message: 'Yêu cầu tham gia đã được gửi, chờ admin duyệt',
        data: {
          status: 'pending'
        }
      });
    }

    // Thêm vào group
    studyGroup.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date(),
      status: 'active'
    });

    studyGroup.currentMemberCount += 1;
    
    // Remove từ pending nếu có
    studyGroup.pendingMembers = studyGroup.pendingMembers.filter(
      pending => pending.user.toString() !== req.user.id
    );

    await studyGroup.save();

    await studyGroup.populate('members.user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Tham gia nhóm học tập thành công',
      data: {
        membership: studyGroup.members.find(
          m => m.user._id.toString() === req.user.id
        )
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tham gia nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Rời khỏi study group
// @route   POST /api/study-groups/:id/leave
// @access  Private
const leaveStudyGroup = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    const memberIndex = studyGroup.members.findIndex(
      member => member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không phải thành viên của nhóm này'
      });
    }

    const member = studyGroup.members[memberIndex];

    // Kiểm tra nếu là creator và còn thành viên khác
    if (member.role === 'admin' && studyGroup.creator.toString() === req.user.id) {
      if (studyGroup.currentMemberCount > 1) {
        return res.status(400).json({
          success: false,
          message: 'Bạn cần chuyển quyền admin cho thành viên khác trước khi rời nhóm'
        });
      }
    }

    // Remove thành viên
    studyGroup.members.splice(memberIndex, 1);
    studyGroup.currentMemberCount -= 1;

    // Nếu không còn thành viên nào, deactivate group
    if (studyGroup.currentMemberCount === 0) {
      studyGroup.status = 'inactive';
    }

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: 'Đã rời khỏi nhóm học tập'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi rời nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Cập nhật study group (Admin only)
// @route   PUT /api/study-groups/:id
// @access  Private (Group Admin)
const updateStudyGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền update
    const member = studyGroup.members.find(
      m => m.user.toString() === req.user.id
    );

    if (!member || (member.role !== 'admin' && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật nhóm này'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'maxMembers', 'isPrivate', 'requireApproval',
      'tags', 'studyLevel', 'language', 'timezone', 'rules', 'schedule'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        studyGroup[update] = req.body[update];
      }
    });

    // Generate new invite code nếu chuyển sang private
    if (req.body.isPrivate && !studyGroup.inviteCode) {
      studyGroup.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    await studyGroup.save();

    await studyGroup.populate([
      { path: 'creator', select: 'name avatar' },
      { path: 'course', select: 'title' },
      { path: 'members.user', select: 'name avatar' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhóm học tập thành công',
      data: {
        studyGroup
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật nhóm học tập',
      error: error.message
    });
  }
};

// @desc    Duyệt/Từ chối thành viên pending
// @route   PUT /api/study-groups/:id/pending/:userId
// @access  Private (Group Admin)
const managePendingMember = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const { id, userId } = req.params;

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền
    const member = studyGroup.members.find(
      m => m.user.toString() === req.user.id
    );

    if (!member || (member.role !== 'admin' && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền duyệt thành viên'
      });
    }

    const pendingIndex = studyGroup.pendingMembers.findIndex(
      p => p.user.toString() === userId
    );

    if (pendingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu tham gia'
      });
    }

    if (action === 'approve') {
      // Kiểm tra group đã full chưa
      if (studyGroup.currentMemberCount >= studyGroup.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Nhóm đã đầy thành viên'
        });
      }

      // Thêm vào members
      studyGroup.members.push({
        user: userId,
        role: 'member',
        joinedAt: new Date(),
        status: 'active'
      });

      studyGroup.currentMemberCount += 1;
    }

    // Remove từ pending
    studyGroup.pendingMembers.splice(pendingIndex, 1);

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Đã duyệt thành viên' : 'Đã từ chối yêu cầu',
      data: {
        action,
        currentMemberCount: studyGroup.currentMemberCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt thành viên',
      error: error.message
    });
  }
};

// @desc    Lấy study groups của user
// @route   GET /api/study-groups/my-groups
// @access  Private
const getMyStudyGroups = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    const skip = (page - 1) * limit;

    const studyGroups = await StudyGroup.find({
      'members.user': req.user.id,
      status: status
    })
      .populate('creator', 'name avatar')
      .populate('course', 'title thumbnail')
      .sort({ 'members.joinedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyGroup.countDocuments({
      'members.user': req.user.id,
      status: status
    });

    // Thêm thông tin membership role cho mỗi group
    const enrichedGroups = studyGroups.map(group => {
      const membership = group.members.find(
        m => m.user.toString() === req.user.id
      );
      return {
        ...group.toObject(),
        userRole: membership ? membership.role : null,
        joinedAt: membership ? membership.joinedAt : null
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedGroups.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        studyGroups: enrichedGroups
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhóm học tập của bạn',
      error: error.message
    });
  }
};

// @desc    Xóa study group
// @route   DELETE /api/study-groups/:id
// @access  Private (Creator hoặc Admin)
const deleteStudyGroup = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền xóa
    if (studyGroup.creator.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ người tạo hoặc admin mới có thể xóa nhóm'
      });
    }

    // Soft delete
    studyGroup.status = 'deleted';
    studyGroup.deletedAt = new Date();
    studyGroup.deletedBy = req.user.id;

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: 'Xóa nhóm học tập thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa nhóm học tập',
      error: error.message
    });
  }
};

module.exports = {
  createStudyGroup,
  getStudyGroupsByCourse,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  updateStudyGroup,
  managePendingMember,
  getMyStudyGroups,
  deleteStudyGroup
};
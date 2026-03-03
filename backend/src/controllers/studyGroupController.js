const { validationResult } = require('express-validator');
const StudyGroup = require('../models/StudyGroup');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');
const { isUserEnrolled } = require('../utils/enrollmentHelpers');

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
    const isEnrolled = await isUserEnrolled(req.user.id, courseId);

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

    const hasAccess = await isUserEnrolled(req.user.id, courseId) || 
      course.instructor.toString() === req.user.id || 
      req.user.isAdmin;

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
    const isEnrolled = await isUserEnrolled(req.user.id, studyGroup.course._id);

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

// @desc    Lấy tất cả study groups (có filter)
// @route   GET /api/study-groups
// @access  Private
const getStudyGroups = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      course,
      studyLevel, 
      language,
      search,
      sortBy = 'memberCount',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = { 
      status: 'active'
    };

    // Chỉ hiển thị public groups hoặc groups mà user đã join
    query.$or = [
      { isPrivate: false },
      { 'members.user': req.user.id }
    ];

    if (course) query.course = course;
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
      .populate('course', 'title thumbnail')
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

// @desc    Mời user vào study group
// @route   POST /api/study-groups/:id/invite
// @access  Private (Moderator/Admin)
const inviteToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, userIds } = req.body; // email or array of userIds

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền (chỉ moderator/admin/creator)
    if (!studyGroup.isModerator(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền mời thành viên'
      });
    }

    // Kiểm tra số lượng thành viên
    if (studyGroup.memberCount >= studyGroup.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Nhóm đã đạt số lượng thành viên tối đa'
      });
    }

    const invitedUsers = [];
    const errors = [];

    // Invite by email
    if (email) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy user với email ${email}`
        });
      }

      // Check if already member
      if (studyGroup.isMember(user._id)) {
        return res.status(400).json({
          success: false,
          message: 'User đã là thành viên của nhóm'
        });
      }

      // Add to members
      studyGroup.members.push({
        user: user._id,
        role: 'member',
        joinedAt: new Date(),
        isActive: true
      });

      invitedUsers.push({ id: user._id, name: user.name, email: user.email });

      // TODO: Send invitation email
      console.log(`📧 Email invitation sent to ${user.email}`);
    }

    // Invite by userIds
    if (userIds && Array.isArray(userIds)) {
      for (const userId of userIds) {
        const user = await User.findById(userId);
        
        if (!user) {
          errors.push(`User ${userId} not found`);
          continue;
        }

        if (studyGroup.isMember(user._id)) {
          errors.push(`${user.name} is already a member`);
          continue;
        }

        studyGroup.members.push({
          user: user._id,
          role: 'member',
          joinedAt: new Date(),
          isActive: true
        });

        invitedUsers.push({ id: user._id, name: user.name, email: user.email });

        // TODO: Send notification
        console.log(`🔔 Notification sent to ${user.name}`);
      }
    }

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: `Đã mời ${invitedUsers.length} thành viên vào nhóm`,
      data: {
        invitedUsers,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi mời thành viên',
      error: error.message
    });
  }
};

// @desc    Duyệt yêu cầu tham gia (alias của managePendingMember)
// @route   PUT /api/study-groups/:id/approve-request/:userId
// @access  Private (Moderator/Admin)
const approveJoinRequest = async (req, res) => {
  // This is essentially the same as managePendingMember with action='approve'
  req.body.action = 'approve';
  return managePendingMember(req, res);
};

// @desc    Tạo study session mới
// @route   POST /api/study-groups/:id/sessions
// @access  Private (Moderator/Admin/Member)
const scheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, duration, topic, meetingUrl, meetingPassword, meetingPlatform } = req.body;

    // Validate required fields
    if (!title || !date || !duration || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, date, duration, topic'
      });
    }

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền (member có thể đề xuất, moderator tự động approve)
    if (!studyGroup.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn phải là thành viên của nhóm để tạo session'
      });
    }

    // Validate date (must be in the future)
    const sessionDate = new Date(date);
    if (sessionDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian session phải là trong tương lai'
      });
    }

    // Validate duration
    if (duration < 15 || duration > 480) {
      return res.status(400).json({
        success: false,
        message: 'Thời lượng session phải từ 15 phút đến 8 giờ'
      });
    }

    // Create session
    const newSession = {
      title,
      description: description || '',
      date: sessionDate,
      duration,
      topic,
      meetingUrl: meetingUrl || '',
      meetingPassword: meetingPassword || '',
      meetingPlatform: meetingPlatform || 'zoom',
      attendees: [{
        user: req.user.id,
        status: 'going',
        joinedAt: null
      }],
      status: 'scheduled',
      recordingUrl: null,
      notes: null
    };

    studyGroup.schedule.push(newSession);
    studyGroup.stats.totalSessions += 1;
    studyGroup.lastActivity = new Date();

    await studyGroup.save();

    // Get the newly created session
    const createdSession = studyGroup.schedule[studyGroup.schedule.length - 1];

    res.status(201).json({
      success: true,
      message: 'Đã tạo study session thành công',
      data: {
        session: createdSession
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo study session',
      error: error.message
    });
  }
};

// @desc    Cập nhật study session
// @route   PUT /api/study-groups/:id/sessions/:sessionId
// @access  Private (Moderator/Admin or Session Creator)
const updateSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const updates = req.body;

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Find session
    const session = studyGroup.schedule.id(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy study session'
      });
    }

    // Kiểm tra quyền (chỉ moderator hoặc người tạo session)
    const isModerator = studyGroup.isModerator(req.user.id);
    const isCreator = session.attendees.some(a => 
      a.user.toString() === req.user.id.toString()
    );

    if (!isModerator && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật session này'
      });
    }

    // Không cho phép update session đã completed
    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật session đã hoàn thành'
      });
    }

    // Update fields
    if (updates.title) session.title = updates.title;
    if (updates.description !== undefined) session.description = updates.description;
    if (updates.date) {
      const newDate = new Date(updates.date);
      if (newDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian session phải là trong tương lai'
        });
      }
      session.date = newDate;
    }
    if (updates.duration) {
      if (updates.duration < 15 || updates.duration > 480) {
        return res.status(400).json({
          success: false,
          message: 'Thời lượng session phải từ 15 phút đến 8 giờ'
        });
      }
      session.duration = updates.duration;
    }
    if (updates.topic) session.topic = updates.topic;
    if (updates.meetingUrl !== undefined) session.meetingUrl = updates.meetingUrl;
    if (updates.meetingPassword !== undefined) session.meetingPassword = updates.meetingPassword;
    if (updates.meetingPlatform) session.meetingPlatform = updates.meetingPlatform;
    if (updates.status) session.status = updates.status;
    if (updates.recordingUrl !== undefined) session.recordingUrl = updates.recordingUrl;
    if (updates.notes !== undefined) session.notes = updates.notes;

    studyGroup.lastActivity = new Date();
    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật session thành công',
      data: {
        session
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật session',
      error: error.message
    });
  }
};

// @desc    Xóa study session
// @route   DELETE /api/study-groups/:id/sessions/:sessionId
// @access  Private (Moderator/Admin)
const deleteSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền (chỉ moderator/admin)
    if (!studyGroup.isModerator(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa session'
      });
    }

    // Find and remove session
    const session = studyGroup.schedule.id(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy study session'
      });
    }

    // Remove session
    session.remove();
    studyGroup.stats.totalSessions = Math.max(0, studyGroup.stats.totalSessions - 1);
    studyGroup.lastActivity = new Date();

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa session thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa session',
      error: error.message
    });
  }
};

// @desc    Thêm tài nguyên vào nhóm
// @route   POST /api/study-groups/:id/resources
// @access  Private (Member)
const addResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, type } = req.body;

    // Validate required fields
    if (!title || !url || !type) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, url, type'
      });
    }

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền (member có thể thêm)
    if (!studyGroup.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn phải là thành viên của nhóm để thêm tài nguyên'
      });
    }

    // Validate type
    const validTypes = ['document', 'video', 'link', 'image', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type phải là một trong: ${validTypes.join(', ')}`
      });
    }

    // Add resource
    const newResource = {
      title,
      url,
      type,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    studyGroup.resources.push(newResource);
    studyGroup.lastActivity = new Date();

    // Update member contributions
    const member = studyGroup.members.find(m => 
      m.user.toString() === req.user.id.toString()
    );
    if (member) {
      member.contributions = (member.contributions || 0) + 1;
    }

    await studyGroup.save();

    // Get the newly created resource
    const createdResource = studyGroup.resources[studyGroup.resources.length - 1];

    res.status(201).json({
      success: true,
      message: 'Đã thêm tài nguyên thành công',
      data: {
        resource: createdResource
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm tài nguyên',
      error: error.message
    });
  }
};

// @desc    Xóa tài nguyên khỏi nhóm
// @route   DELETE /api/study-groups/:id/resources/:resourceId
// @access  Private (Moderator/Admin or Resource Uploader)
const removeResource = async (req, res) => {
  try {
    const { id, resourceId } = req.params;

    const studyGroup = await StudyGroup.findById(id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Find resource
    const resource = studyGroup.resources.id(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài nguyên'
      });
    }

    // Kiểm tra quyền (moderator hoặc người upload)
    const isModerator = studyGroup.isModerator(req.user.id);
    const isUploader = resource.uploadedBy.toString() === req.user.id.toString();

    if (!isModerator && !isUploader) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa tài nguyên này'
      });
    }

    // Remove resource
    resource.remove();
    studyGroup.lastActivity = new Date();

    await studyGroup.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa tài nguyên thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tài nguyên',
      error: error.message
    });
  }
};

// @desc    Lấy analytics của study group
// @route   GET /api/study-groups/:id/analytics
// @access  Private (Member)
const getGroupAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '30' } = req.query; // days

    const studyGroup = await StudyGroup.findById(id)
      .populate('members.user', 'name email avatar')
      .populate('creator', 'name email');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm học tập'
      });
    }

    // Kiểm tra quyền (member có thể xem)
    if (!studyGroup.isMember(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem analytics của nhóm này'
      });
    }

    // Calculate time range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

    // Active members
    const activeMembers = studyGroup.members.filter(m => m.isActive);
    const totalMembers = activeMembers.length;

    // Sessions analytics
    const allSessions = studyGroup.schedule || [];
    const completedSessions = allSessions.filter(s => s.status === 'completed');
    const upcomingSessions = allSessions.filter(s => 
      s.status === 'scheduled' && s.date > new Date()
    ).sort((a, b) => a.date - b.date);

    // Recent sessions (in time range)
    const recentSessions = completedSessions.filter(s => 
      s.createdAt > dateFrom
    );

    // Average attendance
    const totalAttendees = completedSessions.reduce((sum, session) => {
      return sum + (session.attendees?.filter(a => a.status === 'going').length || 0);
    }, 0);
    const averageAttendance = completedSessions.length > 0 
      ? Math.round(totalAttendees / completedSessions.length)
      : 0;

    // Total study hours
    const totalStudyHours = completedSessions.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0) / 60;

    // Top contributors (by contributions count)
    const topContributors = activeMembers
      .sort((a, b) => (b.contributions || 0) - (a.contributions || 0))
      .slice(0, 5)
      .map(m => ({
        userId: m.user._id,
        userName: m.user.name,
        avatar: m.user.avatar,
        contributions: m.contributions || 0,
        role: m.role
      }));

    // Resources by type
    const resourcesByType = {};
    (studyGroup.resources || []).forEach(resource => {
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;
    });

    // Activity by date (last 7 days)
    const activityByDate = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityByDate[dateStr] = 0;
    }

    // Count sessions on each date
    recentSessions.forEach(session => {
      const dateStr = new Date(session.date).toISOString().split('T')[0];
      if (activityByDate[dateStr] !== undefined) {
        activityByDate[dateStr] += 1;
      }
    });

    const dailyActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, sessionsCount: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Member growth (approximation)
    const membersByDate = {};
    activeMembers.forEach(member => {
      const joinDate = new Date(member.joinedAt).toISOString().split('T')[0];
      membersByDate[joinDate] = (membersByDate[joinDate] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMembers,
          totalSessions: studyGroup.stats.totalSessions,
          completedSessions: completedSessions.length,
          upcomingSessionsCount: upcomingSessions.length,
          totalResources: (studyGroup.resources || []).length,
          totalStudyHours: Math.round(totalStudyHours * 10) / 10,
          averageAttendance
        },
        upcomingSessions: upcomingSessions.slice(0, 3),
        topContributors,
        resourcesByType,
        dailyActivity,
        memberGrowth: Object.entries(membersByDate).map(([date, count]) => ({
          date,
          newMembers: count
        })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        timeRange: parseInt(timeRange)
      }
    });

  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy analytics',
      error: error.message
    });
  }
};

// @desc    Lấy study group theo mã mời (inviteCode)
// @route   GET /api/study-groups/by-code/:code
// @access  Private
const getStudyGroupByCode = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Mã nhóm không hợp lệ'
      });
    }

    const studyGroup = await StudyGroup.findOne({
      inviteCode: code,
      status: 'active'
    })
      .populate('creator', 'name avatar')
      .populate('course', 'title thumbnail');

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm với mã này'
      });
    }

    res.status(200).json({
      success: true,
      data: { studyGroup }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm nhóm theo mã',
      error: error.message
    });
  }
};

module.exports = {
  createStudyGroup,
  getStudyGroups,
  getStudyGroupByCode,
  getStudyGroupsByCourse,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
  managePendingMember,
  getMyStudyGroups,
  inviteToGroup,
  approveJoinRequest,
  scheduleSession,
  updateSession,
  deleteSession,
  addResource,
  removeResource,
  getGroupAnalytics
};
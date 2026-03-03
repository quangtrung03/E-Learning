const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const CourseSection = require('../models/CourseSection');
const Lesson = require('../models/Lesson');

const assertCourseOwnerOrAdmin = async ({ courseId, user }) => {
  const course = await Course.findById(courseId).select('instructor');
  if (!course) {
    return { ok: false, status: 404, message: 'Không tìm thấy khóa học' };
  }

  const instructorId = course.instructor?._id ? course.instructor._id.toString() : course.instructor.toString();
  const currentUserId = user._id.toString();

  if (instructorId !== currentUserId && !user.isAdmin) {
    return { ok: false, status: 403, message: 'Bạn không có quyền quản lý section của khóa học này' };
  }

  return { ok: true, course };
};

// @desc    Lấy danh sách section theo khóa học (Instructor/Admin)
// @route   GET /api/sections/by-course/:courseId
// @access  Private
const getSectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const auth = await assertCourseOwnerOrAdmin({ courseId, user: req.user });
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, message: auth.message });
    }

    const sections = await CourseSection.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: { sections }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách section',
      error: error.message
    });
  }
};

// @desc    Tạo section mới (Instructor/Admin)
// @route   POST /api/sections/by-course/:courseId
// @access  Private
const createSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { courseId } = req.params;

    const auth = await assertCourseOwnerOrAdmin({ courseId, user: req.user });
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, message: auth.message });
    }

    const payload = {
      course: courseId,
      title: req.body.title,
      description: req.body.description || ''
    };

    if (req.body.order) {
      payload.order = req.body.order;
    } else {
      const lastSection = await CourseSection.findOne({ course: courseId }).sort({ order: -1 });
      payload.order = lastSection ? lastSection.order + 1 : 1;
    }

    const section = await CourseSection.create(payload);

    res.status(201).json({
      success: true,
      data: { section }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo section',
      error: error.message
    });
  }
};

// @desc    Cập nhật section (Instructor/Admin)
// @route   PUT /api/sections/:id
// @access  Private
const updateSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const section = await CourseSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy section' });
    }

    const auth = await assertCourseOwnerOrAdmin({ courseId: section.course, user: req.user });
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, message: auth.message });
    }

    const update = {};
    if (typeof req.body.title === 'string') update.title = req.body.title;
    if (typeof req.body.description === 'string') update.description = req.body.description;
    if (typeof req.body.order === 'number') update.order = req.body.order;

    const updated = await CourseSection.findByIdAndUpdate(section._id, update, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: { section: updated }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật section',
      error: error.message
    });
  }
};

// @desc    Xóa section (Instructor/Admin)
// @route   DELETE /api/sections/:id
// @access  Private
const deleteSection = async (req, res) => {
  try {
    const section = await CourseSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy section' });
    }

    const auth = await assertCourseOwnerOrAdmin({ courseId: section.course, user: req.user });
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, message: auth.message });
    }

    // Unset section on lessons in that section
    await Lesson.updateMany({ section: section._id }, { $set: { section: null } });

    await CourseSection.findByIdAndDelete(section._id);

    res.status(200).json({
      success: true,
      message: 'Đã xóa section thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa section',
      error: error.message
    });
  }
};

module.exports = {
  getSectionsByCourse,
  createSection,
  updateSection,
  deleteSection
};

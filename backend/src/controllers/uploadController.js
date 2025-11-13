const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const gridfsService = require('../services/gridfsService');

/**
 * @desc    Upload course thumbnail
 * @route   POST /api/courses/:id/upload-thumbnail
 * @access  Private (Instructor/Admin)
 */
const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    // Check permission
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền upload thumbnail'
      });
    }

    // Delete old thumbnail if exists
    if (course.thumbnailFileId) {
      try {
        await gridfsService.deleteFile(course.thumbnailFileId);
      } catch (error) {
        console.log('Old thumbnail not found or already deleted');
      }
    }

    // Upload new thumbnail
    const fileInfo = await gridfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { 
        courseId: course._id,
        userId: req.user._id,
        type: 'course-thumbnail' 
      }
    );

    // Update course
    course.thumbnail = fileInfo.filename;
    course.thumbnailFileId = fileInfo.fileId;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Upload thumbnail thành công',
      data: {
        thumbnailUrl: `/api/files/${fileInfo.filename}`,
        fileId: fileInfo.fileId
      }
    });

  } catch (error) {
    console.error('Upload thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload thumbnail',
      error: error.message
    });
  }
};

/**
 * @desc    Upload lesson video
 * @route   POST /api/lessons/:id/upload-video
 * @access  Private (Instructor/Admin)
 */
const uploadLessonVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file video'
      });
    }

    const lesson = await Lesson.findById(req.params.id).populate('course');
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Check permission
    const course = await Course.findById(lesson.course._id);
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền upload video'
      });
    }

    // Delete old video if exists
    if (lesson.video && lesson.video.fileId) {
      try {
        await gridfsService.deleteFile(lesson.video.fileId);
      } catch (error) {
        console.log('Old video not found or already deleted');
      }
    }

    // Upload new video
    const fileInfo = await gridfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { 
        lessonId: lesson._id,
        courseId: lesson.course._id,
        userId: req.user._id,
        type: 'lesson-video' 
      }
    );

    // Update lesson
    lesson.video = {
      filename: fileInfo.filename,
      fileId: fileInfo.fileId,
      originalName: fileInfo.originalName,
      mimetype: fileInfo.mimetype,
      size: fileInfo.size,
      uploadedAt: fileInfo.uploadedAt
    };
    lesson.contentType = 'video';
    
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Upload video thành công',
      data: {
        videoUrl: `/api/files/${fileInfo.filename}`,
        video: lesson.video
      }
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload video',
      error: error.message
    });
  }
};

/**
 * @desc    Upload lesson document/PDF
 * @route   POST /api/lessons/:id/upload-document
 * @access  Private (Instructor/Admin)
 */
const uploadLessonDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file tài liệu'
      });
    }

    const lesson = await Lesson.findById(req.params.id).populate('course');
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài học'
      });
    }

    // Check permission
    const course = await Course.findById(lesson.course._id);
    if (course.instructor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền upload tài liệu'
      });
    }

    // Upload document
    const fileInfo = await gridfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { 
        lessonId: lesson._id,
        courseId: lesson.course._id,
        userId: req.user._id,
        type: 'lesson-document' 
      }
    );

    // Add to resources
    if (!lesson.resources) {
      lesson.resources = [];
    }

    lesson.resources.push({
      name: fileInfo.originalName,
      url: fileInfo.filename,  // Store GridFS filename
      type: fileInfo.mimetype.includes('pdf') ? 'pdf' : 
            fileInfo.mimetype.includes('doc') ? 'doc' : 'other',
      fileId: fileInfo.fileId,
      uploadedAt: fileInfo.uploadedAt
    });

    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Upload tài liệu thành công',
      data: {
        documentUrl: `/api/files/${fileInfo.filename}`,
        resource: lesson.resources[lesson.resources.length - 1]
      }
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload tài liệu',
      error: error.message
    });
  }
};

module.exports = {
  uploadCourseThumbnail,
  uploadLessonVideo,
  uploadLessonDocument
};

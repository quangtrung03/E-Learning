const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { uploadImage, deleteImage, getPublicIdFromUrl, cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

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

    // Delete old thumbnail from Cloudinary if exists
    if (course.thumbnail && course.thumbnail.includes('cloudinary')) {
      try {
        const publicId = getPublicIdFromUrl(course.thumbnail);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (error) {
        console.log('Old thumbnail not found or already deleted:', error.message);
      }
    }

    // Upload new thumbnail to Cloudinary
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    const cloudinaryUrl = await uploadImage(tempPath, 'course-thumbnails');
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    // Update course
    course.thumbnail = cloudinaryUrl;
    course.thumbnailFileId = null; // Not using GridFS anymore
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Upload thumbnail thành công',
      data: {
        thumbnailUrl: cloudinaryUrl
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

    // Delete old video from Cloudinary if exists
    if (lesson.video && lesson.video.url && lesson.video.url.includes('cloudinary')) {
      try {
        const publicId = getPublicIdFromUrl(lesson.video.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
      } catch (error) {
        console.log('Old video not found or already deleted:', error.message);
      }
    }

    // Upload new video to Cloudinary
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: 'elearning/lesson-videos',
      resource_type: 'video',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    // Update lesson
    lesson.video = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      duration: result.duration || 0,
      uploadedAt: new Date()
    };
    lesson.contentType = 'video';
    
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Upload video thành công',
      data: {
        videoUrl: result.secure_url,
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

    // Upload document to Cloudinary
    const tempPath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: 'elearning/lesson-documents',
      resource_type: 'raw', // For PDFs and other documents
      format: path.extname(req.file.originalname).slice(1) // Remove dot from extension
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    // Add to resources
    if (!lesson.resources) {
      lesson.resources = [];
    }

    lesson.resources.push({
      name: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      type: req.file.mimetype.includes('pdf') ? 'pdf' : 
            req.file.mimetype.includes('doc') ? 'doc' : 'other',
      size: req.file.size,
      uploadedAt: new Date()
    });

    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Upload tài liệu thành công',
      data: {
        documentUrl: result.secure_url,
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

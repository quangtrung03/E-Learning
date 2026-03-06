const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { uploadImage, deleteImage, getPublicIdFromUrl, cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const ensureTempDir = () => {
  const tempDir = path.join(__dirname, '../../uploads/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

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
    const tempDir = ensureTempDir();
    const tempPath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
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

    // Validate file size (100MB max for Cloudinary free tier)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Tối đa 100MB cho Cloudinary free tier'
      });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file video MP4, WebM, OGG, MOV'
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
    if (lesson.video && lesson.video.publicId) {
      try {
        await cloudinary.uploader.destroy(lesson.video.publicId, { resource_type: 'video' });
        console.log('✅ Deleted old video:', lesson.video.publicId);
      } catch (error) {
        console.log('Old video not found or already deleted:', error.message);
      }
    }

    // Create temp directory if not exists
    const tempDir = ensureTempDir();

    // Upload new video to Cloudinary
    const tempPath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    console.log('📤 Uploading video to Cloudinary...');
    
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: 'elearning/lesson-videos',
      resource_type: 'video',
      // Optional: Generate different quality versions
      eager: [
        { width: 1280, height: 720, crop: 'limit', format: 'mp4' },  // HD
        { width: 854, height: 480, crop: 'limit', format: 'mp4' }    // SD
      ],
      eager_async: true,
      // Generate thumbnail
      eager_transformation: [
        { width: 640, height: 360, crop: 'fill', format: 'jpg' }
      ]
    });
    
    console.log('✅ Video uploaded to Cloudinary:', result.public_id);
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.log('Failed to delete temp file:', error.message);
    }

    // Update lesson with new schema
    lesson.video = {
      provider: 'cloudinary',
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      duration: result.duration || 0,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      status: 'ready',
      uploadedAt: new Date()
    };

    // Set thumbnail from eager transformation if available
    if (result.eager && result.eager[0]) {
      lesson.video.thumbnailUrl = result.eager[0].secure_url;
    }

    // Add transformations if eager transformations are ready
    if (result.eager && result.eager.length > 0) {
      lesson.video.transformations = result.eager.map(t => ({
        quality: t.width >= 1280 ? 'hd' : 'sd',
        url: t.secure_url,
        width: t.width,
        height: t.height
      }));
    }

    lesson.contentType = 'video';
    
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Upload video thành công',
      data: {
        videoUrl: result.secure_url,
        thumbnailUrl: lesson.video.thumbnailUrl,
        duration: result.duration,
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
    const tempDir = ensureTempDir();
    const tempPath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: 'elearning/lesson-resources/documents',
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

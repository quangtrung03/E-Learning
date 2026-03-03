const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadImage: uploadImageMiddleware,
  uploadVideo: uploadVideoMiddleware,
  uploadDocument: uploadDocumentMiddleware,
  uploadAudio: uploadAudioMiddleware
} = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const fs = require('fs');
const path = require('path');
const { uploadImage, cloudinary } = require('../config/cloudinary');

/**
 * @desc    Upload image (thumbnails, avatars)
 * @route   POST /api/upload/image
 * @access  Private
 */
router.post('/image', protect, uploadLimiter, uploadImageMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    // Create temp file path
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    
    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Upload to Cloudinary
      const result = await uploadImage(tempFilePath, 'uploads');

      // Delete temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      res.status(200).json({
        success: true,
        message: 'Upload ảnh thành công',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes
        }
      });

    } catch (uploadError) {
      // Delete temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message
    });
  }
});

/**
 * @desc    Upload document (pdf/docx/pptx/xlsx/zip/...)
 * @route   POST /api/upload/document
 * @access  Private
 */
router.post('/document', protect, uploadLimiter, uploadDocumentMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file tài liệu'
      });
    }

    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'raw',
        folder: 'documents'
      });

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      res.status(200).json({
        success: true,
        message: 'Upload tài liệu thành công',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes
        }
      });
    } catch (uploadError) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload tài liệu',
      error: error.message
    });
  }
});

/**
 * @desc    Upload audio (mp3/m4a/wav/...)
 * @route   POST /api/upload/audio
 * @access  Private
 */
router.post('/audio', protect, uploadLimiter, uploadAudioMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file âm thanh'
      });
    }

    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Cloudinary treats audio as resource_type 'video'
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'video',
        folder: 'audio',
        chunk_size: 6000000
      });

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      res.status(200).json({
        success: true,
        message: 'Upload âm thanh thành công',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          duration: result.duration,
          size: result.bytes
        }
      });
    } catch (uploadError) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('Upload audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload âm thanh',
      error: error.message
    });
  }
});

/**
 * @desc    Upload video
 * @route   POST /api/upload/video
 * @access  Private
 */
router.post('/video', protect, uploadLimiter, uploadVideoMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file video'
      });
    }

    // Validate file size (100MB max)
    if (req.file.size > 100 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Kích thước video không được vượt quá 100MB'
      });
    }

    // Create temp file path
    const tempDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
    
    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Upload to Cloudinary videos folder
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'video',
        folder: 'videos',
        chunk_size: 6000000, // 6MB chunks for large files
      });

      // Delete temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      res.status(200).json({
        success: true,
        message: 'Upload video thành công',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          duration: result.duration,
          width: result.width,
          height: result.height,
          size: result.bytes
        }
      });

    } catch (uploadError) {
      // Delete temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload video',
      error: error.message
    });
  }
});

module.exports = router;

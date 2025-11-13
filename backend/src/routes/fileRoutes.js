const express = require('express');
const router = express.Router();
const gridfsService = require('../services/gridfsService');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/files/:filename
 * @desc    Get file by filename (serve image/video)
 * @access  Public
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Get file info first to set proper content-type
    const fileInfo = await gridfsService.getFileInfo(filename);
    
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File không tồn tại'
      });
    }
    
    // Set proper content type
    res.set('Content-Type', fileInfo.metadata.mimetype);
    res.set('Content-Length', fileInfo.length);
    
    // For videos, enable range requests (streaming)
    if (fileInfo.metadata.mimetype.startsWith('video/')) {
      res.set('Accept-Ranges', 'bytes');
    }
    
    // Stream file to response
    const downloadStream = gridfsService.getFileStream(filename);
    
    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: 'Lỗi khi tải file'
        });
      }
    });
    
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('File serve error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy file',
        error: error.message
      });
    }
  }
});

/**
 * @route   GET /api/files/info/:filename
 * @desc    Get file metadata
 * @access  Private
 */
router.get('/info/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const fileInfo = await gridfsService.getFileInfo(filename);
    
    res.status(200).json({
      success: true,
      data: {
        fileId: fileInfo._id,
        filename: fileInfo.filename,
        length: fileInfo.length,
        uploadDate: fileInfo.uploadDate,
        metadata: fileInfo.metadata
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin file',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/files/:fileId
 * @desc    Delete file by ID
 * @access  Private (Admin or Owner)
 */
router.delete('/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // TODO: Add permission check - only admin or file owner can delete
    
    await gridfsService.deleteFile(fileId);
    
    res.status(200).json({
      success: true,
      message: 'Xóa file thành công'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa file',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/files/list/all
 * @desc    List all files (for admin)
 * @access  Private (Admin)
 */
router.get('/list/all', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // TODO: Add admin check
    
    const files = await gridfsService.listFiles(parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: files.length,
      data: { files }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách file',
      error: error.message
    });
  }
});

module.exports = router;

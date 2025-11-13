const { getGridFSBucket } = require('../config/gridfs');
const { Readable } = require('stream');
const mongoose = require('mongoose');

class GridFSService {
  /**
   * Upload file to GridFS from buffer
   * @param {Buffer} buffer - File buffer from multer
   * @param {String} filename - Original filename
   * @param {String} mimetype - File mimetype
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - File info with _id and filename
   */
  async uploadFile(buffer, filename, mimetype, metadata = {}) {
    try {
      const bucket = getGridFSBucket();
      
      // Create readable stream from buffer
      const readableStream = Readable.from(buffer);
      
      // Generate unique filename
      const uniqueFilename = `${Date.now()}_${filename}`;
      
      // Create upload stream
      const uploadStream = bucket.openUploadStream(uniqueFilename, {
        metadata: {
          ...metadata,
          originalName: filename,
          mimetype: mimetype,
          uploadedAt: new Date()
        }
      });
      
      // Upload file
      await new Promise((resolve, reject) => {
        readableStream.pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      
      return {
        fileId: uploadStream.id.toString(),
        filename: uniqueFilename,
        originalName: filename,
        mimetype: mimetype,
        size: buffer.length,
        uploadedAt: new Date()
      };
      
    } catch (error) {
      console.error('GridFS upload error:', error);
      throw new Error('Lỗi khi upload file: ' + error.message);
    }
  }
  
  /**
   * Upload multiple files
   * @param {Array} files - Array of files from multer
   * @param {Object} metadata - Common metadata for all files
   * @returns {Promise<Array>} - Array of file info
   */
  async uploadMultipleFiles(files, metadata = {}) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.originalname, file.mimetype, metadata)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('GridFS multiple upload error:', error);
      throw new Error('Lỗi khi upload nhiều file: ' + error.message);
    }
  }
  
  /**
   * Download file from GridFS
   * @param {String} filename - Filename to download
   * @returns {Stream} - Readable stream
   */
  getFileStream(filename) {
    try {
      const bucket = getGridFSBucket();
      return bucket.openDownloadStreamByName(filename);
    } catch (error) {
      console.error('GridFS download error:', error);
      throw new Error('Lỗi khi download file: ' + error.message);
    }
  }
  
  /**
   * Get file stream by ID
   * @param {String} fileId - File ObjectId
   * @returns {Stream} - Readable stream
   */
  getFileStreamById(fileId) {
    try {
      const bucket = getGridFSBucket();
      return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    } catch (error) {
      console.error('GridFS download by ID error:', error);
      throw new Error('Lỗi khi download file: ' + error.message);
    }
  }
  
  /**
   * Get file metadata
   * @param {String} filename - Filename
   * @returns {Promise<Object>} - File metadata
   */
  async getFileInfo(filename) {
    try {
      const bucket = getGridFSBucket();
      const files = await bucket.find({ filename: filename }).toArray();
      
      if (files.length === 0) {
        throw new Error('File không tồn tại');
      }
      
      return files[0];
    } catch (error) {
      console.error('GridFS file info error:', error);
      throw new Error('Lỗi khi lấy thông tin file: ' + error.message);
    }
  }
  
  /**
   * Delete file from GridFS
   * @param {String} fileId - File ObjectId
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    try {
      const bucket = getGridFSBucket();
      await bucket.delete(new mongoose.Types.ObjectId(fileId));
      console.log(`✅ Deleted file: ${fileId}`);
    } catch (error) {
      console.error('GridFS delete error:', error);
      throw new Error('Lỗi khi xóa file: ' + error.message);
    }
  }
  
  /**
   * Delete file by filename
   * @param {String} filename - Filename to delete
   * @returns {Promise<void>}
   */
  async deleteFileByName(filename) {
    try {
      const fileInfo = await this.getFileInfo(filename);
      await this.deleteFile(fileInfo._id.toString());
    } catch (error) {
      console.error('GridFS delete by name error:', error);
      throw new Error('Lỗi khi xóa file: ' + error.message);
    }
  }
  
  /**
   * List all files with pagination
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise<Array>} - Array of files
   */
  async listFiles(page = 1, limit = 20) {
    try {
      const bucket = getGridFSBucket();
      const skip = (page - 1) * limit;
      
      const files = await bucket.find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return files;
    } catch (error) {
      console.error('GridFS list files error:', error);
      throw new Error('Lỗi khi lấy danh sách file: ' + error.message);
    }
  }
}

module.exports = new GridFSService();

const multer = require('multer');
const path = require('path');

// Configure multer to store files in memory for GridFS upload
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file video!'), false);
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (allowedTypes.test(ext) || 
      mimetype.includes('pdf') || 
      mimetype.includes('document') || 
      mimetype.includes('spreadsheet') ||
      mimetype.includes('presentation') ||
      mimetype.includes('zip')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file tài liệu!'), false);
  }
};

// File filter for any type (with size limits)
const anyFileFilter = (req, file, cb) => {
  cb(null, true);
};

// Configure multer for different file types with Cloudinary free tier limits
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for images (Cloudinary free tier)
  }
});

const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos (Cloudinary free tier)
  }
});

const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  }
});

const uploadAny = multer({
  storage: storage,
  fileFilter: anyFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for any files
  }
});

module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadAny
};

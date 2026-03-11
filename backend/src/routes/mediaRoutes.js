const express = require('express');
const {
  listFolders,
  listResources,
  createFolder,
  deleteFolder,
  deleteResource,
  getUploadSignature
} = require('../controllers/mediaController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All media routes require admin
router.use(protect, requireAdmin);

// GET /api/admin/media/folders?prefix=elearning
router.get('/folders', listFolders);

// GET /api/admin/media/resources?folder=elearning/testimonials
router.get('/resources', listResources);

// POST /api/admin/media/folders  { path }
router.post('/folders', createFolder);

// DELETE /api/admin/media/folders  { path }
router.delete('/folders', deleteFolder);

// DELETE /api/admin/media/resource  { publicId }
router.delete('/resource', deleteResource);

// POST /api/admin/media/upload-signature  { folder, publicId? }
router.post('/upload-signature', getUploadSignature);

module.exports = router;

const express = require('express');
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');

const router = express.Router();

// Public: anyone can fetch active announcements to display
router.get('/active', getActiveAnnouncements);

// Admin routes
router.use(protect);
router.use(requireAdmin);

router.get('/', getAllAnnouncements);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.put('/:id/toggle', toggleAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;

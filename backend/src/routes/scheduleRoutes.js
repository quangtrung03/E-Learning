const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSchedule,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/scheduleController');

router.use(protect);

router.get('/', getSchedule);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;

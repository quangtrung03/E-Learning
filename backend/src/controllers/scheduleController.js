const StudySchedule = require('../models/StudySchedule');

// GET /api/schedule?month=YYYY-MM  OR  ?date=YYYY-MM-DD
exports.getSchedule = async (req, res) => {
  try {
    const { month, date } = req.query;
    const query = { user: req.user.id };

    if (date) {
      query.date = date;
    } else if (month) {
      // prefix match: all events in that month
      query.date = { $regex: `^${month}` };
    }

    const events = await StudySchedule.find(query)
      .populate('course', 'title thumbnail')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/schedule
exports.createEvent = async (req, res) => {
  try {
    const { title, courseId, date, startTime, endTime, color, note } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Tên buổi học và ngày là bắt buộc' });
    }

    const event = await StudySchedule.create({
      user: req.user.id,
      title,
      course: courseId || null,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      color: color || '#3b82f6',
      note: note || '',
    });

    await event.populate('course', 'title thumbnail');

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/schedule/:id
exports.updateEvent = async (req, res) => {
  try {
    const { title, courseId, date, startTime, endTime, color, note, completed } = req.body;

    const update = {};
    if (title !== undefined) update.title = title;
    if (courseId !== undefined) update.course = courseId || null;
    if (date !== undefined) update.date = date;
    if (startTime !== undefined) update.startTime = startTime;
    if (endTime !== undefined) update.endTime = endTime;
    if (color !== undefined) update.color = color;
    if (note !== undefined) update.note = note;
    if (completed !== undefined) update.completed = completed;

    const event = await StudySchedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      update,
      { new: true, runValidators: true }
    ).populate('course', 'title thumbnail');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/schedule/:id
exports.deleteEvent = async (req, res) => {
  try {
    const event = await StudySchedule.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy buổi học' });
    }

    res.json({ success: true, message: 'Đã xóa buổi học' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

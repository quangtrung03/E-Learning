const Announcement = require('../models/Announcement');

// @desc    Lấy thông báo đang hoạt động (dành cho người dùng)
// @route   GET /api/announcements/active
// @access  Public
const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
      .select('title message type linkUrl linkText dismissible priority targetAudience')
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    res.json({ success: true, data: { announcements } });
  } catch (error) {
    console.error('getActiveAnnouncements error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Lấy tất cả thông báo (admin)
// @route   GET /api/announcements
// @access  Admin
const getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const now = new Date();
    let filter = {};
    if (status === 'active') {
      filter = { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } };
    } else if (status === 'scheduled') {
      filter = { isActive: true, startDate: { $gt: now } };
    } else if (status === 'expired') {
      filter = { endDate: { $lt: now } };
    } else if (status === 'inactive') {
      filter = { isActive: false };
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Announcement.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: { announcements },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getAllAnnouncements error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Tạo thông báo mới
// @route   POST /api/announcements
// @access  Admin
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, linkUrl, linkText, startDate, endDate, dismissible, priority, targetAudience } = req.body;

    if (!title || !message || !endDate) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    if (new Date(endDate) <= new Date(startDate || Date.now())) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      linkUrl: linkUrl || null,
      linkText: linkText || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      dismissible: dismissible !== false,
      priority: priority || 0,
      targetAudience: targetAudience || 'all',
      isActive: true,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Tạo thông báo thành công', data: { announcement } });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo thông báo' });
  }
};

// @desc    Cập nhật thông báo
// @route   PUT /api/announcements/:id
// @access  Admin
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    const { title, message, type, linkUrl, linkText, startDate, endDate, dismissible, priority, targetAudience, isActive } = req.body;

    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    Object.assign(announcement, {
      ...(title !== undefined && { title }),
      ...(message !== undefined && { message }),
      ...(type !== undefined && { type }),
      ...(linkUrl !== undefined && { linkUrl }),
      ...(linkText !== undefined && { linkText }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(dismissible !== undefined && { dismissible }),
      ...(priority !== undefined && { priority }),
      ...(targetAudience !== undefined && { targetAudience }),
      ...(isActive !== undefined && { isActive })
    });

    await announcement.save();

    res.json({ success: true, message: 'Cập nhật thông báo thành công', data: { announcement } });
  } catch (error) {
    console.error('updateAnnouncement error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thông báo' });
  }
};

// @desc    Bật/tắt thông báo
// @route   PUT /api/announcements/:id/toggle
// @access  Admin
const toggleAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({
      success: true,
      message: `Thông báo đã ${announcement.isActive ? 'kích hoạt' : 'tắt'}`,
      data: { isActive: announcement.isActive }
    });
  } catch (error) {
    console.error('toggleAnnouncement error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Xóa thông báo
// @route   DELETE /api/announcements/:id
// @access  Admin
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa thông báo' });
  }
};

module.exports = {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement
};

const AppSetting = require('../models/AppSetting');

const COURSE_THUMBNAILS_KEY = 'courseThumbnails';

const normalizeUrl = (url) => String(url || '').trim();

const getCourseThumbnailValue = (setting) => {
  const value = setting?.value;
  if (value && typeof value === 'object') {
    const items = Array.isArray(value.items) ? value.items : [];
    const activeUrl = typeof value.activeUrl === 'string' ? value.activeUrl : null;
    return { activeUrl, items };
  }
  return { activeUrl: null, items: [] };
};

// Public: get active default course thumbnail
const getDefaultCourseThumbnail = async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: COURSE_THUMBNAILS_KEY }).lean();
    const value = getCourseThumbnailValue(setting);

    return res.status(200).json({
      success: true,
      data: {
        url: value.activeUrl || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thumbnail mặc định',
      error: error.message,
    });
  }
};

// Admin: get settings
const adminGetCourseThumbnails = async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: COURSE_THUMBNAILS_KEY }).lean();
    const value = getCourseThumbnailValue(setting);

    return res.status(200).json({
      success: true,
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thumbnail',
      error: error.message,
    });
  }
};

// Admin: add thumbnail (and optionally set active)
const adminAddCourseThumbnail = async (req, res) => {
  try {
    const url = normalizeUrl(req.body?.url);
    const setActive = req.body?.setActive !== false;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu url thumbnail',
      });
    }

    const existing = await AppSetting.findOne({ key: COURSE_THUMBNAILS_KEY });
    const value = getCourseThumbnailValue(existing);

    const hasUrl = value.items.some((item) => item?.url === url);
    const nextItems = hasUrl
      ? value.items
      : [...value.items, { url, addedAt: new Date().toISOString() }];

    const nextValue = {
      activeUrl: setActive ? url : value.activeUrl,
      items: nextItems,
    };

    const saved = await AppSetting.findOneAndUpdate(
      { key: COURSE_THUMBNAILS_KEY },
      { $set: { value: nextValue, updatedBy: req.user?._id || null } },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Đã thêm thumbnail',
      data: getCourseThumbnailValue(saved),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm thumbnail',
      error: error.message,
    });
  }
};

// Admin: set active thumbnail
const adminSetActiveCourseThumbnail = async (req, res) => {
  try {
    const url = normalizeUrl(req.body?.url);

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu url thumbnail',
      });
    }

    const existing = await AppSetting.findOne({ key: COURSE_THUMBNAILS_KEY });
    const value = getCourseThumbnailValue(existing);

    const hasUrl = value.items.some((item) => item?.url === url);
    const nextItems = hasUrl
      ? value.items
      : [...value.items, { url, addedAt: new Date().toISOString() }];

    const nextValue = {
      activeUrl: url,
      items: nextItems,
    };

    const saved = await AppSetting.findOneAndUpdate(
      { key: COURSE_THUMBNAILS_KEY },
      { $set: { value: nextValue, updatedBy: req.user?._id || null } },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật thumbnail mặc định',
      data: getCourseThumbnailValue(saved),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thumbnail mặc định',
      error: error.message,
    });
  }
};

// Admin: remove thumbnail
const adminRemoveCourseThumbnail = async (req, res) => {
  try {
    const url = normalizeUrl(req.body?.url);

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu url thumbnail',
      });
    }

    const existing = await AppSetting.findOne({ key: COURSE_THUMBNAILS_KEY });
    const value = getCourseThumbnailValue(existing);

    const nextItems = value.items.filter((item) => item?.url !== url);
    const nextActiveUrl = value.activeUrl === url ? nextItems[0]?.url || null : value.activeUrl;

    const nextValue = {
      activeUrl: nextActiveUrl,
      items: nextItems,
    };

    const saved = await AppSetting.findOneAndUpdate(
      { key: COURSE_THUMBNAILS_KEY },
      { $set: { value: nextValue, updatedBy: req.user?._id || null } },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa thumbnail',
      data: getCourseThumbnailValue(saved),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thumbnail',
      error: error.message,
    });
  }
};

module.exports = {
  getDefaultCourseThumbnail,
  adminGetCourseThumbnails,
  adminAddCourseThumbnail,
  adminSetActiveCourseThumbnail,
  adminRemoveCourseThumbnail,
};

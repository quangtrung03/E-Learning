const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Lấy danh sách wishlist của người dùng
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'title thumbnail price finalPrice category level rating instructor status',
        populate: { path: 'instructor', select: 'name avatar' }
      });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Only return approved courses
    const wishlist = (user.wishlist || []).filter(c => c && c.status === 'approved');

    res.json({
      success: true,
      data: { wishlist },
      count: wishlist.length
    });
  } catch (error) {
    console.error('getWishlist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy wishlist' });
  }
};

// @desc    Thêm khóa học vào wishlist
// @route   POST /api/wishlist/:courseId
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course || course.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại hoặc chưa được duyệt' });
    }

    const user = await User.findById(req.user._id);
    const alreadyInWishlist = user.wishlist.some(id => id.toString() === courseId);

    if (alreadyInWishlist) {
      return res.status(400).json({ success: false, message: 'Khóa học đã có trong wishlist' });
    }

    user.wishlist.push(courseId);
    await user.save();

    res.json({ success: true, message: 'Đã thêm vào wishlist', inWishlist: true });
  } catch (error) {
    console.error('addToWishlist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi thêm vào wishlist' });
  }
};

// @desc    Xóa khóa học khỏi wishlist
// @route   DELETE /api/wishlist/:courseId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { courseId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { wishlist: courseId }
    });

    res.json({ success: true, message: 'Đã xóa khỏi wishlist', inWishlist: false });
  } catch (error) {
    console.error('removeFromWishlist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa khỏi wishlist' });
  }
};

// @desc    Kiểm tra khóa học có trong wishlist không
// @route   GET /api/wishlist/:courseId/check
// @access  Private
const checkWishlist = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id).select('wishlist');
    const inWishlist = user.wishlist.some(id => id.toString() === courseId);
    res.json({ success: true, inWishlist });
  } catch (error) {
    console.error('checkWishlist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };

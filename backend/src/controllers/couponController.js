const { validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Tạo coupon mới
// @route   POST /api/coupons
// @access  Private (Admin)
const createCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit,
      validity,
      applicableFor,
      restrictions,
      promocampaign,
      autoActivate
    } = req.body;

    // Generate unique coupon code nếu không có
    let couponCode = req.body.code;
    if (!couponCode) {
      couponCode = `${name.replace(/\s+/g, '').toUpperCase().substring(0, 4)}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    // Kiểm tra code đã tồn tại chưa
    const existingCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Mã coupon đã tồn tại'
      });
    }

    const coupon = new Coupon({
      code: couponCode.toUpperCase(),
      name,
      description,
      type,
      value,
      maxDiscountAmount,
      minOrderAmount,
      usageLimit: {
        total: usageLimit?.total || null,
        perUser: usageLimit?.perUser || 1
      },
      validity: {
        startDate: new Date(validity.startDate),
        endDate: new Date(validity.endDate)
      },
      applicableFor: {
        courseIds: applicableFor?.courseIds || [],
        categories: applicableFor?.categories || [],
        instructorIds: applicableFor?.instructorIds || [],
        userGroups: applicableFor?.userGroups || ['all'],
        minCoursePrice: applicableFor?.minCoursePrice || 0,
        maxCoursePrice: applicableFor?.maxCoursePrice || null
      },
      restrictions: {
        firstTimeUsersOnly: restrictions?.firstTimeUsersOnly || false,
        onePerUser: restrictions?.onePerUser !== false,
        excludedUsers: restrictions?.excludedUsers || [],
        excludedCourses: restrictions?.excludedCourses || [],
        requiresMinimumCourses: restrictions?.requiresMinimumCourses || 0
      },
      createdBy: req.user.id,
      autoActivate: autoActivate || false,
      promocampaign: promocampaign || {},
      stackable: req.body.stackable || false
    });

    await coupon.save();

    // Populate dữ liệu để response
    await coupon.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'applicableFor.courseIds', select: 'title price' },
      { path: 'applicableFor.instructorIds', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo coupon thành công',
      data: {
        coupon
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo coupon',
      error: error.message
    });
  }
};

// @desc    Lấy danh sách tất cả coupons
// @route   GET /api/coupons
// @access  Private (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .populate('applicableFor.courseIds', 'title price')
      .populate('applicableFor.instructorIds', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    // Thống kê coupons
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expiredCoupons: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          totalUsage: { $sum: '$currentUsage.total' },
          totalDiscountGiven: { $sum: '$analytics.totalDiscountGiven' },
          totalRevenueGenerated: { $sum: '$analytics.revenueGenerated' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: coupons.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        expiredCoupons: 0,
        totalUsage: 0,
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0
      },
      data: {
        coupons
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách coupons',
      error: error.message
    });
  }
};

// @desc    Lấy chi tiết coupon
// @route   GET /api/coupons/:id
// @access  Private (Admin)
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applicableFor.courseIds', 'title price instructor')
      .populate('applicableFor.instructorIds', 'name email')
      .populate('restrictions.excludedUsers', 'name email')
      .populate('restrictions.excludedCourses', 'title')
      .populate('currentUsage.byUser.user', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coupon
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin coupon',
      error: error.message
    });
  }
};

// @desc    Cập nhật coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin)
const updateCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon'
      });
    }

    // Một số field không cho phép update nếu coupon đã được sử dụng
    if (coupon.currentUsage.total > 0) {
      const restrictedFields = ['code', 'type', 'value'];
      const hasRestrictedUpdates = restrictedFields.some(field => req.body[field] !== undefined);
      
      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Không thể cập nhật các trường quan trọng khi coupon đã được sử dụng'
        });
      }
    }

    // Cập nhật coupon
    const allowedUpdates = [
      'name', 'description', 'maxDiscountAmount', 'minOrderAmount',
      'usageLimit', 'validity', 'applicableFor', 'restrictions',
      'status', 'promocampaign'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        if (update === 'validity') {
          coupon.validity = {
            startDate: new Date(req.body.validity.startDate),
            endDate: new Date(req.body.validity.endDate)
          };
        } else {
          coupon[update] = req.body[update];
        }
      }
    });

    await coupon.save();

    await coupon.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'applicableFor.courseIds', select: 'title price' },
      { path: 'applicableFor.instructorIds', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật coupon thành công',
      data: {
        coupon
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật coupon',
      error: error.message
    });
  }
};

// @desc    Xóa coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon'
      });
    }

    // Không cho phép xóa coupon đã được sử dụng
    if (coupon.currentUsage.total > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa coupon đã được sử dụng. Hãy deactivate thay vì xóa.'
      });
    }

    await Coupon.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa coupon thành công'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa coupon',
      error: error.message
    });
  }
};

// @desc    Validate coupon cho user
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const { code, courseId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã coupon'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!coupon || !coupon.isValid) {
      return res.status(404).json({
        success: false,
        message: 'Mã coupon không tồn tại hoặc đã hết hạn'
      });
    }

    // Kiểm tra user có thể sử dụng không
    const canUse = coupon.canUserUse(req.user.id, courseId);
    if (!canUse.canUse) {
      return res.status(400).json({
        success: false,
        message: canUse.reason
      });
    }

    // Lấy thông tin course để tính discount
    let course = null;
    let discountAmount = 0;
    let finalPrice = 0;

    if (courseId) {
      course = await Course.findById(courseId).select('title price');
      if (course) {
        discountAmount = coupon.calculateDiscount(course.price);
        finalPrice = course.price - discountAmount;
      }
    }

    // Update analytics
    coupon.analytics.views += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Mã coupon hợp lệ',
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderAmount: coupon.minOrderAmount
        },
        discount: {
          amount: discountAmount,
          percentage: course ? Math.round((discountAmount / course.price) * 100) : 0
        },
        course: course ? {
          id: course._id,
          title: course.title,
          originalPrice: course.price,
          finalPrice: finalPrice
        } : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi validate coupon',
      error: error.message
    });
  }
};

// @desc    Lấy coupon theo mã code (public)
// @route   GET /api/coupons/by-code/:code
// @access  Public
const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      status: 'active'
    }).select('code name description type value maxDiscountAmount minOrderAmount validity applicableFor');

    if (!coupon || !coupon.isValid) {
      return res.status(404).json({
        success: false,
        message: 'Mã coupon không tồn tại hoặc đã hết hạn'
      });
    }

    // Update views
    coupon.analytics.views += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderAmount: coupon.minOrderAmount,
          validUntil: coupon.validity.endDate,
          applicableCategories: coupon.applicableFor.categories
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin coupon',
      error: error.message
    });
  }
};

// @desc    Lấy coupons public (đang active và chưa hết hạn)
// @route   GET /api/coupons/public
// @access  Public
const getPublicCoupons = async (req, res) => {
  try {
    const { category, courseId } = req.query;

    let query = {
      status: 'active',
      'validity.startDate': { $lte: new Date() },
      'validity.endDate': { $gte: new Date() }
    };

    // Filter theo category
    if (category) {
      query['applicableFor.categories'] = category;
    }

    // Filter theo course
    if (courseId) {
      query.$or = [
        { 'applicableFor.courseIds': courseId },
        { 'applicableFor.courseIds': { $size: 0 } } // Apply to all courses
      ];
    }

    const coupons = await Coupon.find(query)
      .select('code name description type value maxDiscountAmount minOrderAmount validity applicableFor')
      .sort({ value: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: {
        coupons: coupons.map(coupon => ({
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderAmount: coupon.minOrderAmount,
          validUntil: coupon.validity.endDate,
          applicableCategories: coupon.applicableFor.categories
        }))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách coupons công khai',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê coupon usage
// @route   GET /api/coupons/:id/analytics
// @access  Private (Admin)
const getCouponAnalytics = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('currentUsage.byUser.user', 'name email')
      .select('code name analytics currentUsage validity');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon'
      });
    }

    // Thống kê usage theo ngày
    const dailyUsage = await Coupon.aggregate([
      { $match: { _id: coupon._id } },
      { $unwind: '$currentUsage.byUser' },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$currentUsage.byUser.lastUsed'
            }
          },
          count: { $sum: '$currentUsage.byUser.count' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          name: coupon.name,
          analytics: coupon.analytics,
          currentUsage: coupon.currentUsage,
          validity: coupon.validity
        },
        dailyUsage
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê coupon',
      error: error.message
    });
  }
};

// @desc    Toggle coupon status
// @route   PUT /api/coupons/:id/toggle-status
// @access  Private (Admin)
const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coupon'
      });
    }

    // Toggle between active and inactive
    coupon.status = coupon.status === 'active' ? 'inactive' : 'active';
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Đã ${coupon.status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} coupon`,
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          status: coupon.status
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái coupon',
      error: error.message
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponByCode,
  getPublicCoupons,
  getCouponAnalytics,
  toggleCouponStatus
};
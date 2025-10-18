const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxLength: [20, 'Mã coupon không được quá 20 ký tự']
  },
  name: {
    type: String,
    required: true,
    maxLength: [100, 'Tên coupon không được quá 100 ký tự']
  },
  description: {
    type: String,
    maxLength: [500, 'Mô tả coupon không được quá 500 ký tự']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed-amount'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null // For percentage coupons
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR']
  },
  usageLimit: {
    total: {
      type: Number,
      default: null // null = unlimited
    },
    perUser: {
      type: Number,
      default: 1
    }
  },
  currentUsage: {
    total: {
      type: Number,
      default: 0
    },
    byUser: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      count: {
        type: Number,
        default: 0
      },
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }]
  },
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  applicableFor: {
    courseIds: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Course'
    }],
    categories: [{
      type: String
    }],
    instructorIds: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    userGroups: [{
      type: String,
      enum: ['new-users', 'returning-users', 'premium-users', 'all']
    }],
    minCoursePrice: {
      type: Number,
      default: 0
    },
    maxCoursePrice: {
      type: Number,
      default: null
    }
  },
  restrictions: {
    firstTimeUsersOnly: {
      type: Boolean,
      default: false
    },
    onePerUser: {
      type: Boolean,
      default: true
    },
    excludedUsers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    excludedCourses: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Course'
    }],
    requiresMinimumCourses: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'exhausted'],
    default: 'active'
  },
  autoActivate: {
    type: Boolean,
    default: false
  },
  promocampaign: {
    name: {
      type: String,
      default: null
    },
    source: {
      type: String,
      default: null
    },
    medium: {
      type: String,
      default: null
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    successfulUses: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    revenueGenerated: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  stackable: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  }
}, {
  timestamps: true
});

// Virtual to check if coupon is currently valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') return false;
  
  // Check date validity
  if (now < this.validity.startDate || now > this.validity.endDate) return false;
  
  // Check usage limit
  if (this.usageLimit.total && this.currentUsage.total >= this.usageLimit.total) return false;
  
  return true;
});

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validity.endDate;
});

// Virtual to check if coupon is exhausted
couponSchema.virtual('isExhausted').get(function() {
  return this.usageLimit.total && this.currentUsage.total >= this.usageLimit.total;
});

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function(userId, courseId = null) {
  // Check basic validity
  if (!this.isValid) return { canUse: false, reason: 'Coupon không hợp lệ' };
  
  // Check if user is excluded
  if (this.restrictions.excludedUsers.includes(userId)) {
    return { canUse: false, reason: 'Bạn không được phép sử dụng coupon này' };
  }
  
  // Check per-user usage limit
  const userUsage = this.currentUsage.byUser.find(u => u.user.toString() === userId.toString());
  if (userUsage && userUsage.count >= this.usageLimit.perUser) {
    return { canUse: false, reason: 'Bạn đã sử dụng hết lượt cho coupon này' };
  }
  
  // Check course restrictions
  if (courseId && this.restrictions.excludedCourses.includes(courseId)) {
    return { canUse: false, reason: 'Coupon không áp dụng cho khóa học này' };
  }
  
  return { canUse: true, reason: null };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(originalAmount) {
  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (originalAmount * this.value) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.type === 'fixed-amount') {
    discount = Math.min(this.value, originalAmount);
  }
  
  return Math.round(discount);
};

// Method to use coupon
couponSchema.methods.useCoupon = function(userId, discountAmount, revenueAmount) {
  // Update total usage
  this.currentUsage.total += 1;
  
  // Update user usage
  const userUsageIndex = this.currentUsage.byUser.findIndex(u => 
    u.user.toString() === userId.toString()
  );
  
  if (userUsageIndex >= 0) {
    this.currentUsage.byUser[userUsageIndex].count += 1;
    this.currentUsage.byUser[userUsageIndex].lastUsed = new Date();
  } else {
    this.currentUsage.byUser.push({
      user: userId,
      count: 1,
      lastUsed: new Date()
    });
  }
  
  // Update analytics
  this.analytics.successfulUses += 1;
  this.analytics.totalDiscountGiven += discountAmount;
  this.analytics.revenueGenerated += revenueAmount;
  
  // Check if exhausted
  if (this.usageLimit.total && this.currentUsage.total >= this.usageLimit.total) {
    this.status = 'exhausted';
  }
  
  return this.save();
};

// Pre-save middleware to update status
couponSchema.pre('save', function(next) {
  const now = new Date();
  
  if (now > this.validity.endDate) {
    this.status = 'expired';
  } else if (this.usageLimit.total && this.currentUsage.total >= this.usageLimit.total) {
    this.status = 'exhausted';
  }
  
  // Calculate conversion rate
  if (this.analytics.attempts > 0) {
    this.analytics.conversionRate = (this.analytics.successfulUses / this.analytics.attempts) * 100;
  }
  
  next();
});

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1, 'validity.startDate': 1, 'validity.endDate': 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ 'applicableFor.courseIds': 1 });
couponSchema.index({ 'applicableFor.categories': 1 });

module.exports = mongoose.model('Coupon', couponSchema);
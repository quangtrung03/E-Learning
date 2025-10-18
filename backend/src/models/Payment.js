const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    original: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    final: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR']
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit-card', 'debit-card', 'bank-transfer', 'momo', 'zalopay', 'vnpay', 'paypal'],
      required: true
    },
    provider: {
      type: String,
      required: true // 'stripe', 'vnpay', 'momo', etc.
    },
    last4: {
      type: String,
      default: null // Last 4 digits of card
    },
    brand: {
      type: String,
      default: null // 'visa', 'mastercard', etc.
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  couponCode: {
    type: String,
    default: null
  },
  discountApplied: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage
  },
  billingAddress: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: null
    },
    address: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null
    },
    state: {
      type: String,
      default: null
    },
    zipCode: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: 'VN'
    }
  },
  invoice: {
    number: {
      type: String,
      unique: true,
      sparse: true
    },
    url: {
      type: String,
      default: null
    },
    issuedAt: {
      type: Date,
      default: null
    }
  },
  refund: {
    amount: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    },
    refundId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'processed', 'rejected'],
      default: 'none'
    }
  },
  subscription: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: null
    },
    nextPaymentDate: {
      type: Date,
      default: null
    },
    subscriptionId: {
      type: String,
      default: null
    }
  },
  metadata: {
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    referrer: {
      type: String,
      default: null
    },
    campaignSource: {
      type: String,
      default: null
    }
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Generate order ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.orderId = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Generate invoice number when payment is completed
paymentSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.invoice.number) {
    const date = new Date().toISOString().slice(0, 7).replace('-', '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.invoice.number = `INV-${date}-${random}`;
    this.invoice.issuedAt = new Date();
  }
  next();
});

// Method to add timeline entry
paymentSchema.methods.addTimelineEntry = function(status, message, data = {}) {
  this.timeline.push({
    status,
    message,
    data,
    timestamp: new Date()
  });
  return this.save();
};

// Method to check if refundable
paymentSchema.methods.isRefundable = function() {
  if (this.status !== 'completed') return false;
  if (this.refund.status !== 'none') return false;
  
  // Allow refund within 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.completedAt > thirtyDaysAgo;
};

// Virtual for net amount after refund
paymentSchema.virtual('netAmount').get(function() {
  return this.amount.final - this.refund.amount;
});

// Indexes for better performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ course: 1, status: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ 'invoice.number': 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
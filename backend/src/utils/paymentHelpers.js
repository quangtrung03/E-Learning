/**
 * Payment Utility Functions
 * Helper functions for payment processing and data sanitization
 */

/**
 * Sanitize payment gateway response before saving to database
 * Removes sensitive fields that should NOT be stored (PCI-DSS compliance)
 * 
 * @param {Object} response - Raw gateway response
 * @param {String} provider - Payment provider ('stripe', 'vnpay', 'momo', etc.)
 * @returns {Object} - Sanitized response safe for storage
 */
const sanitizeGatewayResponse = (response, provider = 'unknown') => {
  if (!response || typeof response !== 'object') {
    return {};
  }

  // Fields to NEVER store (security risk)
  const sensitiveFields = [
    'cvv', 'cvc', 'cvv2',
    'cardNumber', 'card_number', 'pan',
    'securityCode', 'security_code',
    'pin', 'password',
    'bankAccount', 'bank_account',
    'routingNumber', 'routing_number',
    'iban', 'swift',
    'ssn', 'social_security',
    // Stripe specific
    'client_secret',
    // VNPay specific  
    'vnp_SecureHash', 'vnp_SecureHashType',
    // MoMo specific
    'signature', 'publicKey', 'privateKey'
  ];

  // Deep clone to avoid modifying original
  const sanitized = JSON.parse(JSON.stringify(response));

  // Recursive function to remove sensitive fields
  const removeSensitiveFields = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Check if field name contains sensitive keywords
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeSensitiveFields(obj[key]);
      }
    });
  };

  removeSensitiveFields(sanitized);

  // Add metadata for tracking
  return {
    provider,
    sanitizedAt: new Date(),
    ...sanitized
  };
};

/**
 * Mask card number for display (show only last 4 digits)
 * @param {String} cardNumber - Full card number
 * @returns {String} - Masked card number (e.g., "**** **** **** 1234")
 */
const maskCardNumber = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return '****';
  }

  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) {
    return '****';
  }

  const last4 = cleaned.slice(-4);
  const masked = '*'.repeat(Math.max(0, cleaned.length - 4));
  
  // Format with spaces for readability
  const formatted = (masked + last4).match(/.{1,4}/g);
  return formatted ? formatted.join(' ') : last4;
};

/**
 * Extract safe payment info for storage
 * @param {Object} paymentInfo - Payment information from gateway
 * @returns {Object} - Safe payment info to store
 */
const extractSafePaymentInfo = (paymentInfo) => {
  const safe = {};

  // Only extract non-sensitive fields
  if (paymentInfo.last4) {
    safe.last4 = paymentInfo.last4;
  } else if (paymentInfo.cardNumber) {
    const cleaned = paymentInfo.cardNumber.replace(/\s/g, '');
    safe.last4 = cleaned.slice(-4);
  }

  if (paymentInfo.brand) {
    safe.brand = paymentInfo.brand;
  }

  if (paymentInfo.expiryMonth) {
    safe.expiryMonth = paymentInfo.expiryMonth;
  }

  if (paymentInfo.expiryYear) {
    safe.expiryYear = paymentInfo.expiryYear;
  }

  if (paymentInfo.cardHolderName) {
    safe.cardHolderName = paymentInfo.cardHolderName;
  }

  return safe;
};

/**
 * Validate payment amount
 * @param {Number} amount - Amount in smallest currency unit (e.g., cents for USD, đồng for VND)
 * @param {String} currency - Currency code
 * @returns {Boolean}
 */
const validatePaymentAmount = (amount, currency = 'VND') => {
  if (typeof amount !== 'number' || amount <= 0) {
    return false;
  }

  // Currency-specific validation
  switch (currency.toUpperCase()) {
    case 'VND':
      // VND minimum: 1,000đ, maximum: 500,000,000đ
      return amount >= 1000 && amount <= 500000000;
    case 'USD':
      // USD minimum: $0.50, maximum: $10,000
      return amount >= 50 && amount <= 1000000; // in cents
    default:
      return amount > 0;
  }
};

/**
 * Format currency for display
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code
 * @returns {String} - Formatted currency string
 */
const formatCurrency = (amount, currency = 'VND') => {
  if (typeof amount !== 'number') {
    return '0';
  }

  const formatters = {
    VND: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  };

  const formatter = formatters[currency.toUpperCase()];
  return formatter ? formatter.format(amount) : `${amount} ${currency}`;
};

/**
 * Generate unique order ID
 * @param {String} prefix - Prefix for order ID (e.g., 'ORD', 'PAY')
 * @returns {String} - Unique order ID
 */
const generateOrderId = (prefix = 'ORD') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

module.exports = {
  sanitizeGatewayResponse,
  maskCardNumber,
  extractSafePaymentInfo,
  validatePaymentAmount,
  formatCurrency,
  generateOrderId
};

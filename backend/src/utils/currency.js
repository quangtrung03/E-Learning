/**
 * Utility functions for currency formatting and calculations
 */

/**
 * Format number to VND currency
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency string
 */
const formatVND = (amount) => {
  if (!amount || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate discounted price
 * @param {Number} originalPrice - Original price
 * @param {Number} discountPercent - Discount percentage (0-100)
 * @returns {Number} Final price after discount
 */
const calculateDiscountedPrice = (originalPrice, discountPercent = 0) => {
  if (!originalPrice || isNaN(originalPrice)) return 0;
  if (!discountPercent || isNaN(discountPercent) || discountPercent <= 0) {
    return originalPrice;
  }
  
  const discount = Math.min(Math.max(discountPercent, 0), 100);
  return Math.round(originalPrice * (1 - discount / 100));
};

/**
 * Calculate discount amount
 * @param {Number} originalPrice - Original price
 * @param {Number} discountPercent - Discount percentage (0-100)
 * @returns {Number} Discount amount
 */
const calculateDiscountAmount = (originalPrice, discountPercent = 0) => {
  if (!originalPrice || isNaN(originalPrice)) return 0;
  if (!discountPercent || isNaN(discountPercent) || discountPercent <= 0) {
    return 0;
  }
  
  const discount = Math.min(Math.max(discountPercent, 0), 100);
  return Math.round(originalPrice * (discount / 100));
};

/**
 * Format course price object with all price information
 * @param {Object} course - Course object with price and discount
 * @returns {Object} Price information object
 */
const formatCoursePrice = (course) => {
  const originalPrice = course.price || 0;
  const discountPercent = course.discount || 0;
  const finalPrice = calculateDiscountedPrice(originalPrice, discountPercent);
  const discountAmount = calculateDiscountAmount(originalPrice, discountPercent);
  
  return {
    original: originalPrice,
    discount: discountPercent,
    discountAmount,
    final: finalPrice,
    currency: 'VND',
    formatted: {
      original: formatVND(originalPrice),
      final: formatVND(finalPrice),
      discount: `${discountPercent}%`,
      saved: formatVND(discountAmount)
    },
    isFree: finalPrice === 0,
    hasDiscount: discountPercent > 0
  };
};

/**
 * Validate price
 * @param {Number} price - Price to validate
 * @returns {Boolean} Is valid price
 */
const isValidPrice = (price) => {
  return !isNaN(price) && price >= 0 && price < 1000000000; // Max 1 billion VND
};

/**
 * Convert USD to VND (approximate rate)
 * @param {Number} usdAmount - Amount in USD
 * @param {Number} exchangeRate - Exchange rate (default 24000)
 * @returns {Number} Amount in VND
 */
const convertUSDtoVND = (usdAmount, exchangeRate = 24000) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Convert VND to USD (approximate rate)
 * @param {Number} vndAmount - Amount in VND
 * @param {Number} exchangeRate - Exchange rate (default 24000)
 * @returns {Number} Amount in USD
 */
const convertVNDtoUSD = (vndAmount, exchangeRate = 24000) => {
  if (!vndAmount || isNaN(vndAmount)) return 0;
  return Math.round((vndAmount / exchangeRate) * 100) / 100; // Round to 2 decimals
};

module.exports = {
  formatVND,
  calculateDiscountedPrice,
  calculateDiscountAmount,
  formatCoursePrice,
  isValidPrice,
  convertUSDtoVND,
  convertVNDtoUSD
};

const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder (e.g., 'categories', 'instructors')
 * @returns {Promise<string>} - Cloudinary URL
 */
const uploadImage = async (filePath, folder = 'elearning') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `elearning/${folder}`,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Resize lớn nhất 1200x800
        { quality: 'auto:good' }, // Tự động optimize quality
        { fetch_format: 'auto' } // Tự động chọn format tốt nhất (WebP nếu browser hỗ trợ)
      ]
    });
    
    return result.secure_url; // HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Deleted image from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
const getPublicIdFromUrl = (url) => {
  // Example: https://res.cloudinary.com/xxx/image/upload/v123/elearning/categories/image.jpg
  // Returns: elearning/categories/image
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  const pathAfterUpload = parts.slice(uploadIndex + 2).join('/'); // Skip version
  return pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove extension
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getPublicIdFromUrl
};

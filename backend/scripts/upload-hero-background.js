const path = require('path');
const dotenv = require('dotenv');

// Load .env BEFORE importing cloudinary config
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Verify credentials loaded
console.log('🔍 Checking Cloudinary credentials...');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅' : '❌');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅' : '❌');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials in .env file!');
  process.exit(1);
}

const { uploadImage } = require('../src/config/cloudinary');

async function uploadHeroBackground() {
  try {
    console.log('📤 Starting Hero Background upload to Cloudinary...\n');
    
    const backgroundPath = path.resolve(__dirname, '..', 'uploads/banners/background2.jpg');
    console.log('  ⏳ Uploading background2.jpg...');
    
    const cloudinaryUrl = await uploadImage(backgroundPath, 'hero-backgrounds');
    
    console.log('\n🎉 Upload completed!');
    console.log('✅ Cloudinary URL:', cloudinaryUrl);
    console.log('\n📋 Next steps:');
    console.log('1. Copy the URL above');
    console.log('2. Update frontend/src/pages/Home.tsx');
    console.log('3. Replace: /src/assets/background2.jpg');
    console.log('4. With:', cloudinaryUrl);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Upload error:', error);
    process.exit(1);
  }
}

uploadHeroBackground();

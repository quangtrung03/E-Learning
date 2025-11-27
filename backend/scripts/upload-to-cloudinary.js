const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');

// Mapping local files to Cloudinary
const categoryImages = [
  { localPath: 'uploads/categories/developweb.jpg', slug: 'web-development', folder: 'categories' },
  { localPath: 'uploads/categories/datasience.jpg', slug: 'data-science', folder: 'categories' },
  { localPath: 'uploads/categories/uiux.jpg', slug: 'ui-ux-design', folder: 'categories' },
  { localPath: 'uploads/categories/digital.png', slug: 'digital-marketing', folder: 'categories' }
];

const instructorImages = [
  { localPath: 'uploads/instructors/huy.png', name: 'Trần Minh Huy', folder: 'instructors' },
  { localPath: 'uploads/instructors/nhien.png', name: 'Dr. Nguyễn An Nhiên', folder: 'instructors' },
  { localPath: 'uploads/instructors/dung.png', name: 'Lê Quang Dũng', folder: 'instructors' },
  { localPath: 'uploads/instructors/thao.png', name: 'Hoàng Thu Thảo', folder: 'instructors' },
  { localPath: 'uploads/instructors/bao.png', name: 'Phạm Gia Bảo', folder: 'instructors' },
  { localPath: 'uploads/instructors/linh.png', name: 'Nguyễn Thị Linh', folder: 'instructors' }
];

async function uploadToCloudinary() {
  try {
    console.log('📤 Starting Cloudinary upload...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Upload Category Images
    console.log('📁 Uploading Category Images...');
    for (const img of categoryImages) {
      try {
        const absolutePath = path.resolve(__dirname, '..', img.localPath);
        console.log(`  ⏳ Uploading ${img.slug}...`);
        
        const cloudinaryUrl = await uploadImage(absolutePath, img.folder);
        console.log(`  ✅ ${img.slug}: ${cloudinaryUrl}`);
        
        // Update database
        await Category.findOneAndUpdate(
          { slug: img.slug },
          { imageUrl: cloudinaryUrl },
          { new: true }
        );
        console.log(`  💾 Updated database for ${img.slug}\n`);
      } catch (error) {
        console.error(`  ❌ Failed to upload ${img.slug}:`, error.message, '\n');
      }
    }

    // Upload Instructor Images
    console.log('👨‍🏫 Uploading Instructor Images...');
    for (const img of instructorImages) {
      try {
        const absolutePath = path.resolve(__dirname, '..', img.localPath);
        console.log(`  ⏳ Uploading ${img.name}...`);
        
        const cloudinaryUrl = await uploadImage(absolutePath, img.folder);
        console.log(`  ✅ ${img.name}: ${cloudinaryUrl}`);
        
        // Update database
        await Instructor.findOneAndUpdate(
          { name: img.name },
          { imageUrl: cloudinaryUrl },
          { new: true }
        );
        console.log(`  💾 Updated database for ${img.name}\n`);
      } catch (error) {
        console.error(`  ❌ Failed to upload ${img.name}:`, error.message, '\n');
      }
    }

    console.log('🎉 Cloudinary upload completed!\n');
    
    // Verify
    const categories = await Category.find({}, 'name imageUrl');
    const instructors = await Instructor.find({}, 'name imageUrl');
    
    console.log('📊 Verification:');
    console.log('\nCategories:');
    categories.forEach(cat => console.log(`  - ${cat.name}: ${cat.imageUrl}`));
    
    console.log('\nInstructors:');
    instructors.forEach(inst => console.log(`  - ${inst.name}: ${inst.imageUrl}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Upload error:', error);
    process.exit(1);
  }
}

uploadToCloudinary();

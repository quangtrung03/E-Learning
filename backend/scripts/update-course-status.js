const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Import models
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const updateCourseStatusToPending = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding draft courses...');
    
    // Tìm tất cả khóa học draft
    const draftCourses = await Course.find({ status: 'draft' });
    console.log(`📚 Found ${draftCourses.length} draft courses`);
    
    if (draftCourses.length === 0) {
      console.log('ℹ️  No draft courses found to update');
      return;
    }
    
    // Update tất cả draft courses thành pending
    const result = await Course.updateMany(
      { status: 'draft' },
      { 
        $set: { 
          status: 'pending',
          rejectionReason: null
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} courses from draft to pending`);
    
    // Hiển thị courses đã update
    const updatedCourses = await Course.find({ status: 'pending' }).populate('instructor', 'name');
    console.log('\n📋 Updated courses:');
    updatedCourses.forEach((course, index) => {
      console.log(`${index + 1}. "${course.title}" by ${course.instructor.name} - Status: ${course.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating courses:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run script
if (require.main === module) {
  updateCourseStatusToPending();
}

module.exports = updateCourseStatusToPending;
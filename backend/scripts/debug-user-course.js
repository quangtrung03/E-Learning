require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Course = require('../src/models/Course');

const MONGODB_URI = process.env.MONGODB_URI;

async function debugUserCourse() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // 1. Tìm user theo email
    const email = 'haquangtrung1534@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error('❌ Không tìm thấy user với email:', email);
      return;
    }
    
    console.log('👤 User found:');
    console.log('   ID:', user._id.toString());
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Created courses:', user.createdCourses?.length || 0);
    console.log('   Enrolled courses:', user.enrolledCourses?.length || 0);

    // 2. Tìm tất cả khóa học của user này
    const userCourses = await Course.find({ instructor: user._id });
    console.log('\n📚 Courses where user is instructor:', userCourses.length);
    
    userCourses.forEach((course, index) => {
      console.log(`   ${index + 1}. "${course.title}"`);
      console.log(`      ID: ${course._id}`);
      console.log(`      Status: ${course.status}`);
      console.log(`      Category: ${course.category}`);
      console.log(`      Level: ${course.level}`);
      console.log(`      Created: ${course.createdAt}`);
    });

    // 3. Kiểm tra khóa học "Lập trình Java"
    const javaCourse = await Course.findOne({ 
      instructor: user._id, 
      title: { $regex: /java/i } 
    });
    
    if (javaCourse) {
      console.log('\n🎯 Java course found:');
      console.log('   Title:', javaCourse.title);
      console.log('   Instructor ID:', javaCourse.instructor);
      console.log('   User ID:', user._id.toString());
      console.log('   Match:', javaCourse.instructor.toString() === user._id.toString());
      console.log('   Status:', javaCourse.status);
    } else {
      console.log('\n❌ Không tìm thấy khóa học Java');
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugUserCourse();
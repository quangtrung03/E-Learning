// Script seed khóa học mới cho user cụ thể
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Course = require('../src/models/Course');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const email = 'haquangtrung1534@gmail.com';
  const user = await User.findOne({ email });
  if (!user) {
    console.error('Không tìm thấy user với email:', email);
    process.exit(1);
  }

  const course = new Course({
    title: 'Lập trình Java',
    description: 'Khóa học cơ bản về lập trình Java cho người mới bắt đầu.',
    category: 'programming',
    level: 'beginner',
    price: 0,
    discount: 0,
    duration: 20,
    status: 'draft',
    instructor: user._id,
    students: [],
  });

  await course.save();
  console.log('Đã tạo khóa học:', course.title, 'cho user', user.email);

  await mongoose.disconnect();
}

seed();

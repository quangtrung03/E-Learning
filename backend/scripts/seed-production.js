const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Payment = require('../src/models/Payment');
const Category = require('../src/models/Category');

const seedProduction = async () => {
  try {
    console.log('🌱 Starting production database seeding...\n');
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ==================== STEP 1: CLEAR DATABASE ====================
    console.log('🗑️  Step 1: Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Database cleared\n');

    // ==================== STEP 2: CREATE ADMIN ====================
    console.log('👑 Step 2: Creating platform admin...');
    const admin = await User.create({
      name: 'E-Learning Platform Admin',
      email: 'elearnplatform1534@gmail.com',
      password: 'Admin@2025!',
      isAdmin: true,
      emailVerified: true,
      isActive: true,
      bio: 'Platform Administrator',
      phone: '0123456789'
    });
    console.log('✅ Admin created:', admin.email, '\n');

    // ==================== STEP 3: CREATE INSTRUCTORS ====================
    console.log('👨‍🏫 Step 3: Creating instructors...');
    const instructors = await User.insertMany([
      {
        name: 'Nguyễn Văn An',
        email: 'instructor1@example.com',
        password: await bcrypt.hash('instructor123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Giảng viên lập trình với 5 năm kinh nghiệm',
        phone: '0901234567'
      },
      {
        name: 'Trần Thị Bình',
        email: 'instructor2@example.com',
        password: await bcrypt.hash('instructor123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Chuyên gia thiết kế UI/UX',
        phone: '0901234568'
      },
      {
        name: 'Lê Minh Cường',
        email: 'instructor3@example.com',
        password: await bcrypt.hash('instructor123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Giảng viên Marketing Digital',
        phone: '0901234569'
      }
    ]);
    console.log(`✅ Created ${instructors.length} instructors\n`);

    // ==================== STEP 4: CREATE STUDENTS ====================
    console.log('👨‍🎓 Step 4: Creating students...');
    const students = await User.insertMany([
      {
        name: 'Học Viên 1',
        email: 'student1@example.com',
        password: await bcrypt.hash('student123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Học viên đam mê lập trình',
        phone: '0912345671'
      },
      {
        name: 'Học Viên 2',
        email: 'student2@example.com',
        password: await bcrypt.hash('student123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Học viên muốn chuyển nghề IT',
        phone: '0912345672'
      },
      {
        name: 'Học Viên 3',
        email: 'student3@example.com',
        password: await bcrypt.hash('student123', 12),
        isAdmin: false,
        emailVerified: true,
        isActive: true,
        bio: 'Học viên yêu thích thiết kế',
        phone: '0912345673'
      }
    ]);
    console.log(`✅ Created ${students.length} students\n`);

    // ==================== STEP 5: CREATE COURSES ====================
    console.log('📚 Step 5: Creating courses...');
    
    // Course 1: Lập trình JavaScript
    const course1 = await Course.create({
      title: 'Lập trình JavaScript từ cơ bản đến nâng cao',
      description: 'Khóa học JavaScript toàn diện từ cơ bản đến nâng cao, bao gồm ES6+, Async/Await, và các framework hiện đại.',
      instructor: instructors[0]._id,
      category: 'programming',
      level: 'beginner',
      price: 499000,
      discount: 20,
      duration: 1200,
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1234567890/courses/javascript.jpg',
      status: 'approved',
      isPublished: true,
      approvedBy: admin._id,
      approvedAt: new Date(),
      requirements: [
        'Kiến thức cơ bản về HTML và CSS',
        'Máy tính có kết nối internet',
        'Đam mê học lập trình'
      ],
      whatYouWillLearn: [
        'Nắm vững các khái niệm JavaScript cơ bản',
        'Làm chủ ES6+ và các tính năng hiện đại',
        'Xây dựng ứng dụng web tương tác',
        'Hiểu về Async/Await và Promise',
        'Làm việc với APIs và fetch data'
      ],
      tags: ['javascript', 'programming', 'web-development', 'es6']
    });

    // Add course to instructor's createdCourses
    await User.findByIdAndUpdate(instructors[0]._id, {
      $push: { createdCourses: course1._id }
    });

    // Course 2: Thiết kế UI/UX với Figma
    const course2 = await Course.create({
      title: 'Thiết kế UI/UX chuyên nghiệp với Figma',
      description: 'Học thiết kế giao diện người dùng và trải nghiệm người dùng từ cơ bản đến nâng cao với Figma.',
      instructor: instructors[1]._id,
      category: 'design',
      level: 'intermediate',
      price: 599000,
      discount: 15,
      duration: 900,
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1234567890/courses/figma.jpg',
      status: 'approved',
      isPublished: true,
      approvedBy: admin._id,
      approvedAt: new Date(),
      requirements: [
        'Kiến thức cơ bản về thiết kế',
        'Cài đặt Figma (miễn phí)',
        'Sáng tạo và tư duy thẩm mỹ'
      ],
      whatYouWillLearn: [
        'Nắm vững các công cụ Figma',
        'Thiết kế wireframe và prototype',
        'Tạo design system chuyên nghiệp',
        'Thiết kế responsive cho mobile và desktop',
        'Collaboration và handoff với developer'
      ],
      tags: ['figma', 'ui-ux', 'design', 'prototype']
    });

    await User.findByIdAndUpdate(instructors[1]._id, {
      $push: { createdCourses: course2._id }
    });

    // Course 3: Marketing Digital - FREE COURSE
    const course3 = await Course.create({
      title: 'Marketing Digital cơ bản - MIỄN PHÍ',
      description: 'Khóa học miễn phí về Marketing Digital giúp bạn hiểu về SEO, Social Media Marketing, và Content Marketing.',
      instructor: instructors[2]._id,
      category: 'marketing',
      level: 'beginner',
      price: 0, // FREE
      discount: 0,
      duration: 600,
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1234567890/courses/marketing.jpg',
      status: 'approved',
      isPublished: true,
      approvedBy: admin._id,
      approvedAt: new Date(),
      requirements: [
        'Không yêu cầu kinh nghiệm trước',
        'Đam mê marketing và kinh doanh'
      ],
      whatYouWillLearn: [
        'Hiểu về các kênh Marketing Digital',
        'Học SEO cơ bản',
        'Social Media Marketing',
        'Email Marketing',
        'Content Marketing Strategy'
      ],
      tags: ['marketing', 'digital-marketing', 'seo', 'social-media']
    });

    await User.findByIdAndUpdate(instructors[2]._id, {
      $push: { createdCourses: course3._id }
    });

    console.log('✅ Created 3 courses\n');

    // ==================== STEP 6: CREATE LESSONS ====================
    console.log('📖 Step 6: Creating lessons...');
    
    // Lessons for Course 1 (JavaScript)
    const course1Lessons = await Lesson.insertMany([
      {
        course: course1._id,
        title: 'Giới thiệu về JavaScript',
        description: 'Tổng quan về JavaScript và vai trò của nó trong web development',
        content: 'Nội dung bài học về giới thiệu JavaScript...',
        duration: 30,
        order: 1,
        isPreview: true,
        videoUrl: 'https://example.com/video1.mp4',
        resources: []
      },
      {
        course: course1._id,
        title: 'Biến và Kiểu dữ liệu',
        description: 'Học về var, let, const và các kiểu dữ liệu trong JavaScript',
        content: 'Nội dung bài học về biến và kiểu dữ liệu...',
        duration: 45,
        order: 2,
        isPreview: true,
        videoUrl: 'https://example.com/video2.mp4',
        resources: []
      },
      {
        course: course1._id,
        title: 'Hàm và Arrow Functions',
        description: 'Tìm hiểu về functions, arrow functions và scope',
        content: 'Nội dung bài học về hàm...',
        duration: 50,
        order: 3,
        isPreview: false,
        videoUrl: 'https://example.com/video3.mp4',
        resources: []
      },
      {
        course: course1._id,
        title: 'Array Methods',
        description: 'Làm chủ map, filter, reduce và các array methods',
        content: 'Nội dung bài học về array methods...',
        duration: 60,
        order: 4,
        isPreview: false,
        videoUrl: 'https://example.com/video4.mp4',
        resources: []
      },
      {
        course: course1._id,
        title: 'Async/Await và Promises',
        description: 'Hiểu về bất đồng bộ trong JavaScript',
        content: 'Nội dung bài học về async/await...',
        duration: 70,
        order: 5,
        isPreview: false,
        videoUrl: 'https://example.com/video5.mp4',
        resources: []
      }
    ]);

    // Update course1 lessons
    await Course.findByIdAndUpdate(course1._id, {
      $push: { lessons: { $each: course1Lessons.map(l => l._id) } }
    });

    // Lessons for Course 2 (Figma)
    const course2Lessons = await Lesson.insertMany([
      {
        course: course2._id,
        title: 'Giới thiệu về Figma',
        description: 'Tổng quan về Figma và cài đặt',
        content: 'Nội dung bài học về giới thiệu Figma...',
        duration: 25,
        order: 1,
        isPreview: true,
        videoUrl: 'https://example.com/figma1.mp4',
        resources: []
      },
      {
        course: course2._id,
        title: 'Các công cụ cơ bản',
        description: 'Học về các công cụ vẽ và chỉnh sửa trong Figma',
        content: 'Nội dung bài học về công cụ cơ bản...',
        duration: 40,
        order: 2,
        isPreview: true,
        videoUrl: 'https://example.com/figma2.mp4',
        resources: []
      },
      {
        course: course2._id,
        title: 'Components và Auto Layout',
        description: 'Tạo components và sử dụng auto layout',
        content: 'Nội dung bài học về components...',
        duration: 55,
        order: 3,
        isPreview: false,
        videoUrl: 'https://example.com/figma3.mp4',
        resources: []
      },
      {
        course: course2._id,
        title: 'Prototyping',
        description: 'Tạo prototype tương tác',
        content: 'Nội dung bài học về prototyping...',
        duration: 50,
        order: 4,
        isPreview: false,
        videoUrl: 'https://example.com/figma4.mp4',
        resources: []
      }
    ]);

    await Course.findByIdAndUpdate(course2._id, {
      $push: { lessons: { $each: course2Lessons.map(l => l._id) } }
    });

    // Lessons for Course 3 (Marketing)
    const course3Lessons = await Lesson.insertMany([
      {
        course: course3._id,
        title: 'Giới thiệu Marketing Digital',
        description: 'Tổng quan về Marketing Digital',
        content: 'Nội dung bài học về giới thiệu marketing...',
        duration: 30,
        order: 1,
        isPreview: true,
        videoUrl: 'https://example.com/marketing1.mp4',
        resources: []
      },
      {
        course: course3._id,
        title: 'SEO cơ bản',
        description: 'Học về SEO và tối ưu hóa tìm kiếm',
        content: 'Nội dung bài học về SEO...',
        duration: 45,
        order: 2,
        isPreview: true,
        videoUrl: 'https://example.com/marketing2.mp4',
        resources: []
      },
      {
        course: course3._id,
        title: 'Social Media Marketing',
        description: 'Marketing trên các nền tảng mạng xã hội',
        content: 'Nội dung bài học về social media...',
        duration: 40,
        order: 3,
        isPreview: false,
        videoUrl: 'https://example.com/marketing3.mp4',
        resources: []
      }
    ]);

    await Course.findByIdAndUpdate(course3._id, {
      $push: { lessons: { $each: course3Lessons.map(l => l._id) } }
    });

    console.log(`✅ Created ${course1Lessons.length + course2Lessons.length + course3Lessons.length} lessons\n`);

    // ==================== STEP 7: CREATE ENROLLMENTS ====================
    console.log('🎓 Step 7: Creating enrollments...');
    
    // Student 1 enrolls in course 1 (JavaScript) - PAID
    const payment1 = await Payment.create({
      user: students[0]._id,
      course: course1._id,
      orderId: `ORD_${Date.now()}_SEED01`,
      amount: {
        original: course1.price,
        discount: course1.price * (course1.discount / 100),
        final: course1.price * (1 - course1.discount / 100)
      },
      paymentMethod: {
        type: 'bank-transfer',
        provider: 'bank'
      },
      billingAddress: {
        fullName: students[0].name,
        email: students[0].email
      },
      status: 'completed',
      paidAt: new Date(),
      transactionId: `TXN_${Date.now()}_SEED01`
    });

    const enrollment1 = await Enrollment.create({
      user: students[0]._id,
      course: course1._id,
      payment: payment1._id,
      enrolledAt: new Date(),
      progress: 40, // 40% progress
      status: 'active',
      completedLessons: [
        { lesson: course1Lessons[0]._id, completedAt: new Date() },
        { lesson: course1Lessons[1]._id, completedAt: new Date() }
      ]
    });

    // Student 2 enrolls in course 3 (Marketing - FREE)
    const enrollment2 = await Enrollment.create({
      user: students[1]._id,
      course: course3._id,
      enrolledAt: new Date(),
      progress: 66, // 66% progress
      status: 'active',
      completedLessons: [
        { lesson: course3Lessons[0]._id, completedAt: new Date() },
        { lesson: course3Lessons[1]._id, completedAt: new Date() }
      ]
    });

    // Student 3 enrolls in course 2 (Figma) - PAID
    const payment3 = await Payment.create({
      user: students[2]._id,
      course: course2._id,
      orderId: `ORD_${Date.now()}_SEED02`,
      amount: {
        original: course2.price,
        discount: course2.price * (course2.discount / 100),
        final: course2.price * (1 - course2.discount / 100)
      },
      paymentMethod: {
        type: 'bank-transfer',
        provider: 'bank'
      },
      billingAddress: {
        fullName: students[2].name,
        email: students[2].email
      },
      status: 'completed',
      paidAt: new Date(),
      transactionId: `TXN_${Date.now()}_SEED02`
    });

    const enrollment3 = await Enrollment.create({
      user: students[2]._id,
      course: course2._id,
      payment: payment3._id,
      enrolledAt: new Date(),
      progress: 25, // 25% progress
      status: 'active',
      completedLessons: [
        { lesson: course2Lessons[0]._id, completedAt: new Date() }
      ]
    });

    console.log('✅ Created 3 enrollments\n');

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📊 DATABASE SUMMARY:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`👤 Users: ${1 + instructors.length + students.length} (1 admin, ${instructors.length} instructors, ${students.length} students)`);
    console.log(`📚 Courses: 3 (2 paid, 1 free)`);
    console.log(`📖 Lessons: ${course1Lessons.length + course2Lessons.length + course3Lessons.length}`);
    console.log(`🎓 Enrollments: 3`);
    console.log(`💳 Payments: 2`);
    console.log('─────────────────────────────────────────────────────\n');
    
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────────────────');
    console.log('ADMIN:');
    console.log('  Email: elearnplatform1534@gmail.com');
    console.log('  Password: Admin@2025!\n');
    console.log('INSTRUCTORS:');
    console.log('  Email: instructor1@example.com | Password: instructor123');
    console.log('  Email: instructor2@example.com | Password: instructor123');
    console.log('  Email: instructor3@example.com | Password: instructor123\n');
    console.log('STUDENTS:');
    console.log('  Email: student1@example.com | Password: student123');
    console.log('  Email: student2@example.com | Password: student123');
    console.log('  Email: student3@example.com | Password: student123');
    console.log('─────────────────────────────────────────────────────\n');
    
    console.log('⚠️  IMPORTANT: Please save these credentials securely!');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedProduction();

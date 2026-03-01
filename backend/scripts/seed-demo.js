const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');
const Payment = require('../src/models/Payment');

const getArg = (name) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? true;
};

const hasFlag = (name) => process.argv.includes(name);

const listCollections = async (db) => {
  return await db.listCollections().toArray();
};

const cleanAllCollections = async () => {
  const all = await listCollections(mongoose.connection.db);
  for (const { name } of all) {
    if (!name || name.startsWith('system.')) continue;
    await mongoose.connection.db.collection(name).deleteMany({});
  }
};

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const makeOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const makeTxnId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

async function seedDemo() {
  const reset = hasFlag('--reset') || process.env.SEED_RESET === 'true';
  const force = hasFlag('--force') || process.env.SEED_CONFIRM === 'YES';

  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in backend/.env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');
  console.log('🏷️  Database:', mongoose.connection.name);
  console.log('🖥️  Host:', mongoose.connection.host);
  console.log('');

  const existingCounts = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Lesson.countDocuments(),
    Enrollment.countDocuments(),
    Category.countDocuments(),
    Instructor.countDocuments(),
    Payment.countDocuments()
  ]);

  const existingTotal = existingCounts.reduce((sum, n) => sum + n, 0);

  if (existingTotal > 0 && !reset) {
    console.log('⚠️ Database is not empty. Refusing to seed without --reset');
    console.log('   Add --reset to wipe ALL collections before seeding.');
    console.log('   Example: node scripts/seed-demo.js --reset --force');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (reset && !force) {
    console.log('⚠️ You requested --reset (will wipe ALL collections).');
    console.log('   For safety, also pass --force or set SEED_CONFIRM=YES');
    console.log('   Example: node scripts/seed-demo.js --reset --force');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (reset) {
    console.log('🧹 Resetting database (delete all documents in all collections)...');
    await cleanAllCollections();
    console.log('✅ Reset done');
    console.log('');
  }

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Test@12345';

  // Users
  const admins = [
    { name: 'Admin Hệ Thống 1', email: 'admin1@example.com', isAdmin: true },
    { name: 'Admin Hệ Thống 2', email: 'admin2@example.com', isAdmin: true }
  ];

  const teachers = [
    { name: 'Nguyễn Minh Khoa', email: 'khoa.nguyen@example.com', bio: 'Giảng viên lập trình web (Full-stack) với 6+ năm kinh nghiệm.', phone: '0901000001' },
    { name: 'Trần Thu Hà', email: 'ha.tran@example.com', bio: 'Thiết kế UI/UX & Design Systems, tập trung vào sản phẩm giáo dục.', phone: '0901000002' },
    { name: 'Lê Quốc Bảo', email: 'bao.le@example.com', bio: 'Digital marketing thực chiến, chuyên performance & content.', phone: '0901000003' }
  ];

  const students = [
    { name: 'Phạm Gia Huy', email: 'huy.pham@example.com', phone: '0902000001' },
    { name: 'Vũ Ngọc Anh', email: 'anh.vu@example.com', phone: '0902000002' },
    { name: 'Đặng Đức Long', email: 'long.dang@example.com', phone: '0902000003' },
    { name: 'Bùi Thảo My', email: 'my.bui@example.com', phone: '0902000004' },
    { name: 'Hoàng Quốc Việt', email: 'viet.hoang@example.com', phone: '0902000005' },
    { name: 'Đỗ Minh Trang', email: 'trang.do@example.com', phone: '0902000006' }
  ];

  const allUsersPayload = [...admins, ...teachers, ...students].map((u) => ({
    ...u,
    password: defaultPassword,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    isActive: true
  }));

  console.log('👥 Creating users...');
  const createdUsers = await User.create(allUsersPayload);

  const adminUsers = createdUsers.filter((u) => u.isAdmin);
  const teacherUsers = createdUsers.filter((u) => !u.isAdmin && teachers.some((t) => t.email === u.email));
  const studentUsers = createdUsers.filter((u) => !u.isAdmin && students.some((s) => s.email === u.email));

  console.log(`✅ Users created: ${createdUsers.length}`);

  // Categories
  console.log('🏷️  Creating categories...');
  const categories = await Category.create([
    {
      name: 'Lập trình',
      slug: 'programming',
      description: 'Web, Backend, Frontend, Full-stack, và kiến thức nền tảng.',
      count: '120+ khóa học',
      imageUrl: 'https://placehold.co/800x450?text=Programming',
      gradient: 'from-blue-500 to-purple-600',
      order: 1,
      isActive: true
    },
    {
      name: 'Thiết kế',
      slug: 'design',
      description: 'UI/UX, Design systems, Figma, và tư duy sản phẩm.',
      count: '60+ khóa học',
      imageUrl: 'https://placehold.co/800x450?text=Design',
      gradient: 'from-pink-500 to-rose-600',
      order: 2,
      isActive: true
    },
    {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Content, performance, social, và chiến lược tăng trưởng.',
      count: '40+ khóa học',
      imageUrl: 'https://placehold.co/800x450?text=Marketing',
      gradient: 'from-emerald-500 to-green-600',
      order: 3,
      isActive: true
    }
  ]);
  console.log(`✅ Categories created: ${categories.length}`);

  // Instructors (landing-page list)
  console.log('🧑‍🏫 Creating instructors (landing list)...');
  const instructorDocs = await Instructor.create([
    {
      name: teacherUsers[0].name,
      title: 'Senior Full-stack Instructor',
      experience: '6+ năm kinh nghiệm',
      imageUrl: 'https://placehold.co/512x512?text=Instructor+1',
      gradient: 'from-blue-500 to-purple-600',
      bio: teachers[0].bio,
      order: 1,
      isActive: true
    },
    {
      name: teacherUsers[1].name,
      title: 'UI/UX Designer & Mentor',
      experience: '7+ năm kinh nghiệm',
      imageUrl: 'https://placehold.co/512x512?text=Instructor+2',
      gradient: 'from-pink-500 to-rose-600',
      bio: teachers[1].bio,
      order: 2,
      isActive: true
    },
    {
      name: teacherUsers[2].name,
      title: 'Marketing Lead & Coach',
      experience: '5+ năm kinh nghiệm',
      imageUrl: 'https://placehold.co/512x512?text=Instructor+3',
      gradient: 'from-emerald-500 to-green-600',
      bio: teachers[2].bio,
      order: 3,
      isActive: true
    }
  ]);
  console.log(`✅ Instructors created: ${instructorDocs.length}`);

  // Courses
  console.log('📚 Creating courses...');
  const approvedBy = adminUsers[0]._id;

  const coursePayloads = [
    {
      title: 'Full-stack Web căn bản: React + Node.js',
      description: 'Lộ trình từ nền tảng đến triển khai: React, API, auth, và triển khai.',
      instructor: teacherUsers[0]._id,
      category: 'programming',
      level: 'beginner',
      price: 1299000,
      discount: 20,
      duration: 420,
      requirements: ['Biết sử dụng máy tính và Internet', 'Có tinh thần tự học'],
      whatYouWillLearn: ['React fundamentals', 'REST API với Express', 'JWT auth', 'Deploy cơ bản'],
      tags: ['react', 'nodejs', 'jwt', 'mongodb'],
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      isPublished: true
    },
    {
      title: 'UI/UX thực chiến: Design System với Figma',
      description: 'Từ user flow đến component library: xây UI nhất quán và mở rộng.',
      instructor: teacherUsers[1]._id,
      category: 'design',
      level: 'intermediate',
      price: 999000,
      discount: 10,
      duration: 300,
      requirements: ['Biết dùng Figma cơ bản'],
      whatYouWillLearn: ['Design tokens', 'Component variants', 'Handoff cho dev'],
      tags: ['ux', 'ui', 'figma', 'design-system'],
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      isPublished: true
    },
    {
      title: 'Digital Marketing: Content + Performance',
      description: 'Chiến lược nội dung, chạy ads cơ bản, tracking và tối ưu hiệu quả.',
      instructor: teacherUsers[2]._id,
      category: 'marketing',
      level: 'beginner',
      price: 799000,
      discount: 15,
      duration: 240,
      requirements: ['Có fanpage hoặc sản phẩm để thực hành (khuyến khích)'],
      whatYouWillLearn: ['Content pillars', 'Ads setup', 'UTM & tracking', 'Optimization'],
      tags: ['marketing', 'content', 'ads', 'tracking'],
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      isPublished: true
    },
    {
      title: 'Node.js nâng cao: kiến trúc & tối ưu API',
      description: 'Best practices: cấu trúc dự án, validation, performance và security cơ bản.',
      instructor: teacherUsers[0]._id,
      category: 'programming',
      level: 'advanced',
      price: 1499000,
      discount: 0,
      duration: 360,
      requirements: ['Đã học JavaScript/Node.js căn bản'],
      whatYouWillLearn: ['Project structure', 'Error handling', 'Caching basics', 'Logging'],
      tags: ['nodejs', 'express', 'architecture'],
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      isPublished: true
    },
    {
      title: 'Thiết kế Landing Page chuyển đổi cao',
      description: 'Tối ưu bố cục, copywriting cơ bản và UX để tăng conversion.',
      instructor: teacherUsers[1]._id,
      category: 'design',
      level: 'beginner',
      price: 599000,
      discount: 5,
      duration: 180,
      requirements: ['Không yêu cầu kinh nghiệm'],
      whatYouWillLearn: ['Layout patterns', 'CTA placement', 'Trust elements'],
      tags: ['landing-page', 'conversion', 'ux'],
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      isPublished: true
    }
  ];

  const createdCourses = await Course.create(coursePayloads);
  console.log(`✅ Courses created: ${createdCourses.length}`);

  // Add createdCourses to teachers
  for (const course of createdCourses) {
    await User.findByIdAndUpdate(course.instructor, { $addToSet: { createdCourses: course._id } });
  }

  // Lessons
  console.log('📖 Creating lessons...');
  const lessonTemplatesByCourse = (courseTitle) => {
    return [
      { title: `Giới thiệu & lộ trình (${courseTitle})`, contentType: 'text', isPreview: true },
      { title: 'Kiến thức nền tảng', contentType: 'text', isPreview: false },
      { title: 'Thực hành: bài tập/mini project', contentType: 'quiz', isPreview: false },
      { title: 'Tổng kết & bước tiếp theo', contentType: 'text', isPreview: false }
    ];
  };

  const allLessons = [];
  for (const course of createdCourses) {
    const items = lessonTemplatesByCourse(course.title);
    for (let i = 0; i < items.length; i += 1) {
      allLessons.push({
        title: items[i].title,
        description: 'Bài học được thiết kế theo hướng thực hành, dễ theo dõi.',
        course: course._id,
        order: i + 1,
        content: `Nội dung bài học: ${items[i].title}.\n\n- Mục tiêu\n- Ví dụ\n- Bài tập\n`,
        contentType: items[i].contentType,
        duration: 30 + i * 10,
        isPreview: items[i].isPreview,
        isPublished: true
      });
    }
  }

  const createdLessons = await Lesson.create(allLessons);

  // Attach lessons to courses
  const lessonsByCourse = new Map();
  for (const lesson of createdLessons) {
    const key = lesson.course.toString();
    if (!lessonsByCourse.has(key)) lessonsByCourse.set(key, []);
    lessonsByCourse.get(key).push(lesson._id);
  }

  for (const course of createdCourses) {
    const ids = lessonsByCourse.get(course._id.toString()) || [];
    await Course.findByIdAndUpdate(course._id, { $set: { lessons: ids } });
  }

  console.log(`✅ Lessons created: ${createdLessons.length}`);

  // Enrollments + Payments
  console.log('🧾 Creating enrollments & sample payments...');

  const paymentMethods = [
    { type: 'bank-transfer', provider: 'vnpay' },
    { type: 'momo', provider: 'momo' },
    { type: 'credit-card', provider: 'stripe', last4: '4242', brand: 'visa' }
  ];

  const enrollments = [];
  const payments = [];

  // Make a few paid enrollments for realism
  for (let i = 0; i < studentUsers.length; i += 1) {
    const student = studentUsers[i];

    // Each student enrolls 1-2 courses
    const courseA = createdCourses[i % createdCourses.length];
    const courseB = createdCourses[(i + 2) % createdCourses.length];
    const chosen = i % 2 === 0 ? [courseA, courseB] : [courseA];

    for (const course of chosen) {
      const courseLessonIds = lessonsByCourse.get(course._id.toString()) || [];
      const completedCount = Math.min(courseLessonIds.length, i % 3);
      const completedLessons = courseLessonIds.slice(0, completedCount).map((lessonId) => ({
        lesson: lessonId,
        completedAt: new Date(Date.now() - (completedCount * 2) * 24 * 60 * 60 * 1000)
      }));

      const progress = courseLessonIds.length ? Math.round((completedCount / courseLessonIds.length) * 100) : 0;
      const status = progress === 100 ? 'completed' : 'active';

      enrollments.push({
        user: student._id,
        course: course._id,
        enrolledAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        status,
        progress,
        completedAt: status === 'completed' ? new Date() : null,
        lastAccessedAt: new Date(),
        completedLessons,
        totalTimeSpent: 30 * (completedCount + 1)
      });

      // Create payment for first course enrollment of a few students
      if (i < 4) {
        const method = randomPick(paymentMethods);
        const original = course.price;
        const discountAmount = Math.round(original * (course.discount / 100));
        const finalAmount = Math.max(0, original - discountAmount);

        payments.push({
          user: student._id,
          course: course._id,
          orderId: makeOrderId(),
          transactionId: makeTxnId(),
          amount: {
            original,
            discount: discountAmount,
            final: finalAmount,
            currency: 'VND'
          },
          paymentMethod: {
            type: method.type,
            provider: method.provider,
            last4: method.last4 || null,
            brand: method.brand || null
          },
          status: 'completed',
          billingAddress: {
            fullName: student.name,
            email: student.email,
            phone: student.phone || null,
            address: 'Quận 1',
            city: 'TP. Hồ Chí Minh',
            state: null,
            zipCode: null,
            country: 'VN'
          },
          timeline: [
            { status: 'completed', message: 'Thanh toán hoàn tất', timestamp: new Date(), data: {} }
          ],
          completedAt: new Date()
        });
      }
    }
  }

  const createdEnrollments = await Enrollment.create(enrollments);
  const createdPayments = await Payment.create(payments);

  // Link payments back to enrollments (best effort)
  const paymentMap = new Map(createdPayments.map((p) => [`${p.user.toString()}-${p.course.toString()}`, p._id]));
  for (const e of createdEnrollments) {
    const key = `${e.user.toString()}-${e.course.toString()}`;
    const paymentId = paymentMap.get(key);
    if (paymentId) {
      await Enrollment.findByIdAndUpdate(e._id, { $set: { payment: paymentId } });
    }
  }

  console.log(`✅ Enrollments created: ${createdEnrollments.length}`);
  console.log(`✅ Payments created: ${createdPayments.length}`);

  console.log('\n🎉 Seed demo completed successfully!');
  console.log('🔐 Default password for all seeded accounts:', defaultPassword);

  console.log('\nAdmin accounts:');
  console.log('- admin1@example.com');
  console.log('- admin2@example.com');

  console.log('\nTeacher accounts:');
  for (const t of teacherUsers) {
    console.log(`- ${t.email}`);
  }

  console.log('\nStudent accounts:');
  for (const s of studentUsers) {
    console.log(`- ${s.email}`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

seedDemo().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

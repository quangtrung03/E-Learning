const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');
const Payment = require('../src/models/Payment');
const AppSetting = require('../src/models/AppSetting');
const CourseSection = require('../src/models/CourseSection');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');
const Review = require('../src/models/Review');
const Discussion = require('../src/models/Discussion');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const StudyGroup = require('../src/models/StudyGroup');
const Certificate = require('../src/models/Certificate');
const LearningAnalytics = require('../src/models/LearningAnalytics');
const Coupon = require('../src/models/Coupon');
const FriendRequest = require('../src/models/FriendRequest');
const Friendship = require('../src/models/Friendship');
const { cloudinary } = require('../src/config/cloudinary');

const COURSE_THUMBNAILS_KEY = 'courseThumbnails';

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

const svgDataUri = (svg) => {
  const encoded = Buffer.from(String(svg), 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
};

const safeText = (value) => {
  const raw = String(value || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 80);
  // Escape XML entities for SVG text nodes
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildThumbSvg = ({ title, subtitle }) => {
  const t = safeText(title);
  const s = safeText(subtitle);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1F2937"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="64" y="64" width="1072" height="502" rx="24" fill="#0B1220" opacity="0.9"/>
  <text x="96" y="220" font-family="Arial, Helvetica, sans-serif" font-size="54" fill="#FFFFFF" font-weight="700">${t}</text>
  <text x="96" y="300" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#9CA3AF">${s}</text>
  <text x="96" y="520" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#6B7280">E-Learning • Seed Data</text>
</svg>`;
};

const buildAvatarSvg = ({ name }) => {
  const n = safeText(name);
  const initial = n.trim() ? n.trim()[0].toUpperCase() : 'U';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#6366F1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#a)"/>
  <text x="50%" y="56%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="220" fill="#FFFFFF" font-weight="700">${initial}</text>
  <text x="50%" y="88%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#E5E7EB">${n}</text>
</svg>`;
};

const buildCategorySvg = ({ title }) => {
  const t = safeText(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#22C55E"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" rx="32" fill="url(#c)"/>
  <rect x="40" y="40" width="720" height="370" rx="24" fill="#0B1220" opacity="0.85"/>
  <text x="80" y="240" font-family="Arial, Helvetica, sans-serif" font-size="56" fill="#FFFFFF" font-weight="700">${t}</text>
  <text x="80" y="310" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#E5E7EB">Danh mục • Seed</text>
</svg>`;
};

const buildInstructorSvg = ({ name }) => {
  const n = safeText(name);
  const initial = n.trim() ? n.trim()[0].toUpperCase() : 'I';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="i" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#i)"/>
  <circle cx="256" cy="210" r="104" fill="#0B1220" opacity="0.25"/>
  <text x="50%" y="54%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="200" fill="#FFFFFF" font-weight="700">${initial}</text>
  <text x="50%" y="86%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#FEE2E2">${n}</text>
</svg>`;
};

const buildCertificateSvg = ({ userName, courseTitle, certificateId }) => {
  const u = safeText(userName);
  const c = safeText(courseTitle);
  const id = safeText(certificateId);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B1220"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#FDE68A"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg)"/>
  <rect x="80" y="80" width="1440" height="1040" rx="32" fill="#0B1220" opacity="0.92" stroke="url(#gold)" stroke-width="10"/>
  <text x="800" y="240" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" fill="#FDE68A" font-weight="700">CERTIFICATE OF COMPLETION</text>
  <text x="800" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#9CA3AF">Chứng nhận hoàn thành khóa học</text>
  <text x="800" y="480" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" fill="#FFFFFF" font-weight="700">${u}</text>
  <text x="800" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#E5E7EB">đã hoàn thành khóa học</text>
  <text x="800" y="640" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#FFFFFF" font-weight="700">${c}</text>
  <text x="140" y="1020" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#9CA3AF">Certificate ID: ${id}</text>
  <text x="1460" y="1020" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#9CA3AF">E-Learning</text>
</svg>`;
};

const gradeFromScore = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const sha256 = (input) => crypto.createHash('sha256').update(String(input)).digest('hex');

const uploadSvgToCloudinary = async ({ svg, folder, publicIdHint }) => {
  // Note: Cloudinary accepts data URIs.
  const dataUri = svgDataUri(svg);
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `elearning/${folder}`,
    public_id: publicIdHint || undefined,
    resource_type: 'image',
    overwrite: true,
    transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
  });
  return result.secure_url;
};

const parseUrlList = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

// Safe defaults: MDN hosts small CC0 sample videos intended for demos.
// Using direct mp4/webm URLs avoids YouTube/TOS and reduces copyright risk.
const DEFAULT_CC0_VIDEO_URLS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm'
];

const uploadVideoUrlsToCloudinary = async ({ urls, folder }) => {
  const out = [];
  for (const url of urls) {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: `elearning/${folder}`,
        resource_type: 'video'
      });
      out.push({
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        duration: result.duration || 0,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes
      });
      console.log('  ✅ Uploaded video:', result.public_id);
    } catch (e) {
      console.log('  ⚠️ Failed to upload video URL:', url);
      console.log('     ', e.message);
    }
  }
  return out;
};

async function seedRich() {
  const reset = hasFlag('--reset') || process.env.SEED_RESET === 'true';
  const force = hasFlag('--confirm') || hasFlag('--force') || process.env.SEED_CONFIRM === 'YES';
  const withCloudinaryImages = hasFlag('--with-cloudinary-images') || process.env.SEED_CLOUDINARY_IMAGES === 'true';
  const withCloudinaryVideos = hasFlag('--with-cloudinary-videos') || process.env.SEED_CLOUDINARY_VIDEOS === 'true';

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
    Payment.countDocuments(),
    AppSetting.countDocuments()
  ]);
  const existingTotalDocs = existingCounts.reduce((sum, n) => sum + n, 0);

  if (existingTotalDocs > 0 && !reset) {
    console.log('⚠️ Database is not empty. Refusing to seed without --reset');
    console.log('   Example: node scripts/seed-rich.js --reset --force');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (reset && !force) {
    console.log('⚠️ You requested --reset (will wipe ALL collections).');
    console.log('   For safety, also pass --force or set SEED_CONFIRM=YES');
    console.log('   Example: node scripts/seed-rich.js --reset --force');
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
  const admins = [{ name: 'Admin Hệ Thống', email: 'admin@example.com', isAdmin: true }];

  const teachers = [
    { name: 'Nguyễn Minh Khoa', email: 'khoa.nguyen@example.com', bio: 'Giảng viên lập trình web (Full-stack).', phone: '0901000001' },
    { name: 'Trần Thu Hà', email: 'ha.tran@example.com', bio: 'Thiết kế UI/UX & Design Systems.', phone: '0901000002' }
  ];

  const students = Array.from({ length: 12 }).map((_, i) => ({
    name: `Học viên ${i + 1}`,
    email: `student${i + 1}@example.com`,
    phone: `0902${String(i + 1).padStart(6, '0')}`
  }));

  const allUsersPayload = [...admins, ...teachers, ...students].map((u) => ({
    ...u,
    password: defaultPassword,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    isActive: true
  }));

  console.log('👥 Creating users...');
  const createdUsers = await User.create(allUsersPayload);

  const adminUser = createdUsers.find((u) => u.isAdmin);
  const teacherUsers = createdUsers.filter((u) => !u.isAdmin && teachers.some((t) => t.email === u.email));
  const studentUsers = createdUsers.filter((u) => !u.isAdmin && u.email.startsWith('student'));

  // Optional: upload avatars
  if (withCloudinaryImages) {
    console.log('🖼️  Uploading SVG avatars to Cloudinary...');
    for (const u of [...teacherUsers, ...studentUsers]) {
      const svg = buildAvatarSvg({ name: u.name });
      const url = await uploadSvgToCloudinary({
        svg,
        folder: 'avatars/seed',
        publicIdHint: `avatar-${u._id.toString()}`
      });
      await User.findByIdAndUpdate(u._id, { $set: { avatar: url } });
    }
  }

  console.log(`✅ Users created: ${createdUsers.length}`);

  // Categories
  console.log('🏷️  Creating categories...');
  const categorySeed = [
    {
      name: 'Lập trình',
      slug: 'programming',
      description: 'Web, Backend, Frontend, Full-stack, và kiến thức nền tảng.',
      count: '120+ khóa học',
      gradient: 'from-blue-500 to-purple-600',
      order: 1,
      isActive: true
    },
    {
      name: 'Thiết kế',
      slug: 'design',
      description: 'UI/UX, Design systems, Figma, và tư duy sản phẩm.',
      count: '60+ khóa học',
      gradient: 'from-pink-500 to-rose-600',
      order: 2,
      isActive: true
    },
    {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Content, performance, social, và chiến lược tăng trưởng.',
      count: '40+ khóa học',
      gradient: 'from-emerald-500 to-green-600',
      order: 3,
      isActive: true
    }
  ];

  const categoryPayloads = [];
  for (const c of categorySeed) {
    const svg = buildCategorySvg({ title: c.name });
    const imageUrl = withCloudinaryImages
      ? await uploadSvgToCloudinary({ svg, folder: 'categories/seed', publicIdHint: `category-${c.slug}` })
      : svgDataUri(svg);

    categoryPayloads.push({ ...c, imageUrl });
  }

  const categories = await Category.create(categoryPayloads);
  console.log(`✅ Categories created: ${categories.length}`);

  // Instructors (landing page list)
  console.log('🧑‍🏫 Creating instructors (landing list)...');
  const instructorSeed = [
    {
      name: teacherUsers[0].name,
      title: 'Senior Full-stack Instructor',
      experience: '6+ năm kinh nghiệm',
      gradient: 'from-blue-500 to-purple-600',
      bio: teachers[0].bio,
      order: 1,
      isActive: true
    },
    {
      name: teacherUsers[1].name,
      title: 'UI/UX Designer & Mentor',
      experience: '7+ năm kinh nghiệm',
      gradient: 'from-pink-500 to-rose-600',
      bio: teachers[1].bio,
      order: 2,
      isActive: true
    }
  ];

  const instructorPayloads = [];
  for (const i of instructorSeed) {
    const svg = buildInstructorSvg({ name: i.name });
    const imageUrl = withCloudinaryImages
      ? await uploadSvgToCloudinary({ svg, folder: 'instructors/seed', publicIdHint: `instructor-${i.order}` })
      : svgDataUri(svg);
    instructorPayloads.push({ ...i, imageUrl });
  }

  const instructorDocs = await Instructor.create(instructorPayloads);
  console.log(`✅ Instructors created: ${instructorDocs.length}`);

  // Default course thumbnails (admin managed)
  let defaultThumbUrls = [];
  if (withCloudinaryImages) {
    console.log('🖼️  Uploading default course thumbnails...');
    const thumbs = [
      buildThumbSvg({ title: 'Khóa học', subtitle: 'Thumbnail mặc định (1)' }),
      buildThumbSvg({ title: 'E-Learning', subtitle: 'Thumbnail mặc định (2)' }),
      buildThumbSvg({ title: 'Học Online', subtitle: 'Thumbnail mặc định (3)' })
    ];
    for (let i = 0; i < thumbs.length; i += 1) {
      const url = await uploadSvgToCloudinary({
        svg: thumbs[i],
        folder: 'defaults/course-thumbnails',
        publicIdHint: `default-course-thumb-${i + 1}`
      });
      defaultThumbUrls.push(url);
    }

    await AppSetting.findOneAndUpdate(
      { key: COURSE_THUMBNAILS_KEY },
      {
        $set: {
          value: {
            activeUrl: defaultThumbUrls[0] || null,
            items: defaultThumbUrls.map((url) => ({ url, addedAt: new Date().toISOString() }))
          },
          updatedBy: adminUser?._id || null
        }
      },
      { upsert: true }
    );
  } else {
    await AppSetting.findOneAndUpdate(
      { key: COURSE_THUMBNAILS_KEY },
      {
        $set: {
          value: { activeUrl: null, items: [] },
          updatedBy: adminUser?._id || null
        }
      },
      { upsert: true }
    );
  }

  // Courses
  console.log('📚 Creating courses...');
  const approvedBy = adminUser?._id || null;

  const coursePayloads = [
    {
      title: 'Full-stack Web căn bản: React + Node.js',
      description: 'Lộ trình từ nền tảng đến triển khai: React, API, auth, và triển khai.',
      instructor: teacherUsers[0]._id,
      category: 'programming',
      level: 'beginner',
      price: 1200000,
      discount: 0,
      duration: 420,
      requirements: ['Biết sử dụng máy tính và Internet'],
      whatYouWillLearn: ['React fundamentals', 'REST API với Express', 'JWT auth'],
      tags: ['react', 'nodejs', 'mongodb'],
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
      price: 1500000,
      discount: 0,
      duration: 360,
      requirements: ['Đã học JavaScript/Node.js căn bản'],
      whatYouWillLearn: ['Project structure', 'Error handling', 'Caching basics'],
      tags: ['nodejs', 'express', 'architecture'],
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
      price: 1000000,
      discount: 0,
      duration: 300,
      requirements: ['Biết dùng Figma cơ bản'],
      whatYouWillLearn: ['Design tokens', 'Component variants', 'Handoff cho dev'],
      tags: ['ux', 'ui', 'figma'],
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
      price: 600000,
      discount: 0,
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

  // Upload course thumbnails (optional)
  if (withCloudinaryImages) {
    console.log('🖼️  Uploading course thumbnails...');
    for (const c of createdCourses) {
      const svg = buildThumbSvg({ title: c.title, subtitle: 'Thumbnail khóa học' });
      const url = await uploadSvgToCloudinary({
        svg,
        folder: 'course-thumbnails/seed',
        publicIdHint: `course-thumb-${c._id.toString()}`
      });
      await Course.findByIdAndUpdate(c._id, { $set: { thumbnail: url } });
    }
  } else if (defaultThumbUrls[0]) {
    for (const c of createdCourses) {
      await Course.findByIdAndUpdate(c._id, { $set: { thumbnail: defaultThumbUrls[0] } });
    }
  }

  console.log(`✅ Courses created: ${createdCourses.length}`);

  // Add createdCourses to teachers
  for (const course of createdCourses) {
    await User.findByIdAndUpdate(course.instructor, { $addToSet: { createdCourses: course._id } });
  }

  // Lessons
  console.log('📖 Creating lessons...');
  const lessonTemplates = (courseTitle) => [
    { title: `Giới thiệu & lộ trình (${courseTitle})`, contentType: 'text', isPreview: true },
    { title: 'Bài giảng video: nội dung chính', contentType: 'video', isPreview: false },
    { title: 'Thực hành: bài tập/mini project', contentType: 'quiz', isPreview: false },
    { title: 'Tổng kết & bước tiếp theo', contentType: 'text', isPreview: false }
  ];

  const seedVideoUrls = parseUrlList(process.env.SEED_VIDEO_URLS);
  const effectiveVideoUrls = seedVideoUrls.length ? seedVideoUrls : DEFAULT_CC0_VIDEO_URLS;
  let uploadedVideos = [];
  if (withCloudinaryVideos) {
    if (!seedVideoUrls.length) {
      console.log('🎬 SEED_VIDEO_URLS not provided. Using safe CC0 defaults (MDN cc0-videos).');
    } else {
      console.log('🎬 Uploading seed videos to Cloudinary (from SEED_VIDEO_URLS)...');
    }

    uploadedVideos = await uploadVideoUrlsToCloudinary({ urls: effectiveVideoUrls, folder: 'lesson-videos/seed' });
    console.log(`✅ Seed videos uploaded: ${uploadedVideos.length}`);
    if (uploadedVideos.length === 0) {
      console.log('⚠️ Could not upload any seed videos. Video lessons will fall back to text.');
    }
  }

  const allLessons = [];
  let videoIndex = 0;
  for (const course of createdCourses) {
    const items = lessonTemplates(course.title);
    for (let i = 0; i < items.length; i += 1) {
      const base = {
        title: items[i].title,
        description: 'Bài học được thiết kế theo hướng thực hành, dễ theo dõi.',
        course: course._id,
        order: i + 1,
        content: `Nội dung bài học: ${items[i].title}.\n\n- Mục tiêu\n- Ví dụ\n- Bài tập\n`,
        contentType: items[i].contentType,
        duration: 30 + i * 10,
        isPreview: items[i].isPreview,
        isPublished: true
      };

      if (items[i].contentType === 'video') {
        const v = uploadedVideos.length ? uploadedVideos[videoIndex % uploadedVideos.length] : null;
        videoIndex += 1;
        allLessons.push({
          ...base,
          contentType: v ? 'video' : 'text',
          videoUrl: v ? v.secureUrl : null,
          video: v
            ? {
                provider: 'cloudinary',
                publicId: v.publicId,
                url: v.url,
                secureUrl: v.secureUrl,
                duration: v.duration,
                format: v.format,
                width: v.width,
                height: v.height,
                size: v.size,
                status: 'ready',
                uploadedAt: new Date()
              }
            : undefined
        });
      } else {
        allLessons.push(base);
      }
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
  console.log('🧾 Creating enrollments & payments...');

  const paymentMethods = [
    { type: 'bank-transfer', provider: 'vnpay' },
    { type: 'momo', provider: 'momo' },
    { type: 'credit-card', provider: 'stripe', last4: '4242', brand: 'visa' }
  ];

  const enrollments = [];
  const payments = [];

  for (let i = 0; i < studentUsers.length; i += 1) {
    const student = studentUsers[i];
    const courseA = createdCourses[i % createdCourses.length];
    const courseB = createdCourses[(i + 1) % createdCourses.length];
    const courseC = createdCourses[(i + 2) % createdCourses.length];
    const chosen = i % 3 === 0 ? [courseA, courseB, courseC] : i % 2 === 0 ? [courseA, courseB] : [courseA];

    for (const course of chosen) {
      const courseLessonIds = lessonsByCourse.get(course._id.toString()) || [];
      // Ensure we have some completed enrollments for certificates/reviews/dashboard.
      const shouldComplete = i % 4 === 0 && courseLessonIds.length > 0;
      const completedCount = shouldComplete ? courseLessonIds.length : Math.min(courseLessonIds.length, (i + 1) % 4);
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

      // Create a completed payment for every enrollment (so Dashboard + Revenue match)
      const method = randomPick(paymentMethods);
      const original = course.price;
      const discountAmount = Math.round(original * (course.discount / 100));
      const finalAmount = Math.max(0, original - discountAmount);
      const completedAt = new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000);

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
        timeline: [{ status: 'completed', message: 'Thanh toán hoàn tất', timestamp: completedAt, data: {} }],
        completedAt
      });
    }
  }

  const createdEnrollments = await Enrollment.create(enrollments);
  const createdPayments = await Payment.create(payments);

  // Link payments back to enrollments
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

  console.log('🧩 Seeding extra modules (sections, assignments, submissions, reviews, discussions, chat, study groups, analytics, certificates, coupons, friends)...');

  const now = Date.now();
  const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000);

  const enrollmentsByCourse = new Map();
  const enrollmentByUserCourse = new Map();
  for (const e of createdEnrollments) {
    const courseKey = e.course.toString();
    if (!enrollmentsByCourse.has(courseKey)) enrollmentsByCourse.set(courseKey, []);
    enrollmentsByCourse.get(courseKey).push(e);
    enrollmentByUserCourse.set(`${e.user.toString()}-${courseKey}`, e);
  }

  // 1) Course sections and attach lessons
  const sectionsPayload = [];
  for (const course of createdCourses) {
    sectionsPayload.push(
      {
        course: course._id,
        title: 'Giới thiệu & Nền tảng',
        description: 'Bắt đầu từ các khái niệm nền tảng và setup môi trường.',
        order: 1
      },
      {
        course: course._id,
        title: 'Thực hành & Tổng kết',
        description: 'Bài thực hành, mini project và tổng kết kiến thức.',
        order: 2
      }
    );
  }

  const createdSections = await CourseSection.create(sectionsPayload);
  const sectionsByCourse = new Map();
  for (const s of createdSections) {
    const key = s.course.toString();
    if (!sectionsByCourse.has(key)) sectionsByCourse.set(key, []);
    sectionsByCourse.get(key).push(s);
  }
  for (const [courseId, secs] of sectionsByCourse) {
    secs.sort((a, b) => a.order - b.order);
    sectionsByCourse.set(courseId, secs);
  }

  const lessonDocsByCourse = new Map();
  for (const l of createdLessons) {
    const key = l.course.toString();
    if (!lessonDocsByCourse.has(key)) lessonDocsByCourse.set(key, []);
    lessonDocsByCourse.get(key).push({ id: l._id, order: l.order });
  }
  for (const [courseId, lessonDocs] of lessonDocsByCourse) {
    lessonDocs.sort((a, b) => a.order - b.order);
    lessonDocsByCourse.set(courseId, lessonDocs);
  }

  const lessonSectionUpdates = [];
  for (const course of createdCourses) {
    const courseId = course._id.toString();
    const secs = sectionsByCourse.get(courseId) || [];
    const lessonDocs = lessonDocsByCourse.get(courseId) || [];
    if (secs.length < 2 || lessonDocs.length === 0) continue;
    const mid = Math.ceil(lessonDocs.length / 2);
    for (let idx = 0; idx < lessonDocs.length; idx += 1) {
      const sectionId = idx < mid ? secs[0]._id : secs[1]._id;
      lessonSectionUpdates.push({
        updateOne: {
          filter: { _id: lessonDocs[idx].id },
          update: { $set: { section: sectionId } }
        }
      });
    }
  }
  if (lessonSectionUpdates.length) {
    await Lesson.bulkWrite(lessonSectionUpdates);
  }

  // 2) Assignments
  const assignmentsPayload = [];
  for (const course of createdCourses) {
    const courseId = course._id.toString();
    const courseLessonIds = lessonsByCourse.get(courseId) || [];
    const lessonId = courseLessonIds[0] || null;
    const instructorId = course.instructor;

    assignmentsPayload.push({
      title: `Quiz nhanh: ${course.title}`,
      description: 'Bài quiz ngắn để ôn lại kiến thức chính.',
      course: course._id,
      lesson: lessonId,
      instructor: instructorId,
      type: 'quiz',
      questions: [
        {
          type: 'multiple-choice',
          question: 'HTTP status code nào thường dùng cho “Thành công”?',
          options: [
            { text: '200', isCorrect: true },
            { text: '404', isCorrect: false },
            { text: '500', isCorrect: false },
            { text: '301', isCorrect: false }
          ],
          explanation: '200 OK là mã phổ biến nhất cho request thành công.',
          points: 3,
          order: 1
        },
        {
          type: 'true-false',
          question: 'JWT có thể được lưu trong localStorage (đúng/sai)?',
          correctAnswer: true,
          explanation: 'Có thể lưu, nhưng cần cân nhắc rủi ro XSS.',
          points: 3,
          order: 2
        },
        {
          type: 'fill-blank',
          question: 'Trong REST API, phương thức ____ thường dùng để cập nhật tài nguyên.',
          correctAnswer: 'PUT',
          explanation: 'PUT/PATCH dùng để cập nhật.',
          points: 4,
          order: 3
        }
      ],
      instructions: 'Làm trong 10 phút. Bạn có thể làm lại nếu cần.',
      timeLimit: 10,
      maxAttempts: 2,
      passingScore: 60,
      totalPoints: 10,
      startDate: daysAgo(7),
      dueDate: null,
      isPublished: true,
      allowRetake: true,
      showResultsImmediately: true
    });

    assignmentsPayload.push({
      title: `Mini Project: ${course.title}`,
      description: 'Bài project nhỏ để thực hành triển khai từ đầu đến cuối.',
      course: course._id,
      lesson: null,
      instructor: instructorId,
      type: 'project',
      questions: [],
      instructions: 'Nộp link repo hoặc mô tả cách triển khai. (Demo seed: không yêu cầu file thật)',
      timeLimit: null,
      maxAttempts: 1,
      passingScore: 70,
      totalPoints: 100,
      startDate: daysAgo(10),
      dueDate: daysAgo(-10),
      isPublished: true,
      allowRetake: false,
      showResultsImmediately: false
    });
  }

  const createdAssignments = await Assignment.create(assignmentsPayload);
  const assignmentById = new Map(createdAssignments.map((a) => [a._id.toString(), a]));
  const assignmentsByCourse = new Map();
  for (const a of createdAssignments) {
    const key = a.course.toString();
    if (!assignmentsByCourse.has(key)) assignmentsByCourse.set(key, []);
    assignmentsByCourse.get(key).push(a);
  }

  // 3) Submissions + link to enrollments
  const submissionsPayload = [];
  for (const assignment of createdAssignments) {
    const courseKey = assignment.course.toString();
    const enrolled = (enrollmentsByCourse.get(courseKey) || []).slice(0, 3);
    for (let idx = 0; idx < enrolled.length; idx += 1) {
      const e = enrolled[idx];

      const answers = (assignment.questions || []).map((q) => {
        if (q.type === 'multiple-choice') {
          const correctIdx = (q.options || []).findIndex((o) => o.isCorrect);
          const chosenIdx = idx === 0 ? correctIdx : Math.max(0, Math.min((q.options || []).length - 1, correctIdx + 1));
          const isCorrect = chosenIdx === correctIdx;
          return {
            question: q._id,
            selectedOptions: [chosenIdx],
            textAnswer: null,
            isCorrect,
            pointsEarned: isCorrect ? q.points : 0
          };
        }

        if (q.type === 'true-false') {
          const chosen = idx === 0 ? Boolean(q.correctAnswer) : !Boolean(q.correctAnswer);
          const isCorrect = chosen === Boolean(q.correctAnswer);
          return {
            question: q._id,
            selectedOptions: [],
            textAnswer: chosen ? 'true' : 'false',
            isCorrect,
            pointsEarned: isCorrect ? q.points : 0
          };
        }

        if (q.type === 'fill-blank') {
          const chosen = idx === 0 ? String(q.correctAnswer || '') : 'PATCH';
          const isCorrect = String(chosen).toUpperCase() === String(q.correctAnswer || '').toUpperCase();
          return {
            question: q._id,
            selectedOptions: [],
            textAnswer: chosen,
            isCorrect,
            pointsEarned: isCorrect ? q.points : 0
          };
        }

        // essay / fallback
        return {
          question: q._id,
          selectedOptions: [],
          textAnswer: 'Bài làm demo từ seed.',
          isCorrect: true,
          pointsEarned: q.points || 1
        };
      });

      const totalPoints = assignment.totalPoints;
      const pointsEarned = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
      const score = totalPoints ? Math.round((pointsEarned / totalPoints) * 100) : 0;
      const isQuiz = assignment.type === 'quiz';
      const status = isQuiz ? 'graded' : idx === 0 ? 'submitted' : 'graded';
      const startedAt = daysAgo(5 - idx);
      const submittedAt = daysAgo(4 - idx);

      submissionsPayload.push({
        assignment: assignment._id,
        student: e.user,
        attemptNumber: 1,
        answers,
        startedAt,
        submittedAt,
        timeSpent: 60 * (5 + idx),
        score,
        pointsEarned,
        totalPoints,
        status,
        passed: score >= assignment.passingScore,
        feedback: status === 'graded' ? 'Bài làm demo đã được chấm.' : null,
        gradedBy: status === 'graded' ? assignment.instructor : null,
        gradedAt: status === 'graded' ? submittedAt : null,
        isLate: false
      });
    }
  }

  const createdSubmissions = submissionsPayload.length ? await Submission.create(submissionsPayload) : [];
  const submissionStatsByUserCourse = new Map();
  for (const s of createdSubmissions) {
    const assignment = assignmentById.get(s.assignment.toString());
    if (!assignment) continue;
    const key = `${s.student.toString()}-${assignment.course.toString()}`;
    const existing = submissionStatsByUserCourse.get(key) || { count: 0, scoreSum: 0 };
    submissionStatsByUserCourse.set(key, { count: existing.count + 1, scoreSum: existing.scoreSum + (s.score || 0) });
  }
  if (createdSubmissions.length) {
    const enrollmentUpdates = [];
    for (const s of createdSubmissions) {
      const assignment = assignmentById.get(s.assignment.toString());
      if (!assignment) continue;
      const key = `${s.student.toString()}-${assignment.course.toString()}`;
      const enrollment = enrollmentByUserCourse.get(key);
      if (!enrollment) continue;
      enrollmentUpdates.push({
        updateOne: {
          filter: { _id: enrollment._id },
          update: {
            $addToSet: {
              submittedAssignments: {
                assignment: s.assignment,
                submission: s._id,
                submittedAt: s.submittedAt || new Date(),
                grade: s.score
              }
            }
          }
        }
      });
    }
    if (enrollmentUpdates.length) {
      await Enrollment.bulkWrite(enrollmentUpdates);
    }
  }

  // 4) Reviews + update Course.rating
  const reviewPayload = [];
  for (const course of createdCourses) {
    const enrolled = (enrollmentsByCourse.get(course._id.toString()) || []).slice(0, 4);
    for (let idx = 0; idx < enrolled.length; idx += 1) {
      const e = enrolled[idx];
      const rating = idx === 0 ? 5 : idx === 1 ? 4 : 5 - Math.min(3, idx);
      reviewPayload.push({
        course: course._id,
        user: e.user,
        rating,
        title: idx === 0 ? 'Rất hữu ích' : 'Khóa học ổn',
        comment: idx === 0 ? 'Nội dung rõ ràng, dễ theo dõi. Bài học có ví dụ thực tế.' : 'Bố cục ổn, phù hợp để bắt đầu và thực hành.',
        aspects: {
          contentQuality: Math.min(5, rating),
          instructorQuality: Math.min(5, rating),
          courseStructure: Math.min(5, rating),
          valueForMoney: Math.min(5, rating)
        },
        verified: e.progress === 100,
        completionPercentage: e.progress,
        timeSpentOnCourse: e.totalTimeSpent,
        wouldRecommend: rating >= 4,
        status: 'active'
      });
    }
  }
  const createdReviews = reviewPayload.length ? await Review.create(reviewPayload) : [];

  const ratingByCourse = new Map();
  for (const r of createdReviews) {
    const key = r.course.toString();
    if (!ratingByCourse.has(key)) ratingByCourse.set(key, []);
    ratingByCourse.get(key).push(r.rating);
  }
  const courseRatingUpdates = [];
  for (const [courseId, ratings] of ratingByCourse) {
    const count = ratings.length;
    const average = count ? Math.round((ratings.reduce((s, n) => s + n, 0) / count) * 10) / 10 : 0;
    courseRatingUpdates.push({
      updateOne: {
        filter: { _id: courseId },
        update: { $set: { 'rating.average': average, 'rating.count': count } }
      }
    });
  }
  if (courseRatingUpdates.length) {
    await Course.bulkWrite(courseRatingUpdates);
  }

  // 5) Discussions
  const discussionsPayload = [];
  for (const course of createdCourses) {
    const enrolled = (enrollmentsByCourse.get(course._id.toString()) || []).slice(0, 2);
    const studentAuthor = enrolled[0]?.user || studentUsers[0]._id;
    const lessonId = (lessonsByCourse.get(course._id.toString()) || [])[0] || null;

    discussionsPayload.push({
      course: course._id,
      lesson: lessonId,
      title: `Hỏi đáp: ${course.title}`,
      content: 'Mọi người ơi, phần này mình hơi rối. Có ai giải thích thêm không?',
      author: studentAuthor,
      category: 'question',
      tags: ['seed', 'question'],
      replies: [
        {
          author: course.instructor,
          content: 'Mình gợi ý bạn xem lại ví dụ ở bài trước, rồi thử làm lại theo từng bước. Nếu vướng chỗ nào thì gửi screenshot nhé.'
        }
      ],
      views: 12,
      pinned: false,
      locked: false,
      solved: false,
      lastActivity: daysAgo(1)
    });

    discussionsPayload.push({
      course: course._id,
      lesson: null,
      title: 'Thông báo: Lộ trình học đề xuất',
      content: 'Học theo thứ tự bài và hoàn thành quiz sau mỗi phần để nắm chắc kiến thức.',
      author: course.instructor,
      category: 'announcement',
      tags: ['announcement'],
      replies: [],
      views: 20,
      pinned: true,
      pinnedBy: course.instructor,
      pinnedAt: daysAgo(2),
      locked: false,
      solved: false,
      lastActivity: daysAgo(2)
    });
  }
  const createdDiscussions = discussionsPayload.length ? await Discussion.create(discussionsPayload) : [];

  // 6) Conversations + Messages
  const conversationsPayload = [];
  for (const course of createdCourses) {
    const enrolled = (enrollmentsByCourse.get(course._id.toString()) || []).slice(0, 2);
    for (const e of enrolled) {
      conversationsPayload.push({
        participants: [course.instructor, e.user],
        type: 'direct',
        name: null,
        lastMessage: null,
        lastMessageAt: daysAgo(1),
        unreadCount: {}
      });
    }
  }
  const createdConversations = conversationsPayload.length ? await Conversation.create(conversationsPayload) : [];

  const messagesPayload = [];
  for (const conv of createdConversations) {
    const [a, b] = conv.participants;
    messagesPayload.push(
      {
        conversation: conv._id,
        sender: a,
        content: 'Chào bạn, nếu cần hỗ trợ phần bài tập cứ nhắn nhé!',
        type: 'text',
        isRead: true,
        readAt: daysAgo(1)
      },
      {
        conversation: conv._id,
        sender: b,
        content: 'Dạ cảm ơn thầy/cô, em đang học theo lộ trình và sẽ hỏi nếu vướng ạ.',
        type: 'text',
        isRead: false
      }
    );
  }
  const createdMessages = messagesPayload.length ? await Message.create(messagesPayload) : [];

  if (createdMessages.length) {
    const lastByConv = new Map();
    for (const m of createdMessages) {
      const key = m.conversation.toString();
      const existing = lastByConv.get(key);
      if (!existing || existing.createdAt < m.createdAt) lastByConv.set(key, m);
    }
    const convUpdates = [];
    for (const [convId, msg] of lastByConv) {
      convUpdates.push({
        updateOne: {
          filter: { _id: convId },
          update: { $set: { lastMessage: msg._id, lastMessageAt: msg.createdAt } }
        }
      });
    }
    if (convUpdates.length) {
      await Conversation.bulkWrite(convUpdates);
    }
  }

  // 7) Study groups
  const studyGroupsPayload = [];
  for (const course of createdCourses) {
    const enrolled = (enrollmentsByCourse.get(course._id.toString()) || []).slice(0, 6);
    const members = [
      { user: course.instructor, role: 'admin', joinedAt: daysAgo(10), isActive: true, contributions: 3 },
      ...enrolled.map((e) => ({ user: e.user, role: 'member', joinedAt: daysAgo(8), isActive: true, contributions: 1 }))
    ];
    studyGroupsPayload.push({
      name: `Nhóm học: ${course.title}`,
      description: 'Nhóm học demo từ seed để trao đổi và học cùng nhau.',
      course: course._id,
      creator: course.instructor,
      members,
      moderators: [course.instructor],
      maxMembers: 50,
      isPrivate: false,
      requireApproval: false,
      tags: ['seed', 'study-group'],
      studyLevel: 'mixed',
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      schedule: [
        {
          title: 'Buổi học nhóm #1',
          description: 'Ôn lại kiến thức và giải đáp câu hỏi.',
          date: new Date(now + 3 * 24 * 60 * 60 * 1000),
          duration: 90,
          topic: 'Ôn tập & Q&A',
          meetingUrl: 'https://meet.google.com/seed-demo',
          meetingPlatform: 'google-meet',
          attendees: members.slice(0, 6).map((m) => ({ user: m.user, status: 'going' })),
          status: 'scheduled'
        }
      ],
      rules: ['Tôn trọng lẫn nhau', 'Không spam', 'Chia sẻ có chọn lọc'],
      resources: [
        {
          title: 'Tài liệu tham khảo',
          url: 'https://developer.mozilla.org/',
          type: 'link',
          uploadedBy: course.instructor
        }
      ],
      stats: {
        totalSessions: 1,
        totalStudyHours: 2,
        averageAttendance: 0,
        completionRate: 0
      },
      isActive: true,
      lastActivity: daysAgo(1)
    });
  }
  const createdStudyGroups = studyGroupsPayload.length ? await StudyGroup.create(studyGroupsPayload) : [];

  // 8) Learning analytics (one per enrollment)
  const analyticsPayload = [];
  for (const e of createdEnrollments) {
    const courseId = e.course.toString();
    const totalLessons = (lessonsByCourse.get(courseId) || []).length;
    const totalAssignments = (assignmentsByCourse.get(courseId) || []).length;
    const completedAssignments = submissionStatsByUserCourse.get(`${e.user.toString()}-${courseId}`)?.count || 0;
    const predictedScore = 70 + (Math.abs(parseInt(e.user.toString().slice(-2), 16)) % 25);
    const predictedGrade = gradeFromScore(predictedScore);
    analyticsPayload.push({
      user: e.user,
      course: e.course,
      enrolledDate: e.enrolledAt,
      lastAccessDate: e.lastAccessedAt || new Date(),
      totalTimeSpent: e.totalTimeSpent || 0,
      averageSessionDuration: 25,
      totalSessions: 4,
      completionRate: e.progress,
      averageScore: 75,
      progressData: {
        lessonsCompleted: (e.completedLessons || []).length,
        totalLessons: totalLessons || 1,
        assignmentsCompleted: completedAssignments,
        totalAssignments,
        quizzesCompleted: 1,
        totalQuizzes: 1
      },
      behaviorPatterns: {
        preferredStudyTime: [{ hour: 20, frequency: 3 }],
        averageSessionsPerWeek: 3,
        mostActiveDay: 'Monday',
        studyConsistency: 70
      },
      predictions: {
        completionDate: e.progress === 100 ? (e.completedAt || new Date()) : daysAgo(-14),
        finalGrade: predictedGrade,
        successProbability: Math.min(99, 70 + (predictedScore % 30)),
        riskLevel: 'low'
      },
      weakAreas: [],
      strongAreas: [],
      recommendedCourses: [],
      learningPath: []
    });
  }
  const createdAnalytics = analyticsPayload.length ? await LearningAnalytics.create(analyticsPayload) : [];

  // 9) Certificates for completed enrollments
  const completedEnrollments = createdEnrollments.filter((e) => e.progress === 100);
  const certificatesPayload = [];
  for (const e of completedEnrollments.slice(0, 8)) {
    const course = createdCourses.find((c) => c._id.toString() === e.course.toString());
    const user = createdUsers.find((u) => u._id.toString() === e.user.toString());
    if (!course || !user) continue;

    const certificateId = `CERT-SEED-${course._id.toString().slice(-6)}-${user._id.toString().slice(-6)}`.toUpperCase();
    const certificateName = `Certificate: ${course.title}`;
    const score = 80 + (Math.abs(parseInt(user._id.toString().slice(-2), 16)) % 20);
    const grade = gradeFromScore(score);
    const totalLessons = (lessonsByCourse.get(course._id.toString()) || []).length;
    const totalAssignments = (assignmentsByCourse.get(course._id.toString()) || []).length;
    const completedAssignments = submissionStatsByUserCourse.get(`${e.user.toString()}-${course._id.toString()}`)?.count || 0;
    const svg = buildCertificateSvg({ userName: user.name, courseTitle: course.title, certificateId });
    const certificateUrl = withCloudinaryImages
      ? await uploadSvgToCloudinary({ svg, folder: 'certificates/seed', publicIdHint: `cert-${certificateId}` })
      : svgDataUri(svg);
    const certificateHash = sha256(`${certificateId}|${user._id.toString()}|${course._id.toString()}`);

    certificatesPayload.push({
      user: user._id,
      course: course._id,
      certificateId,
      certificateName,
      completionDate: e.completedAt || new Date(),
      issueDate: new Date(),
      score,
      grade,
      certificateUrl,
      certificateHash,
      verified: true,
      issuedBy: { name: 'E-Learning', title: 'System' },
      courseDuration: Math.max(1, Math.round((course.duration || 60) / 60)),
      skills: ['Fundamentals', 'Practice'],
      metadata: {
        totalLessons: totalLessons || 1,
        completedLessons: totalLessons || 1,
        totalAssignments,
        completedAssignments,
        averageScore: score,
        timeSpent: e.totalTimeSpent || 0
      },
      status: 'active'
    });
  }

  const createdCertificates = certificatesPayload.length ? await Certificate.create(certificatesPayload) : [];
  if (createdCertificates.length) {
    const certUpdates = [];
    for (const cert of createdCertificates) {
      const key = `${cert.user.toString()}-${cert.course.toString()}`;
      const enrollment = enrollmentByUserCourse.get(key);
      if (!enrollment) continue;
      certUpdates.push({
        updateOne: {
          filter: { _id: enrollment._id },
          update: { $set: { certificate: cert._id } }
        }
      });
    }
    if (certUpdates.length) {
      await Enrollment.bulkWrite(certUpdates);
    }
  }

  // 10) Coupons
  const couponStart = daysAgo(1);
  const couponEnd = daysAgo(-30);
  const courseIds = createdCourses.map((c) => c._id);
  const couponsPayload = [
    {
      code: 'SEED20',
      name: 'Giảm 20% (Seed)',
      description: 'Coupon demo cho môi trường seed.',
      type: 'percentage',
      value: 20,
      maxDiscountAmount: 200000,
      minOrderAmount: 0,
      validity: { startDate: couponStart, endDate: couponEnd },
      applicableFor: { courseIds, categories: [], instructorIds: [], userGroups: ['all'], minCoursePrice: 0, maxCoursePrice: null },
      createdBy: adminUser._id,
      status: 'active',
      stackable: false,
      priority: 1
    },
    {
      code: 'SEED100K',
      name: 'Giảm 100k (Seed)',
      description: 'Coupon demo giảm giá cố định.',
      type: 'fixed-amount',
      value: 100000,
      minOrderAmount: 0,
      validity: { startDate: couponStart, endDate: couponEnd },
      applicableFor: { courseIds: courseIds.slice(0, 2), categories: [], instructorIds: [], userGroups: ['all'], minCoursePrice: 0, maxCoursePrice: null },
      createdBy: adminUser._id,
      status: 'active',
      stackable: false,
      priority: 0
    }
  ];
  const createdCoupons = await Coupon.create(couponsPayload);

  // 11) Friend requests + friendships
  const [s1, s2, s3, s4] = studentUsers;
  const friendRequestsPayload = [];
  if (s1 && s2) {
    friendRequestsPayload.push({ fromUser: s1._id, toUser: s2._id, status: 'pending', createdAt: daysAgo(2) });
  }
  if (s3 && s4) {
    friendRequestsPayload.push({ fromUser: s3._id, toUser: s4._id, status: 'accepted', createdAt: daysAgo(5), respondedAt: daysAgo(4) });
  }
  const createdFriendRequests = friendRequestsPayload.length ? await FriendRequest.create(friendRequestsPayload) : [];

  const friendshipsPayload = [];
  if (s3 && s4) {
    const a = s3._id.toString() < s4._id.toString() ? s3._id : s4._id;
    const b = s3._id.toString() < s4._id.toString() ? s4._id : s3._id;
    friendshipsPayload.push({ userA: a, userB: b, createdAt: daysAgo(4) });
  }
  const createdFriendships = friendshipsPayload.length ? await Friendship.create(friendshipsPayload) : [];

  console.log(`✅ Sections created: ${createdSections.length}`);
  console.log(`✅ Assignments created: ${createdAssignments.length}`);
  console.log(`✅ Submissions created: ${createdSubmissions.length}`);
  console.log(`✅ Reviews created: ${createdReviews.length}`);
  console.log(`✅ Discussions created: ${createdDiscussions.length}`);
  console.log(`✅ Conversations created: ${createdConversations.length}`);
  console.log(`✅ Messages created: ${createdMessages.length}`);
  console.log(`✅ StudyGroups created: ${createdStudyGroups.length}`);
  console.log(`✅ LearningAnalytics created: ${createdAnalytics.length}`);
  console.log(`✅ Certificates created: ${createdCertificates.length}`);
  console.log(`✅ Coupons created: ${createdCoupons.length}`);
  console.log(`✅ FriendRequests created: ${createdFriendRequests.length}`);
  console.log(`✅ Friendships created: ${createdFriendships.length}`);

  console.log('\n🎉 Seed rich completed successfully!');
  console.log('🔐 Default password for all seeded accounts:', defaultPassword);
  console.log('\nAccounts:');
  console.log('- admin@example.com');
  console.log('- khoa.nguyen@example.com');
  console.log('- ha.tran@example.com');
  console.log('- student1@example.com .. student12@example.com');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

seedRich().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

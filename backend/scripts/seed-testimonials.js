/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const Testimonial = require('../src/models/Testimonial');

const getArgValue = (name) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
};

const hasFlag = (name) => process.argv.includes(name);

// Upload local image file to Cloudinary, return secure_url
const uploadToCloudinary = async (cloudinary, localPath, publicId) => {
  console.log(`  ☁️  Uploading ${path.basename(localPath)} to Cloudinary...`);
  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'elearning/testimonials',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
  console.log(`  ✅ Uploaded: ${result.secure_url}`);
  return result.secure_url;
};

const main = async () => {
  const envFile = getArgValue('--env-file');
  if (envFile) {
    dotenv.config({ path: envFile });
  } else {
    dotenv.config();
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Missing MONGODB_URI in environment');
    process.exit(1);
  }

  // Setup Cloudinary
  const cloudinaryV2 = require('cloudinary').v2;
  cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const reset = hasFlag('--reset');
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'testimonials');

  // Build person data with local file info
  const persons = [
    {
      name: 'Nguyễn Anh',
      slug: 'nguyen-anh',
      role: 'Kỹ sư phần mềm tại FPT',
      comment: 'Chương trình học có lộ trình rõ ràng và giảng viên tận tâm đã giúp tôi đạt được công việc mơ ước.',
      rating: 5,
      localFile: 'nguyen-anh.jpg',
      bio: 'Tôi bắt đầu học với mục tiêu nâng cấp kỹ năng lập trình và có một lộ trình rõ ràng. Sau khi hoàn thành chương trình, tôi tự tin ứng tuyển và đã có cơ hội làm việc trong môi trường chuyên nghiệp.\n\nĐiều tôi ấn tượng nhất là nội dung sát thực tế, bài tập có tính ứng dụng cao và sự hỗ trợ nhanh từ giảng viên/mentor.',
      highlights: [
        'Hoàn thành lộ trình học tập theo tuần, bám sát mục tiêu',
        'Xây dựng dự án cá nhân để đưa vào CV',
        'Tự tin phỏng vấn nhờ luyện tập theo tình huống thực tế'
      ],
      order: 1
    },
    {
      name: 'Trần Văn Bình',
      slug: 'tran-van-binh',
      role: 'Chuyển hướng nghề nghiệp',
      comment: 'Tôi tìm đúng thứ mình cần. Cách giảng dạy dễ hiểu và hỗ trợ rất tốt.',
      rating: 5,
      localFile: 'tran-van-binh.jpg',
      bio: 'Tôi chuyển hướng nghề nghiệp từ một lĩnh vực khác sang công nghệ và từng gặp khó khăn khi tự học. Nhờ lộ trình bài bản và cộng đồng hỗ trợ, tôi đã đi từ nền tảng đến triển khai dự án hoàn chỉnh.\n\nQuan trọng hơn, tôi biết cách tự học đúng và đo lường tiến bộ của mình theo từng giai đoạn.',
      highlights: [
        'Nắm vững nền tảng trước khi đi sâu',
        'Học theo dự án và nhận phản hồi liên tục',
        'Tối ưu thời gian học nhờ lộ trình rõ ràng'
      ],
      order: 2
    },
    {
      name: 'Lê Thị Cẩm',
      slug: 'le-thi-cam',
      role: 'Sinh viên mới tốt nghiệp',
      comment: 'Tăng sự tự tin nhờ kiến thức thực tiễn và cơ hội kết nối tuyệt vời.',
      rating: 5,
      localFile: 'le-thi-cam.jpg',
      bio: 'Tôi là sinh viên mới ra trường và muốn học thêm kỹ năng thực chiến để sớm đi làm. Chương trình giúp tôi hệ thống lại kiến thức, luyện tập theo yêu cầu tuyển dụng và cải thiện sự tự tin khi trình bày dự án.\n\nTôi cũng có thêm cơ hội kết nối và học hỏi từ những người cùng mục tiêu.',
      highlights: [
        'Củng cố kiến thức cốt lõi và thực hành đều đặn',
        'Chuẩn bị portfolio/dự án theo chuẩn tuyển dụng',
        'Tăng sự tự tin khi thuyết trình và làm việc nhóm'
      ],
      order: 3
    }
  ];

  // Upload images to Cloudinary first
  console.log('\n📸 Uploading avatars to Cloudinary...');
  const docs = [];
  for (const person of persons) {
    let avatarUrl = '';
    const localPath = path.join(uploadsDir, person.localFile);
    if (fs.existsSync(localPath)) {
      try {
        avatarUrl = await uploadToCloudinary(cloudinaryV2, localPath, person.slug);
      } catch (err) {
        console.warn(`  ⚠️  Cloudinary upload failed for ${person.slug}: ${err.message}`);
        avatarUrl = `/uploads/testimonials/${person.localFile}`;
      }
    } else {
      console.warn(`  ⚠️  Local file not found: ${localPath} — skipping upload`);
    }

    docs.push({
      name: person.name,
      slug: person.slug,
      role: person.role,
      comment: person.comment,
      rating: person.rating,
      avatarUrl,
      bio: person.bio,
      highlights: person.highlights,
      order: person.order,
      isActive: true
    });
  }

  // Connect and upsert
  await mongoose.connect(mongoUri);
  console.log('\n✅ Connected to MongoDB');

  if (reset) {
    const del = await Testimonial.deleteMany({});
    console.log(`🧹 Reset testimonials: deleted ${del.deletedCount}`);
  }

  let upserted = 0;
  for (const doc of docs) {
    const result = await Testimonial.updateOne(
      { slug: doc.slug },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0) upserted += result.upsertedCount;
    console.log(`  💾 ${doc.name} → avatarUrl: ${doc.avatarUrl.slice(0, 80)}`);
  }

  const total = await Testimonial.countDocuments({});
  console.log(`\n✅ Seeded testimonials. Upserted: ${upserted}. Total: ${total}`);

  await mongoose.disconnect();
  console.log('👋 Done');
};

main().catch((err) => {
  console.error('❌ Seed testimonials failed:', err);
  process.exit(1);
});

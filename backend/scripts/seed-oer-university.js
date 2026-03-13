const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const CourseSection = require('../src/models/CourseSection');

const hasFlag = (name) => process.argv.includes(name);

const OER_COURSES = [
  {
    title: 'Python for Data Literacy (OER University Track)',
    description:
      'Lộ trình học Python tập trung cho sinh viên mới bắt đầu, kết hợp nội dung mở từ MIT OCW, OpenStax và tài liệu học thuật công khai.',
    category: 'programming',
    level: 'beginner',
    price: 990000,
    discount: 20,
    duration: 720,
    requirements: [
      'Không cần nền tảng lập trình',
      'Có máy tính cá nhân',
      'Sẵn sàng học tối thiểu 30 phút/ngày'
    ],
    whatYouWillLearn: [
      'Viết chương trình Python cơ bản đến trung cấp',
      'Xử lý dữ liệu CSV/JSON và trực quan hóa đơn giản',
      'Đọc hiểu tài liệu học thuật bằng kỹ thuật note theo lesson'
    ],
    tags: ['python', 'oer', 'data-literacy', 'university'],
    modules: [
      {
        title: 'Module 1 - Foundations',
        description: 'Khởi động với tư duy lập trình và môi trường Python.',
        lessons: [
          {
            title: 'Lesson 1.1 - Tư duy thuật toán cho người mới',
            contentType: 'text',
            duration: 35,
            isPreview: true,
            content:
              'Mục tiêu: nắm tư duy input-process-output, phân rã bài toán, và mô hình kiểm thử thủ công trước khi code.\n\nChecklist:\n1) Viết giả mã\n2) Xác định dữ liệu đầu vào\n3) Dự đoán đầu ra mẫu\n4) Đánh giá độ phức tạp mức cơ bản.',
            resources: [
              {
                name: 'MIT OCW - Intro to CS & Python (course page, CC BY-NC-SA)',
                url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
                type: 'link'
              },
              {
                name: 'OpenStax - Introduction to Python chapter references (open textbook)',
                url: 'https://openstax.org/subjects/science',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.2 - Video mini: Biến, kiểu dữ liệu, toán tử',
            contentType: 'video',
            duration: 28,
            isPreview: true,
            videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
            content:
              'Video ngắn để ôn nhanh biến và kiểu dữ liệu. Sau video, học viên hoàn thành 8 bài tập nhập/xuất và ép kiểu.',
            resources: [
              {
                name: 'University of Michigan Python materials (open learning links)',
                url: 'https://www.coursera.org/specializations/python',
                type: 'link'
              },
              {
                name: 'MIT OCW - Lecture notes and handouts (open course materials)',
                url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/pages/lecture-notes/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.3 - PDF worksheet: Điều kiện và vòng lặp',
            contentType: 'pdf',
            duration: 40,
            content:
              'Worksheet PDF hướng dẫn if/else, for/while, break/continue với 20 tình huống thực tế trong lớp đại học.',
            resources: [
              {
                name: 'Python Data Structures handbook PDF (open educational use)',
                url: 'https://www.py4e.com/book.php',
                type: 'pdf'
              }
            ]
          },
          {
            title: 'Lesson 1.4 - Lab: Hàm và tái sử dụng code',
            contentType: 'text',
            duration: 45,
            content:
              'Bài lab yêu cầu tách chức năng thành hàm, viết docstring theo chuẩn cơ bản, và test thủ công với bộ input đa dạng.',
            resources: [
              {
                name: 'MIT OCW assignments and labs reference',
                url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/pages/assignments/',
                type: 'link'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 2 - Data Handling',
        description: 'Làm việc với file, cấu trúc dữ liệu và mini analytics.',
        lessons: [
          {
            title: 'Lesson 2.1 - Danh sách, dict, set chuyên sâu',
            contentType: 'text',
            duration: 35,
            content:
              'Thực hành 15 bài tập thao tác list/dict/set và tối ưu độ đọc hiểu bằng pattern chuẩn trong học phần nhập môn.',
            resources: [
              {
                name: 'Stanford Code in Place (course materials)',
                url: 'https://codeinplace.stanford.edu/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 2.2 - Video mini: Đọc ghi CSV/JSON',
            contentType: 'video',
            duration: 32,
            videoUrl: 'https://www.youtube.com/watch?v=Xi52tx6phRU',
            content:
              'Video ngắn về quy trình ETL cơ bản với file CSV/JSON và lỗi thường gặp trong dữ liệu thực tế.',
            resources: [
              {
                name: 'OECD open data quick start (public data source)',
                url: 'https://www.oecd.org/en/data.html',
                type: 'link'
              },
              {
                name: 'Stanford Data Science open resources',
                url: 'https://datascience.stanford.edu/education',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 2.3 - PDF: Data cleaning checklist',
            contentType: 'pdf',
            duration: 25,
            content:
              'Checklist làm sạch dữ liệu dùng trong bài tập nhóm: missing values, outlier, standardization, và metadata log.',
            resources: [
              {
                name: 'World Bank open learning resources',
                url: 'https://olc.worldbank.org/',
                type: 'pdf'
              }
            ]
          },
          {
            title: 'Lesson 2.4 - Mini project: Student performance report',
            contentType: 'quiz',
            duration: 50,
            content:
              'Project dựng báo cáo kết quả học tập bằng Python: tổng hợp điểm, phân nhóm, tạo biểu đồ cơ bản và viết kết luận.',
            resources: [
              {
                name: 'Project rubric (Google Doc template)',
                url: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
                type: 'doc'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 3 - Applied University Case',
        description: 'Case study mô phỏng học phần đại học với tiến độ theo tuần.',
        lessons: [
          {
            title: 'Lesson 3.1 - Capstone brief và timeline',
            contentType: 'text',
            duration: 30,
            content:
              'Sinh viên lập kế hoạch capstone 3 tuần: mục tiêu, phân rã task, KPI đầu ra, và cơ chế peer-review.',
            resources: [
              {
                name: 'MIT OCW - project-style learning references',
                url: 'https://ocw.mit.edu/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 3.2 - Video mini: trình bày kết quả bằng storytelling',
            contentType: 'video',
            duration: 22,
            videoUrl: 'https://www.youtube.com/watch?v=7yDmGnA8Hw0',
            content:
              'Hướng dẫn kể chuyện dữ liệu trong 3 phút, tập trung bối cảnh-vấn đề-kết luận cho hội đồng học thuật.',
            resources: [
              {
                name: 'OpenLearn communication short course',
                url: 'https://www.open.edu/openlearn/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 3.3 - Tài liệu PDF tổng kết học phần',
            contentType: 'pdf',
            duration: 20,
            content:
              'Tổng kết checklist nộp bài, chuẩn hóa repo, viết báo cáo và chuẩn bị demo.',
            resources: [
              {
                name: 'Open textbook library (PDF sources, mixed open licenses)',
                url: 'https://open.umn.edu/opentextbooks',
                type: 'pdf'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Modern Web Development Studio (University Open Materials)',
    description:
      'Khóa học web development thực hành theo cấu trúc học phần đại học: HTML/CSS/JS, API, deployment, quality assurance.',
    category: 'programming',
    level: 'intermediate',
    price: 1290000,
    discount: 15,
    duration: 840,
    requirements: ['Đã biết HTML/CSS căn bản', 'Có kinh nghiệm dùng trình duyệt devtools'],
    whatYouWillLearn: [
      'Xây ứng dụng frontend theo component',
      'Thiết kế REST API có validation',
      'Triển khai production với checklist chất lượng'
    ],
    tags: ['web', 'javascript', 'api', 'deployment', 'oer'],
    modules: [
      {
        title: 'Module 1 - Frontend Core',
        description: 'Chuẩn hóa giao diện và luồng dữ liệu phía client.',
        lessons: [
          {
            title: 'Lesson 1.1 - Semantic HTML và accessibility',
            contentType: 'text',
            duration: 30,
            isPreview: true,
            content: 'Học semantic tags, aria labels, keyboard navigation và kiểm tra truy cập cơ bản.',
            resources: [
              {
                name: 'W3C Web Accessibility Tutorials',
                url: 'https://www.w3.org/WAI/tutorials/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.2 - Video mini: CSS architecture',
            contentType: 'video',
            duration: 24,
            isPreview: true,
            videoUrl: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
            content: 'Học BEM/utility layering và chiến lược scale stylesheet trong dự án thật.',
            resources: [
              {
                name: 'Open source design systems references',
                url: 'https://designsystemsrepo.com/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.3 - PDF: JavaScript architecture notes',
            contentType: 'pdf',
            duration: 35,
            content: 'Ghi chú kiến trúc module, state flow và boundary giữa domain/UI/service.',
            resources: [
              {
                name: 'MDN JavaScript Guide',
                url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
                type: 'pdf'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 2 - Backend API',
        description: 'Thiết kế và bảo vệ API cho ứng dụng học trực tuyến.',
        lessons: [
          {
            title: 'Lesson 2.1 - REST contract và versioning',
            contentType: 'text',
            duration: 32,
            content: 'Thiết kế endpoint, error model, pagination và versioning strategy cho hệ thống tăng trưởng nhanh.',
            resources: [
              {
                name: 'Microsoft REST API Guidelines',
                url: 'https://github.com/microsoft/api-guidelines',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 2.2 - Video mini: Auth flow JWT',
            contentType: 'video',
            duration: 26,
            videoUrl: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
            content: 'Mô phỏng flow access token/refresh token, revoke và bảo vệ route nhạy cảm.',
            resources: [
              {
                name: 'OWASP API Security Top 10',
                url: 'https://owasp.org/www-project-api-security/',
                type: 'pdf'
              }
            ]
          },
          {
            title: 'Lesson 2.3 - Assignment spec DOC: API quality rubric',
            contentType: 'quiz',
            duration: 40,
            content: 'Bài tập đánh giá API theo rubric: correctness, reliability, observability, security.',
            resources: [
              {
                name: 'API rubric template (DOC placeholder - replace with approved school rubric)',
                url: 'https://ocw.mit.edu/',
                type: 'link'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 3 - Deployment & QA',
        description: 'Đóng gói, triển khai và kiểm thử end-to-end.',
        lessons: [
          {
            title: 'Lesson 3.1 - CI/CD checklist theo học phần',
            contentType: 'text',
            duration: 30,
            content: 'Thiết kế pipeline build-test-deploy và quy tắc rollback.',
            resources: [
              {
                name: 'GitHub Actions docs',
                url: 'https://docs.github.com/actions',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 3.2 - Video mini: test strategy cho web app',
            contentType: 'video',
            duration: 24,
            videoUrl: 'https://www.youtube.com/watch?v=Jv2uxzhPFl4',
            content: 'Lập ma trận test unit/integration/e2e và quy tắc ưu tiên case.',
            resources: [
              {
                name: 'Cypress documentation',
                url: 'https://docs.cypress.io/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 3.3 - PDF: production incident playbook',
            contentType: 'pdf',
            duration: 20,
            content: 'Hướng dẫn xử lý sự cố production, ghi nhận timeline và postmortem.',
            resources: [
              {
                name: 'Google SRE workbook (open content)',
                url: 'https://sre.google/workbook/table-of-contents/',
                type: 'pdf'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: 'Data Analytics for Business Decisions (Open University Bundle)',
    description:
      'Khóa học phân tích dữ liệu ứng dụng cho kinh doanh với case thực tế, dashboard, và báo cáo quyết định theo chuẩn đại học.',
    category: 'business',
    level: 'intermediate',
    price: 1190000,
    discount: 10,
    duration: 780,
    requirements: ['Hiểu Excel cơ bản', 'Đã học thống kê mô tả sơ cấp'],
    whatYouWillLearn: [
      'Làm sạch và phân tích dữ liệu kinh doanh',
      'Tạo dashboard theo mục tiêu quản trị',
      'Viết báo cáo quyết định dựa trên bằng chứng dữ liệu'
    ],
    tags: ['analytics', 'business', 'dashboard', 'oer'],
    modules: [
      {
        title: 'Module 1 - Data Thinking',
        description: 'Tư duy dữ liệu cho quản trị và lập kế hoạch.',
        lessons: [
          {
            title: 'Lesson 1.1 - Framing business questions',
            contentType: 'text',
            duration: 28,
            content: 'Học cách chuyển câu hỏi kinh doanh thành chỉ số đo lường và giả thuyết kiểm định.',
            resources: [
              {
                name: 'Wharton analytics resources (public learning)',
                url: 'https://online.wharton.upenn.edu/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.2 - Video mini: KPI hierarchy',
            contentType: 'video',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=sE4x5gM6fU0',
            content: 'Thiết kế cây KPI từ north-star metric xuống các leading indicator.',
            resources: [
              {
                name: 'OpenLearn data and business short courses',
                url: 'https://www.open.edu/openlearn/money-business',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 1.3 - PDF reading pack: descriptive stats',
            contentType: 'pdf',
            duration: 30,
            content: 'Bộ đọc nhanh thống kê mô tả dùng cho các bài tập dashboard và dự báo cơ bản.',
            resources: [
              {
                name: 'OpenIntro Statistics (open textbook PDF)',
                url: 'https://www.openintro.org/book/os/',
                type: 'pdf'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 2 - Dashboard & Storytelling',
        description: 'Thiết kế dashboard phục vụ quyết định.',
        lessons: [
          {
            title: 'Lesson 2.1 - Data visualization principles',
            contentType: 'text',
            duration: 30,
            content: 'Chọn chart type đúng ngữ cảnh, tránh hiểu nhầm dữ liệu và tối ưu khả năng đọc.',
            resources: [
              {
                name: 'Data Viz Catalogue',
                url: 'https://datavizcatalogue.com/',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 2.2 - Video mini: dashboard critique',
            contentType: 'video',
            duration: 24,
            videoUrl: 'https://www.youtube.com/watch?v=5Zg-C8AAIGg',
            content: 'Phân tích dashboard sai/đúng và cách chỉnh sửa theo nguyên tắc nhận thức thị giác.',
            resources: [
              {
                name: 'Storytelling with Data blog',
                url: 'https://www.storytellingwithdata.com/blog',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 2.3 - DOC assignment template: executive summary',
            contentType: 'quiz',
            duration: 36,
            content: 'Nộp executive summary 1 trang: bối cảnh, insight chính, đề xuất hành động.',
            resources: [
              {
                name: 'Executive summary DOC template (placeholder)',
                url: 'https://www.open.edu/openlearn/',
                type: 'link'
              }
            ]
          }
        ]
      },
      {
        title: 'Module 3 - Decision Lab',
        description: 'Phòng lab ra quyết định dựa trên dữ liệu.',
        lessons: [
          {
            title: 'Lesson 3.1 - A/B testing basics',
            contentType: 'text',
            duration: 30,
            content: 'Học cách đọc kết quả A/B test và tránh sai lầm diễn giải.',
            resources: [
              {
                name: 'Khan Academy statistics and probability',
                url: 'https://www.khanacademy.org/math/statistics-probability',
                type: 'link'
              }
            ]
          },
          {
            title: 'Lesson 3.2 - Video mini: communicating uncertainty',
            contentType: 'video',
            duration: 22,
            videoUrl: 'https://www.youtube.com/watch?v=8idr1WZ1A7Q',
            content: 'Trình bày độ bất định cho stakeholder không chuyên bằng ngôn ngữ dễ hiểu.',
            resources: [
              {
                name: 'Our World in Data methodology notes',
                url: 'https://ourworldindata.org/methods',
                type: 'pdf'
              }
            ]
          },
          {
            title: 'Lesson 3.3 - Final PDF checklist cho đồ án dữ liệu',
            contentType: 'pdf',
            duration: 18,
            content: 'Checklist trước khi nộp đồ án: reproducibility, nguồn dữ liệu, và fairness note.',
            resources: [
              {
                name: 'UN data and SDG resources (open)',
                url: 'https://unstats.un.org/sdgs/dataportal',
                type: 'pdf'
              }
            ]
          }
        ]
      }
    ]
  }
];

async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in backend/.env');
  }
  await mongoose.connect(process.env.MONGODB_URI);
}

async function pickInstructors() {
  const users = await User.find({ isAdmin: false }).sort({ createdAt: 1 }).limit(6);
  if (users.length < 1) {
    throw new Error('Không tìm thấy tài khoản giảng viên/người dùng để seed.');
  }
  return users;
}

async function createCourseTree({ instructor, courseInput, approvedBy, dryRun }) {
  const existing = await Course.findOne({
    title: courseInput.title,
    instructor: instructor._id
  })
    .select('_id title')
    .lean();

  if (existing) {
    console.log(`⏭️  Skip existing: ${existing.title}`);
    return { created: false, courseId: existing._id, lessonCount: 0, sectionCount: 0 };
  }

  const flatLessons = courseInput.modules.flatMap((m) => m.lessons);
  const totalDuration = flatLessons.reduce((sum, l) => sum + (l.duration || 0), 0);

  if (dryRun) {
    console.log(`🧪 [dry-run] Would create course: ${courseInput.title}`);
    return {
      created: true,
      courseId: null,
      lessonCount: flatLessons.length,
      sectionCount: courseInput.modules.length,
      duration: totalDuration
    };
  }

  const course = await Course.create({
    title: courseInput.title,
    description: courseInput.description,
    instructor: instructor._id,
    category: courseInput.category,
    level: courseInput.level,
    price: courseInput.price,
    discount: courseInput.discount,
    duration: totalDuration || courseInput.duration,
    requirements: courseInput.requirements,
    whatYouWillLearn: courseInput.whatYouWillLearn,
    tags: courseInput.tags,
    status: 'approved',
    approvedBy: approvedBy || null,
    approvedAt: new Date(),
    isPublished: true
  });

  const sections = [];
  for (let i = 0; i < courseInput.modules.length; i += 1) {
    const mod = courseInput.modules[i];
    const section = await CourseSection.create({
      course: course._id,
      title: mod.title,
      description: mod.description,
      order: i + 1
    });
    sections.push(section);
  }

  const lessons = [];
  let order = 1;
  for (let i = 0; i < courseInput.modules.length; i += 1) {
    const mod = courseInput.modules[i];
    const section = sections[i];

    for (const lesson of mod.lessons) {
      const lessonDoc = await Lesson.create({
        title: lesson.title,
        description: `Nguồn OER: tài liệu mở có trích nguồn trong resources.`,
        course: course._id,
        section: section._id,
        order,
        content: lesson.content,
        contentType: lesson.contentType,
        duration: lesson.duration,
        isPreview: Boolean(lesson.isPreview),
        isPublished: true,
        videoUrl: lesson.videoUrl || null,
        resources: (lesson.resources || []).map((r) => ({
          name: r.name,
          url: r.url,
          type: r.type || 'link'
        }))
      });

      lessons.push(lessonDoc._id);
      order += 1;
    }
  }

  await Course.findByIdAndUpdate(course._id, { $set: { lessons } });
  await User.findByIdAndUpdate(instructor._id, { $addToSet: { createdCourses: course._id } });

  return {
    created: true,
    courseId: course._id,
    lessonCount: lessons.length,
    sectionCount: sections.length,
    duration: totalDuration
  };
}

async function run() {
  const dryRun = hasFlag('--dry-run');
  try {
    await connectDb();

    const instructors = await pickInstructors();
    const admin = await User.findOne({ isAdmin: true }).select('_id').lean();

    let createdCourses = 0;
    let createdLessons = 0;
    let createdSections = 0;

    for (let i = 0; i < OER_COURSES.length; i += 1) {
      const instructor = instructors[i % instructors.length];
      const result = await createCourseTree({
        instructor,
        courseInput: OER_COURSES[i],
        approvedBy: admin?._id,
        dryRun
      });

      if (result.created) {
        createdCourses += 1;
        createdLessons += result.lessonCount;
        createdSections += result.sectionCount;
      }
    }

    console.log('');
    console.log('✅ OER university seed completed');
    console.log(`   Courses: ${createdCourses}`);
    console.log(`   Sections: ${createdSections}`);
    console.log(`   Lessons: ${createdLessons}`);
    console.log(`   Mode: ${dryRun ? 'dry-run' : 'write'}`);
    console.log('');
    console.log('⚠️ Legal note: chỉ dùng nguồn có giấy phép phù hợp (OER/Creative Commons) và cần review lại từng link trước khi production/commercial use.');
  } catch (err) {
    console.error('❌ seed-oer-university failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🌱 Starting comprehensive seed...');

const users = [
  {
    name: 'Admin System',
    email: 'admin@elearning.com',
    password: '123456',
    isAdmin: true,
    emailVerified: true,
    bio: 'Quản trị viên hệ thống E-Learning'
  },
  {
    name: 'Hà Quang Trung',
    email: 'haquangtrung1534@gmail.com',
    password: '123456',
    isAdmin: false,
    emailVerified: true,
    bio: 'Giảng viên lập trình với 5 năm kinh nghiệm'
  },
  {
    name: 'Nguyễn Văn Nam',
    email: 'nguyenvannam@gmail.com',
    password: '123456',
    isAdmin: false,
    emailVerified: true,
    bio: 'Chuyên gia thiết kế UI/UX'
  },
  {
    name: 'Trần Thị Lan',
    email: 'tranthilan@gmail.com',
    password: '123456',
    isAdmin: false,
    emailVerified: true,
    bio: 'Học viên chăm chỉ'
  },
  {
    name: 'Lê Minh Hoàng',
    email: 'leminhhoang@gmail.com',
    password: '123456',
    isAdmin: false,
    emailVerified: true,
    bio: 'Sinh viên công nghệ thông tin'
  }
];

const courses = [
  {
    title: 'Lập trình Java cơ bản',
    description: 'Khóa học Java từ cơ bản đến nâng cao, bao gồm OOP, Collections, Exception Handling và các design patterns phổ biến.',
    category: 'programming',
    level: 'beginner',
    price: 299000,
    discount: 10,
    duration: 180,
    status: 'approved',
    isPublished: true,
    requirements: [
      'Biết sử dụng máy tính cơ bản',
      'Có sự kiên trì và ham học hỏi'
    ],
    whatYouWillLearn: [
      'Nắm vững cú pháp Java cơ bản',
      'Hiểu và áp dụng OOP trong Java',
      'Sử dụng Collections Framework',
      'Xử lý exception và debugging'
    ],
    tags: ['java', 'programming', 'oop', 'beginner']
  },
  {
    title: 'React & TypeScript cho người mới',
    description: 'Học React với TypeScript từ zero. Xây dựng ứng dụng web hiện đại với hooks, context API và best practices.',
    category: 'programming',
    level: 'intermediate',
    price: 499000,
    discount: 20,
    duration: 240,
    status: 'pending',
    isPublished: false,
    requirements: [
      'Có kiến thức HTML, CSS cơ bản',
      'Biết JavaScript ES6+',
      'Hiểu về npm và Node.js'
    ],
    whatYouWillLearn: [
      'Tạo component với React',
      'Quản lý state với useState và useEffect',
      'Sử dụng TypeScript với React',
      'Xây dựng ứng dụng hoàn chỉnh'
    ],
    tags: ['react', 'typescript', 'frontend', 'javascript']
  },
  {
    title: 'UI/UX Design với Figma',
    description: 'Khóa học thiết kế giao diện người dùng chuyên nghiệp. Từ research, wireframe đến prototype hoàn chỉnh.',
    category: 'design',
    level: 'beginner',
    price: 399000,
    discount: 15,
    duration: 160,
    status: 'approved',
    isPublished: true,
    requirements: [
      'Có máy tính với Figma',
      'Tư duy sáng tạo',
      'Kiên nhẫn và tỉ mỉ'
    ],
    whatYouWillLearn: [
      'Nguyên tắc thiết kế UI/UX',
      'Sử dụng Figma chuyên nghiệp',
      'Tạo wireframe và prototype',
      'User research và testing'
    ],
    tags: ['figma', 'ui', 'ux', 'design']
  },
  {
    title: 'Marketing Digital toàn diện',
    description: 'Chiến lược marketing online hiệu quả. SEO, SEM, Social Media Marketing và Analytics.',
    category: 'marketing',
    level: 'intermediate',
    price: 599000,
    discount: 25,
    duration: 200,
    status: 'draft',
    isPublished: false,
    requirements: [
      'Hiểu biết cơ bản về business',
      'Biết sử dụng mạng xã hội',
      'Có tư duy phân tích'
    ],
    whatYouWillLearn: [
      'Xây dựng chiến lược marketing',
      'SEO và SEM hiệu quả',
      'Social Media Marketing',
      'Phân tích và đo lường ROI'
    ],
    tags: ['marketing', 'seo', 'social-media', 'analytics']
  }
];

const lessons = [
  // Java Course Lessons
  [
    {
      title: 'Giới thiệu về Java',
      description: 'Tổng quan về ngôn ngữ lập trình Java, lịch sử và ứng dụng',
      order: 1,
      content: 'Java là ngôn ngữ lập trình hướng đối tượng được phát triển bởi Sun Microsystems...',
      contentType: 'text',
      duration: 30,
      isPreview: true,
      isPublished: true
    },
    {
      title: 'Cài đặt môi trường Java',
      description: 'Hướng dẫn cài đặt JDK, IDE và tạo project đầu tiên',
      order: 2,
      content: 'Để bắt đầu lập trình Java, chúng ta cần cài đặt Java Development Kit (JDK)...',
      contentType: 'video',
      videoUrl: 'https://example.com/java-setup.mp4',
      duration: 45,
      isPreview: false,
      isPublished: true
    },
    {
      title: 'Biến và kiểu dữ liệu',
      description: 'Học về các kiểu dữ liệu cơ bản trong Java',
      order: 3,
      content: 'Java có các kiểu dữ liệu nguyên thủy như int, double, boolean...',
      contentType: 'text',
      duration: 40,
      isPreview: false,
      isPublished: true
    }
  ],
  // React Course Lessons
  [
    {
      title: 'Giới thiệu React',
      description: 'React là gì và tại sao nên học React',
      order: 1,
      content: 'React là thư viện JavaScript để xây dựng user interface...',
      contentType: 'text',
      duration: 35,
      isPreview: true,
      isPublished: true
    },
    {
      title: 'Component đầu tiên',
      description: 'Tạo và sử dụng component trong React',
      order: 2,
      content: 'Component là building block cơ bản của React application...',
      contentType: 'video',
      videoUrl: 'https://example.com/react-component.mp4',
      duration: 50,
      isPreview: false,
      isPublished: false
    }
  ],
  // UI/UX Course Lessons
  [
    {
      title: 'Nguyên tắc thiết kế',
      description: 'Các nguyên tắc cơ bản trong thiết kế UI/UX',
      order: 1,
      content: 'Thiết kế tốt phải tuân thủ các nguyên tắc về màu sắc, typography, layout...',
      contentType: 'text',
      duration: 40,
      isPreview: true,
      isPublished: true
    }
  ]
];

const assignments = [
  // Java Course Assignment
  {
    title: 'Kiểm tra kiến thức Java cơ bản',
    description: 'Bài kiểm tra về cú pháp Java, biến và kiểu dữ liệu',
    type: 'quiz',
    instructions: 'Đọc kỹ câu hỏi và chọn đáp án đúng nhất. Bạn có 30 phút để hoàn thành.',
    timeLimit: 30,
    maxAttempts: 2,
    passingScore: 70,
    isPublished: true,
    questions: [
      {
        type: 'multiple-choice',
        question: 'Kiểu dữ liệu nào được sử dụng để lưu trữ số thực trong Java?',
        options: [
          { text: 'int', isCorrect: false },
          { text: 'double', isCorrect: true },
          { text: 'String', isCorrect: false },
          { text: 'boolean', isCorrect: false }
        ],
        correctAnswer: 1,
        explanation: 'double được sử dụng để lưu trữ số thực có độ chính xác kép',
        points: 2,
        order: 1
      },
      {
        type: 'true-false',
        question: 'Java là ngôn ngữ lập trình hướng đối tượng',
        correctAnswer: true,
        explanation: 'Java hoàn toàn là ngôn ngữ hướng đối tượng',
        points: 1,
        order: 2
      },
      {
        type: 'multiple-choice',
        question: 'Từ khóa nào được sử dụng để tạo class trong Java?',
        options: [
          { text: 'class', isCorrect: true },
          { text: 'Class', isCorrect: false },
          { text: 'object', isCorrect: false },
          { text: 'new', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Từ khóa "class" được sử dụng để định nghĩa class',
        points: 2,
        order: 3
      }
    ]
  },
  // React Course Assignment
  {
    title: 'Bài tập thực hành React Component',
    description: 'Tạo component React đơn giản và sử dụng props',
    type: 'project',
    instructions: 'Tạo một component hiển thị thông tin cá nhân với props. Upload code lên GitHub.',
    timeLimit: null,
    maxAttempts: 3,
    passingScore: 80,
    isPublished: false,
    questions: [
      {
        type: 'essay',
        question: 'Hãy mô tả cách bạn tạo component và giải thích cách sử dụng props',
        explanation: 'Câu trả lời cần mô tả rõ ràng quá trình tạo component',
        points: 10,
        order: 1
      }
    ]
  }
];

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create courses
    console.log('📚 Creating courses...');
    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      // Assign instructors cyclically (skip admin user)
      const instructorIndex = (i % (createdUsers.length - 1)) + 1;
      courseData.instructor = createdUsers[instructorIndex]._id;
      
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
      
      // Update user's createdCourses
      await User.findByIdAndUpdate(courseData.instructor, {
        $push: { createdCourses: course._id }
      });
      
      console.log(`✅ Created course: ${course.title} by ${createdUsers[instructorIndex].name}`);
    }

    // Create lessons for courses
    console.log('📖 Creating lessons...');
    for (let i = 0; i < Math.min(createdCourses.length, lessons.length); i++) {
      const course = createdCourses[i];
      const courseLessons = lessons[i];
      
      for (const lessonData of courseLessons) {
        lessonData.course = course._id;
        const lesson = new Lesson(lessonData);
        await lesson.save();
        
        // Add lesson to course
        await Course.findByIdAndUpdate(course._id, {
          $push: { lessons: lesson._id }
        });
        
        console.log(`✅ Created lesson: ${lesson.title} for ${course.title}`);
      }
    }

    // Create assignments
    console.log('📝 Creating assignments...');
    for (let i = 0; i < Math.min(createdCourses.length, assignments.length); i++) {
      const course = createdCourses[i];
      const assignmentData = assignments[i];
      
      assignmentData.course = course._id;
      assignmentData.instructor = course.instructor;
      
      // Calculate total points
      assignmentData.totalPoints = assignmentData.questions.reduce(
        (sum, question) => sum + question.points, 0
      );
      
      const assignment = new Assignment(assignmentData);
      await assignment.save();
      
      console.log(`✅ Created assignment: ${assignment.title} for ${course.title}`);
    }

    // Enroll some students in courses
    console.log('🎓 Enrolling students...');
    const students = createdUsers.slice(-2); // Last 2 users as students
    
    for (const student of students) {
      // Enroll in first 2 approved courses
      const approvedCourses = createdCourses.filter(c => c.status === 'approved').slice(0, 2);
      
      for (const course of approvedCourses) {
        // Add to course students
        await Course.findByIdAndUpdate(course._id, {
          $push: {
            students: {
              student: student._id,
              enrolledAt: new Date(),
              progress: Math.floor(Math.random() * 50) // Random progress 0-50%
            }
          }
        });
        
        // Add to user enrolledCourses
        await User.findByIdAndUpdate(student._id, {
          $push: {
            enrolledCourses: {
              course: course._id,
              enrolledAt: new Date(),
              progress: Math.floor(Math.random() * 50)
            }
          }
        });
        
        console.log(`✅ Enrolled ${student.name} in ${course.title}`);
      }
    }

    // Update course ratings
    console.log('⭐ Adding course ratings...');
    for (const course of createdCourses.filter(c => c.status === 'approved')) {
      const rating = {
        average: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        count: Math.floor(Math.random() * 50) + 10 // 10-60 reviews
      };
      
      await Course.findByIdAndUpdate(course._id, { rating });
      console.log(`✅ Added rating ${rating.average}/5 (${rating.count} reviews) to ${course.title}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`📚 Courses: ${createdCourses.length}`);
    console.log(`📖 Lessons: ${lessons.flat().length}`);
    console.log(`📝 Assignments: ${assignments.length}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@elearning.com / 123456');
    console.log('Instructor: haquangtrung1534@gmail.com / 123456');
    console.log('Student: tranthilan@gmail.com / 123456');
    
    console.log('\n📈 Course Status Distribution:');
    const statusCounts = {};
    createdCourses.forEach(course => {
      statusCounts[course.status] = (statusCounts[course.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} courses`);
    });

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
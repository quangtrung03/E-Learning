const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import all models
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');
const Payment = require('../src/models/Payment');
const Review = require('../src/models/Review');
const Discussion = require('../src/models/Discussion');
const Certificate = require('../src/models/Certificate');
const Coupon = require('../src/models/Coupon');
const StudyGroup = require('../src/models/StudyGroup');
const AdminRequest = require('../src/models/AdminRequest');
const EmailVerification = require('../src/models/EmailVerification');
const PasswordReset = require('../src/models/PasswordReset');
const LearningAnalytics = require('../src/models/LearningAnalytics');

const cleanDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Cleaning database...\n');

    // Delete all collections
    const collections = [
      { model: User, name: 'Users' },
      { model: Course, name: 'Courses' },
      { model: Lesson, name: 'Lessons' },
      { model: Assignment, name: 'Assignments' },
      { model: Submission, name: 'Submissions' },
      { model: Payment, name: 'Payments' },
      { model: Review, name: 'Reviews' },
      { model: Discussion, name: 'Discussions' },
      { model: Certificate, name: 'Certificates' },
      { model: Coupon, name: 'Coupons' },
      { model: StudyGroup, name: 'StudyGroups' },
      { model: AdminRequest, name: 'AdminRequests' },
      { model: EmailVerification, name: 'EmailVerifications' },
      { model: PasswordReset, name: 'PasswordResets' },
      { model: LearningAnalytics, name: 'LearningAnalytics' }
    ];

    for (const { model, name } of collections) {
      const result = await model.deleteMany({});
      console.log(`  ✅ Deleted ${result.deletedCount} ${name}`);
    }

    console.log('\n✨ Database cleaned successfully!\n');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();

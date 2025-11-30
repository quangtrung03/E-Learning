const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Review = require('../src/models/Review');
const Discussion = require('../src/models/Discussion');
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');
const StudyGroup = require('../src/models/StudyGroup');
const Payment = require('../src/models/Payment');

const inspectDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                 DATABASE INSPECTION REPORT                 ');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ====================
    // COURSES
    // ====================
    console.log('📚 COURSES COLLECTION');
    console.log('─────────────────────────────────────');
    const courses = await Course.find({}).populate('instructor', 'name').limit(5);
    console.log(`Total: ${await Course.countDocuments()}`);
    console.log('\nSample courses:');
    courses.forEach((course, idx) => {
      console.log(`\n${idx + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Instructor: ${course.instructor?.name || 'N/A'}`);
      console.log(`   Category: ${course.category}`);
      console.log(`   Level: ${course.level}`);
      console.log(`   Price: ${course.price}đ`);
      console.log(`   Final Price: ${course.finalPrice || 'N/A'}đ`);
      console.log(`   Discount: ${course.discount || 0}%`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Published: ${course.isPublished}`);
      console.log(`   Rating: ${course.rating?.average || 0} (${course.rating?.count || 0} reviews)`);
      console.log(`   Students: ${course.students?.length || 0}`);
      console.log(`   Lessons: ${course.lessons?.length || 0}`);
      console.log(`   Thumbnail: ${course.thumbnail ? 'Yes ✓' : 'No ✗'}`);
      console.log(`   Requirements: ${course.requirements?.length || 0}`);
      console.log(`   What You'll Learn: ${course.whatYouWillLearn?.length || 0}`);
      console.log(`   Tags: ${course.tags?.length || 0}`);
    });

    const coursesByStatus = await Course.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\nCourses by status:');
    coursesByStatus.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    // ====================
    // USERS
    // ====================
    console.log('\n\n👥 USERS COLLECTION');
    console.log('─────────────────────────────────────');
    const users = await User.find({}).limit(5);
    console.log(`Total: ${await User.countDocuments()}`);
    console.log('\nSample users:');
    users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.name}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Enrolled Courses: ${user.enrolledCourses?.length || 0}`);
      console.log(`   Wishlist: ${user.wishlist?.length || 0}`);
    });

    const adminCount = await User.countDocuments({ isAdmin: true });
    const studentCount = await User.countDocuments({ isAdmin: false });
    console.log('\nUsers by type:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Students: ${studentCount}`);

    // ====================
    // REVIEWS
    // ====================
    console.log('\n\n⭐ REVIEWS COLLECTION');
    console.log('─────────────────────────────────────');
    const reviews = await Review.find({})
      .populate('user', 'name')
      .populate('course', 'title')
      .limit(5);
    console.log(`Total: ${await Review.countDocuments()}`);
    console.log('\nSample reviews:');
    reviews.forEach((review, idx) => {
      console.log(`\n${idx + 1}. Rating: ${review.rating}/5`);
      console.log(`   Course: ${review.course?.title || 'N/A'}`);
      console.log(`   User: ${review.user?.name || 'N/A'}`);
      console.log(`   Comment: ${review.comment?.substring(0, 50)}...`);
      console.log(`   Helpful: ${review.helpful?.length || 0}`);
      console.log(`   Date: ${review.createdAt}`);
    });

    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    console.log(`\nAverage rating across all reviews: ${avgRating[0]?.avg.toFixed(2) || 0}/5`);

    // ====================
    // DISCUSSIONS
    // ====================
    console.log('\n\n💬 DISCUSSIONS COLLECTION');
    console.log('─────────────────────────────────────');
    const discussions = await Discussion.find({})
      .populate('user', 'name')
      .populate('course', 'title')
      .limit(5);
    console.log(`Total: ${await Discussion.countDocuments()}`);
    console.log('\nSample discussions:');
    discussions.forEach((disc, idx) => {
      console.log(`\n${idx + 1}. ${disc.title}`);
      console.log(`   Course: ${disc.course?.title || 'N/A'}`);
      console.log(`   User: ${disc.user?.name || 'N/A'}`);
      console.log(`   Category: ${disc.category}`);
      console.log(`   Replies: ${disc.replies?.length || 0}`);
      console.log(`   Likes: ${disc.likes?.length || 0}`);
      console.log(`   Pinned: ${disc.isPinned}`);
      console.log(`   Closed: ${disc.isClosed}`);
    });

    // ====================
    // LESSONS
    // ====================
    console.log('\n\n📖 LESSONS COLLECTION');
    console.log('─────────────────────────────────────');
    const lessons = await Lesson.find({}).populate('course', 'title').limit(5);
    console.log(`Total: ${await Lesson.countDocuments()}`);
    console.log('\nSample lessons:');
    lessons.forEach((lesson, idx) => {
      console.log(`\n${idx + 1}. ${lesson.title}`);
      console.log(`   Course: ${lesson.course?.title || 'N/A'}`);
      console.log(`   Type: ${lesson.type}`);
      console.log(`   Order: ${lesson.order}`);
      console.log(`   Duration: ${lesson.duration} mins`);
      console.log(`   Free: ${lesson.isFree}`);
      console.log(`   Content length: ${lesson.content?.length || 0} chars`);
    });

    const lessonsByType = await Lesson.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    console.log('\nLessons by type:');
    lessonsByType.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    // ====================
    // STUDY GROUPS
    // ====================
    console.log('\n\n👥 STUDY GROUPS COLLECTION');
    console.log('─────────────────────────────────────');
    const studyGroups = await StudyGroup.find({})
      .populate('course', 'title')
      .populate('creator', 'name')
      .limit(5);
    console.log(`Total: ${await StudyGroup.countDocuments()}`);
    console.log('\nSample study groups:');
    studyGroups.forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.name}`);
      console.log(`   Course: ${group.course?.title || 'N/A'}`);
      console.log(`   Creator: ${group.creator?.name || 'N/A'}`);
      console.log(`   Members: ${group.members?.length || 0}/${group.maxMembers}`);
      console.log(`   Private: ${group.isPrivate}`);
      console.log(`   Status: ${group.status}`);
      console.log(`   Sessions: ${group.sessions?.length || 0}`);
      console.log(`   Resources: ${group.resources?.length || 0}`);
    });

    // ====================
    // CATEGORIES
    // ====================
    console.log('\n\n📁 CATEGORIES COLLECTION');
    console.log('─────────────────────────────────────');
    const categories = await Category.find({});
    console.log(`Total: ${await Category.countDocuments()}`);
    categories.forEach((cat, idx) => {
      console.log(`\n${idx + 1}. ${cat.name}`);
      console.log(`   Slug: ${cat.slug}`);
      console.log(`   Description: ${cat.description?.substring(0, 50)}...`);
      console.log(`   Image: ${cat.imageUrl ? 'Yes ✓' : 'No ✗'}`);
    });

    // ====================
    // INSTRUCTORS
    // ====================
    console.log('\n\n👨‍🏫 INSTRUCTORS COLLECTION');
    console.log('─────────────────────────────────────');
    const instructors = await Instructor.find({}).limit(5);
    console.log(`Total: ${await Instructor.countDocuments()}`);
    instructors.forEach((inst, idx) => {
      console.log(`\n${idx + 1}. ${inst.name || 'N/A'}`);
      console.log(`   Title: ${inst.title || 'N/A'}`);
      console.log(`   Bio: ${inst.bio?.substring(0, 50) || 'N/A'}...`);
      console.log(`   Experience: ${inst.experience || 'N/A'}`);
      console.log(`   Image: ${inst.imageUrl ? 'Yes ✓' : 'No ✗'}`);
    });

    // ====================
    // PAYMENTS
    // ====================
    console.log('\n\n💳 PAYMENTS COLLECTION');
    console.log('─────────────────────────────────────');
    const payments = await Payment.find({}).limit(5);
    console.log(`Total: ${await Payment.countDocuments()}`);
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    console.log(`Total Revenue: ${totalRevenue[0]?.total || 0}đ`);

    const paymentsByStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    console.log('\nPayments by status:');
    paymentsByStatus.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} payments (${stat.total}đ)`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    INSPECTION COMPLETE                     ');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
};

// Run the script
inspectDatabase();

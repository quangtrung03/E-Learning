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
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');

const fixDatabaseSchema = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ====================
    // 1. FIX COURSES
    // ====================
    console.log('📚 Fixing Courses collection...');
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses\n`);

    let courseUpdated = 0;
    for (const course of courses) {
      let needsUpdate = false;
      const updates = {};

      // Ensure rating structure
      if (!course.rating || typeof course.rating.average !== 'number') {
        updates.rating = {
          average: 0,
          count: 0
        };
        needsUpdate = true;
      }

      // Ensure thumbnail field exists
      if (course.thumbnail === undefined) {
        updates.thumbnail = null;
        needsUpdate = true;
      }

      // Ensure students array exists
      if (!Array.isArray(course.students)) {
        updates.students = [];
        needsUpdate = true;
      }

      // Ensure lessons array exists
      if (!Array.isArray(course.lessons)) {
        updates.lessons = [];
        needsUpdate = true;
      }

      // Ensure status field
      if (!course.status) {
        updates.status = 'pending';
        needsUpdate = true;
      }

      // Ensure isPublished field
      if (course.isPublished === undefined) {
        updates.isPublished = course.status === 'approved';
        needsUpdate = true;
      }

      // Ensure finalPrice
      if (course.finalPrice === undefined) {
        const discount = course.discount || 0;
        updates.finalPrice = course.price - (course.price * discount / 100);
        needsUpdate = true;
      }

      // Ensure arrays for optional fields
      if (!Array.isArray(course.requirements)) {
        updates.requirements = [];
        needsUpdate = true;
      }
      if (!Array.isArray(course.whatYouWillLearn)) {
        updates.whatYouWillLearn = [];
        needsUpdate = true;
      }
      if (!Array.isArray(course.tags)) {
        updates.tags = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Course.updateOne({ _id: course._id }, { $set: updates });
        courseUpdated++;
        console.log(`✅ Updated course: ${course.title}`);
      }
    }
    console.log(`✅ Updated ${courseUpdated} courses\n`);

    // ====================
    // 2. FIX USERS
    // ====================
    console.log('👥 Fixing Users collection...');
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    let userUpdated = 0;
    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // Ensure enrolledCourses structure
      if (!Array.isArray(user.enrolledCourses)) {
        updates.enrolledCourses = [];
        needsUpdate = true;
      } else {
        // Fix enrolledCourses structure
        const fixedEnrollments = user.enrolledCourses.map(enrollment => {
          if (!enrollment.course) return null;
          return {
            course: enrollment.course,
            enrolledAt: enrollment.enrolledAt || new Date(),
            progress: enrollment.progress || 0,
            completed: enrollment.completed || false,
            lastAccessed: enrollment.lastAccessed || new Date()
          };
        }).filter(e => e !== null);

        if (JSON.stringify(fixedEnrollments) !== JSON.stringify(user.enrolledCourses)) {
          updates.enrolledCourses = fixedEnrollments;
          needsUpdate = true;
        }
      }

      // Ensure createdCourses array
      if (!Array.isArray(user.createdCourses)) {
        updates.createdCourses = [];
        needsUpdate = true;
      }

      // Ensure isAdmin field (User model uses isAdmin, not role)
      if (user.isAdmin === undefined) {
        // Set isAdmin = true for admin emails
        updates.isAdmin = user.email && (user.email.includes('admin') || user.email.includes('elearn')) ? true : false;
        needsUpdate = true;
      }

      // Ensure emailVerified field
      if (user.emailVerified === undefined) {
        updates.emailVerified = false;
        needsUpdate = true;
      }

      // Ensure isActive field
      if (user.isActive === undefined) {
        updates.isActive = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        userUpdated++;
        console.log(`✅ Updated user: ${user.name}`);
      }
    }
    console.log(`✅ Updated ${userUpdated} users\n`);

    // ====================
    // 3. FIX REVIEWS
    // ====================
    console.log('⭐ Fixing Reviews collection...');
    const reviews = await Review.find({});
    console.log(`Found ${reviews.length} reviews\n`);

    let reviewUpdated = 0;
    for (const review of reviews) {
      let needsUpdate = false;
      const updates = {};

      // Ensure rating is number between 1-5
      if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
        updates.rating = 5;
        needsUpdate = true;
      }

      // Ensure helpful array
      if (!Array.isArray(review.helpful)) {
        updates.helpful = [];
        needsUpdate = true;
      }

      // Ensure course and user references exist
      if (!review.course || !review.user) {
        console.log(`❌ Invalid review found (missing course or user), deleting...`);
        await Review.deleteOne({ _id: review._id });
        continue;
      }

      if (needsUpdate) {
        await Review.updateOne({ _id: review._id }, { $set: updates });
        reviewUpdated++;
      }
    }
    console.log(`✅ Updated ${reviewUpdated} reviews\n`);

    // ====================
    // 4. FIX DISCUSSIONS
    // ====================
    console.log('💬 Fixing Discussions collection...');
    const discussions = await Discussion.find({});
    console.log(`Found ${discussions.length} discussions\n`);

    let discussionUpdated = 0;
    for (const discussion of discussions) {
      let needsUpdate = false;
      const updates = {};

      // Ensure category
      if (!discussion.category) {
        updates.category = 'general';
        needsUpdate = true;
      }

      // Ensure replies array
      if (!Array.isArray(discussion.replies)) {
        updates.replies = [];
        needsUpdate = true;
      }

      // Ensure likes array
      if (!Array.isArray(discussion.likes)) {
        updates.likes = [];
        needsUpdate = true;
      }

      // Ensure isPinned
      if (discussion.isPinned === undefined) {
        updates.isPinned = false;
        needsUpdate = true;
      }

      // Ensure isClosed
      if (discussion.isClosed === undefined) {
        updates.isClosed = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Discussion.updateOne({ _id: discussion._id }, { $set: updates });
        discussionUpdated++;
      }
    }
    console.log(`✅ Updated ${discussionUpdated} discussions\n`);

    // ====================
    // 5. FIX LESSONS
    // ====================
    console.log('📖 Fixing Lessons collection...');
    const lessons = await Lesson.find({});
    console.log(`Found ${lessons.length} lessons\n`);

    let lessonUpdated = 0;
    for (const lesson of lessons) {
      let needsUpdate = false;
      const updates = {};

      // Ensure type field
      if (!lesson.type) {
        updates.type = 'video';
        needsUpdate = true;
      }

      // Ensure order field
      if (typeof lesson.order !== 'number') {
        updates.order = 0;
        needsUpdate = true;
      }

      // Ensure isFree field
      if (lesson.isFree === undefined) {
        updates.isFree = false;
        needsUpdate = true;
      }

      // Ensure duration
      if (typeof lesson.duration !== 'number') {
        updates.duration = 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Lesson.updateOne({ _id: lesson._id }, { $set: updates });
        lessonUpdated++;
      }
    }
    console.log(`✅ Updated ${lessonUpdated} lessons\n`);

    // ====================
    // 6. FIX STUDY GROUPS
    // ====================
    console.log('👥 Fixing Study Groups collection...');
    const studyGroups = await StudyGroup.find({});
    console.log(`Found ${studyGroups.length} study groups\n`);

    let studyGroupUpdated = 0;
    for (const group of studyGroups) {
      let needsUpdate = false;
      const updates = {};

      // Ensure members array
      if (!Array.isArray(group.members)) {
        updates.members = group.creator ? [group.creator] : [];
        needsUpdate = true;
      }

      // Ensure maxMembers
      if (typeof group.maxMembers !== 'number') {
        updates.maxMembers = 10;
        needsUpdate = true;
      }

      // Ensure isPrivate
      if (group.isPrivate === undefined) {
        updates.isPrivate = false;
        needsUpdate = true;
      }

      // Ensure status
      if (!group.status) {
        updates.status = 'active';
        needsUpdate = true;
      }

      // Ensure arrays
      if (!Array.isArray(group.sessions)) {
        updates.sessions = [];
        needsUpdate = true;
      }
      if (!Array.isArray(group.resources)) {
        updates.resources = [];
        needsUpdate = true;
      }
      if (!Array.isArray(group.joinRequests)) {
        updates.joinRequests = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await StudyGroup.updateOne({ _id: group._id }, { $set: updates });
        studyGroupUpdated++;
      }
    }
    console.log(`✅ Updated ${studyGroupUpdated} study groups\n`);

    // ====================
    // 7. FIX CATEGORIES
    // ====================
    console.log('📁 Fixing Categories collection...');
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories\n`);

    let categoryUpdated = 0;
    for (const category of categories) {
      let needsUpdate = false;
      const updates = {};

      // Ensure slug
      if (!category.slug) {
        updates.slug = category.name.toLowerCase().replace(/\s+/g, '-');
        needsUpdate = true;
      }

      // Ensure imageUrl
      if (!category.imageUrl) {
        updates.imageUrl = 'https://via.placeholder.com/400x300?text=' + category.name;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Category.updateOne({ _id: category._id }, { $set: updates });
        categoryUpdated++;
      }
    }
    console.log(`✅ Updated ${categoryUpdated} categories\n`);

    // ====================
    // 8. FIX INSTRUCTORS
    // ====================
    console.log('👨‍🏫 Fixing Instructors collection...');
    const instructors = await Instructor.find({});
    console.log(`Found ${instructors.length} instructors\n`);

    let instructorUpdated = 0;
    for (const instructor of instructors) {
      let needsUpdate = false;
      const updates = {};

      // Ensure rating structure
      if (!instructor.rating || typeof instructor.rating.average !== 'number') {
        updates.rating = {
          average: 0,
          count: 0
        };
        needsUpdate = true;
      }

      // Ensure students count
      if (typeof instructor.students !== 'number') {
        updates.students = 0;
        needsUpdate = true;
      }

      // Ensure courses array
      if (!Array.isArray(instructor.courses)) {
        updates.courses = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Instructor.updateOne({ _id: instructor._id }, { $set: updates });
        instructorUpdated++;
      }
    }
    console.log(`✅ Updated ${instructorUpdated} instructors\n`);

    // ====================
    // SUMMARY & STATISTICS
    // ====================
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('═══════════════════════════════════════');
    console.log(`📚 Courses: ${courses.length} (${courseUpdated} updated)`);
    console.log(`👥 Users: ${users.length} (${userUpdated} updated)`);
    console.log(`⭐ Reviews: ${reviews.length} (${reviewUpdated} updated)`);
    console.log(`💬 Discussions: ${discussions.length} (${discussionUpdated} updated)`);
    console.log(`📖 Lessons: ${lessons.length} (${lessonUpdated} updated)`);
    console.log(`👥 Study Groups: ${studyGroups.length} (${studyGroupUpdated} updated)`);
    console.log(`📁 Categories: ${categories.length} (${categoryUpdated} updated)`);
    console.log(`👨‍🏫 Instructors: ${instructors.length} (${instructorUpdated} updated)`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Database schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
fixDatabaseSchema();

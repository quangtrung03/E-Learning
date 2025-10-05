#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const EmailVerification = require('./src/models/EmailVerification');
const PasswordReset = require('./src/models/PasswordReset');
const AdminRequest = require('./src/models/AdminRequest');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Check database data
const checkDatabase = async () => {
  console.log('\n📊 DATABASE STATUS:');
  console.log('==================');
  
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const lessonCount = await Lesson.countDocuments();
    const emailVerificationCount = await EmailVerification.countDocuments();
    const passwordResetCount = await PasswordReset.countDocuments();
    const adminRequestCount = await AdminRequest.countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Courses: ${courseCount}`);
    console.log(`📖 Lessons: ${lessonCount}`);
    console.log(`📧 Email Verifications: ${emailVerificationCount}`);
    console.log(`🔑 Password Resets: ${passwordResetCount}`);
    console.log(`👑 Admin Requests: ${adminRequestCount}`);
    
    const total = userCount + courseCount + lessonCount + emailVerificationCount + passwordResetCount + adminRequestCount;
    console.log(`📈 Total Records: ${total}`);
    
    if (userCount > 0) {
      console.log('\n👥 USERS:');
      const users = await User.find({}, 'name email emailVerified isAdmin createdAt').sort({ createdAt: -1 });
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Verified: ${user.emailVerified} - Admin: ${user.isAdmin}`);
      });
    }
    
    if (courseCount > 0) {
      console.log('\n📚 COURSES:');
      const courses = await Course.find({}, 'title status instructor createdAt').populate('instructor', 'name email').sort({ createdAt: -1 });
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course.status}) - By: ${course.instructor?.name || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
};

// Clean database (delete all data)
const cleanDatabase = async () => {
  console.log('\n🧹 CLEANING DATABASE...');
  console.log('=====================');
  
  try {
    // Delete all data
    const deleteUsers = await User.deleteMany({});
    const deleteCourses = await Course.deleteMany({});
    const deleteLessons = await Lesson.deleteMany({});
    const deleteEmailVerifications = await EmailVerification.deleteMany({});
    const deletePasswordResets = await PasswordReset.deleteMany({});
    const deleteAdminRequests = await AdminRequest.deleteMany({});
    
    console.log(`🗑️  Deleted ${deleteUsers.deletedCount} users`);
    console.log(`🗑️  Deleted ${deleteCourses.deletedCount} courses`);
    console.log(`🗑️  Deleted ${deleteLessons.deletedCount} lessons`);
    console.log(`🗑️  Deleted ${deleteEmailVerifications.deletedCount} email verifications`);
    console.log(`🗑️  Deleted ${deletePasswordResets.deletedCount} password resets`);
    console.log(`🗑️  Deleted ${deleteAdminRequests.deletedCount} admin requests`);
    
    const totalDeleted = deleteUsers.deletedCount + deleteCourses.deletedCount + deleteLessons.deletedCount + 
                        deleteEmailVerifications.deletedCount + deletePasswordResets.deletedCount + deleteAdminRequests.deletedCount;
    
    console.log(`✅ Total deleted: ${totalDeleted} records`);
    console.log('🎉 Database is now clean!');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  }
};

// Main function
const main = async () => {
  const action = process.argv[2];
  
  await connectDB();
  
  switch (action) {
    case 'check':
      await checkDatabase();
      break;
    case 'clean':
      console.log('⚠️  WARNING: This will delete ALL data in the database!');
      console.log('Are you sure? This action cannot be undone.');
      
      // Simple confirmation (in production, use better confirmation)
      const args = process.argv.slice(3);
      if (args.includes('--confirm')) {
        await cleanDatabase();
      } else {
        console.log('❌ Cancelled. Use --confirm flag to proceed:');
        console.log('node database-manager.js clean --confirm');
      }
      break;
    case 'reset':
      console.log('🔄 RESETTING DATABASE (Clean + Check)...');
      if (process.argv.includes('--confirm')) {
        await cleanDatabase();
        console.log('\n');
        await checkDatabase();
      } else {
        console.log('❌ Use --confirm flag to proceed:');
        console.log('node database-manager.js reset --confirm');
      }
      break;
    default:
      console.log('📋 DATABASE MANAGER USAGE:');
      console.log('==========================');
      console.log('node database-manager.js check           # Check current data');
      console.log('node database-manager.js clean --confirm # Delete all data');
      console.log('node database-manager.js reset --confirm # Clean + Check');
      console.log('');
      console.log('🔍 Checking current database status...');
      await checkDatabase();
  }
  
  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
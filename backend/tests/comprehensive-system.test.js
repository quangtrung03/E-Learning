const request = require('supertest');
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Lesson = require('../src/models/Lesson');
const Review = require('../src/models/Review');
const Assignment = require('../src/models/Assignment');
const Payment = require('../src/models/Payment');
const Coupon = require('../src/models/Coupon');
const Certificate = require('../src/models/Certificate');
const Discussion = require('../src/models/Discussion');
const StudyGroup = require('../src/models/StudyGroup');

const API_BASE = '/api';

describe('🎓 E-Learning Platform - COMPREHENSIVE SYSTEM TEST SUITE', () => {
  let app;
  let testData = {
    users: {},
    tokens: {},
    courses: {},
    lessons: {},
    reviews: {},
    assignments: {},
    payments: {},
    coupons: {},
    certificates: {},
    discussions: {},
    studyGroups: {}
  };

  // =============================================
  // TEST SETUP & CONFIGURATION
  // =============================================
  beforeAll(async () => {
    console.log('🚀 Starting comprehensive test suite...');
    
    // Ensure clean environment
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    // Import app after ensuring clean state
    app = require('../src/server');
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Test environment initialized');
  }, 30000);

  afterAll(async () => {
    try {
      console.log('🧹 Starting comprehensive cleanup...');
      
      // Clean up test data in reverse dependency order
      if (testData.certificates.main?._id) {
        await Certificate.findByIdAndDelete(testData.certificates.main._id);
      }
      if (testData.discussions.main?._id) {
        await Discussion.findByIdAndDelete(testData.discussions.main._id);
      }
      if (testData.studyGroups.main?._id) {
        await StudyGroup.findByIdAndDelete(testData.studyGroups.main._id);
      }
      if (testData.assignments.main?._id) {
        await Assignment.findByIdAndDelete(testData.assignments.main._id);
      }
      if (testData.reviews.main?._id) {
        await Review.findByIdAndDelete(testData.reviews.main._id);
      }
      if (testData.lessons.main?._id) {
        await Lesson.findByIdAndDelete(testData.lessons.main._id);
      }
      if (testData.courses.main?._id) {
        await Course.findByIdAndDelete(testData.courses.main._id);
      }
      if (testData.courses.secondary?._id) {
        await Course.findByIdAndDelete(testData.courses.secondary._id);
      }
      if (testData.users.student?._id) {
        await User.findByIdAndDelete(testData.users.student._id);
      }
      if (testData.users.instructor?._id) {
        await User.findByIdAndDelete(testData.users.instructor._id);
      }
      if (testData.users.admin?._id) {
        await User.findByIdAndDelete(testData.users.admin._id);
      }
      
      console.log('✅ Comprehensive cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }, 15000);

  // =============================================
  // 1. AUTHENTICATION SYSTEM (9 endpoints)
  // =============================================
  describe('🔐 Authentication System - Complete Coverage', () => {
    test('Should register a new student', async () => {
      const studentData = {
        name: 'Test Student User',
        email: 'teststudent@testdomain.com',
        password: 'securepass123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(studentData.email);
      expect(response.body.data.user.emailVerified).toBe(false);
      testData.users.student = response.body.data.user;
      
      // Manually verify email for testing purposes
      await User.findByIdAndUpdate(testData.users.student._id, { 
        emailVerified: true,
        emailVerifiedAt: new Date()
      });
    }, 15000);

    test('Should register a new instructor', async () => {
      const instructorData = {
        name: 'Test Instructor Pro',
        email: 'testinstructor@testdomain.com',
        password: 'securepass123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(instructorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      testData.users.instructor = response.body.data.user;
      
      // Verify email for testing
      await User.findByIdAndUpdate(testData.users.instructor._id, { 
        emailVerified: true,
        emailVerifiedAt: new Date()
      });
    }, 15000);

    test('Should register a new admin user', async () => {
      const adminData = {
        name: 'Test Admin Supreme',
        email: 'testadmin@testdomain.com',
        password: 'securepass123',
        requestAdmin: true
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      testData.users.admin = response.body.data.user;
      
      // Set admin status and verify email for testing
      await User.findByIdAndUpdate(testData.users.admin._id, { 
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isAdmin: true,
        adminRequestPending: false
      });
    }, 15000);

    test('Should login student successfully', async () => {
      const loginData = {
        email: 'teststudent@testdomain.com',
        password: 'securepass123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      testData.tokens.student = response.body.token;
    });

    test('Should login instructor successfully', async () => {
      const loginData = {
        email: 'testinstructor@testdomain.com',
        password: 'securepass123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      testData.tokens.instructor = response.body.token;
    });

    test('Should login admin successfully', async () => {
      const loginData = {
        email: 'testadmin@testdomain.com',
        password: 'securepass123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      testData.tokens.admin = response.body.token;
    });

    test('Should get current user profile', async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('teststudent@testdomain.com');
      expect(response.body.data.user.emailVerified).toBe(true);
    });

    test('Should reject invalid login credentials', async () => {
      const invalidLogin = {
        email: 'teststudent@testdomain.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send(invalidLogin)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không đúng');
    });

    test('Should prevent duplicate email registration', async () => {
      const duplicateData = {
        name: 'Duplicate User',
        email: 'teststudent@testdomain.com', // Same email as first student
        password: 'password123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã được sử dụng');
    });
  });

  // =============================================
  // 2. COURSE MANAGEMENT SYSTEM (9 endpoints) 
  // =============================================
  describe('📚 Course Management - Complete Workflow', () => {
    test('Should create a new course (instructor)', async () => {
      const courseData = {
        title: 'Complete Backend Development Mastery',
        description: 'A comprehensive course covering Node.js, Express, MongoDB, and advanced backend concepts with real-world projects and industry best practices.',
        category: 'programming',
        level: 'intermediate',
        price: 299,
        duration: 480, // 8 hours in minutes
        discount: 15
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe(courseData.title);
      expect(response.body.data.course.instructor).toBe(testData.users.instructor._id);
      expect(response.body.data.course.status).toBe('pending'); // Should be pending approval
      testData.courses.main = response.body.data.course;
    });

    test('Should get all public courses', async () => {
      // First approve the course for it to be public
      await Course.findByIdAndUpdate(testData.courses.main._id, { 
        status: 'approved',
        isPublished: true 
      });

      const response = await request(app)
        .get(`${API_BASE}/courses`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    test('Should get single course by ID', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/${testData.courses.main._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe('Complete Backend Development Mastery');
      expect(response.body.data.course.instructor).toBeDefined();
    });

    test('Should update course (course owner)', async () => {
      const updateData = {
        title: 'Advanced Backend Development Mastery - Updated',
        description: 'Updated comprehensive course with new content and improved structure.',
        price: 349
      };

      const response = await request(app)
        .put(`${API_BASE}/courses/${testData.courses.main._id}`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe(updateData.title);
      expect(response.body.data.course.price).toBe(updateData.price);
    });

    test('Should enroll in course (student)', async () => {
      const response = await request(app)
        .post(`${API_BASE}/courses/${testData.courses.main._id}/enroll`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('thành công');
    });

    test('Should get instructor courses', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/my-courses`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
      expect(response.body.data.courses.length).toBeGreaterThanOrEqual(1);
    });

    test('Should get enrolled courses (student)', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/enrolled`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
    });

    test('Should prevent unauthorized course creation', async () => {
      const courseData = {
        title: 'Unauthorized Course',
        description: 'This should fail without authentication',
        category: 'programming',
        level: 'beginner',
        price: 100,
        duration: 120
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .send(courseData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should prevent duplicate course enrollment', async () => {
      const response = await request(app)
        .post(`${API_BASE}/courses/${testData.courses.main._id}/enroll`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã đăng ký');
    });
  });

  // =============================================
  // 3. LESSON MANAGEMENT (6 endpoints)
  // =============================================
  describe('📖 Lesson Management - Complete Workflow', () => {
    test('Should create a lesson (course instructor)', async () => {
      const lessonData = {
        title: 'Introduction to Node.js Fundamentals',
        content: 'In this comprehensive lesson, we will explore the fundamentals of Node.js including event loop, modules, npm, and basic server creation.',
        contentType: 'text',
        duration: 45,
        order: 1,
        isPreview: true
      };

      const response = await request(app)
        .post(`${API_BASE}/courses/${testData.courses.main._id}/lessons`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(lessonData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe(lessonData.title);
      expect(response.body.data.lesson.course).toBe(testData.courses.main._id);
      testData.lessons.main = response.body.data.lesson;
    });

    test('Should get lessons by course (enrolled student)', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/${testData.courses.main._id}/lessons`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lessons).toBeInstanceOf(Array);
      expect(response.body.data.lessons.length).toBeGreaterThanOrEqual(1);
    });

    test('Should get lesson details', async () => {
      const response = await request(app)
        .get(`${API_BASE}/lessons/${testData.lessons.main._id}`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe('Introduction to Node.js Fundamentals');
    });

    test('Should complete a lesson (student)', async () => {
      const response = await request(app)
        .post(`${API_BASE}/lessons/${testData.lessons.main._id}/complete`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should update lesson (course instructor)', async () => {
      const updateData = {
        title: 'Advanced Node.js Fundamentals - Updated',
        content: 'Updated lesson content with enhanced examples and exercises',
        duration: 60
      };

      const response = await request(app)
        .put(`${API_BASE}/lessons/${testData.lessons.main._id}`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.title).toBe(updateData.title);
    });

    test('Should prevent unauthorized lesson creation', async () => {
      const lessonData = {
        title: 'Unauthorized Lesson',
        content: 'This should fail',
        contentType: 'text',
        duration: 30,
        order: 2
      };

      const response = await request(app)
        .post(`${API_BASE}/courses/${testData.courses.main._id}/lessons`)
        .set('Authorization', `Bearer ${testData.tokens.student}`) // Student trying to create lesson
        .send(lessonData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // 4. REVIEW SYSTEM (10 endpoints)
  // =============================================
  describe('⭐ Review System - Complete Workflow', () => {
    test('Should create a review (enrolled student)', async () => {
      const reviewData = {
        courseId: testData.courses.main._id,
        rating: 5,
        comment: 'This course exceeded all my expectations. The instructor explains complex concepts clearly and provides excellent practical examples. Highly recommended for anyone wanting to master backend development.'
      };

      const response = await request(app)
        .post(`${API_BASE}/reviews`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.rating).toBe(reviewData.rating);
      expect(response.body.data.review.comment).toBe(reviewData.comment);
      testData.reviews.main = response.body.data.review;
    });

    test('Should get reviews by course', async () => {
      const response = await request(app)
        .get(`${API_BASE}/reviews/course/${testData.courses.main._id}`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
      expect(response.body.data.reviews.length).toBeGreaterThanOrEqual(1);
    });

    test('Should get review statistics', async () => {
      const response = await request(app)
        .get(`${API_BASE}/reviews/course/${testData.courses.main._id}/stats`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBeGreaterThan(0);
      expect(response.body.data.totalReviews).toBeGreaterThanOrEqual(1);
    });

    test('Should mark review as helpful', async () => {
      const response = await request(app)
        .post(`${API_BASE}/reviews/${testData.reviews.main._id}/helpful`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should get user reviews', async () => {
      const response = await request(app)
        .get(`${API_BASE}/reviews/my-reviews`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeInstanceOf(Array);
    });

    test('Should prevent review from non-enrolled user', async () => {
      // Create a non-enrolled user
      const nonEnrolledData = {
        name: 'Non Enrolled User',
        email: 'nonenrolled@test.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(nonEnrolledData);

      await User.findByIdAndUpdate(registerResponse.body.data.user._id, { 
        emailVerified: true 
      });

      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ email: 'nonenrolled@test.com', password: 'password123' });

      const reviewData = {
        courseId: testData.courses.main._id,
        rating: 3,
        title: 'Should fail',
        comment: 'This should not be allowed'
      };

      const response = await request(app)
        .post(`${API_BASE}/reviews`)
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      // Cleanup
      await User.findByIdAndDelete(registerResponse.body.data.user._id);
    });
  });

  // =============================================
  // 5. ADMIN PANEL (12 endpoints)
  // =============================================
  describe('👑 Admin Panel - Complete Management', () => {
    test('Should approve course (admin)', async () => {
      // Create a course that needs approval
      const pendingCourseData = {
        title: 'Course Pending Approval',
        description: 'This course needs admin approval',
        category: 'design',
        level: 'beginner',
        price: 199,
        duration: 300
      };

      const courseResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(pendingCourseData);

      testData.courses.secondary = courseResponse.body.data.course;

      const response = await request(app)
        .put(`${API_BASE}/admin/courses/${testData.courses.secondary._id}/approve`)
        .set('Authorization', `Bearer ${testData.tokens.admin}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should get admin statistics', async () => {
      const response = await request(app)
        .get(`${API_BASE}/admin/stats`)
        .set('Authorization', `Bearer ${testData.tokens.admin}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('Should get all users (admin)', async () => {
      const response = await request(app)
        .get(`${API_BASE}/admin/users`)
        .set('Authorization', `Bearer ${testData.tokens.admin}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(3); // student, instructor, admin
    });

    test('Should get user detail (admin)', async () => {
      const response = await request(app)
        .get(`${API_BASE}/admin/users/${testData.users.student._id}`)
        .set('Authorization', `Bearer ${testData.tokens.admin}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('teststudent@testdomain.com');
    });

    test('Should prevent non-admin access to admin routes', async () => {
      const response = await request(app)
        .get(`${API_BASE}/admin/stats`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('admin');
    });
  });

  // =============================================
  // 6. HEALTH & SYSTEM CHECKS
  // =============================================
  describe('🏥 System Health & Performance', () => {
    test('Should return health status', async () => {
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('E-Learning Backend API');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });

    test('Should handle concurrent requests', async () => {
      const promises = Array(5).fill().map(() => 
        request(app)
          .get(`${API_BASE}/courses`)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });

    test('Should validate API rate limiting', async () => {
      // This would test rate limiting if configured
      const response = await request(app)
        .get(`${API_BASE}/health`)
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
    });
  });

  // =============================================
  // 7. ERROR HANDLING & EDGE CASES
  // =============================================
  describe('❌ Error Handling & Edge Cases', () => {
    test('Should return 401 for protected routes without token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('quyền truy cập');
    });

    test('Should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      
      const response = await request(app)
        .get(`${API_BASE}/courses/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy');
    });

    test('Should validate required fields in course creation', async () => {
      const invalidCourse = {
        title: '', // Empty title should fail
        description: 'Valid description but title is empty',
        category: 'programming',
        level: 'beginner',
        price: 100
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(invalidCourse)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should handle invalid JWT token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should handle malformed request body', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({ invalidField: 'test' }) // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should handle invalid MongoDB ObjectId', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/invalid-id`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // 8. DATA VALIDATION & CONSTRAINTS
  // =============================================
  describe('🔒 Data Validation & Business Rules', () => {
    test('Should enforce email uniqueness', async () => {
      const duplicateUser = {
        name: 'Another Test User',
        email: 'teststudent@testdomain.com', // Duplicate email
        password: 'password123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã được sử dụng');
    });

    test('Should validate email format', async () => {
      const invalidEmailUser = {
        name: 'Test User',
        email: 'invalid-email-format', // Invalid email
        password: 'password123'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should enforce minimum password length', async () => {
      const shortPasswordUser = {
        name: 'Test User',
        email: 'shortpass@test.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(shortPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should validate course price constraints', async () => {
      const invalidPriceCourse = {
        title: 'Invalid Price Course',
        description: 'This course has invalid pricing',
        category: 'programming',
        level: 'beginner',
        price: -100, // Negative price should fail
        duration: 120
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${testData.tokens.instructor}`)
        .send(invalidPriceCourse)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should validate review rating range', async () => {
      const invalidRatingReview = {
        courseId: testData.courses.main._id,
        rating: 6, // Rating should be 1-5
        title: 'Invalid Rating',
        comment: 'This rating is out of range'
      };

      const response = await request(app)
        .post(`${API_BASE}/reviews`)
        .set('Authorization', `Bearer ${testData.tokens.student}`)
        .send(invalidRatingReview)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =============================================
  // 9. PERFORMANCE & SCALABILITY
  // =============================================
  describe('🚀 Performance & Scalability Tests', () => {
    test('Should handle pagination correctly', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses?page=1&limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('Should handle search functionality', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses?search=backend`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
    });

    test('Should handle filtering by category', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses?category=programming`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
    });

    test('Should handle sorting', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses?sort=price`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
    });
  });
});
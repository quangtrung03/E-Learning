const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server'); // We'll need to export app from server.js
const User = require('../src/models/User');
const Course = require('../src/models/Course');

describe('Course API Testing Suite', () => {
  let mongoServer;
  let authToken;
  let teacherUser;
  let testCourse;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Course.deleteMany({});

    // Create test teacher
    teacherUser = new User({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher',
      isEmailVerified: true,
      isActive: true
    });
    await teacherUser.save();

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'password123'
      });

    authToken = loginRes.body.token;

    // Create test course
    testCourse = new Course({
      title: 'Test Course',
      description: 'Test Description',
      instructor: teacherUser._id,
      category: 'programming',
      level: 'beginner',
      price: 299000,
      duration: 120
    });
    await testCourse.save();
  });

  describe('GET /api/courses', () => {
    test('should get all courses', async () => {
      const res = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('courses');
      expect(res.body.data.courses).toHaveLength(1);
      expect(res.body.data.courses[0].title).toBe('Test Course');
    });

    test('should filter courses by category', async () => {
      const res = await request(app)
        .get('/api/courses?category=programming')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courses).toHaveLength(1);
    });

    test('should filter courses by level', async () => {
      const res = await request(app)
        .get('/api/courses?level=beginner')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courses).toHaveLength(1);
    });

    test('should search courses by title', async () => {
      const res = await request(app)
        .get('/api/courses?search=Test')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courses).toHaveLength(1);
    });

    test('should paginate courses', async () => {
      const res = await request(app)
        .get('/api/courses?page=1&limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/courses/:id', () => {
    test('should get single course by ID', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course._id).toBe(testCourse._id.toString());
      expect(res.body.data.course.title).toBe('Test Course');
    });

    test('should return 404 for invalid course ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/courses/${invalidId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Không tìm thấy khóa học');
    });
  });

  describe('POST /api/courses', () => {
    test('should create new course with valid data', async () => {
      const courseData = {
        title: 'New Test Course',
        description: 'New test description',
        category: 'design',
        level: 'intermediate',
        price: 399000,
        duration: 180,
        requirements: ['Basic design knowledge'],
        whatYouWillLearn: ['Advanced design techniques']
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(courseData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe(courseData.title);
      expect(res.body.data.course.instructor).toBe(teacherUser._id.toString());
    });

    test('should require authentication', async () => {
      const courseData = {
        title: 'Unauthorized Course',
        description: 'Should fail',
        category: 'programming',
        level: 'beginner',
        price: 0,
        duration: 60
      };

      const res = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const invalidCourse = {
        title: '',
        description: ''
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCourse)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/courses/:id', () => {
    test('should update course by instructor', async () => {
      const updateData = {
        title: 'Updated Course Title',
        price: 499000
      };

      const res = await request(app)
        .put(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe(updateData.title);
      expect(res.body.data.course.price).toBe(updateData.price);
    });

    test('should not allow non-instructor to update course', async () => {
      // Create student user
      const studentUser = new User({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student',
        isEmailVerified: true,
        isActive: true
      });
      await studentUser.save();

      // Login as student
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      const studentToken = loginRes.body.token;

      const res = await request(app)
        .put(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Should not work' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    test('should delete course by instructor', async () => {
      const res = await request(app)
        .delete(`/api/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify course is deleted
      const course = await Course.findById(testCourse._id);
      expect(course).toBeNull();
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    test('should enroll student in course', async () => {
      // Create and login student
      const studentUser = new User({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student',
        isEmailVerified: true,
        isActive: true
      });
      await studentUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      const studentToken = loginRes.body.token;

      const res = await request(app)
        .post(`/api/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng ký khóa học thành công');

      // Verify enrollment
      const updatedCourse = await Course.findById(testCourse._id);
      expect(updatedCourse.students).toContain(studentUser._id);
    });

    test('should not allow duplicate enrollment', async () => {
      // Create and login student
      const studentUser = new User({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student',
        isEmailVerified: true,
        isActive: true
      });
      await studentUser.save();

      // Enroll student manually
      testCourse.students.push(studentUser._id);
      await testCourse.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      const studentToken = loginRes.body.token;

      const res = await request(app)
        .post(`/api/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Bạn đã đăng ký khóa học này rồi');
    });
  });
});

const express = require('express');
const { body } = require('express-validator');
const {
  getAssignmentsByCourse,
  getAssignment,
  createAssignment,
  submitAssignment,
  completeSubmission
} = require('../controllers/assignmentController');
const { protect, requireInstructor } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: API quản lý bài tập và quiz
 */

// Validation rules for assignment creation
const assignmentValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tiêu đề bài tập phải có từ 5-200 ký tự'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Mô tả bài tập phải có từ 20-2000 ký tự'),
  body('course')
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('type')
    .isIn(['quiz', 'essay', 'project', 'coding'])
    .withMessage('Loại bài tập không hợp lệ'),
  body('passingScore')
    .isInt({ min: 0, max: 100 })
    .withMessage('Điểm đỗ phải từ 0-100'),
  body('maxAttempts')
    .isInt({ min: 1 })
    .withMessage('Số lần làm bài phải lớn hơn 0'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất 1 câu hỏi'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Câu hỏi phải có từ 10-1000 ký tự'),
  body('questions.*.type')
    .isIn(['multiple-choice', 'true-false', 'essay', 'fill-blank'])
    .withMessage('Loại câu hỏi không hợp lệ'),
  body('questions.*.points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Điểm câu hỏi phải lớn hơn 0')
];

/**
 * @swagger
 * /api/courses/{courseId}/assignments:
 *   get:
 *     summary: Lấy danh sách assignments của khóa học
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [quiz, essay, project, coding]
 *         description: Loại bài tập
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
// This route will be /api/assignments/by-course/:courseId after mounting
router.get('/by-course/:courseId', protect, getAssignmentsByCourse);

/**
 * @swagger
 * /api/courses/{courseId}/assignments:
 *   post:
 *     summary: Tạo assignment cho khóa học
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - questions
 *               - passingScore
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [quiz, essay, project, coding]
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *               passingScore:
 *                 type: number
 *               maxAttempts:
 *                 type: number
 *               timeLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo bài tập thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
// This route will be /api/assignments/create/:courseId after mounting  
router.post('/create/:courseId', protect, requireInstructor, assignmentValidation, createAssignment);

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy bài tập
 */
// This route will be /api/assignments/:id after mounting
router.get('/:id', protect, getAssignment);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Tạo assignment mới
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - course
 *               - type
 *               - questions
 *               - passingScore
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               course:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [quiz, essay, project, coding]
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *               passingScore:
 *                 type: number
 *               maxAttempts:
 *                 type: number
 *               timeLimit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo bài tập thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
// General create assignment route - /api/assignments/ after mounting
router.post('/', protect, requireInstructor, assignmentValidation, createAssignment);

/**
 * @swagger
 * /api/assignments/{id}/submit:
 *   post:
 *     summary: Bắt đầu làm bài assignment
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startNew:
 *                 type: boolean
 *               answers:
 *                 type: array
 *     responses:
 *       201:
 *         description: Bắt đầu làm bài thành công
 *       400:
 *         description: Lỗi khi nộp bài
 */
// This route will be /api/assignments/:id/submit after mounting
router.post('/:id/submit', protect, submitAssignment);

/**
 * @swagger
 * /api/submissions/{id}/complete:
 *   put:
 *     summary: Hoàn thành submission
 *     tags: [Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Hoàn thành bài làm thành công
 *       400:
 *         description: Lỗi khi hoàn thành
 */
// This route will be /api/assignments/submissions/:id/complete after mounting
router.put('/submissions/:id/complete', protect, completeSubmission);

module.exports = router;
const express = require('express');
const { body } = require('express-validator');
const {
  createStudyGroup,
  getStudyGroups,
  getStudyGroupByCode,
  getStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  inviteToGroup,
  approveJoinRequest,
  scheduleSession,
  updateSession,
  deleteSession,
  addResource,
  removeResource,
  getGroupAnalytics
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: StudyGroups
 *   description: API quản lý nhóm học tập
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StudyGroup:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         course:
 *           type: object
 *         creator:
 *           type: object
 *         members:
 *           type: array
 *           items:
 *             type: object
 *         maxMembers:
 *           type: number
 *         isPrivate:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         sessions:
 *           type: array
 *         resources:
 *           type: array
 *         joinRequests:
 *           type: array
 *         status:
 *           type: string
 *           enum: [active, completed, suspended]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Validation rules
const createStudyGroupValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên nhóm phải có từ 3-100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không quá 500 ký tự'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Course ID không hợp lệ'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Số thành viên tối đa từ 2-50'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate phải là boolean'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tối đa 5 tags')
];

const updateStudyGroupValidation = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tên nhóm phải có từ 3-100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không quá 500 ký tự'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Số thành viên tối đa từ 2-50'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate phải là boolean'),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tối đa 5 tags')
];

const scheduleSessionValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tiêu đề session phải có từ 3-100 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không quá 500 ký tự'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time phải là định dạng ISO 8601'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Thời lượng từ 15-480 phút'),
  body('type')
    .isIn(['online', 'offline', 'hybrid'])
    .withMessage('Loại session không hợp lệ'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Địa điểm không quá 200 ký tự'),
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Meeting link phải là URL hợp lệ')
];

const inviteValidation = [
  body('userIds')
    .isArray({ min: 1, max: 10 })
    .withMessage('Phải mời ít nhất 1, tối đa 10 user'),
  body('userIds.*')
    .isMongoId()
    .withMessage('User ID không hợp lệ'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tin nhắn mời không quá 200 ký tự')
];

const addResourceValidation = [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tiêu đề tài liệu phải có từ 3-100 ký tự'),
  body('type')
    .isIn(['link', 'file', 'note'])
    .withMessage('Loại tài liệu không hợp lệ'),
  body('url')
    .if(body('type').equals('link'))
    .isURL()
    .withMessage('URL không hợp lệ'),
  body('content')
    .if(body('type').equals('note'))
    .isLength({ min: 10, max: 2000 })
    .withMessage('Nội dung note phải có từ 10-2000 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Mô tả không quá 300 ký tự')
];

// Protected routes
router.use(protect);

// Lookup / join by invite code (must be before '/:id')
router.get('/by-code/:code', getStudyGroupByCode);

/**
 * @swagger
 * /study-groups:
 *   post:
 *     summary: Tạo nhóm học tập mới
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên nhóm học tập
 *               description:
 *                 type: string
 *                 description: Mô tả nhóm
 *               courseId:
 *                 type: string
 *                 description: ID khóa học (optional)
 *               maxMembers:
 *                 type: number
 *                 default: 10
 *                 description: Số thành viên tối đa
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *                 description: Nhóm riêng tư (cần phê duyệt)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: Tạo nhóm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     studyGroup:
 *                       $ref: '#/components/schemas/StudyGroup'
 */
router.post('/', createStudyGroupValidation, createStudyGroup);

/**
 * @swagger
 * /study-groups:
 *   get:
 *     summary: Lấy danh sách nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter theo khóa học
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, suspended]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter theo tags (comma-separated)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, members]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/', getStudyGroups);

/**
 * @swagger
 * /study-groups/{id}:
 *   get:
 *     summary: Lấy chi tiết nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy nhóm
 */
router.get('/:id', getStudyGroup);

/**
 * @swagger
 * /study-groups/{id}:
 *   put:
 *     summary: Cập nhật nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               maxMembers:
 *                 type: number
 *               isPrivate:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền chỉnh sửa
 */
router.put('/:id', updateStudyGroupValidation, updateStudyGroup);

/**
 * @swagger
 * /study-groups/{id}:
 *   delete:
 *     summary: Xóa nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 */
router.delete('/:id', deleteStudyGroup);

/**
 * @swagger
 * /study-groups/{id}/join:
 *   post:
 *     summary: Tham gia nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tham gia thành công (hoặc gửi yêu cầu)
 *       400:
 *         description: Nhóm đã đầy hoặc đã tham gia
 */
router.post('/:id/join', joinStudyGroup);

/**
 * @swagger
 * /study-groups/{id}/leave:
 *   post:
 *     summary: Rời khỏi nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rời nhóm thành công
 *       400:
 *         description: Chưa tham gia nhóm
 */
router.post('/:id/leave', leaveStudyGroup);

/**
 * @swagger
 * /study-groups/{id}/invite:
 *   post:
 *     summary: Mời user vào nhóm
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi lời mời thành công
 *       403:
 *         description: Không có quyền mời
 */
router.post('/:id/invite', inviteValidation, inviteToGroup);

/**
 * @swagger
 * /study-groups/{id}/requests/{requestId}/approve:
 *   post:
 *     summary: Phê duyệt yêu cầu tham gia
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       403:
 *         description: Không có quyền phê duyệt
 */
router.post('/:id/requests/:requestId/approve', approveJoinRequest);

/**
 * @swagger
 * /study-groups/{id}/sessions:
 *   post:
 *     summary: Lên lịch session học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - duration
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *                 description: Thời lượng (phút)
 *               type:
 *                 type: string
 *                 enum: [online, offline, hybrid]
 *               location:
 *                 type: string
 *               meetingLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo session thành công
 */
router.post('/:id/sessions', scheduleSessionValidation, scheduleSession);

/**
 * @swagger
 * /study-groups/{id}/sessions/{sessionId}:
 *   put:
 *     summary: Cập nhật session
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id/sessions/:sessionId', updateSession);

/**
 * @swagger
 * /study-groups/{id}/sessions/{sessionId}:
 *   delete:
 *     summary: Xóa session
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id/sessions/:sessionId', deleteSession);

/**
 * @swagger
 * /study-groups/{id}/resources:
 *   post:
 *     summary: Thêm tài liệu vào nhóm
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [link, file, note]
 *               url:
 *                 type: string
 *               content:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm tài liệu thành công
 */
router.post('/:id/resources', addResourceValidation, addResource);

/**
 * @swagger
 * /study-groups/{id}/resources/{resourceId}:
 *   delete:
 *     summary: Xóa tài liệu
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa tài liệu thành công
 */
router.delete('/:id/resources/:resourceId', removeResource);

/**
 * @swagger
 * /study-groups/{id}/analytics:
 *   get:
 *     summary: Lấy thống kê nhóm học tập
 *     tags: [StudyGroups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *       403:
 *         description: Không có quyền xem thống kê
 */
router.get('/:id/analytics', getGroupAnalytics);

module.exports = router;
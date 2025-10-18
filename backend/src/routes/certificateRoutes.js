const express = require('express');
const {
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
  getCertificate,
  revokeCertificate,
  getCertificateStats
} = require('../controllers/certificateController');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: API quản lý chứng chỉ
 */

/**
 * @swagger
 * /api/certificates/generate:
 *   post:
 *     summary: Tạo certificate cho khóa học đã hoàn thành
 *     tags: [Certificates]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID của khóa học
 *     responses:
 *       201:
 *         description: Tạo certificate thành công
 *       400:
 *         description: Chưa đủ điều kiện hoặc đã có certificate
 */
router.post('/generate', protect, generateCertificate);

/**
 * @swagger
 * /api/certificates/my-certificates:
 *   get:
 *     summary: Lấy danh sách certificates của user
 *     tags: [Certificates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, revoked, expired]
 *         description: Trạng thái certificate
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/my-certificates', protect, getMyCertificates);

/**
 * @swagger
 * /api/certificates/verify/{hash}:
 *   get:
 *     summary: Xác thực certificate bằng hash
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate hash
 *     responses:
 *       200:
 *         description: Certificate hợp lệ
 *       404:
 *         description: Certificate không tồn tại
 *       400:
 *         description: Certificate đã hết hạn hoặc bị thu hồi
 */
router.get('/verify/:hash', verifyCertificate);

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Lấy thông tin certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate ID
 *       - in: query
 *         name: public
 *         schema:
 *           type: string
 *         description: Truy cập công khai (true/false)
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy certificate
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/:id', getCertificate);

/**
 * @swagger
 * /api/certificates/{id}/revoke:
 *   put:
 *     summary: Thu hồi certificate (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do thu hồi
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *       404:
 *         description: Không tìm thấy certificate
 */
router.put('/:id/revoke', protect, requireAdmin, revokeCertificate);

/**
 * @swagger
 * /api/certificates/admin/stats:
 *   get:
 *     summary: Lấy thống kê certificates (Admin only)
 *     tags: [Certificates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 */
router.get('/admin/stats', protect, requireAdmin, getCertificateStats);

module.exports = router;
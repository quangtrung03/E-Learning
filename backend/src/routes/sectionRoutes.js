const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  getSectionsByCourse,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/sectionController');

const router = express.Router();

const sectionCreateValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tiêu đề section phải có từ 3-200 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Thứ tự phải là số nguyên dương')
];

const sectionUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tiêu đề section phải có từ 3-200 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Thứ tự phải là số nguyên dương')
];

router.use(protect);

router.get('/by-course/:courseId', validateObjectId('courseId'), getSectionsByCourse);
router.post('/by-course/:courseId', validateObjectId('courseId'), sectionCreateValidation, createSection);
router.put('/:id', validateObjectId('id'), sectionUpdateValidation, updateSection);
router.delete('/:id', validateObjectId('id'), deleteSection);

module.exports = router;

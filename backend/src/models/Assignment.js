const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'essay', 'fill-blank'],
    required: true
  },
  question: {
    type: String,
    required: true,
    maxLength: [1000, 'Câu hỏi không được quá 1000 ký tự']
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed // String or Number
  },
  explanation: {
    type: String,
    maxLength: [500, 'Giải thích không được quá 500 ký tự']
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: [200, 'Tiêu đề bài tập không được quá 200 ký tự']
  },
  description: {
    type: String,
    required: true,
    maxLength: [2000, 'Mô tả bài tập không được quá 2000 ký tự']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    default: null
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'essay', 'project', 'coding'],
    required: true
  },
  questions: [questionSchema],
  instructions: {
    type: String,
    maxLength: [1000, 'Hướng dẫn không được quá 1000 ký tự']
  },
  timeLimit: {
    type: Number, // in minutes
    default: null
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowRetake: {
    type: Boolean,
    default: true
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

// Virtual for getting question count
assignmentSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Index for better performance
assignmentSchema.index({ course: 1, type: 1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ isPublished: 1, startDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
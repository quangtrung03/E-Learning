const mongoose = require('mongoose');

const studyScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    // Store as YYYY-MM-DD string for easy querying by month prefix
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    startTime: {
      type: String, // HH:mm
      default: null,
    },
    endTime: {
      type: String, // HH:mm
      default: null,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    note: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studyScheduleSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('StudySchedule', studyScheduleSchema);

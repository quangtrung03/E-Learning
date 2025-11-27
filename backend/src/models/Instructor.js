const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  gradient: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Instructor', instructorSchema);

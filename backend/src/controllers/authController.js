const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Gửi response với token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Loại bỏ password khỏi output
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// @desc    Đăng ký tài khoản
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    console.log('\n🔐 REGISTER ATTEMPT:');
    console.log('📦 Request Body:', req.body);
    
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    const { name, email, password, role } = req.body;
    console.log('✅ Validation passed');
    console.log('👤 User data:', { name, email, role: role || 'student' });
    
    // Kiểm tra email đã tồn tại
    console.log('🔍 Checking if email exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }
    console.log('✅ Email available');
    
    // Tạo user mới
    console.log('🔨 Creating new user...');
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });
    
    console.log('✅ User created successfully:', user._id);
    console.log('🎯 Sending token...');
    
    createSendToken(user, 201, res);
    
  } catch (error) {
    console.error('❌ Register error:', error);
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Tìm user và include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }
    
    createSendToken(user, 200, res);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('enrolledCourses.course', 'title thumbnail price')
      .populate('createdCourses', 'title thumbnail price students');
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name || req.user.name,
        phone: phone || req.user.phone,
        bio: bio || req.user.bio
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

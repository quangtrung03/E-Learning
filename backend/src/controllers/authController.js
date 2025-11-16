const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const AdminRequest = require('../models/AdminRequest');
const emailService = require('../config/email-new');

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
    
    const { name, email, password, requestAdmin } = req.body;
    console.log('✅ Validation passed');
    
    // Convert requestAdmin from "on" string to boolean
    const isRequestAdmin = requestAdmin === 'on' || requestAdmin === true || requestAdmin === 'true';
    console.log('👤 User data:', { name, email, requestAdmin, isRequestAdmin });
    
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
    
    // Tạo user mới (email chưa được xác thực)
    console.log('🔨 Creating new user...');
    const user = await User.create({
      name,
      email,
      password,
      emailVerified: false,
      adminRequestPending: isRequestAdmin
    });
    
    console.log('✅ User created successfully:', user._id);
    
    // Tạo email verification token
    console.log('📧 Creating email verification token...');
    const verification = new EmailVerification({
      user: user._id,
      email: email
    });
    
    // Generate token manually để debug
    console.log('🎫 Generating token manually...');
    verification.generateToken();
    console.log('✅ Token generated:', verification.token);
    
    await verification.save();
    console.log('💾 Verification saved to database');
    
    // Gửi email xác thực
    console.log('📤 Sending verification email...');
    const emailResult = await emailService.sendVerificationEmail(
      email, 
      verification.token, 
      name
    );
    
    if (emailResult.success) {
      console.log('✅ Verification email sent successfully');
      
      // Nếu user yêu cầu làm admin, tạo admin request và gửi email
      if (isRequestAdmin) {
        console.log('👑 Processing admin request...');
        
        // Tạo validation token và expiry cho admin request
        const crypto = require('crypto');
        const validationToken = crypto.randomBytes(32).toString('hex');
        const validationTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const adminRequest = await AdminRequest.create({
          user: user._id,
          email,
          validationToken,
          validationTokenExpires,
          fullName: name,
          reason: 'Yêu cầu quyền quản trị viên khi đăng ký'
        });
        
        console.log('✅ Admin request created with validation token');
        
        // GỬI EMAIL CHO USER để điền form chi tiết
        console.log('📤 Sending validation email to user...');
        const userValidationEmailResult = await emailService.sendAdminRequestValidation({
          userName: name,
          userEmail: email,
          validationToken: validationToken
        });
        
        if (userValidationEmailResult.success) {
          console.log('✅ Validation email sent to user successfully');
        } else {
          console.log('❌ Failed to send validation email to user:', userValidationEmailResult.error);
        }
        
        // NOTE: Chỉ gửi email cho admin SAU KHI user đã điền form và submit
        // Không gửi ngay ở đây vì admin request vẫn ở trạng thái pending_validation
      }
      
      res.status(201).json({
        success: true,
        message: isRequestAdmin 
          ? 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Yêu cầu quyền admin đã được gửi để xem xét.'
          : 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            adminRequestPending: user.adminRequestPending
          },
          emailSent: true
        }
      });
    } else {
      console.log('❌ Failed to send verification email:', emailResult.error);
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công nhưng không thể gửi email xác thực. Vui lòng thử lại sau.',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified
          },
          emailSent: false
        }
      });
    }
    
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
    
    // Kiểm tra email đã được xác thực chưa
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng xác thực email trước khi đăng nhập',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email
        }
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
    const gridfsService = require('../services/gridfsService');
    const { name, phone, bio } = req.body;
    
    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    
    // If avatar file is uploaded, upload to GridFS
    if (req.file) {
      const fileInfo = await gridfsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { userId: req.user.id, type: 'avatar' }
      );
      
      // Store GridFS filename in user profile
      updateData.avatar = fileInfo.filename;
      updateData.avatarFileId = fileInfo.fileId;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        user: {
          ...user.toObject(),
          avatarUrl: user.avatar ? `/api/files/${user.avatar}` : null
        }
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin',
      error: error.message
    });
  }
};

// @desc    Xác thực email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực là bắt buộc'
      });
    }
    
    console.log('🔍 Verifying email token:', token);
    
    // Tìm verification record
    const verification = await EmailVerification.findOne({ 
      token,
      verified: false 
    }).populate('user');
    
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã được sử dụng'
      });
    }
    
    // Kiểm tra token đã hết hạn chưa
    if (verification.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.'
      });
    }
    
    // Cập nhật user và verification
    const user = verification.user;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    
    await verification.markAsVerified();
    
    // Gửi email chào mừng
    await emailService.sendWelcomeEmail(user.email, user.name);
    
    console.log('✅ Email verified successfully for user:', user._id);
    
    // Tạo JWT token để user có thể đăng nhập ngay
    const authToken = signToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Xác thực email thành công! Chào mừng bạn đến với E-Learning Platform.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          emailVerifiedAt: user.emailVerifiedAt
        },
        token: authToken
      }
    });
    
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực email',
      error: error.message
    });
  }
};

// @desc    Gửi lại email xác thực
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }
    
    console.log('🔄 Resending verification email to:', email);
    
    // Tìm user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }
    
    // Kiểm tra đã xác thực chưa
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được xác thực rồi'
      });
    }
    
    // Xóa các verification cũ chưa xác thực
    await EmailVerification.deleteMany({ 
      user: user._id, 
      verified: false 
    });
    
    // Tạo verification mới
    const verification = new EmailVerification({
      user: user._id,
      email: email
    });
    
    // Generate token manually
    verification.generateToken();
    console.log('✅ Resend - Token generated:', verification.token);
    
    await verification.save();
    
    // Gửi email
    const emailResult = await emailService.sendVerificationEmail(
      email, 
      verification.token, 
      user.name
    );
    
    if (emailResult.success) {
      console.log('✅ Verification email resent successfully');
      res.status(200).json({
        success: true,
        message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
      });
    } else {
      console.log('❌ Failed to resend verification email:', emailResult.error);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.'
      });
    }
    
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi lại email xác thực',
      error: error.message
    });
  }
};

// @desc    Quên mật khẩu
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    console.log('\n🔐 FORGOT PASSWORD ATTEMPT:');
    console.log('📧 Email:', req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }
    
    // Tìm user theo email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Vì bảo mật, ta vẫn trả về thành công dù không tìm thấy user
      return res.status(200).json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.'
      });
    }
    
    console.log('✅ User found:', user.name);
    
    // Xóa các token reset password cũ của user này
    await PasswordReset.deleteMany({ userId: user._id });
    console.log('🗑️ Cleaned up old reset tokens');
    
    // Tạo token reset password mới
    const resetToken = PasswordReset.generateToken();
    
    // Lưu token vào database
    const passwordReset = new PasswordReset({
      userId: user._id,
      email: user.email,
      token: resetToken
    });
    
    await passwordReset.save();
    console.log('💾 Reset token saved to database');
    
    // Gửi email reset password
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      user.name
    );
    
    if (emailResult.success) {
      console.log('✅ Password reset email sent successfully');
      res.status(200).json({
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
      });
    } else {
      console.log('❌ Failed to send reset email:', emailResult.error);
      // Xóa token vì không gửi được email
      await PasswordReset.deleteOne({ token: resetToken });
      
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'
      });
    }
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý yêu cầu đặt lại mật khẩu',
      error: error.message
    });
  }
};

// @desc    Đặt lại mật khẩu
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    console.log('\n🔐 RESET PASSWORD ATTEMPT:');
    console.log('🎫 Token:', req.body.token);
    
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token và mật khẩu mới là bắt buộc'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }
    
    // Tìm token reset password
    const passwordReset = await PasswordReset.findOne({ token });
    
    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
      });
    }
    
    // Kiểm tra token đã được sử dụng chưa
    if (passwordReset.used) {
      return res.status(400).json({
        success: false,
        message: 'Token đặt lại mật khẩu đã được sử dụng'
      });
    }
    
    // Kiểm tra token đã hết hạn chưa
    if (passwordReset.isExpired()) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: 'Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.'
      });
    }
    
    console.log('✅ Reset token is valid');
    
    // Tìm user
    const user = await User.findById(passwordReset.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    console.log('✅ User found:', user.name);
    
    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully');
    
    // Đánh dấu token đã được sử dụng
    await passwordReset.markAsUsed();
    
    // Xóa tất cả token reset password khác của user này
    await PasswordReset.deleteMany({ 
      userId: user._id, 
      _id: { $ne: passwordReset._id } 
    });
    
    console.log('🗑️ Cleaned up other reset tokens');
    
    // Gửi email xác nhận
    const emailResult = await emailService.sendPasswordResetSuccessEmail(
      user.email, 
      user.name
    );
    
    if (emailResult.success) {
      console.log('✅ Password reset success email sent');
    } else {
      console.log('⚠️ Failed to send success email, but password was reset');
    }
    
    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt lại mật khẩu',
      error: error.message
    });
  }
};

// @desc    Xác thực token reset password (kiểm tra tính hợp lệ)
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Tìm token
    const passwordReset = await PasswordReset.findOne({ token }).populate('userId', 'name email');
    
    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (passwordReset.used) {
      return res.status(400).json({
        success: false,
        message: 'Token đã được sử dụng'
      });
    }
    
    if (passwordReset.isExpired()) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token hợp lệ',
      data: {
        email: passwordReset.userId.email,
        name: passwordReset.userId.name
      }
    });
    
  } catch (error) {
    console.error('❌ Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực token',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyResetToken
};

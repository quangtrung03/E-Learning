const sgMail = require('@sendgrid/mail');

// Set SendGrid API key with validation
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey && apiKey.startsWith('SG.')) {
  sgMail.setApiKey(apiKey);
} else if (apiKey) {
  console.warn('⚠️ SendGrid API key does not start with "SG." - email functionality may not work');
  sgMail.setApiKey(apiKey);
} else {
  console.warn('⚠️ SendGrid API key not found - email functionality disabled');
}

// Create email transporter using SendGrid
const createTransporter = () => {
  // SendGrid handles SMTP internally via API
  return sgMail;
};

// Get frontend URL based on environment
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || process.env.PRODUCTION_URL || 'https://e-learning-five-puce.vercel.app';
  }
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// Email templates
const emailTemplates = {
  // Email verification template
  verification: (data) => ({
    subject: '✅ Xác thực email - E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Xác thực Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .verification-box { background: #f8f9fa; border: 2px dashed #6c63ff; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6c63ff; padding: 15px; background: #e8f0fe; border-radius: 5px; margin: 15px 0; font-family: 'Courier New', monospace; }
          .button { display: inline-block; background: #6c63ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 E-Learning Platform</h1>
            <p>Xác thực tài khoản của bạn</p>
          </div>
          <div class="content">
            <h2>Chào mừng ${data.name}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại E-Learning Platform. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.</p>
            
            <div class="verification-box">
              <h3>🔐 Mã xác thực OTP</h3>
              <div class="otp">${data.otp}</div>
              <p style="font-size: 14px; color: #666;">Nhập mã này vào trang xác thực</p>
              
              <div class="note">
                <strong>💡 Gợi ý:</strong> Chỉ cần nhập 6 số trên - Rất dễ dàng!
              </div>
              
              <hr style="margin: 20px 0; border: 1px solid #ddd;">
              
              <p><strong>Hoặc click vào nút bên dưới để tự động xác thực:</strong></p>
              <a href="${getFrontendUrl()}/verify-email?token=${data.token}" class="button">✨ Xác thực tự động</a>
            </div>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>✅ Mã OTP có hiệu lực trong 24 giờ</li>
              <li>📱 Dễ dàng nhập trên điện thoại - Chỉ 6 số!</li>
              <li>🔒 Không chia sẻ mã này với ai khác</li>
              <li>🔗 Link tự động chỉ hoạt động khi click từ cùng thiết bị</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 E-Learning Platform. Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Welcome email template
  welcome: (data) => ({
    subject: '🎉 Chào mừng bạn đến với E-Learning Platform!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Chào mừng bạn!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .welcome-box { background: #f0f8ff; border: 2px solid #4facfe; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .feature-list { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { display: flex; align-items: center; margin: 10px 0; }
          .feature-icon { width: 30px; height: 30px; background: #4facfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; }
          .button { display: inline-block; background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 E-Learning Platform</h1>
            <p>Chào mừng bạn đến với cộng đồng học tập!</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2>🎉 Chào mừng ${data.userName}!</h2>
              <p>Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể bắt đầu khám phá hàng ngàn khóa học chất lượng ngay bây giờ!</p>
            </div>

            <h3>🚀 Bạn có thể làm gì tại E-Learning Platform?</h3>
            <div class="feature-list">
              <div class="feature-item">
                <div class="feature-icon">📚</div>
                <div>
                  <strong>Học tập không giới hạn:</strong> Truy cập hàng ngàn khóa học từ cơ bản đến nâng cao
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">👨‍🏫</div>
                <div>
                  <strong>Tạo khóa học:</strong> Chia sẻ kiến thức của bạn và kiếm thu nhập
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🏆</div>
                <div>
                  <strong>Theo dõi tiến độ:</strong> Xem chi tiết quá trình học tập của bạn
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">💬</div>
                <div>
                  <strong>Cộng đồng học tập:</strong> Kết nối với hàng nghìn học viên khác
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${getFrontendUrl()}/dashboard" class="button">🚀 Bắt đầu học ngay</a>
              <a href="${getFrontendUrl()}/courses" class="button">📖 Khám phá khóa học</a>
            </div>

            <p><strong>💡 Mẹo:</strong> Hãy hoàn thiện hồ sơ cá nhân để có trải nghiệm tốt nhất!</p>
            
            <p>Chúc bạn có những trải nghiệm học tập thú vị!</p>
            <p><strong>Đội ngũ E-Learning Platform</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 E-Learning Platform. Tất cả quyền được bảo lưu.</p>
            <p>Nếu bạn có thắc mắc, hãy liên hệ: <a href="mailto:elearnplatform1534@gmail.com">elearnplatform1534@gmail.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Admin request template  
  adminRequest: (data) => ({
    subject: '👑 Yêu cầu quyền Admin mới - E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Yêu cầu quyền Admin</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👑 E-Learning Platform - Admin Request</h1>
            <p>Có yêu cầu quyền quản trị viên mới</p>
          </div>
          <div class="content">
            <h2>Yêu cầu quyền Admin mới</h2>
            <p>Có một người dùng mới vừa đăng ký và yêu cầu quyền quản trị viên:</p>
            
            <div class="info-box">
              <h3>Thông tin người dùng:</h3>
              <p><strong>Tên:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Thời gian yêu cầu:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              <p><strong>Lý do xin admin:</strong></p>
              <blockquote style="background: #f8f9fa; padding: 15px; border-left: 3px solid #007bff; font-style: italic;">
                "${data.reason}"
              </blockquote>
            </div>

            <p>Vui lòng đăng nhập vào hệ thống admin để xem xét và phê duyệt yêu cầu này.</p>
            
            <a href="${getFrontendUrl()}/admin" class="button">
              Xem Admin Dashboard
            </a>
            
            <div class="footer">
              <p>Email này được gửi tự động từ hệ thống E-Learning Platform</p>
              <p>© 2025 E-Learning Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Admin request validation template (send to USER)
  adminRequestValidation: (data) => ({
    subject: '👑 Hoàn tất yêu cầu quyền Admin - E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hoàn tất yêu cầu Admin</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .validation-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .token { font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #667eea; padding: 10px; background: #e8f0fe; border-radius: 5px; margin: 10px 0; word-break: break-all; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👑 E-Learning Platform</h1>
            <p>Yêu cầu quyền quản trị viên</p>
          </div>
          <div class="content">
            <h2>Chào ${data.userName}!</h2>
            <p>Cảm ơn bạn đã yêu cầu quyền quản trị viên tại E-Learning Platform.</p>
            <p>Để hoàn tất yêu cầu, vui lòng điền đầy đủ thông tin cá nhân và lý do muốn trở thành Admin.</p>
            
            <div class="validation-box">
              <h3>📝 Điền thông tin chi tiết</h3>
              <p><strong>Bước 1:</strong> Click vào nút bên dưới (khuyến nghị)</p>
              <a href="${getFrontendUrl()}/admin/validate/${data.validationToken}" class="button">Điền thông tin ngay</a>
              
              <hr style="margin: 20px 0; border: 1px solid #ddd;">
              
              <p><strong>Bước 2 (Nếu link không hoạt động):</strong> Sử dụng mã token</p>
              <p>Truy cập: <strong>${getFrontendUrl()}/admin/validate</strong></p>
              <p>Nhập mã bên dưới:</p>
              <div class="token">${data.validationToken}</div>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Link và mã token có hiệu lực trong <strong>7 ngày</strong></li>
                <li>Bạn cần điền đầy đủ thông tin: CCCD, SĐT, địa chỉ, nghề nghiệp...</li>
                <li>Sau khi điền form, yêu cầu sẽ được gửi đến admin để phê duyệt</li>
                <li>Quá trình phê duyệt có thể mất 1-3 ngày làm việc</li>
              </ul>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: <strong>${process.env.ADMIN_EMAIL || 'support@elearning.com'}</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 E-Learning Platform. Nếu bạn không yêu cầu quyền admin, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password reset template
  passwordReset: (data) => ({
    subject: '🔐 Đặt lại mật khẩu - E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Đặt lại mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .reset-box { background: #fff5f5; border: 2px solid #ff6b6b; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff6b6b; padding: 15px; background: #ffe0e0; border-radius: 5px; margin: 15px 0; font-family: 'Courier New', monospace; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 E-Learning Platform</h1>
            <p>Yêu cầu đặt lại mật khẩu</p>
          </div>
          <div class="content">
            <h2>Xin chào ${data.name}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div class="reset-box">
              <h3>🔑 Mã xác thực OTP</h3>
              <div class="otp">${data.otp}</div>
              <p style="font-size: 14px; color: #666;">Nhập mã này để đặt lại mật khẩu</p>
              
              <div class="note">
                <strong>💡 Gợi ý:</strong> Chỉ cần nhập 6 số trên - Rất dễ dàng!
              </div>
              
              <hr style="margin: 20px 0;">
              
              <p><strong>Hoặc click vào nút bên dưới để tự động chuyển trang:</strong></p>
              <a href="${getFrontendUrl()}/reset-password?token=${data.token}" class="button">🔓 Đặt lại mật khẩu</a>
            </div>
            
            <p><strong>⚠️ Lưu ý:</strong></p>
            <ul>
              <li>Mã OTP có hiệu lực trong 1 giờ</li>
              <li>Dễ dàng nhập trên điện thoại - Chỉ 6 số!</li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com', // Replace with your verified sender
      subject: subject,
      html: html
    };

    const result = await transporter.send(msg);
    console.log('✅ Email sent successfully via SendGrid:', result[0]?.headers?.['x-message-id']);
    return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email
const sendVerificationEmail = async (email, token, otp, name) => {
  try {
    console.log('📧 Preparing verification email...');
    console.log('📧 Email:', email);
    console.log('🎫 Token:', token);
    console.log('🔢 OTP:', otp);
    console.log('👤 Name:', name);

    const frontendUrl = getFrontendUrl();
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const emailContent = emailTemplates.verification({
      name,
      verificationUrl,
      token,
      otp
    });

    console.log('🔗 Verification URL:', verificationUrl);
    console.log('🔢 OTP Code:', otp);

    return await sendEmail(email, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin request notification
// Send admin request validation email to USER
const sendAdminRequestValidation = async (data) => {
  try {
    console.log('📧 Preparing admin request validation email...');
    console.log('📧 Email:', data.userEmail);
    console.log('🎫 Token:', data.validationToken);

    const emailContent = emailTemplates.adminRequestValidation(data);

    return await sendEmail(data.userEmail, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send admin request validation:', error);
    return { success: false, error: error.message };
  }
};

// Send admin request notification to ADMIN
const sendAdminRequestNotification = async (data) => {
  try {
    console.log('📧 Preparing admin request notification...');

    const emailContent = emailTemplates.adminRequest(data);

    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL;

    return await sendEmail(adminEmail, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send admin request notification:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    console.log('📧 Preparing welcome email...');
    console.log('👤 User:', name);
    console.log('📧 Email:', email);

    const emailContent = emailTemplates.welcome({
      userName: name,
      email: email
    });

    return await sendEmail(email, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, otp, name) => {
  try {
    console.log('📧 Preparing password reset email...');
    console.log('👤 User:', name);
    console.log('📧 Email:', email);
    console.log('🎫 Token:', token);
    console.log('🔢 OTP:', otp);

    const emailContent = emailTemplates.passwordReset({
      name,
      token,
      otp
    });

    return await sendEmail(email, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (email, name) => {
  try {
    console.log('📧 Preparing password reset success email...');
    console.log('👤 User:', name);
    console.log('📧 Email:', email);

    const emailContent = {
      subject: '✅ Mật khẩu đã được đặt lại thành công - E-Learning Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mật khẩu đã được đặt lại</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .success-box { background: #d4edda; border: 2px solid #28a745; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mật khẩu đã được đặt lại</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${name}!</h2>
              <div class="success-box">
                <h3>🎉 Đặt lại mật khẩu thành công!</h3>
                <p>Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
              </div>
              <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
            </div>
            <div class="footer">
              <p>© 2025 E-Learning Platform</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return await sendEmail(email, emailContent.subject, emailContent.html);
  } catch (error) {
    console.error('❌ Failed to send password reset success email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendAdminRequestValidation,
  sendAdminRequestNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendCourseApprovalEmail: async (data) => {
    try {
      const emailContent = {
        subject: '✅ Khóa học của bạn đã được duyệt - E-Learning Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Khóa học đã được duyệt</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .success-box { background: #d4edda; border: 2px solid #28a745; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
              .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Khóa học đã được duyệt!</h1>
              </div>
              <div class="content">
                <h2>Chào ${data.instructorName}!</h2>
                <div class="success-box">
                  <h3>✅ Khóa học "${data.courseTitle}" đã được duyệt</h3>
                  <p>Chúc mừng! Khóa học của bạn đã được phê duyệt và giờ đây đã được công khai trên nền tảng.</p>
                </div>
                <p>Khóa học của bạn giờ đây có thể được tìm thấy bởi tất cả học viên trên E-Learning Platform.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${getFrontendUrl()}/courses/${data.courseId}" class="button">Xem khóa học</a>
                </div>
              </div>
              <div class="footer">
                <p>© 2025 E-Learning Platform</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      return await sendEmail(data.to, emailContent.subject, emailContent.html);
    } catch (error) {
      console.error('❌ Failed to send course approval email:', error);
      return { success: false, error: error.message };
    }
  },
  sendCourseRejectionEmail: async (data) => {
    try {
      const emailContent = {
        subject: '❌ Khóa học của bạn cần chỉnh sửa - E-Learning Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Khóa học cần chỉnh sửa</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .warning-box { background: #fff3cd; border: 2px solid #ffc107; padding: 25px; border-radius: 10px; margin: 20px 0; }
              .reason-box { background: #f8f9fa; padding: 20px; border-left: 4px solid #dc3545; margin: 15px 0; }
              .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📝 Khóa học cần chỉnh sửa</h1>
              </div>
              <div class="content">
                <h2>Chào ${data.instructorName}!</h2>
                <div class="warning-box">
                  <h3>⚠️ Khóa học "${data.courseTitle}" cần chỉnh sửa</h3>
                  <p>Khóa học của bạn đã được xem xét nhưng cần một số điều chỉnh trước khi được phê duyệt.</p>
                </div>
                <div class="reason-box">
                  <h4>Lý do từ quản trị viên:</h4>
                  <p>${data.rejectionReason}</p>
                </div>
                <p>Vui lòng chỉnh sửa khóa học theo hướng dẫn trên và gửi lại để được xem xét.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${getFrontendUrl()}/dashboard" class="button">Chỉnh sửa khóa học</a>
                </div>
              </div>
              <div class="footer">
                <p>© 2025 E-Learning Platform</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      return await sendEmail(data.to, emailContent.subject, emailContent.html);
    } catch (error) {
      console.error('❌ Failed to send course rejection email:', error);
      return { success: false, error: error.message };
    }
  },
  emailTemplates,
  getFrontendUrl
};
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For Gmail, you need to use App Password (not regular password)
  // Go to Google Account > Security > 2-Step Verification > App passwords
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'elearnplatform1534@gmail.com',
      pass: process.env.EMAIL_PASSWORD // App password from Gmail
    }
  });
};

// Get frontend URL based on environment
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.PRODUCTION_URL || process.env.FRONTEND_URL;
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
          .token { font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #6c63ff; padding: 10px; background: #e8f0fe; border-radius: 5px; margin: 10px 0; }
          .button { display: inline-block; background: #6c63ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
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
              <h3>🔐 Xác thực email</h3>
              <p><strong>Cách 1:</strong> Click vào nút bên dưới (chỉ hoạt động trên máy tính)</p>
              <a href="${getFrontendUrl()}/verify-email?token=${data.token}" class="button">Xác thực ngay</a>
              
              <hr style="margin: 20px 0; border: 1px solid #ddd;">
              
              <p><strong>Cách 2:</strong> Copy mã bên dưới và nhập vào trang web (khuyến nghị cho điện thoại)</p>
              <div class="token">${data.token}</div>
              <p>Truy cập: <strong>${getFrontendUrl()}/verify-email</strong> và nhập mã trên</p>
            </div>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Mã xác thực có hiệu lực trong 24 giờ</li>
              <li>Nếu bạn đang dùng điện thoại, hãy sử dụng Cách 2</li>
              <li>Không chia sẻ mã này với ai khác</li>
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
          .token { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #ff6b6b; padding: 10px; background: #ffe0e0; border-radius: 5px; margin: 10px 0; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
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
              <h3>🔑 Đặt lại mật khẩu</h3>
              <p><strong>Cách 1:</strong> Click vào nút bên dưới</p>
              <a href="${getFrontendUrl()}/reset-password?token=${data.token}" class="button">Đặt lại mật khẩu</a>
              
              <hr style="margin: 20px 0;">
              
              <p><strong>Cách 2:</strong> Sử dụng mã token</p>
              <div class="token">${data.token}</div>
              <p>Truy cập: <strong>${getFrontendUrl()}/reset-password</strong></p>
            </div>
            
            <p><strong>⚠️ Lưu ý:</strong> Link/mã này chỉ có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"E-Learning Platform" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
  getFrontendUrl
};
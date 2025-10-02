const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For Gmail, you need to use App Password (not regular password)
  // Go to Google Account > Security > 2-Step Verification > App passwords
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'elearnplatform1534@gmail.com',
      pass: process.env.EMAIL_PASSWORD // App password from Gmail
    }
  });
};

// Email templates
const emailTemplates = {
  verification: (verificationToken, userName) => ({
    subject: '🎓 Xác thực tài khoản E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Xác thực tài khoản</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 E-Learning Platform</h1>
            <p>Chào mừng bạn đến với nền tảng học tập trực tuyến!</p>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản trên E-Learning Platform. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào nút dưới đây:</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}" class="button">
                Xác thực Email
              </a>
            </div>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Link xác thực có hiệu lực trong <strong>24 giờ</strong></li>
              <li>Nếu bạn không xác thực email, tài khoản sẽ không thể đăng nhập</li>
              <li>Nếu link hết hạn, bạn có thể yêu cầu gửi lại email xác thực</li>
            </ul>
            
            <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Token xác thực:</strong> <code>${verificationToken}</code></p>
            <p><em>(Bạn cũng có thể copy token này và nhập thủ công vào trang xác thực)</em></p>
          </div>
          <div class="footer">
            <p>© 2025 E-Learning Platform. All rights reserved.</p>
            <p>Email được gửi tự động, vui lòng không trả lời email này.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcomeAfterVerification: (userName) => ({
    subject: '🎉 Chào mừng bạn đến với E-Learning Platform!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Chào mừng!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Xác thực thành công!</h1>
            <p>Tài khoản của bạn đã được kích hoạt</p>
          </div>
          <div class="content">
            <h2>Chào mừng ${userName}!</h2>
            <p>Tuyệt vời! Bạn đã xác thực email thành công. Giờ đây bạn có thể:</p>
            
            <ul>
              <li>🎓 Tham gia các khóa học miễn phí và có phí</li>
              <li>📚 Tạo và quản lý khóa học riêng của bạn</li>
              <li>💬 Tương tác với cộng đồng học viên</li>
              <li>📊 Theo dõi tiến độ học tập</li>
              <li>🏆 Nhận chứng chỉ sau khi hoàn thành khóa học</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
                Bắt đầu học ngay
              </a>
            </div>
            
            <p>Cảm ơn bạn đã tin tưởng và lựa chọn E-Learning Platform!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (resetToken, userName) => ({
    subject: '🔐 Đặt lại mật khẩu - E-Learning Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Đặt lại mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
            <p>Yêu cầu khôi phục tài khoản</p>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên E-Learning Platform.</p>
            
            <div class="warning">
              <strong>⚠️ Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
            </div>
            
            <p>Để đặt lại mật khẩu, nhấp vào nút bên dưới:</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}" class="button">
                Đặt lại mật khẩu
              </a>
            </div>
            
            <p><strong>Thông tin quan trọng:</strong></p>
            <ul>
              <li>Link đặt lại mật khẩu có hiệu lực trong <strong>1 giờ</strong></li>
              <li>Chỉ sử dụng được <strong>1 lần duy nhất</strong></li>
              <li>Sau khi đặt lại, bạn sẽ cần đăng nhập bằng mật khẩu mới</li>
              <li>Nếu link hết hạn, bạn có thể yêu cầu đặt lại mật khẩu lần nữa</li>
            </ul>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Token đặt lại:</strong> <code>${resetToken}</code></p>
            <p><em>(Bạn cũng có thể copy token này và nhập thủ công vào trang đặt lại mật khẩu)</em></p>
          </div>
          <div class="footer">
            <p>© 2025 E-Learning Platform. All rights reserved.</p>
            <p>Email được gửi tự động, vui lòng không trả lời email này.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordResetSuccess: (userName) => ({
    subject: '✅ Mật khẩu đã được đặt lại thành công',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Đặt lại mật khẩu thành công</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Thành công!</h1>
            <p>Mật khẩu đã được đặt lại</p>
          </div>
          <div class="content">
            <h2>Xin chào ${userName}!</h2>
            <p>Mật khẩu của bạn đã được đặt lại thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
                Đăng nhập ngay
              </a>
            </div>
            
            <p>Để bảo mật tài khoản của bạn, chúng tôi khuyến nghị:</p>
            <ul>
              <li>🔐 Sử dụng mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)</li>
              <li>🚫 Không chia sẻ mật khẩu với bất kỳ ai</li>
              <li>🔄 Thay đổi mật khẩu định kỳ</li>
              <li>📱 Bật xác thực 2 yếu tố nếu có thể</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"E-Learning Platform" <${process.env.EMAIL_USER || 'elearnplatform1534@gmail.com'}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const emailService = {
  sendVerificationEmail: async (email, verificationToken, userName) => {
    const template = emailTemplates.verification(verificationToken, userName);
    return await sendEmail(email, template);
  },

  sendWelcomeEmail: async (email, userName) => {
    const template = emailTemplates.welcomeAfterVerification(userName);
    return await sendEmail(email, template);
  },

  sendPasswordResetEmail: async (email, resetToken, userName) => {
    const template = emailTemplates.passwordReset(resetToken, userName);
    return await sendEmail(email, template);
  },

  sendPasswordResetSuccessEmail: async (email, userName) => {
    const template = emailTemplates.passwordResetSuccess(userName);
    return await sendEmail(email, template);
  }
};

module.exports = emailService;

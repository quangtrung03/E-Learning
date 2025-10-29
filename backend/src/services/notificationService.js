const sgMail = require('@sendgrid/mail');
const { Server } = require('socket.io');
const User = require('../models/User');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key-here');

class NotificationService {
  constructor() {
    this.io = null;
    this.emailTransporter = sgMail; // Use SendGrid instead of nodemailer
    // No need to init transporter anymore
  }

  // Khởi tạo Socket.IO
  initSocketIO(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.CORS_ORIGIN] 
          : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Join user room for personalized notifications
      socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 User ${userId} joined their room`);
      });

      // Join course room for course-specific notifications
      socket.on('join-course', (courseId) => {
        socket.join(`course-${courseId}`);
        console.log(`📚 Joined course room: ${courseId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Email transporter is now SendGrid (initialized in constructor)

  // Gửi thông báo realtime
  async sendRealtimeNotification(userId, notification) {
    if (!this.io) return;

    try {
      this.io.to(`user-${userId}`).emit('notification', {
        id: Date.now(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date(),
        read: false
      });

      console.log(`🔔 Realtime notification sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Error sending realtime notification:', error);
    }
  }

  // Gửi thông báo đến course room
  async sendCourseNotification(courseId, notification) {
    if (!this.io) return;

    try {
      this.io.to(`course-${courseId}`).emit('course-notification', {
        ...notification,
        timestamp: new Date()
      });

      console.log(`📚 Course notification sent to course ${courseId}`);
    } catch (error) {
      console.error('❌ Error sending course notification:', error);
    }
  }

  // Gửi email
  async sendEmail(to, subject, html, attachments = null) {
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com', // Replace with your verified sender
        subject,
        html,
        attachments: attachments ? [attachments] : undefined
      };

      const result = await this.emailTransporter.send(msg);
      console.log(`📧 Email sent successfully to ${to} via SendGrid`);
      return result;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  // Template emails
  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Chào mừng ${user.fullName}!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại E-Learning Platform.</p>
        <p>Bạn có thể bắt đầu khám phá các khóa học chất lượng cao của chúng tôi.</p>
        <a href="${process.env.FRONTEND_URL}/courses" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Khám phá khóa học
        </a>
        <p>Trân trọng,<br>Đội ngũ E-Learning Platform</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Chào mừng bạn đến với E-Learning Platform', html);
  }

  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực email của bạn</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
        <a href="${verificationUrl}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Xác thực Email
        </a>
        <p>Link sẽ hết hạn trong 24 giờ.</p>
        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Xác thực email - E-Learning Platform', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đặt lại mật khẩu</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tạo mật khẩu mới:</p>
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Đặt lại mật khẩu
        </a>
        <p>Link sẽ hết hạn trong 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Đặt lại mật khẩu - E-Learning Platform', html);
  }

  async sendEnrollmentConfirmation(user, course) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đăng ký khóa học thành công!</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Bạn đã đăng ký thành công khóa học: <strong>${course.title}</strong></p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>${course.title}</h3>
          <p>Giảng viên: ${course.instructor.fullName}</p>
          <p>Thời lượng: ${course.duration} giờ</p>
          <p>Số bài học: ${course.lessons?.length || 0}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/courses/${course._id}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Bắt đầu học ngay
        </a>
        <p>Chúc bạn học tập hiệu quả!</p>
      </div>
    `;

    await this.sendEmail(user.email, `Đăng ký thành công: ${course.title}`, html);
  }

  async sendPaymentConfirmation(user, course, payment) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thanh toán thành công!</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Cảm ơn bạn đã thanh toán cho khóa học: <strong>${course.title}</strong></p>
        
        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>Thông tin thanh toán</h3>
          <p><strong>Mã giao dịch:</strong> ${payment.transactionId}</p>
          <p><strong>Số tiền:</strong> ${payment.amount.toLocaleString('vi-VN')} VNĐ</p>
          <p><strong>Phương thức:</strong> ${payment.provider.toUpperCase()}</p>
          <p><strong>Thời gian:</strong> ${new Date(payment.paidAt).toLocaleString('vi-VN')}</p>
        </div>

        <div style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3>Thông tin khóa học</h3>
          <p><strong>Tên khóa học:</strong> ${course.title}</p>
          <p><strong>Giảng viên:</strong> ${course.instructor.fullName}</p>
          <p><strong>Thời lượng:</strong> ${course.duration} giờ</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/courses/${course._id}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Vào học ngay
        </a>
        
        <p>Chúc bạn học tập vui vẻ và hiệu quả!</p>
      </div>
    `;

    await this.sendEmail(user.email, `Thanh toán thành công: ${course.title}`, html);
  }

  async sendCertificateEmail(user, course, certificateUrl) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Chúc mừng bạn hoàn thành khóa học!</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Chúc mừng bạn đã hoàn thành xuất sắc khóa học: <strong>${course.title}</strong></p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; border: 2px solid #28a745;">
            <h3>🏆 Chứng chỉ hoàn thành</h3>
            <p>Bạn đã được cấp chứng chỉ cho khóa học này!</p>
          </div>
        </div>

        <a href="${certificateUrl}" 
           style="background-color: #ffc107; color: #000; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          📜 Tải chứng chỉ
        </a>

        <p>Hãy chia sẻ thành tích của bạn trên mạng xã hội và tiếp tục hành trình học tập!</p>
        
        <a href="${process.env.FRONTEND_URL}/certificates" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Xem tất cả chứng chỉ
        </a>
      </div>
    `;

    await this.sendEmail(user.email, `🎉 Chứng chỉ hoàn thành: ${course.title}`, html);
  }

  async sendAssignmentReminder(user, course, assignment) {
    const dueDate = new Date(assignment.dueDate).toLocaleString('vi-VN');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⏰ Nhắc nhở nộp bài tập</h2>
        <p>Xin chào ${user.fullName},</p>
        <p>Bạn có bài tập sắp hết hạn trong khóa học: <strong>${course.title}</strong></p>
        
        <div style="border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; background-color: #fff3cd;">
          <h3>${assignment.title}</h3>
          <p><strong>Hạn nộp:</strong> ${dueDate}</p>
          <p>${assignment.description}</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/courses/${course._id}/assignments/${assignment._id}" 
           style="background-color: #ffc107; color: #000; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Làm bài tập ngay
        </a>
        
        <p>Đừng quên nộp bài đúng hạn nhé!</p>
      </div>
    `;

    await this.sendEmail(user.email, `⏰ Nhắc nhở: ${assignment.title}`, html);
  }

  async sendNewLessonNotification(users, course, lesson) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🆕 Bài học mới đã được thêm!</h2>
        <p>Khóa học <strong>${course.title}</strong> có bài học mới:</p>
        
        <div style="border: 1px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 5px; background-color: #f8f9fa;">
          <h3>${lesson.title}</h3>
          <p>${lesson.description}</p>
          <p><strong>Thời lượng:</strong> ${lesson.duration} phút</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/courses/${course._id}/lessons/${lesson._id}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Xem bài học mới
        </a>
      </div>
    `;

    // Gửi email cho tất cả students
    const emailPromises = users.map(user => 
      this.sendEmail(user.email, `🆕 Bài học mới: ${lesson.title}`, html)
    );

    await Promise.allSettled(emailPromises);
  }

  // Utility methods
  async notifyPaymentSuccess(userId, courseId, paymentData) {
    await this.sendRealtimeNotification(userId, {
      type: 'payment_success',
      title: 'Thanh toán thành công',
      message: `Bạn đã thanh toán thành công cho khóa học. Bắt đầu học ngay!`,
      data: { courseId, paymentId: paymentData.id }
    });
  }

  async notifyNewDiscussion(courseId, discussion) {
    await this.sendCourseNotification(courseId, {
      type: 'new_discussion',
      title: 'Thảo luận mới',
      message: `${discussion.author.fullName} đã tạo thảo luận: ${discussion.title}`,
      data: { discussionId: discussion._id }
    });
  }

  async notifyAssignmentGraded(userId, assignment, grade) {
    await this.sendRealtimeNotification(userId, {
      type: 'assignment_graded',
      title: 'Bài tập đã được chấm điểm',
      message: `Bài tập "${assignment.title}" đã được chấm: ${grade}/100`,
      data: { assignmentId: assignment._id, grade }
    });
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
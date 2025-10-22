const cron = require('node-cron');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Payment = require('../models/Payment');
const LearningAnalytics = require('../models/LearningAnalytics');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const notificationService = require('../services/notificationService');

class CronJobService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('🕐 Initializing cron jobs...');
    
    // Chỉ chạy cron jobs trong production hoặc khi NODE_ENV=development và ENABLE_CRON=true
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      this.setupJobs();
      this.isInitialized = true;
      console.log('✅ Cron jobs initialized successfully');
    } else {
      console.log('⚠️ Cron jobs disabled in development mode');
    }
  }

  setupJobs() {
    // 1. Dọn dẹp email verification cũ (mỗi ngày lúc 2:00 AM)
    this.jobs.set('cleanupEmailVerification', 
      cron.schedule('0 2 * * *', this.cleanupEmailVerifications, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 2. Dọn dẹp password reset tokens cũ (mỗi giờ)
    this.jobs.set('cleanupPasswordReset', 
      cron.schedule('0 * * * *', this.cleanupPasswordResetTokens, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 3. Nhắc nhở bài tập sắp hết hạn (mỗi ngày lúc 9:00 AM)
    this.jobs.set('assignmentReminder', 
      cron.schedule('0 9 * * *', this.sendAssignmentReminders, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 4. Cập nhật thống kê hàng ngày (mỗi ngày lúc 1:00 AM)
    this.jobs.set('dailyAnalytics', 
      cron.schedule('0 1 * * *', this.updateDailyAnalytics, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 5. Dọn dẹp payment pending cũ (mỗi 30 phút)
    this.jobs.set('cleanupPendingPayments', 
      cron.schedule('*/30 * * * *', this.cleanupPendingPayments, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 6. Gửi báo cáo hàng tuần (Chủ nhật lúc 8:00 AM)
    this.jobs.set('weeklyReport', 
      cron.schedule('0 8 * * 0', this.sendWeeklyReports, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 7. Backup database (mỗi ngày lúc 3:00 AM) - chỉ production
    if (process.env.NODE_ENV === 'production') {
      this.jobs.set('databaseBackup', 
        cron.schedule('0 3 * * *', this.backupDatabase, {
          scheduled: true,
          timezone: 'Asia/Ho_Chi_Minh'
        })
      );
    }

    // 8. Cập nhật course ratings (mỗi giờ)
    this.jobs.set('updateCourseRatings', 
      cron.schedule('0 * * * *', this.updateCourseRatings, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    // 9. Nhắc nhở học tập (mỗi ngày lúc 7:00 PM)
    this.jobs.set('learningReminder', 
      cron.schedule('0 19 * * *', this.sendLearningReminders, {
        scheduled: true,
        timezone: 'Asia/Ho_Chi_Minh'
      })
    );

    console.log(`📅 Scheduled ${this.jobs.size} cron jobs`);
  }

  // Dọn dẹp email verification tokens đã hết hạn
  async cleanupEmailVerifications() {
    try {
      console.log('🧹 Starting cleanup of expired email verifications...');
      
      const result = await EmailVerification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`✅ Cleaned up ${result.deletedCount} expired email verification tokens`);
    } catch (error) {
      console.error('❌ Error cleaning up email verifications:', error);
    }
  }

  // Dọn dẹp password reset tokens đã hết hạn
  async cleanupPasswordResetTokens() {
    try {
      console.log('🧹 Starting cleanup of expired password reset tokens...');
      
      const result = await PasswordReset.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`✅ Cleaned up ${result.deletedCount} expired password reset tokens`);
    } catch (error) {
      console.error('❌ Error cleaning up password reset tokens:', error);
    }
  }

  // Gửi nhắc nhở bài tập sắp hết hạn
  async sendAssignmentReminders() {
    try {
      console.log('📚 Sending assignment reminders...');
      
      // Tìm bài tập hết hạn trong 24 giờ tới
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const today = new Date();

      const assignments = await Assignment.find({
        dueDate: {
          $gte: today,
          $lte: tomorrow
        },
        status: 'published'
      }).populate('course');

      for (const assignment of assignments) {
        // Tìm students chưa nộp bài
        const course = await Course.findById(assignment.course._id)
          .populate('students', 'fullName email');

        const submittedUsers = assignment.submissions.map(s => s.student.toString());
        const pendingUsers = course.students.filter(
          student => !submittedUsers.includes(student._id.toString())
        );

        // Gửi email nhắc nhở
        for (const user of pendingUsers) {
          await notificationService.sendAssignmentReminder(user, course, assignment);
        }

        console.log(`📧 Sent ${pendingUsers.length} assignment reminders for: ${assignment.title}`);
      }

    } catch (error) {
      console.error('❌ Error sending assignment reminders:', error);
    }
  }

  // Cập nhật thống kê hàng ngày
  async updateDailyAnalytics() {
    try {
      console.log('📊 Updating daily analytics...');
      
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Cập nhật learning streak cho users
      const activeUsers = await LearningAnalytics.distinct('user', {
        'activities.timestamp': {
          $gte: yesterday,
          $lt: today
        }
      });

      for (const userId of activeUsers) {
        const analytics = await LearningAnalytics.findOne({ user: userId });
        if (analytics) {
          // Cập nhật learning streak
          const lastActivity = analytics.activities
            .sort((a, b) => b.timestamp - a.timestamp)[0];

          if (lastActivity && lastActivity.timestamp >= yesterday) {
            analytics.learningStreak = (analytics.learningStreak || 0) + 1;
          } else {
            analytics.learningStreak = 0;
          }

          await analytics.save();
        }
      }

      console.log(`📈 Updated analytics for ${activeUsers.length} users`);

    } catch (error) {
      console.error('❌ Error updating daily analytics:', error);
    }
  }

  // Dọn dẹp payment pending cũ
  async cleanupPendingPayments() {
    try {
      console.log('💰 Cleaning up old pending payments...');
      
      // Xóa payment pending quá 1 giờ
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const result = await Payment.deleteMany({
        status: 'pending',
        createdAt: { $lt: oneHourAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`✅ Cleaned up ${result.deletedCount} old pending payments`);
      }

    } catch (error) {
      console.error('❌ Error cleaning up pending payments:', error);
    }
  }

  // Gửi báo cáo hàng tuần
  async sendWeeklyReports() {
    try {
      console.log('📊 Sending weekly reports...');
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Thống kê tuần
      const stats = {
        newUsers: await User.countDocuments({
          createdAt: { $gte: oneWeekAgo }
        }),
        newEnrollments: await Course.aggregate([
          { $unwind: '$students' },
          { 
            $lookup: {
              from: 'users',
              localField: 'students',
              foreignField: '_id',
              as: 'studentInfo'
            }
          },
          {
            $match: {
              'studentInfo.createdAt': { $gte: oneWeekAgo }
            }
          },
          { $count: 'total' }
        ]),
        completedPayments: await Payment.countDocuments({
          status: 'completed',
          paidAt: { $gte: oneWeekAgo }
        })
      };

      // Gửi báo cáo cho admins
      const admins = await User.find({ role: 'admin' });
      
      // Tạo HTML báo cáo
      const reportHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📊 Báo cáo tuần từ ${oneWeekAgo.toLocaleDateString('vi-VN')} đến ${new Date().toLocaleDateString('vi-VN')}</h2>
          
          <div style="display: grid; gap: 20px;">
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
              <h3>👥 Người dùng mới</h3>
              <p style="font-size: 24px; color: #007bff; margin: 0;">${stats.newUsers}</p>
            </div>
            
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
              <h3>📚 Đăng ký khóa học mới</h3>
              <p style="font-size: 24px; color: #28a745; margin: 0;">${stats.newEnrollments[0]?.total || 0}</p>
            </div>
            
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
              <h3>💰 Thanh toán thành công</h3>
              <p style="font-size: 24px; color: #ffc107; margin: 0;">${stats.completedPayments}</p>
            </div>
          </div>
          
          <p>Báo cáo được tạo tự động vào ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      `;

      for (const admin of admins) {
        await notificationService.sendEmail(
          admin.email,
          `📊 Báo cáo tuần - ${new Date().toLocaleDateString('vi-VN')}`,
          reportHtml
        );
      }

      console.log(`📧 Weekly reports sent to ${admins.length} admins`);

    } catch (error) {
      console.error('❌ Error sending weekly reports:', error);
    }
  }

  // Backup database (placeholder - implementation depends on database setup)
  async backupDatabase() {
    try {
      console.log('💾 Starting database backup...');
      
      // Trong production, implement backup logic phù hợp với infrastructure
      // Ví dụ: mongodump, AWS S3 backup, etc.
      
      if (process.env.NODE_ENV === 'production') {
        // Implementation for actual backup
        console.log('💾 Database backup completed (placeholder)');
      }

    } catch (error) {
      console.error('❌ Error backing up database:', error);
    }
  }

  // Cập nhật course ratings
  async updateCourseRatings() {
    try {
      console.log('⭐ Updating course ratings...');
      
      const Review = require('../models/Review');
      
      // Lấy tất cả courses có reviews
      const coursesWithReviews = await Review.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$course',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      // Cập nhật rating cho từng course
      for (const courseData of coursesWithReviews) {
        await Course.findByIdAndUpdate(courseData._id, {
          rating: Math.round(courseData.averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: courseData.totalReviews
        });
      }

      console.log(`⭐ Updated ratings for ${coursesWithReviews.length} courses`);

    } catch (error) {
      console.error('❌ Error updating course ratings:', error);
    }
  }

  // Gửi nhắc nhở học tập
  async sendLearningReminders() {
    try {
      console.log('🎓 Sending learning reminders...');
      
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      // Tìm users đã đăng ký khóa học nhưng không hoạt động trong 3 ngày
      const inactiveUsers = await User.find({
        role: 'student',
        lastLogin: { $lt: threeDaysAgo }
      });

      for (const user of inactiveUsers) {
        // Kiểm tra có khóa học đang học không
        const enrolledCourses = await Course.find({
          students: user._id,
          status: 'published'
        }).limit(3);

        if (enrolledCourses.length > 0) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>🎓 Tiếp tục hành trình học tập!</h2>
              <p>Xin chào ${user.fullName},</p>
              <p>Chúng tôi nhận thấy bạn chưa học trong vài ngày qua. Hãy tiếp tục hành trình học tập của mình!</p>
              
              <h3>Các khóa học của bạn:</h3>
              ${enrolledCourses.map(course => `
                <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
                  <strong>${course.title}</strong><br>
                  <small>Giảng viên: ${course.instructor?.fullName}</small>
                </div>
              `).join('')}
              
              <a href="${process.env.FRONTEND_URL}/my-courses" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Tiếp tục học
              </a>
            </div>
          `;

          await notificationService.sendEmail(
            user.email,
            '🎓 Tiếp tục hành trình học tập của bạn',
            html
          );
        }
      }

      console.log(`🎓 Sent learning reminders to ${inactiveUsers.length} inactive users`);

    } catch (error) {
      console.error('❌ Error sending learning reminders:', error);
    }
  }

  // Stop all cron jobs
  stopAllJobs() {
    console.log('🛑 Stopping all cron jobs...');
    
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`⏹️ Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isInitialized = false;
    console.log('✅ All cron jobs stopped');
  }

  // Get job status
  getJobStatus() {
    const status = {};
    
    for (const [name, job] of this.jobs.entries()) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    
    return status;
  }
}

// Singleton instance
const cronJobService = new CronJobService();

module.exports = cronJobService;
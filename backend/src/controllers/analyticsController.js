const { validationResult } = require('express-validator');
const LearningAnalytics = require('../models/LearningAnalytics');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Submission = require('../models/Submission');
const { getUserEnrollment } = require('../utils/enrollmentHelpers');

// @desc    Lấy analytics của user
// @route   GET /api/analytics/user
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const { courseId, timeframe = '30d' } = req.query;

    let analytics = await LearningAnalytics.findOne({ 
      user: req.user.id,
      ...(courseId && { course: courseId })
    }).populate('course', 'title instructor');

    if (!analytics) {
      // Tạo analytics mới nếu chưa có
      analytics = new LearningAnalytics({
        user: req.user.id,
        ...(courseId && { course: courseId })
      });
      await analytics.save();
    }

    // Tính toán timeframe
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Lọc sessions theo timeframe
    const recentSessions = analytics.learningSessions.filter(
      session => session.startTime >= startDate
    );

    // Tính toán thống kê
    const totalTimeSpent = recentSessions.reduce(
      (total, session) => total + (session.timeSpent || 0), 0
    );

    const avgSessionTime = recentSessions.length > 0 ? 
      totalTimeSpent / recentSessions.length : 0;

    const completedActivities = recentSessions.reduce(
      (total, session) => total + session.activitiesCompleted.length, 0
    );

    // Thống kê theo ngày
    const dailyStats = {};
    recentSessions.forEach(session => {
      const date = session.startTime.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          timeSpent: 0,
          sessionsCount: 0,
          activitiesCompleted: 0
        };
      }
      dailyStats[date].timeSpent += session.timeSpent || 0;
      dailyStats[date].sessionsCount += 1;
      dailyStats[date].activitiesCompleted += session.activitiesCompleted.length;
    });

    // Nếu có courseId, lấy thêm thông tin course specific
    let courseSpecificData = null;
    if (courseId) {
      const enrollment = await getUserEnrollment(req.user.id, courseId);

      if (enrollment) {
        const course = await Course.findById(courseId)
          .populate('lessons', '_id title')
          .populate('assignments', '_id title');

        // Tính progress
        const totalLessons = course.lessons.length;
        const totalAssignments = course.assignments.length;
        
        // Lấy completed lessons và assignments
        const completedLessons = analytics.completedLessons.filter(
          l => course.lessons.some(lesson => lesson._id.equals(l.lesson))
        ).length;

        const completedAssignments = analytics.assignmentSubmissions.filter(
          a => course.assignments.some(assignment => assignment._id.equals(a.assignment))
        ).length;

        const overallProgress = totalLessons + totalAssignments > 0 ?
          ((completedLessons + completedAssignments) / (totalLessons + totalAssignments)) * 100 : 0;

        courseSpecificData = {
          courseId,
          courseName: course.title,
          enrollmentDate: enrollment.enrolledAt,
          progress: {
            overall: Math.round(overallProgress),
            lessons: {
              completed: completedLessons,
              total: totalLessons,
              percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
            },
            assignments: {
              completed: completedAssignments,
              total: totalAssignments,
              percentage: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
            }
          },
          estimatedCompletionDate: analytics.predictions.completionDate,
          studyStreak: calculateStudyStreak(recentSessions),
          weeklyGoalProgress: calculateWeeklyGoalProgress(recentSessions, analytics.goals)
        };
      }
    }

    // Thống kê tổng quát
    const overallStats = {
      totalTimeSpent: Math.round(totalTimeSpent),
      totalSessions: recentSessions.length,
      avgSessionTime: Math.round(avgSessionTime),
      completedActivities,
      totalCoursesEnrolled: (await User.findById(req.user.id)).enrolledCourses.length,
      certificatesEarned: await Certificate.countDocuments({ user: req.user.id, status: 'active' }),
      currentStreak: calculateStudyStreak(recentSessions),
      longestStreak: analytics.streakData.longestStreak
    };

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        overallStats,
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats
        })),
        courseSpecific: courseSpecificData,
        goals: analytics.goals,
        achievements: analytics.achievements,
        recommendations: analytics.recommendedCourses.slice(0, 3)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy analytics của user',
      error: error.message
    });
  }
};

// @desc    Cập nhật learning progress
// @route   POST /api/analytics/progress/:courseId
// @access  Private
const updateLearningProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      activityType, // 'lesson', 'assignment', 'quiz'
      activityId,
      timeSpent,
      completed,
      score,
      startTime,
      endTime
    } = req.body;

    // Tìm hoặc tạo analytics record
    let analytics = await LearningAnalytics.findOne({ 
      user: req.user.id,
      course: courseId
    });

    if (!analytics) {
      analytics = new LearningAnalytics({
        user: req.user.id,
        course: courseId
      });
    }

    // Tạo learning session
    const sessionData = {
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
      timeSpent: timeSpent || 0,
      activitiesCompleted: completed ? [{
        activityType,
        activityId,
        completedAt: new Date(),
        score
      }] : [],
      deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
      platform: 'web'
    };

    analytics.learningSessions.push(sessionData);

    // Cập nhật completed activities
    if (completed) {
      switch (activityType) {
        case 'lesson':
          const existingLesson = analytics.completedLessons.find(
            l => l.lesson.toString() === activityId
          );
          if (!existingLesson) {
            analytics.completedLessons.push({
              lesson: activityId,
              completedAt: new Date(),
              timeSpent: timeSpent || 0
            });
          }
          break;

        case 'assignment':
          analytics.assignmentSubmissions.push({
            assignment: activityId,
            submittedAt: new Date(),
            score: score || 0,
            timeSpent: timeSpent || 0
          });
          break;
      }
    }

    // Cập nhật streak data
    updateStreakData(analytics);

    // Cập nhật goal progress
    updateGoalProgress(analytics, timeSpent || 0);

    // Tính toán predictions
    calculatePredictions(analytics);

    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật learning progress thành công',
      data: {
        sessionId: analytics.learningSessions[analytics.learningSessions.length - 1]._id,
        currentStreak: analytics.streakData.currentStreak,
        totalTimeSpent: analytics.totalTimeSpent
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật learning progress',
      error: error.message
    });
  }
};

// @desc    Lấy analytics của course (cho instructor)
// @route   GET /api/analytics/course/:courseId
// @access  Private (Instructor hoặc Admin)
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Kiểm tra quyền truy cập
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem analytics của khóa học này'
      });
    }

    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Lấy tất cả analytics của course
    const courseAnalytics = await LearningAnalytics.find({ course: courseId })
      .populate('user', 'name email avatar');

    // Thống kê tổng quan
    const totalStudents = courseAnalytics.length;
    const activeStudents = courseAnalytics.filter(a => 
      a.learningSessions.some(s => s.startTime >= startDate)
    ).length;

    const totalSessions = courseAnalytics.reduce((total, a) => 
      total + a.learningSessions.filter(s => s.startTime >= startDate).length, 0
    );

    const totalTimeSpent = courseAnalytics.reduce((total, a) => 
      total + a.learningSessions
        .filter(s => s.startTime >= startDate)
        .reduce((sessionTotal, s) => sessionTotal + (s.timeSpent || 0), 0), 0
    );

    const avgTimePerStudent = activeStudents > 0 ? totalTimeSpent / activeStudents : 0;

    // Completion rates
    const lessons = await Lesson.find({ course: courseId });
    const assignments = await Assignment.find({ course: courseId });

    const lessonCompletionRates = lessons.map(lesson => {
      const completions = courseAnalytics.filter(a =>
        a.completedLessons.some(l => l.lesson.toString() === lesson._id.toString())
      ).length;
      return {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        completionRate: totalStudents > 0 ? (completions / totalStudents) * 100 : 0,
        completedBy: completions
      };
    });

    const assignmentCompletionRates = assignments.map(assignment => {
      const submissions = courseAnalytics.filter(a =>
        a.assignmentSubmissions.some(s => s.assignment.toString() === assignment._id.toString())
      ).length;
      return {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        submissionRate: totalStudents > 0 ? (submissions / totalStudents) * 100 : 0,
        submittedBy: submissions
      };
    });

    // Daily engagement
    const dailyEngagement = {};
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyEngagement[dateStr] = {
        activeUsers: 0,
        totalTimeSpent: 0,
        sessionsCount: 0
      };
      
      courseAnalytics.forEach(analytics => {
        const daySessions = analytics.learningSessions.filter(s => 
          s.startTime.toISOString().split('T')[0] === dateStr
        );
        if (daySessions.length > 0) {
          dailyEngagement[dateStr].activeUsers++;
          dailyEngagement[dateStr].totalTimeSpent += daySessions.reduce(
            (total, s) => total + (s.timeSpent || 0), 0
          );
          dailyEngagement[dateStr].sessionsCount += daySessions.length;
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Top performers
    const studentPerformance = courseAnalytics.map(analytics => {
      const recentSessions = analytics.learningSessions.filter(s => s.startTime >= startDate);
      const totalTime = recentSessions.reduce((total, s) => total + (s.timeSpent || 0), 0);
      
      return {
        user: analytics.user,
        totalTimeSpent: totalTime,
        sessionsCount: recentSessions.length,
        completedLessons: analytics.completedLessons.length,
        submittedAssignments: analytics.assignmentSubmissions.length,
        currentStreak: analytics.streakData.currentStreak
      };
    }).sort((a, b) => b.totalTimeSpent - a.totalTimeSpent).slice(0, 10);

    // Difficulty analysis (based on time spent vs completion)
    const difficultyAnalysis = lessons.map(lesson => {
      const completions = courseAnalytics.filter(a =>
        a.completedLessons.some(l => l.lesson.toString() === lesson._id.toString())
      );

      if (completions.length === 0) return null;

      const avgTimeToComplete = completions.reduce((total, analytics) => {
        const lessonCompletion = analytics.completedLessons.find(
          l => l.lesson.toString() === lesson._id.toString()
        );
        return total + (lessonCompletion?.timeSpent || 0);
      }, 0) / completions.length;

      return {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        avgTimeToComplete,
        completionRate: (completions.length / totalStudents) * 100,
        difficultyScore: avgTimeToComplete / (lesson.estimatedDuration || 30) // relative to estimated time
      };
    }).filter(item => item !== null);

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        overview: {
          totalStudents,
          activeStudents,
          totalSessions,
          totalTimeSpent: Math.round(totalTimeSpent),
          avgTimePerStudent: Math.round(avgTimePerStudent),
          engagementRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0
        },
        completionRates: {
          lessons: lessonCompletionRates,
          assignments: assignmentCompletionRates
        },
        dailyEngagement: Object.entries(dailyEngagement).map(([date, stats]) => ({
          date,
          ...stats
        })),
        topPerformers: studentPerformance,
        difficultyAnalysis: difficultyAnalysis.sort((a, b) => b.difficultyScore - a.difficultyScore),
        recommendations: generateCourseRecommendations(courseAnalytics, course)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy analytics của khóa học',
      error: error.message
    });
  }
};

// @desc    Lấy learning path recommendations
// @route   GET /api/analytics/recommendations
// @access  Private
const getLearningRecommendations = async (req, res) => {
  try {
    const analytics = await LearningAnalytics.findOne({ user: req.user.id })
      .populate('course', 'title category level');

    if (!analytics) {
      // User mới, recommend popular courses
      const popularCourses = await Course.find({ 
        isPublished: true, 
        status: 'approved' 
      })
        .sort({ 'rating.average': -1, 'stats.totalStudents': -1 })
        .limit(5)
        .select('title description category level price rating thumbnail');

      return res.status(200).json({
        success: true,
        data: {
          type: 'popular',
          recommendations: popularCourses.map(course => ({
            course,
            reason: 'Khóa học phổ biến cho người mới bắt đầu',
            confidence: 80
          }))
        }
      });
    }

    // Phân tích learning pattern
    const userPreferences = analyzeUserPreferences(analytics);
    
    // Tìm courses phù hợp
    const recommendations = await generatePersonalizedRecommendations(
      req.user.id, 
      userPreferences, 
      analytics
    );

    res.status(200).json({
      success: true,
      data: {
        type: 'personalized',
        userPreferences,
        recommendations: recommendations.slice(0, 10)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy learning recommendations',
      error: error.message
    });
  }
};

// @desc    Set learning goals
// @route   POST /api/analytics/goals
// @access  Private
const setLearningGoals = async (req, res) => {
  try {
    const { dailyTimeGoal, weeklyTimeGoal, monthlyCompletionGoal } = req.body;

    let analytics = await LearningAnalytics.findOne({ user: req.user.id });

    if (!analytics) {
      analytics = new LearningAnalytics({ user: req.user.id });
    }

    analytics.goals = {
      dailyTimeGoal: dailyTimeGoal || 30, // minutes
      weeklyTimeGoal: weeklyTimeGoal || 210, // minutes
      monthlyCompletionGoal: monthlyCompletionGoal || 2, // courses
      setAt: new Date()
    };

    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Đặt mục tiêu học tập thành công',
      data: {
        goals: analytics.goals
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đặt mục tiêu học tập',
      error: error.message
    });
  }
};

// Helper functions
function calculateStudyStreak(sessions) {
  if (sessions.length === 0) return 0;

  const dates = [...new Set(sessions.map(s => 
    s.startTime.toISOString().split('T')[0]
  ))].sort();

  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i-1]);
    const currentDate = new Date(dates[i]);
    const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function calculateWeeklyGoalProgress(sessions, goals) {
  if (!goals?.weeklyTimeGoal) return 0;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter(s => s.startTime >= weekStart);
  const weeklyTimeSpent = weekSessions.reduce((total, s) => total + (s.timeSpent || 0), 0);

  return Math.min((weeklyTimeSpent / goals.weeklyTimeGoal) * 100, 100);
}

function updateStreakData(analytics) {
  const sessions = analytics.learningSessions;
  if (sessions.length === 0) return;

  const currentStreak = calculateStudyStreak(sessions);
  analytics.streakData.currentStreak = currentStreak;
  analytics.streakData.longestStreak = Math.max(
    analytics.streakData.longestStreak, 
    currentStreak
  );

  const today = new Date().toISOString().split('T')[0];
  const lastSessionDate = sessions[sessions.length - 1]?.startTime.toISOString().split('T')[0];
  
  if (lastSessionDate === today) {
    analytics.streakData.lastStudyDate = new Date();
  }
}

function updateGoalProgress(analytics, timeSpent) {
  if (!analytics.goals) return;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Daily goal progress
  const todaySessions = analytics.learningSessions.filter(s => 
    s.startTime.toISOString().split('T')[0] === todayStr
  );
  const todayTimeSpent = todaySessions.reduce((total, s) => total + (s.timeSpent || 0), 0);
  
  if (todayTimeSpent >= analytics.goals.dailyTimeGoal) {
    if (!analytics.achievements.some(a => 
      a.type === 'daily_goal' && 
      a.earnedAt.toISOString().split('T')[0] === todayStr
    )) {
      analytics.achievements.push({
        type: 'daily_goal',
        title: 'Hoàn thành mục tiêu ngày',
        description: `Học ${Math.round(todayTimeSpent)} phút hôm nay`,
        earnedAt: new Date()
      });
    }
  }
}

function calculatePredictions(analytics) {
  const sessions = analytics.learningSessions;
  if (sessions.length < 3) return; // Cần ít nhất 3 sessions để predict

  const avgDailyTime = sessions.reduce((total, s) => total + (s.timeSpent || 0), 0) / sessions.length;
  const completionRate = analytics.completedLessons.length / sessions.length;

  // Estimate completion date (very basic prediction)
  if (avgDailyTime > 0 && completionRate > 0) {
    const estimatedDaysToComplete = 30 / completionRate; // Giả định 30 lessons per course
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDaysToComplete);
    
    analytics.predictions.completionDate = completionDate;
    analytics.predictions.confidence = Math.min(sessions.length * 10, 90); // Max 90% confidence
  }
}

function analyzeUserPreferences(analytics) {
  // Analyze user's learning patterns
  const sessions = analytics.learningSessions;
  
  // Preferred time of day
  const hourCounts = {};
  sessions.forEach(s => {
    const hour = s.startTime.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const preferredHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[a] > hourCounts[b] ? a : b, 0
  );

  // Average session length
  const avgSessionLength = sessions.reduce((total, s) => total + (s.timeSpent || 0), 0) / sessions.length;

  return {
    preferredStudyTime: `${preferredHour}:00`,
    avgSessionLength: Math.round(avgSessionLength),
    totalSessions: sessions.length,
    consistency: calculateConsistency(sessions)
  };
}

function calculateConsistency(sessions) {
  const dates = sessions.map(s => s.startTime.toISOString().split('T')[0]);
  const uniqueDates = new Set(dates);
  const dayRange = sessions.length > 0 ? 
    (new Date() - new Date(sessions[0].startTime)) / (1000 * 60 * 60 * 24) : 0;
  
  return dayRange > 0 ? (uniqueDates.size / dayRange) * 100 : 0;
}

async function generatePersonalizedRecommendations(userId, preferences, analytics) {
  // Implement recommendation algorithm based on user preferences
  // This is a simplified version
  
  const user = await User.findById(userId);
  const enrolledCourseIds = user.enrolledCourses.map(e => e.course);

  const recommendations = await Course.find({
    _id: { $nin: enrolledCourseIds },
    isPublished: true,
    status: 'approved'
  })
    .sort({ 'rating.average': -1 })
    .limit(20)
    .select('title description category level price rating thumbnail');

  return recommendations.map(course => ({
    course,
    reason: 'Phù hợp với sở thích học tập của bạn',
    confidence: 75
  }));
}

function generateCourseRecommendations(analytics, course) {
  // Generate recommendations for course improvement
  const recommendations = [];

  const avgCompletionTime = analytics.reduce((total, a) => {
    const courseTime = a.learningSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    return total + courseTime;
  }, 0) / analytics.length;

  if (avgCompletionTime > 300) { // 5 hours
    recommendations.push({
      type: 'content',
      priority: 'high',
      message: 'Khóa học có thể quá dài. Hãy xem xét chia nhỏ nội dung.'
    });
  }

  return recommendations;
}

// @desc    Lấy revenue analytics (Admin/Instructor)
// @route   GET /api/analytics/revenue
// @access  Private (Admin/Instructor)
const getRevenueAnalytics = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { timeframe = '30d', courseId } = req.query;

    // Calculate date range
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // All time
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = {
      status: 'completed',
      paidAt: { $gte: startDate }
    };

    // Filter by course if instructor
    if (req.user.role === 'teacher') {
      const courses = await Course.find({ instructor: req.user.id }).select('_id');
      query.course = { $in: courses.map(c => c._id) };
    } else if (courseId && req.user.role === 'admin') {
      query.course = courseId;
    }

    const payments = await Payment.find(query)
      .populate('course', 'title price instructor')
      .populate('user', 'name email')
      .sort({ paidAt: -1 });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount.final, 0);
    const totalDiscount = payments.reduce((sum, p) => sum + p.amount.discount, 0);
    const totalTransactions = payments.length;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Revenue by date
    const revenueByDate = {};
    payments.forEach(payment => {
      const date = payment.paidAt.toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, count: 0 };
      }
      revenueByDate[date].revenue += payment.amount.final;
      revenueByDate[date].count += 1;
    });

    // Revenue by course
    const revenueByCourse = {};
    payments.forEach(payment => {
      const courseId = payment.course._id.toString();
      const courseTitle = payment.course.title;
      if (!revenueByCourse[courseId]) {
        revenueByCourse[courseId] = {
          courseId,
          courseTitle,
          revenue: 0,
          sales: 0,
          avgPrice: 0
        };
      }
      revenueByCourse[courseId].revenue += payment.amount.final;
      revenueByCourse[courseId].sales += 1;
    });

    // Calculate avg price for each course
    Object.values(revenueByCourse).forEach(course => {
      course.avgPrice = course.revenue / course.sales;
    });

    // Top courses by revenue
    const topCourses = Object.values(revenueByCourse)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Format currency
    const formatVND = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalRevenueFormatted: formatVND(totalRevenue),
          totalDiscount,
          totalDiscountFormatted: formatVND(totalDiscount),
          totalTransactions,
          avgTransactionValue,
          avgTransactionValueFormatted: formatVND(avgTransactionValue)
        },
        revenueByDate: Object.entries(revenueByDate)
          .map(([date, data]) => ({
            date,
            revenue: data.revenue,
            revenueFormatted: formatVND(data.revenue),
            transactions: data.count
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)),
        topCourses: topCourses.map(course => ({
          ...course,
          revenueFormatted: formatVND(course.revenue),
          avgPriceFormatted: formatVND(course.avgPrice)
        })),
        recentTransactions: payments.slice(0, 20).map(p => ({
          orderId: p.orderId,
          course: p.course.title,
          user: p.user.name,
          amount: p.amount.final,
          amountFormatted: formatVND(p.amount.final),
          discount: p.amount.discount,
          paidAt: p.paidAt,
          paymentMethod: p.paymentMethod.type
        }))
      }
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy revenue analytics',
      error: error.message
    });
  }
};

// @desc    Lấy analytics cho instructor dashboard
// @route   GET /api/analytics/instructor
// @access  Private (Instructor only)
const getInstructorAnalytics = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const { timeRange = '30' } = req.query; // days

    // Lấy tất cả courses của instructor
    const instructorCourses = await Course.find({ instructor: instructorId })
      .select('_id title price students createdAt');

    const courseIds = instructorCourses.map(c => c._id);

    // Tính toán thời gian
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

    // Tổng revenue
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed',
      createdAt: { $gte: dateFrom }
    }).select('amount.final createdAt course');

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount.final, 0);

    // Tổng students (unique)
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: 'active'
    }).select('user course enrolledAt');

    const uniqueStudents = new Set(enrollments.map(e => e.user.toString())).size;

    // Course stats (từng course)
    const courseStats = await Promise.all(
      instructorCourses.map(async (course) => {
        const courseEnrollments = enrollments.filter(e => 
          e.course.toString() === course._id.toString()
        );
        const coursePayments = payments.filter(p => 
          p.course.toString() === course._id.toString()
        );
        const courseRevenue = coursePayments.reduce((sum, p) => sum + p.amount.final, 0);

        // Average completion rate
        const analytics = await LearningAnalytics.find({ course: course._id })
          .select('completionRate');
        const avgCompletion = analytics.length > 0
          ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length
          : 0;

        return {
          courseId: course._id,
          title: course.title,
          price: course.price,
          studentsCount: courseEnrollments.length,
          revenue: courseRevenue,
          averageCompletion: Math.round(avgCompletion),
          createdAt: course.createdAt
        };
      })
    );

    // Recent payments (last 10)
    const recentPayments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    })
      .populate('user', 'name email avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount.final user course createdAt');

    // Revenue by date (for chart)
    const revenueByDate = {};
    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + payment.amount.final;
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalStudents: uniqueStudents,
        totalCourses: instructorCourses.length,
        courseStats: courseStats.sort((a, b) => b.revenue - a.revenue),
        recentPayments,
        revenueByDate: Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          amount
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    });

  } catch (error) {
    console.error('Get instructor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy instructor analytics',
      error: error.message
    });
  }
};

// @desc    Track user activity (page views, video watch time)
// @route   POST /api/analytics/track
// @access  Private
const trackActivity = async (req, res) => {
  try {
    const { activityType, courseId, lessonId, duration, metadata } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!activityType || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'activityType và courseId là bắt buộc'
      });
    }

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    // Tìm hoặc tạo LearningAnalytics
    let analytics = await LearningAnalytics.findOne({
      user: userId,
      course: courseId
    });

    if (!analytics) {
      // Tạo mới nếu chưa có
      const course = await Course.findById(courseId).populate('lessons');
      analytics = new LearningAnalytics({
        user: userId,
        course: courseId,
        enrolledDate: enrollment.enrolledAt,
        progressData: {
          totalLessons: course.lessons?.length || 0,
          lessonsCompleted: 0,
          totalAssignments: 0,
          assignmentsCompleted: 0,
          totalQuizzes: 0,
          quizzesCompleted: 0
        }
      });
    }

    // Update analytics based on activity type
    switch (activityType) {
      case 'page_view':
        analytics.lastAccessDate = new Date();
        break;

      case 'video_watch':
        if (duration) {
          analytics.totalTimeSpent += Math.round(duration / 60); // convert to minutes
          analytics.totalSessions += 1;
          analytics.averageSessionDuration = Math.round(
            analytics.totalTimeSpent / analytics.totalSessions
          );
        }
        analytics.lastAccessDate = new Date();
        break;

      case 'lesson_complete':
        if (lessonId) {
          analytics.progressData.lessonsCompleted += 1;
          analytics.completionRate = Math.round(
            (analytics.progressData.lessonsCompleted / analytics.progressData.totalLessons) * 100
          );
          
          // Update enrollment progress
          enrollment.progress = analytics.completionRate;
          await enrollment.save();
        }
        break;

      case 'assignment_complete':
        analytics.progressData.assignmentsCompleted += 1;
        break;

      case 'quiz_complete':
        analytics.progressData.quizzesCompleted += 1;
        break;

      default:
        analytics.lastAccessDate = new Date();
    }

    // Calculate engagement score (0-100)
    const daysSinceEnroll = (new Date() - analytics.enrolledDate) / (1000 * 60 * 60 * 24);
    const expectedSessions = Math.max(1, daysSinceEnroll / 7); // expect 1 session per week
    const sessionRatio = Math.min(analytics.totalSessions / expectedSessions, 2);
    analytics.engagementScore = Math.round(Math.min(sessionRatio * 50 + analytics.completionRate * 0.5, 100));

    // Update study patterns
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

    // Update preferred study time
    const existingTimeSlot = analytics.behaviorPatterns.preferredStudyTime.find(
      slot => slot.hour === currentHour
    );
    if (existingTimeSlot) {
      existingTimeSlot.frequency += 1;
    } else {
      analytics.behaviorPatterns.preferredStudyTime.push({
        hour: currentHour,
        frequency: 1
      });
    }

    // Sort and keep top 5 time slots
    analytics.behaviorPatterns.preferredStudyTime.sort((a, b) => b.frequency - a.frequency);
    analytics.behaviorPatterns.preferredStudyTime = analytics.behaviorPatterns.preferredStudyTime.slice(0, 5);

    // Update most active day
    analytics.behaviorPatterns.mostActiveDay = currentDay;

    analytics.lastUpdated = new Date();
    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Activity tracked successfully',
      data: {
        engagementScore: analytics.engagementScore,
        completionRate: analytics.completionRate,
        totalTimeSpent: analytics.totalTimeSpent
      }
    });

  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi track activity',
      error: error.message
    });
  }
};

// @desc    Lấy dashboard stats cho student
// @route   GET /api/analytics/dashboard
// @access  Private (Student)
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy enrollments
    const enrollments = await Enrollment.find({
      user: userId,
      status: { $in: ['active', 'completed'] }
    }).populate('course', 'title category level');

    const courseIds = enrollments.map(e => e.course._id);

    // Lấy analytics cho tất cả courses
    const analytics = await LearningAnalytics.find({
      user: userId,
      course: { $in: courseIds }
    });

    // Calculate stats
    const coursesInProgress = enrollments.filter(e => 
      e.status === 'active' && e.progress > 0 && e.progress < 100
    ).length;

    const coursesCompleted = enrollments.filter(e => 
      e.status === 'completed' || e.progress === 100
    ).length;

    const totalTimeSpent = analytics.reduce((sum, a) => sum + (a.totalTimeSpent || 0), 0);

    const averageProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    // Upcoming deadlines (assignments due soon)
    const assignments = await Assignment.find({
      course: { $in: courseIds },
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      isPublished: true
    })
      .populate('course', 'title')
      .sort({ dueDate: 1 })
      .limit(5);

    // Check submissions for each assignment
    const upcomingDeadlines = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: userId
        });

        return {
          assignmentId: assignment._id,
          title: assignment.title,
          courseTitle: assignment.course.title,
          dueDate: assignment.dueDate,
          submitted: !!submission,
          submissionStatus: submission?.status || 'not_submitted'
        };
      })
    );

    // Course progress details
    const courseProgress = enrollments.map(enrollment => {
      const courseAnalytics = analytics.find(a => 
        a.course.toString() === enrollment.course._id.toString()
      );

      return {
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        category: enrollment.course.category,
        level: enrollment.course.level,
        progress: enrollment.progress,
        timeSpent: courseAnalytics?.totalTimeSpent || 0,
        lastAccessed: enrollment.lastAccessedAt,
        engagementScore: courseAnalytics?.engagementScore || 0
      };
    }).sort((a, b) => b.lastAccessed - a.lastAccessed);

    // Daily activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count activities on this date (simplified - would need activity log in production)
      const dayAnalytics = analytics.filter(a => {
        const accessDate = a.lastAccessDate.toISOString().split('T')[0];
        return accessDate === dateStr;
      });

      dailyActivity.unshift({
        date: dateStr,
        timeSpent: dayAnalytics.reduce((sum, a) => sum + (a.totalTimeSpent || 0), 0),
        lessonsCompleted: dayAnalytics.reduce((sum, a) => sum + (a.progressData?.lessonsCompleted || 0), 0)
      });
    }

    // Study patterns (from most recent analytics)
    const recentAnalytics = analytics.sort((a, b) => 
      b.lastAccessDate - a.lastAccessDate
    )[0];

    const studyPatterns = recentAnalytics?.behaviorPatterns ? {
      mostActiveDay: recentAnalytics.behaviorPatterns.mostActiveDay,
      mostActiveHour: recentAnalytics.behaviorPatterns.preferredStudyTime[0]?.hour || null,
      averageSessionDuration: recentAnalytics.averageSessionDuration || 0
    } : null;

    res.status(200).json({
      success: true,
      data: {
        totalTimeSpent,
        coursesInProgress,
        coursesCompleted,
        averageProgress: Math.round(averageProgress),
        dailyActivity,
        courseProgress,
        upcomingDeadlines,
        studyPatterns
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dashboard stats',
      error: error.message
    });
  }
};

// @desc    Lấy engagement metrics cho course
// @route   GET /api/analytics/engagement/:courseId
// @access  Private (Instructor, Admin)
const getEngagementMetrics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { dateRange = 'week' } = req.query; // week, month, all

    // Kiểm tra quyền truy cập
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem engagement metrics của khóa học này'
      });
    }

    // Tính thời gian
    let dateFrom = new Date();
    switch (dateRange) {
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      default:
        dateFrom = new Date(0); // all time
    }

    // Lấy tất cả analytics cho course
    const analytics = await LearningAnalytics.find({
      course: courseId,
      lastAccessDate: { $gte: dateFrom }
    }).populate('user', 'name email');

    // Tổng số students enrolled
    const totalEnrolled = await Enrollment.countDocuments({
      course: courseId,
      status: { $in: ['active', 'completed'] }
    });

    // Daily active users
    const dailyActiveUsers = {};
    analytics.forEach(analytic => {
      const date = analytic.lastAccessDate.toISOString().split('T')[0];
      dailyActiveUsers[date] = (dailyActiveUsers[date] || 0) + 1;
    });

    const dailyActive = Object.entries(dailyActiveUsers).map(([date, count]) => ({
      date,
      activeUsers: count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Completion rate
    const completedCount = await Enrollment.countDocuments({
      course: courseId,
      status: 'completed'
    });
    const completionRate = totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;

    // Average time spent
    const averageTimeSpent = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.totalTimeSpent, 0) / analytics.length
      : 0;

    // Average engagement score
    const averageEngagement = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.engagementScore, 0) / analytics.length
      : 0;

    // At-risk students (low engagement)
    const atRiskStudents = analytics
      .filter(a => a.engagementScore < 30)
      .map(a => ({
        userId: a.user._id,
        userName: a.user.name,
        email: a.user.email,
        engagementScore: a.engagementScore,
        completionRate: a.completionRate,
        lastAccessDate: a.lastAccessDate
      }));

    // Top performers (high engagement)
    const topPerformers = analytics
      .filter(a => a.engagementScore >= 80)
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10)
      .map(a => ({
        userId: a.user._id,
        userName: a.user.name,
        engagementScore: a.engagementScore,
        completionRate: a.completionRate,
        timeSpent: a.totalTimeSpent
      }));

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        completionRate: Math.round(completionRate),
        averageTimeSpent: Math.round(averageTimeSpent),
        averageEngagement: Math.round(averageEngagement),
        dailyActive,
        atRiskStudents,
        topPerformers,
        dateRange
      }
    });

  } catch (error) {
    console.error('Get engagement metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy engagement metrics',
      error: error.message
    });
  }
};

// @desc    Update course progress manually
// @route   PUT /api/analytics/progress/:courseId
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { progress, lessonId } = req.body;
    const userId = req.user.id;

    // Validate
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Progress phải từ 0-100'
      });
    }

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    // Update enrollment progress
    if (progress !== undefined) {
      enrollment.progress = progress;
      
      if (progress >= 100) {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();
      }
      
      await enrollment.save();
    }

    // Update learning analytics
    let analytics = await LearningAnalytics.findOne({
      user: userId,
      course: courseId
    });

    if (!analytics) {
      const course = await Course.findById(courseId).populate('lessons');
      analytics = new LearningAnalytics({
        user: userId,
        course: courseId,
        enrolledDate: enrollment.enrolledAt,
        progressData: {
          totalLessons: course.lessons?.length || 0,
          lessonsCompleted: 0
        }
      });
    }

    // Update completion rate
    if (progress !== undefined) {
      analytics.completionRate = progress;
    }

    // Mark lesson as completed
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (lesson) {
        // Check if not already completed
        const alreadyCompleted = enrollment.completedLessons.some(
          cl => cl.lesson.toString() === lessonId
        );

        if (!alreadyCompleted) {
          enrollment.completedLessons.push({
            lesson: lessonId,
            completedAt: new Date()
          });
          await enrollment.save();

          analytics.progressData.lessonsCompleted += 1;
          analytics.completionRate = Math.round(
            (analytics.progressData.lessonsCompleted / analytics.progressData.totalLessons) * 100
          );
        }
      }
    }

    analytics.lastAccessDate = new Date();
    await analytics.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật progress thành công',
      data: {
        progress: enrollment.progress,
        completionRate: analytics.completionRate,
        status: enrollment.status
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi update progress',
      error: error.message
    });
  }
};

// @desc    Generate learning report
// @route   GET /api/analytics/report/:courseId
// @access  Private
const generateReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { format = 'json' } = req.query; // json, pdf, csv

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    }).populate('course', 'title category level instructor');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    // Lấy analytics
    const analytics = await LearningAnalytics.findOne({
      user: userId,
      course: courseId
    });

    // Lấy submissions
    const assignments = await Assignment.find({ course: courseId });
    const submissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) },
      student: userId
    }).populate('assignment', 'title maxScore dueDate');

    // Calculate scores
    const averageScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0;

    // Generate report data
    const report = {
      generatedAt: new Date(),
      student: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      course: {
        id: enrollment.course._id,
        title: enrollment.course.title,
        category: enrollment.course.category,
        level: enrollment.course.level
      },
      enrollment: {
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt
      },
      performance: {
        lessonsCompleted: analytics?.progressData?.lessonsCompleted || 0,
        totalLessons: analytics?.progressData?.totalLessons || 0,
        assignmentsCompleted: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        totalAssignments: assignments.length,
        averageScore: Math.round(averageScore),
        totalTimeSpent: analytics?.totalTimeSpent || 0,
        totalSessions: analytics?.totalSessions || 0,
        averageSessionDuration: analytics?.averageSessionDuration || 0
      },
      engagement: {
        engagementScore: analytics?.engagementScore || 0,
        completionRate: analytics?.completionRate || 0,
        studyConsistency: analytics?.behaviorPatterns?.studyConsistency || 0
      },
      studyPatterns: {
        mostActiveDay: analytics?.behaviorPatterns?.mostActiveDay,
        preferredStudyTime: analytics?.behaviorPatterns?.preferredStudyTime || [],
        averageSessionsPerWeek: analytics?.behaviorPatterns?.averageSessionsPerWeek || 0
      },
      assignments: submissions.map(s => ({
        title: s.assignment.title,
        dueDate: s.assignment.dueDate,
        submittedAt: s.submittedAt,
        score: s.score,
        maxScore: s.assignment.maxScore,
        status: s.status
      })),
      strengths: analytics?.strongAreas || [],
      weaknesses: analytics?.weakAreas || []
    };

    // Return based on format
    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: { report }
      });
    }

    // For other formats (PDF, CSV), return JSON for now
    // TODO: Implement PDF/CSV generation
    res.status(200).json({
      success: true,
      message: 'PDF/CSV generation coming soon',
      data: { report }
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo report',
      error: error.message
    });
  }
};

// @desc    Get recommended learning path
// @route   GET /api/analytics/learning-path/:courseId
// @access  Private
const getLearningPath = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa đăng ký khóa học này'
      });
    }

    // Lấy analytics
    let analytics = await LearningAnalytics.findOne({
      user: userId,
      course: courseId
    });

    // Nếu đã có learning path, return luôn
    if (analytics?.learningPath && analytics.learningPath.length > 0) {
      return res.status(200).json({
        success: true,
        data: {
          learningPath: analytics.learningPath,
          currentStep: analytics.learningPath.find(step => !step.completed)?.step || null
        }
      });
    }

    // Generate learning path dựa trên weak areas
    const course = await Course.findById(courseId).populate('lessons');
    const lessons = course.lessons || [];

    // Get assignments
    const assignments = await Assignment.find({
      course: courseId,
      isPublished: true
    }).sort({ createdAt: 1 });

    // Create learning path
    const learningPath = [];
    let step = 1;

    // Add all lessons
    for (let index = 0; index < lessons.length; index++) {
      const lesson = lessons[index];
      const isCompleted = enrollment.completedLessons.some(
        cl => cl.lesson.toString() === lesson._id.toString()
      );

      learningPath.push({
        step: step++,
        content: lesson.title,
        contentType: 'lesson',
        estimatedTime: lesson.duration || 30,
        completed: isCompleted,
        completedAt: isCompleted ? enrollment.completedLessons.find(
          cl => cl.lesson.toString() === lesson._id.toString()
        )?.completedAt : null
      });

      // Add assignment after every 3 lessons
      if ((index + 1) % 3 === 0 && assignments[Math.floor(index / 3)]) {
        const assignment = assignments[Math.floor(index / 3)];
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: userId
        });

        learningPath.push({
          step: step++,
          content: assignment.title,
          contentType: 'assignment',
          estimatedTime: 60,
          completed: !!submission,
          completedAt: submission?.submittedAt || null
        });
      }
    }

    // Save learning path
    if (analytics) {
      analytics.learningPath = learningPath;
      await analytics.save();
    }

    const currentStep = learningPath.find(step => !step.completed)?.step || null;

    res.status(200).json({
      success: true,
      data: {
        learningPath,
        currentStep,
        totalSteps: learningPath.length,
        completedSteps: learningPath.filter(s => s.completed).length
      }
    });

  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy learning path',
      error: error.message
    });
  }
};

// @desc    Export analytics to CSV/Excel
// @route   GET /api/analytics/export/:courseId
// @access  Private (Instructor, Admin)
const exportAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { format = 'csv' } = req.query; // csv or excel

    // Kiểm tra quyền
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học'
      });
    }

    if (course.instructor.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền export analytics'
      });
    }

    // Lấy tất cả analytics
    const analytics = await LearningAnalytics.find({ course: courseId })
      .populate('user', 'name email')
      .lean();

    // Lấy enrollments
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('user', 'name email')
      .lean();

    // Prepare data for export
    const exportData = analytics.map(analytic => {
      const enrollment = enrollments.find(e => 
        e.user._id.toString() === analytic.user._id.toString()
      );

      return {
        'Student Name': analytic.user.name,
        'Email': analytic.user.email,
        'Enrolled Date': enrollment?.enrolledAt || 'N/A',
        'Status': enrollment?.status || 'N/A',
        'Progress': `${enrollment?.progress || 0}%`,
        'Completion Rate': `${analytic.completionRate}%`,
        'Total Time Spent (min)': analytic.totalTimeSpent,
        'Total Sessions': analytic.totalSessions,
        'Average Session Duration (min)': analytic.averageSessionDuration,
        'Engagement Score': analytic.engagementScore,
        'Lessons Completed': analytic.progressData?.lessonsCompleted || 0,
        'Assignments Completed': analytic.progressData?.assignmentsCompleted || 0,
        'Average Score': analytic.performanceMetrics?.averageAssignmentScore || 0,
        'Last Access': analytic.lastAccessDate,
        'Most Active Day': analytic.behaviorPatterns?.mostActiveDay || 'N/A'
      };
    });

    // For now, return JSON (CSV/Excel generation would require additional libraries)
    // TODO: Use csv-writer or exceljs library for actual file generation
    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => JSON.stringify(row[header] || '')).join(',')
        )
      ];
      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${courseId}_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    // Default: return JSON
    res.status(200).json({
      success: true,
      message: 'Excel export coming soon. Here is JSON data.',
      data: exportData
    });

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi export analytics',
      error: error.message
    });
  }
};

module.exports = {
  getUserAnalytics,
  getCourseAnalytics,
  getInstructorAnalytics,
  updateProgress,
  trackActivity,
  getRecommendations: getLearningRecommendations,
  generateReport,
  getDashboardStats,
  getEngagementMetrics,
  getLearningPath,
  exportAnalytics,
  updateLearningProgress,
  setLearningGoals,
  getRevenueAnalytics
};
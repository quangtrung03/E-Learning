const { validationResult } = require('express-validator');
const LearningAnalytics = require('../models/LearningAnalytics');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Certificate = require('../models/Certificate');

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
      const user = await User.findById(req.user.id);
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === courseId
      );

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

module.exports = {
  getUserAnalytics,
  getCourseAnalytics,
  getInstructorAnalytics: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  updateProgress: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  trackActivity: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  getRecommendations: getLearningRecommendations,
  generateReport: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  getDashboardStats: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  getEngagementMetrics: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  getLearningPath: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  exportAnalytics: (req, res) => res.status(501).json({ success: false, message: 'Function not implemented yet' }),
  updateLearningProgress,
  setLearningGoals
};
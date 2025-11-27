import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Clock, Award, BookOpen, Target, Zap, Calendar } from 'lucide-react';

interface AnalyticsData {
  totalTimeSpent: number;
  coursesInProgress: number;
  coursesCompleted: number;
  averageProgress: number;
  dailyActivity: Array<{
    date: string;
    timeSpent: number;
    lessonsCompleted: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    timeSpent: number;
    lastAccessed: Date;
  }>;
  weeklyGoal: {
    target: number;
    achieved: number;
    percentage: number;
  };
  studyPatterns: {
    mostActiveDay: string;
    mostActiveHour: number;
    averageSessionDuration: number;
  };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const LearningAnalytics = () => {

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getUserAnalytics();
      
      if (response.data.success) {
        // Transform data for charts
        const data = response.data.data;
        setAnalytics({
          totalTimeSpent: data.totalTimeSpent || 0,
          coursesInProgress: data.coursesInProgress || 0,
          coursesCompleted: data.coursesCompleted || 0,
          averageProgress: data.averageProgress || 0,
          dailyActivity: data.dailyActivity || [],
          courseProgress: data.courseProgress || [],
          weeklyGoal: data.weeklyGoal || { target: 10, achieved: 0, percentage: 0 },
          studyPatterns: data.studyPatterns || {
            mostActiveDay: 'Thứ 2',
            mostActiveHour: 20,
            averageSessionDuration: 0
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      // Sử dụng dữ liệu mẫu nếu API chưa có dữ liệu
      setAnalytics(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (): AnalyticsData => {
    const today = new Date();
    const dailyActivity = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailyActivity.push({
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        timeSpent: Math.floor(Math.random() * 120) + 30,
        lessonsCompleted: Math.floor(Math.random() * 5) + 1
      });
    }

    return {
      totalTimeSpent: 2580, // minutes
      coursesInProgress: 3,
      coursesCompleted: 2,
      averageProgress: 65,
      dailyActivity,
      courseProgress: [
        {
          courseId: '1',
          courseTitle: 'React Advanced',
          progress: 75,
          timeSpent: 840,
          lastAccessed: new Date()
        },
        {
          courseId: '2',
          courseTitle: 'Node.js Backend',
          progress: 60,
          timeSpent: 720,
          lastAccessed: new Date()
        },
        {
          courseId: '3',
          courseTitle: 'TypeScript Complete',
          progress: 45,
          timeSpent: 540,
          lastAccessed: new Date()
        }
      ],
      weeklyGoal: {
        target: 600, // 10 hours
        achieved: 420, // 7 hours
        percentage: 70
      },
      studyPatterns: {
        mostActiveDay: 'Thứ 2',
        mostActiveHour: 20,
        averageSessionDuration: 45
      }
    };
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCourseDistributionData = () => {
    if (!analytics) return [];
    return [
      { name: 'Hoàn thành', value: analytics.coursesCompleted },
      { name: 'Đang học', value: analytics.coursesInProgress },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Phân tích học tập</h1>
          <p className="text-gray-600">Theo dõi tiến độ và hiệu suất học tập của bạn</p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            7 ngày
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            30 ngày
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tất cả
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Tổng thời gian học</h3>
            <p className="text-2xl font-bold text-gray-900">{formatTime(analytics.totalTimeSpent)}</p>
            <p className="text-xs text-gray-500 mt-1">≈ {Math.round(analytics.totalTimeSpent / 60)} giờ</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Khóa học đang học</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.coursesInProgress}</p>
            <p className="text-xs text-gray-500 mt-1">Đang hoạt động</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Đã hoàn thành</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.coursesCompleted}</p>
            <p className="text-xs text-gray-500 mt-1">Khóa học</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Tiến độ trung bình</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.averageProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${analytics.averageProgress}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Activity Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">⏱️ Hoạt động hàng ngày</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="timeSpent"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Thời gian (phút)"
                />
                <Line
                  type="monotone"
                  dataKey="lessonsCompleted"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Bài học hoàn thành"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Course Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">📚 Phân bổ khóa học</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getCourseDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCourseDistributionData().map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-sm text-gray-600">Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                <span className="text-sm text-gray-600">Đang học</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Goal */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🎯 Mục tiêu tuần này</h3>
            <span className="text-2xl font-bold text-blue-600">
              {analytics.weeklyGoal.percentage}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-500"
                style={{ width: `${analytics.weeklyGoal.percentage}%` }}
              >
                {analytics.weeklyGoal.percentage > 15 && `${analytics.weeklyGoal.achieved}/${analytics.weeklyGoal.target} phút`}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <span>Đã đạt: {formatTime(analytics.weeklyGoal.achieved)}</span>
            <span>Mục tiêu: {formatTime(analytics.weeklyGoal.target)}</span>
          </div>
        </Card>

        {/* Course Progress Details */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">📖 Tiến độ từng khóa học</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.courseProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="courseTitle" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" fill="#8b5cf6" name="Tiến độ (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Study Patterns & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Study Patterns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🔥 Thói quen học tập</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Ngày học nhiều nhất</span>
                </div>
                <span className="font-semibold text-blue-600">{analytics.studyPatterns.mostActiveDay}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Giờ học hiệu quả nhất</span>
                </div>
                <span className="font-semibold text-purple-600">{analytics.studyPatterns.mostActiveHour}:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Thời lượng TB/buổi</span>
                </div>
                <span className="font-semibold text-green-600">{analytics.studyPatterns.averageSessionDuration} phút</span>
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">💡 Gợi ý cải thiện</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Tăng tần suất học:</strong> Thử học ít nhất 30 phút mỗi ngày để duy trì kiến thức tốt hơn.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Thời gian tốt nhất:</strong> Bạn học hiệu quả vào {analytics.studyPatterns.mostActiveHour}:00. Hãy sắp xếp lịch học vào khung giờ này!
                </p>
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Hoàn thành mục tiêu:</strong> Bạn đã đạt {analytics.weeklyGoal.percentage}% mục tiêu tuần. Còn {analytics.weeklyGoal.target - analytics.weeklyGoal.achieved} phút nữa là đạt mục tiêu!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearningAnalytics;

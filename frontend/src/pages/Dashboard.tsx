// ===== UNIFIED DASHBOARD (Dashboard + MyCourses + LearningAnalytics) =====
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, analyticsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';
import { useToast } from '../context/ToastContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Clock, Award, BookOpen, Target, Zap, Calendar, GraduationCap, Briefcase } from 'lucide-react';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  finalPrice?: number;
  progress?: number;
  lastLessonId?: string;
  lastAccessedAt?: string;
  totalStudents?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rating?: { average: number; count: number };
  instructor?: { name: string };
}

interface Student {
  _id: string;
  name: string;
  email: string;
  joinedAt: string;
  totalCoursesEnrolled: number;
  totalCoursesCreated: number;
  totalPaid: number;
  courses: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    enrolledAt: string;
    lastAccessedAt?: string;
  }>;
  paymentHistory: Array<{ date: string; amount: number }>;
}

interface RevenueData {
  courseId: string;
  title: string;
  finalPrice: number;
  studentsCount: number;
  rating?: { average: number; count: number };
  revenue: number;
  platformFeeAmount?: number;
  netRevenue?: number;
  payments: Array<{ user: { name: string }; date: string; amount: number }>;
  reviews: any[];
  analytics: {
    byDate: { date: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
    byMonth: { month: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
    byYear: { year: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
  };
}

interface AnalyticsData {
  totalTimeSpent: number;
  coursesInProgress: number;
  coursesCompleted: number;
  averageProgress: number;
  dailyActivity: Array<{ date: string; timeSpent: number; lessonsCompleted: number }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    timeSpent: number;
    lastAccessed: Date;
  }>;
  weeklyGoal: { target: number; achieved: number; percentage: number };
  studyPatterns: { mostActiveDay: string; mostActiveHour: number; averageSessionDuration: number };
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// ─── Component ──────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const defaultCourseThumbnailUrl = useDefaultCourseThumbnailUrl();
  const fallbackCourseThumbnailUrl = resolveFileUrl(defaultCourseThumbnailUrl || undefined);

  // ── Role tab ──
  const [activeRole, setActiveRole] = useState<'student' | 'instructor'>('student');

  // ── Data ──
  const [loading, setLoading] = useState(true);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // ── Instructor: stats ──
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalNetRevenue, setTotalNetRevenue] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPlatformFee, setTotalPlatformFee] = useState(0);
  const [currentMonthPlatformFee, setCurrentMonthPlatformFee] = useState(0);

  // ── Instructor: modals ──
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueTimeframe, setRevenueTimeframe] = useState<'day' | 'month' | 'year'>('month');
  const [selectedCourse, setSelectedCourse] = useState<RevenueData | null>(null);

  // ── Student: filter ──
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  // ── Instructor: course status filter ──
  const [createdStatusFilter, setCreatedStatusFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');

  // ─── Data Loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [createdRes, enrolledRes, analyticsRes] = await Promise.allSettled([
        courseAPI.getMyCourses({ limit: 50 }),
        courseAPI.getMyEnrolledCourses({ limit: 50 }),
        analyticsAPI.getUserAnalytics(),
      ]);

      // Parse created courses
      let parsed_created: Course[] = [];
      if (createdRes.status === 'fulfilled') {
        const d = createdRes.value.data;
        parsed_created = d?.data?.courses || d?.data || d?.courses || [];
      }
      setCreatedCourses(parsed_created);

      // Compute instructor stats from created courses
      const ts = parsed_created.reduce((s: number, c: any) => s + (c.totalStudents || 0), 0);
      setTotalStudents(ts);

      // Parse enrolled courses
      let parsed_enrolled: Course[] = [];
      if (enrolledRes.status === 'fulfilled') {
        const d = enrolledRes.value.data;
        parsed_enrolled = d?.data?.courses || d?.data || d?.courses || [];
      }
      setEnrolledCourses(parsed_enrolled);

      // Parse analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        const d = analyticsRes.value.data.data;
        setAnalytics({
          totalTimeSpent: d.totalTimeSpent || 0,
          coursesInProgress: d.coursesInProgress || 0,
          coursesCompleted: d.coursesCompleted || 0,
          averageProgress: d.averageProgress || 0,
          dailyActivity: d.dailyActivity || [],
          courseProgress: d.courseProgress || [],
          weeklyGoal: d.weeklyGoal || { target: 600, achieved: 0, percentage: 0 },
          studyPatterns: d.studyPatterns || {
            mostActiveDay: '—',
            mostActiveHour: 0,
            averageSessionDuration: 0
          }
        });
      } else {
        setAnalytics(generateSampleAnalytics());
      }

      // Smart default tab: prefer instructor if user has created courses
      if (parsed_created.length > 0) {
        setActiveRole('instructor');
      } else {
        setActiveRole('student');
      }
    } catch (err) {
      console.error('Dashboard fetchAllData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAnalytics = (): AnalyticsData => {
    const today = new Date();
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        timeSpent: Math.floor(Math.random() * 90) + 20,
        lessonsCompleted: Math.floor(Math.random() * 4) + 1,
      };
    });
    return {
      totalTimeSpent: 0, coursesInProgress: 0, coursesCompleted: 0, averageProgress: 0,
      dailyActivity,
      courseProgress: [],
      weeklyGoal: { target: 600, achieved: 0, percentage: 0 },
      studyPatterns: { mostActiveDay: '—', mostActiveHour: 0, averageSessionDuration: 0 }
    };
  };

  // ─── Instructor lazy-loaders ────────────────────────────────────────────────

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await courseAPI.getMyStudents();
      if (response.data.success) setStudents(response.data.data.students);
    } catch { /* silent */ } finally { setLoadingStudents(false); }
  };

  const fetchRevenue = async () => {
    try {
      setLoadingRevenue(true);
      const response = await courseAPI.getMyRevenue();
      if (response.data.success) {
        setRevenueData(response.data.data.courses);
        setTotalRevenue(response.data.data.totalRevenue);
        setTotalPlatformFee(response.data.data.totalPlatformFee || 0);
        setTotalNetRevenue(response.data.data.totalNetRevenue || 0);
        setCurrentMonthPlatformFee(response.data.data.currentMonthPlatformFee || 0);
      }
    } catch { /* silent */ } finally { setLoadingRevenue(false); }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getCategoryLabel = (category: string) => ({
    programming: 'Lập trình', design: 'Thiết kế', business: 'Kinh doanh',
    marketing: 'Marketing', language: 'Ngôn ngữ', science: 'Khoa học', other: 'Khác'
  }[category] || category);

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { color: string; label: string }> = {
      draft:    { color: 'bg-gray-100 text-gray-800',   label: 'Nháp' },
      pending:  { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 text-green-800',  label: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800',     label: 'Bị từ chối' },
    };
    const { color, label } = cfg[status] || cfg.draft;
    return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{label}</span>;
  };

  const handleSubmitForApproval = async (courseId: string) => {
    try {
      await courseAPI.submitCourseForApproval(courseId);
      toast.showToast({ type: 'success', title: 'Đã gửi khóa học để admin duyệt!' });
      fetchAllData();
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi gửi khóa học để duyệt' });
    }
  };

  const filteredCreatedCourses = createdStatusFilter === 'all'
    ? createdCourses
    : createdCourses.filter(c => c.status === createdStatusFilter);

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render: Student View ─────────────────────────────────────────────────

  const renderStudentView = () => {
    const noData = enrolledCourses.length === 0 && (!analytics || analytics.totalTimeSpent === 0);

    return (
      <div className="space-y-8">
        {noData ? (
          <Card className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Bạn chưa đăng ký khóa học nào</h3>
            <p className="text-gray-500 mb-6">Hãy khám phá kho khóa học của chúng tôi để bắt đầu hành trình học tập!</p>
            <Link to="/courses"><Button>Khám phá khóa học</Button></Link>
          </Card>
        ) : (
          <>
            {/* Analytics Stats */}
            {analytics && (
              <>
                {/* Period Filter */}
                <div className="flex gap-2">
                  {(['week', 'month', 'all'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedPeriod === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border'
                      }`}
                    >
                      {p === 'week' ? '7 ngày' : p === 'month' ? '30 ngày' : 'Tất cả'}
                    </button>
                  ))}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-gray-500 text-xs mb-1">Tổng thời gian học</p>
                    <p className="text-xl font-bold text-gray-900">{formatTime(analytics.totalTimeSpent)}</p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-gray-500 text-xs mb-1">Đang học</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.coursesInProgress}</p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-gray-500 text-xs mb-1">Đã hoàn thành</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.coursesCompleted}</p>
                  </Card>

                  <Card className="p-5">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-gray-500 text-xs mb-1">Tiến độ TB</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.averageProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${analytics.averageProgress}%` }} />
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4">⏱️ Hoạt động hàng ngày</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={analytics.dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="timeSpent" stroke="#3b82f6" strokeWidth={2} name="Thời gian (phút)" />
                        <Line type="monotone" dataKey="lessonsCompleted" stroke="#10b981" strokeWidth={2} name="Bài học hoàn thành" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4">📚 Phân bổ khóa học</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hoàn thành', value: analytics.coursesCompleted },
                            { name: 'Đang học', value: analytics.coursesInProgress },
                          ]}
                          cx="50%" cy="50%" outerRadius={75}
                          labelLine={false}
                          label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                          dataKey="value"
                        >
                          {[0, 1].map((index) => (
                            <Cell key={index} fill={CHART_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-purple-500 rounded-full" />
                        <span className="text-xs text-gray-600">Hoàn thành</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                        <span className="text-xs text-gray-600">Đang học</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Weekly Goal */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">🎯 Mục tiêu tuần này</h3>
                    <span className="text-xl font-bold text-blue-600">{analytics.weeklyGoal.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-7">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-7 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                      style={{ width: `${Math.max(analytics.weeklyGoal.percentage, 5)}%` }}
                    >
                      {analytics.weeklyGoal.percentage > 15 && `${analytics.weeklyGoal.achieved}/${analytics.weeklyGoal.target} phút`}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Đã đạt: {formatTime(analytics.weeklyGoal.achieved)}</span>
                    <span>Mục tiêu: {formatTime(analytics.weeklyGoal.target)}</span>
                  </div>
                </Card>

                {/* Course Progress Chart */}
                {analytics.courseProgress.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4">📖 Tiến độ từng khóa học</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={analytics.courseProgress}
                        barCategoryGap="35%" barGap={8}
                        margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="courseTitle" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={75} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="progress" fill="#8b5cf6" name="Tiến độ (%)" barSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* Study Patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4">🔥 Thói quen học tập</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700 text-sm">Ngày học nhiều nhất</span>
                        </div>
                        <span className="font-semibold text-blue-600 text-sm">{analytics.studyPatterns.mostActiveDay}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700 text-sm">Giờ học hiệu quả nhất</span>
                        </div>
                        <span className="font-semibold text-purple-600 text-sm">{analytics.studyPatterns.mostActiveHour}:00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700 text-sm">Thời lượng TB/buổi</span>
                        </div>
                        <span className="font-semibold text-green-600 text-sm">{analytics.studyPatterns.averageSessionDuration} phút</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4">💡 Gợi ý cải thiện</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="text-sm text-gray-700"><strong>Tăng tần suất học:</strong> Thử học ít nhất 30 phút mỗi ngày để duy trì kiến thức tốt hơn.</p>
                      </div>
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-gray-700"><strong>Thời gian tốt nhất:</strong> Bạn học hiệu quả vào {analytics.studyPatterns.mostActiveHour}:00. Hãy sắp xếp lịch học vào khung giờ này!</p>
                      </div>
                      <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                        <p className="text-sm text-gray-700"><strong>Hoàn thành mục tiêu:</strong> Bạn đã đạt {analytics.weeklyGoal.percentage}% mục tiêu tuần. Còn {formatTime(Math.max(0, analytics.weeklyGoal.target - analytics.weeklyGoal.achieved))} nữa là đạt mục tiêu!</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {/* Enrolled Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📖 Khóa học đang học ({enrolledCourses.length})</h2>
                <Link to="/courses" className="text-sm text-primary-600 hover:underline">Khám phá thêm →</Link>
              </div>
              {enrolledCourses.length === 0 ? (
                <Card className="text-center py-10">
                  <p className="text-gray-500 mb-4">Bạn chưa đăng ký khóa học nào.</p>
                  <Link to="/courses"><Button size="sm">Xem khóa học</Button></Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrolledCourses.map((course) => (
                    <Card key={course._id} className="hover:shadow-lg transition-shadow">
                      <div className="h-32 rounded-t-xl overflow-hidden bg-gray-100 relative">
                        {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                          <img
                            src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                            alt={course.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">{course.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">{getCategoryLabel(course.category)}</span>
                          <span className="text-xs text-gray-500">{course.progress || 0}% hoàn thành</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{course.title}</h3>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                          <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${course.progress || 0}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{course.instructor?.name || 'Giảng viên'}</span>
                          <Link to={course.lastLessonId ? `/courses/${course._id}/learn/${course.lastLessonId}` : `/courses/${course._id}`}>
                            <Button size="sm">Tiếp tục</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── Render: Instructor View ──────────────────────────────────────────────

  const renderInstructorView = () => {
    const noData = createdCourses.length === 0;

    return (
      <div className="space-y-8">
        {noData ? (
          <Card className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Bạn chưa tạo khóa học nào</h3>
            <p className="text-gray-500 mb-6">Hãy bắt đầu chia sẻ kiến thức của bạn với cộng đồng học viên!</p>
            <Link to="/courses"><Button>Tạo khóa học mới</Button></Link>
          </Card>
        ) : (
          <>
            {/* Instructor Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Khóa học đã tạo</p>
                    <p className="text-3xl font-bold text-green-600">{createdCourses.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✨</div>
                </div>
              </Card>

              <div
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => { fetchStudents(); setShowStudentsModal(true); }}
                role="button" tabIndex={0}
                onKeyPress={e => { if (e.key === 'Enter') { fetchStudents(); setShowStudentsModal(true); } }}
              >
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tổng học viên</p>
                      <p className="text-3xl font-bold text-purple-600">{totalStudents}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Nhấn để xem chi tiết</p>
                </Card>
              </div>

              <div
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => { fetchRevenue(); setShowRevenueModal(true); }}
                role="button" tabIndex={0}
                onKeyPress={e => { if (e.key === 'Enter') { fetchRevenue(); setShowRevenueModal(true); } }}
              >
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doanh thu ròng</p>
                      <p className="text-3xl font-bold text-orange-600">{totalNetRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">💰</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Nhấn để xem chi tiết</p>
                </Card>
              </div>
            </div>

            {/* Created Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📚 Khóa học đã tạo ({filteredCreatedCourses.length})</h2>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={createdStatusFilter}
                  onChange={(e) => setCreatedStatusFilter(e.target.value as any)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Nháp</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Bị từ chối</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCreatedCourses.map((course) => (
                  <Card key={course._id} className="hover:shadow-lg transition-shadow">
                    <div className="h-32 rounded-t-xl overflow-hidden bg-gray-100 relative">
                      {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                        <img
                          src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{course.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(course.status)}
                        <span className="text-xs text-gray-500">{course.totalStudents || 0} học viên</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{course.title}</h3>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{course.description}</p>

                      {course.status === 'rejected' && course.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                          <p className="text-red-700 text-xs"><strong>Lý do từ chối:</strong> {course.rejectionReason}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary-600 text-sm">{(course.finalPrice || course.price || 0).toLocaleString('vi-VN')}đ</span>
                        <div className="flex gap-1.5">
                          <Link to={`/courses/${course._id}/lessons`}>
                            <Button variant="outline" size="sm">Quản lý</Button>
                          </Link>
                          {(course.status === 'draft' || course.status === 'rejected') && (
                            <Button size="sm" onClick={() => handleSubmitForApproval(course._id)}>
                              {course.status === 'rejected' ? 'Gửi lại' : 'Gửi duyệt'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Xin chào, {user?.name || 'Bạn'}! 👋
          </h1>
          <p className="text-primary-100 text-base">
            Quản lý khóa học và theo dõi tiến độ học tập của bạn
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Role Tab Switcher */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-0">
          <button
            onClick={() => setActiveRole('student')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors -mb-px ${
              activeRole === 'student'
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            👨‍🎓 Học viên
            {enrolledCourses.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{enrolledCourses.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveRole('instructor')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors -mb-px ${
              activeRole === 'instructor'
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            👨‍🏫 Giảng viên
            {createdCourses.length > 0 && (
              <span className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{createdCourses.length}</span>
            )}
          </button>
        </div>

        {/* Role Content */}
        {activeRole === 'student' ? renderStudentView() : renderInstructorView()}

        {/* Quick Actions */}
        <section className="mt-12 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🚀 Hành động nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/courses" className="group">
              <Card className="p-5 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-1">Tìm khóa học</h3>
                <p className="text-gray-500 text-sm">Khám phá hàng ngàn khóa học chất lượng</p>
              </Card>
            </Link>
            <Link to="/courses" className="group">
              <Card className="p-5 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="font-semibold text-gray-900 mb-1">Tạo khóa học</h3>
                <p className="text-gray-500 text-sm">Chia sẻ kiến thức với cộng đồng</p>
              </Card>
            </Link>
            <Link to="/profile" className="group">
              <Card className="p-5 hover:shadow-lg transition-all group-hover:scale-[1.02]">
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-semibold text-gray-900 mb-1">Cập nhật hồ sơ</h3>
                <p className="text-gray-500 text-sm">Chỉnh sửa thông tin cá nhân</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>

      {/* ── Students Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showStudentsModal}
        onClose={() => { setShowStudentsModal(false); setSelectedStudent(null); }}
        title={selectedStudent ? `Chi tiết học viên: ${selectedStudent.name}` : 'Danh sách học viên'}
      >
        <div className="max-h-[560px] overflow-y-auto">
          {loadingStudents ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : selectedStudent ? (
            <div className="space-y-5">
              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>← Quay lại</Button>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-600 text-sm">{selectedStudent.email}</p>
                  <p className="text-xs text-gray-400">Tham gia: {new Date(selectedStudent.joinedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3"><p className="text-xs text-gray-500">Khóa đã đăng ký</p><p className="text-xl font-bold text-blue-600">{selectedStudent.totalCoursesEnrolled}</p></Card>
                <Card className="p-3 col-span-2"><p className="text-xs text-gray-500">Tổng đã thanh toán</p><p className="text-xl font-bold text-orange-600">{selectedStudent.totalPaid.toLocaleString('vi-VN')}đ</p></Card>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Khóa học ({selectedStudent.courses.length})</h4>
                <div className="space-y-2">
                  {selectedStudent.courses.map((c) => (
                    <div key={c.courseId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{c.courseTitle}</p>
                          <p className="text-xs text-gray-400">Đăng ký: {new Date(c.enrolledAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary-600">{c.progress}%</p>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : students.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Chưa có học viên nào</p>
          ) : (
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStudent(s)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-base font-bold text-primary-600">{s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                        <p className="text-xs text-gray-400">{s.courses.length} khóa học</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">{s.totalPaid.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-gray-400">Tổng đã trả</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Revenue Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRevenueModal}
        onClose={() => { setShowRevenueModal(false); setSelectedCourse(null); }}
        title={selectedCourse ? `Chi tiết: ${selectedCourse.title}` : `Doanh thu tổng: ${totalRevenue.toLocaleString('vi-VN')}đ`}
      >
        <div className="max-h-[560px] overflow-y-auto">
          {loadingRevenue ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : selectedCourse ? (
            <div className="space-y-5">
              <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>← Quay lại</Button>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3"><p className="text-xs text-gray-500">Giá KH</p><p className="text-lg font-bold text-blue-600">{selectedCourse.finalPrice.toLocaleString('vi-VN')}đ</p></Card>
                <Card className="p-3"><p className="text-xs text-gray-500">Học viên</p><p className="text-lg font-bold text-purple-600">{selectedCourse.studentsCount}</p></Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Doanh thu ròng</p>
                  <p className="text-lg font-bold text-green-600">{(selectedCourse.netRevenue || 0).toLocaleString('vi-VN')}đ</p>
                  <p className="text-xs text-gray-400">Phí: {(selectedCourse.platformFeeAmount || 0).toLocaleString('vi-VN')}đ</p>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Biểu đồ doanh thu</h4>
                  <select className="px-2 py-1 border rounded text-xs" value={revenueTimeframe} onChange={(e) => setRevenueTimeframe(e.target.value as any)}>
                    <option value="day">Theo ngày</option>
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {(revenueTimeframe === 'day' ? selectedCourse.analytics.byDate :
                    revenueTimeframe === 'month' ? selectedCourse.analytics.byMonth :
                    selectedCourse.analytics.byYear
                  ).slice(0, 10).map((item: any, i) => {
                    const all = revenueTimeframe === 'day' ? selectedCourse.analytics.byDate : revenueTimeframe === 'month' ? selectedCourse.analytics.byMonth : selectedCourse.analytics.byYear;
                    const max = Math.max(...all.map((x: any) => x.amount), 1);
                    const pct = (item.amount / max) * 100;
                    const label = item.date || item.month || item.year;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-20 text-xs text-gray-500">{label}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-5">
                          <div className="bg-gradient-to-r from-green-400 to-green-600 h-5 rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                            <span className="text-xs text-white font-medium">{item.amount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Thanh toán gần đây ({selectedCourse.payments.length})</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedCourse.payments.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border-b hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">{p.user.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm text-gray-900">{p.user.name}</p>
                          <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <span className="font-medium text-green-600 text-sm">{p.amount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : revenueData.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Chưa có dữ liệu doanh thu</p>
          ) : (
            <div className="space-y-3">
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-gray-500">Doanh thu tổng</p><p className="text-base font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')}đ</p></div>
                  <div><p className="text-xs text-gray-500">Phí nền tảng</p><p className="text-base font-bold text-gray-700">{totalPlatformFee.toLocaleString('vi-VN')}đ</p><p className="text-xs text-gray-400">Tháng này: {currentMonthPlatformFee.toLocaleString('vi-VN')}đ</p></div>
                  <div><p className="text-xs text-gray-500">Doanh thu ròng</p><p className="text-base font-bold text-orange-600">{totalNetRevenue.toLocaleString('vi-VN')}đ</p></div>
                </div>
              </Card>
              {revenueData.map((c) => (
                <div key={c.courseId} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCourse(c)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{c.title}</h3>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>💵 {c.finalPrice.toLocaleString('vi-VN')}đ</span>
                        <span>👥 {c.studentsCount}</span>
                        <span>⭐ {c.rating?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{c.revenue.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-gray-400">Ròng: {(c.netRevenue || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full" style={{ width: `${totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;

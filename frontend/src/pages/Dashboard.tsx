import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Modal from '../components/ui/Modal';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price?: number;
  finalPrice?: number;
  duration?: number;
  rating?: {
    average: number;
    count: number;
  };
  instructor?: {
    _id: string;
    name: string;
  };
  totalStudents?: number; // Virtual count from backend
  progress?: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  courses: {
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    progress: number;
    lastAccessedAt?: string;
    lastLessonId?: string | null;
    lastLessonAccessedAt?: string | null;
  }[];
  totalCoursesEnrolled: number;
  totalCoursesCreated: number;
  totalPaid: number;
  paymentHistory: {
    amount: number;
    date: string;
  }[];
}

interface RevenueData {
  courseId: string;
  title: string;
  price: number;
  finalPrice: number;
  studentsCount: number;
  rating: {
    average: number;
    count: number;
  };
  revenue: number;
  platformFeeAmount?: number;
  netRevenue?: number;
  payments: {
    user: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    amount: number;
    platformFeeAmount?: number;
    instructorNetAmount?: number;
    date: string;
  }[];
  reviews: any[];
  analytics: {
    byDate: { date: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
    byMonth: { month: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
    byYear: { year: string; amount: number; platformFeeAmount?: number; netAmount?: number }[];
  };
}

interface UserStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  createdCourses: number;
  totalStudents: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    createdCourses: 0,
    totalStudents: 0,
    totalRevenue: 0
  });
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [modalCourses, setModalCourses] = useState<Course[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  
  // New states for students and revenue
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPlatformFee, setTotalPlatformFee] = useState(0);
  const [totalNetRevenue, setTotalNetRevenue] = useState(0);
  const [currentMonthPlatformFee, setCurrentMonthPlatformFee] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<RevenueData | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueTimeframe, setRevenueTimeframe] = useState<'day' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent courses for discovery
      console.log('Fetching recent courses...');
      const recentResponse = await courseAPI.getAllCourses({ limit: 6, sort: 'newest' });
      console.log('Recent courses response:', recentResponse.data);
      
      if (recentResponse.data.success && recentResponse.data.data && recentResponse.data.data.courses) {
        const courses = Array.isArray(recentResponse.data.data.courses) 
          ? recentResponse.data.data.courses 
          : [];
        setRecentCourses(courses);
      } else {
        setRecentCourses([]);
      }

      // If user is logged in, fetch their specific data
      if (user) {
        console.log('Fetching user courses...');
        try {
          // Fetch both created courses and enrolled courses
          const [myCoursesResponse, enrolledCoursesResponse] = await Promise.all([
            courseAPI.getMyCourses({ limit: 10 }),
            courseAPI.getMyEnrolledCourses({ limit: 10 })
          ]);
          
          console.log('My courses response:', myCoursesResponse.data);
          console.log('Enrolled courses response:', enrolledCoursesResponse.data);

          // Parse created courses
          let userCoursesArr: any[] = [];
          if (myCoursesResponse.data.success && myCoursesResponse.data.data) {
            if (Array.isArray(myCoursesResponse.data.data.courses)) {
              userCoursesArr = myCoursesResponse.data.data.courses;
            } else if (Array.isArray(myCoursesResponse.data.data)) {
              userCoursesArr = myCoursesResponse.data.data;
            }
          }

          // Parse enrolled courses
          let enrolledCoursesArr: any[] = [];
          if (enrolledCoursesResponse.data.success && enrolledCoursesResponse.data.data) {
            if (Array.isArray(enrolledCoursesResponse.data.data.courses)) {
              enrolledCoursesArr = enrolledCoursesResponse.data.data.courses;
            } else if (Array.isArray(enrolledCoursesResponse.data.data)) {
              enrolledCoursesArr = enrolledCoursesResponse.data.data;
            }
          }

          // Store courses separately for modal display
          setCreatedCourses(userCoursesArr);
          setEnrolledCourses(enrolledCoursesArr);

          // Calculate accurate stats
          const enrolledCount = enrolledCoursesArr.length;
          const createdCount = userCoursesArr.length;
          const completedCount = enrolledCoursesArr.filter((course: any) => course.progress >= 100).length;
          const totalStudents = userCoursesArr.reduce((sum: number, course: any) => {
            return sum + (course.totalStudents || 0);
          }, 0);

          const totalRevenue = userCoursesArr.reduce((sum: number, course: any) => {
            const price = course.finalPrice || course.price || 0;
            const studentCount = course.totalStudents || 0;
            return sum + (price * studentCount);
          }, 0);

          const userStats = {
            enrolledCourses: enrolledCount,
            createdCourses: createdCount, 
            completedCourses: completedCount,
            totalCourses: recentResponse.data.pagination?.total || 0,
            totalStudents: totalStudents,
            totalRevenue: totalRevenue
          };
          
          console.log('Calculated stats:', userStats);
          setStats(userStats);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // Set default stats if user data fails
          setStats({
            enrolledCourses: user.enrolledCourses?.length || 0,
            createdCourses: 0,
            completedCourses: 0,
            totalCourses: 0,
            totalStudents: 0,
            totalRevenue: 0
          });
        }
      } else {
        // Not logged in, show basic stats
        setStats({
          enrolledCourses: 0,
          createdCourses: 0,
          completedCourses: 0,
          totalCourses: recentResponse.data.pagination?.total || 0,
          totalStudents: 0,
          totalRevenue: 0
        });
      }

    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu dashboard:', error);
      // Set fallback data
      setRecentCourses([]);
      setStats({
        enrolledCourses: 0,
        createdCourses: 0,
        completedCourses: 0,
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'programming': 'Lập trình',
      'design': 'Thiết kế', 
      'business': 'Kinh doanh',
      'marketing': 'Marketing',
      'language': 'Ngôn ngữ',
      'science': 'Khoa học',
      'other': 'Khác'
    };
    return categories[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'beginner': 'Cơ bản',
      'intermediate': 'Trung cấp',
      'advanced': 'Nâng cao'
    };
    return levels[level] || level;
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await courseAPI.getMyStudents();
      if (response.data.success) {
        setStudents(response.data.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
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
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleStatsClick = (type: string) => {
    switch (type) {
      case 'enrolled':
        setModalCourses(enrolledCourses);
        setModalTitle('Khóa học đã đăng ký');
        setShowCourseModal(true);
        break;
      case 'created':
        setModalCourses(createdCourses);
        setModalTitle('Khóa học đã tạo');
        setShowCourseModal(true);
        break;
      case 'students':
        fetchStudents();
        setShowStudentsModal(true);
        break;
      case 'revenue':
        fetchRevenue();
        setShowRevenueModal(true);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Xin chào, {user?.name || 'Bạn'}! 👋
            </h1>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Quản lý khóa học và theo dõi tiến độ học tập của bạn
            </p>
            {/* Search bar sẽ được thêm ở đây */}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {user && (
          <>
            {/* Stats Cards */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Thống kê của bạn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStatsClick('enrolled')}
                  tabIndex={0}
                  role="button"
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleStatsClick('enrolled');
                  }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Khóa học đã đăng ký</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.enrolledCourses}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📖</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStatsClick('created')}
                  tabIndex={0}
                  role="button"
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleStatsClick('created');
                  }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Khóa học đã tạo</p>
                        <p className="text-3xl font-bold text-green-600">{stats.createdCourses}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStatsClick('students')}
                  tabIndex={0}
                  role="button"
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleStatsClick('students');
                  }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng học viên</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStatsClick('revenue')}
                  tabIndex={0}
                  role="button"
                  onKeyPress={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleStatsClick('revenue');
                  }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                        <p className="text-3xl font-bold text-orange-600">{Number(stats?.totalRevenue || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </section>

          </>
        )}

        {/* Recent Courses */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Khóa học mới nhất</h2>
          {recentCourses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
                {(Array.isArray(recentCourses) ? recentCourses : []).map((course) => (
                <Link key={course._id} to={`/courses/${course._id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-xl flex items-center justify-center relative">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                      <div className="absolute top-3 right-3 bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                        ⭐ {course.rating?.average?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {getLevelLabel(course.level)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course.totalStudents || 0} học viên
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary-600">
                            {Number(course.finalPrice || course.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Chưa có khóa học nào
              </h3>
              <p className="text-gray-600 mb-6">
                Hệ thống đang được cập nhật với nhiều khóa học mới
              </p>
              {user && (
                <Link to="/courses">
                  <Button>Bắt đầu tạo khóa học đầu tiên</Button>
                </Link>
              )}
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        {user && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Hành động nhanh</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/courses" className="group">
                <Card className="hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tìm khóa học</h3>
                  <p className="text-gray-600">Khám phá hàng ngàn khóa học chất lượng</p>
                </Card>
              </Link>

              <Link to="/courses" className="group">
                <Card className="hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tạo khóa học</h3>
                  <p className="text-gray-600">Chia sẻ kiến thức với cộng đồng</p>
                </Card>
              </Link>

              <Link to="/profile" className="group">
                <Card className="hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật hồ sơ</h3>
                  <p className="text-gray-600">Chỉnh sửa thông tin cá nhân</p>
                </Card>
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Course List Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title={modalTitle}
      >
        <div className="max-h-96 overflow-y-auto">
          {modalCourses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chưa có khóa học nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(modalCourses) ? modalCourses : []).map((course) => (
                <div key={course._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📚 {getCategoryLabel(course.category)}</span>
                        <span>📊 {getLevelLabel(course.level)}</span>
                        {course.progress !== undefined && (
                          <span>📈 {course.progress}% hoàn thành</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link
                        to={`/courses/${course._id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal học viên */}
      <Modal
        isOpen={showStudentsModal}
        onClose={() => {
          setShowStudentsModal(false);
          setSelectedStudent(null);
        }}
        title={selectedStudent ? `Chi tiết học viên: ${selectedStudent.name}` : "Danh sách học viên"}
      >
        <div className="max-h-[600px] overflow-y-auto">
          {loadingStudents ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : selectedStudent ? (
            // Xem chi tiết học viên
            <div className="space-y-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedStudent(null)}
                className="mb-4"
              >
                ← Quay lại danh sách
              </Button>
              
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  <p className="text-sm text-gray-500">Tham gia: {new Date(selectedStudent.joinedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Khóa học đã đăng ký</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedStudent.totalCoursesEnrolled}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Khóa học đã tạo</p>
                  <p className="text-2xl font-bold text-green-600">{selectedStudent.totalCoursesCreated}</p>
                </Card>
                <Card className="p-4 col-span-2">
                  <p className="text-sm text-gray-600">Tổng số tiền đã thanh toán</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedStudent.totalPaid.toLocaleString('vi-VN')}đ</p>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Khóa học của bạn ({selectedStudent.courses.length})</h4>
                <div className="space-y-2">
                  {selectedStudent.courses.map((course) => (
                    <div key={course.courseId} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{course.courseTitle}</p>
                          <p className="text-sm text-gray-500">Đăng ký: {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}</p>
                          {course.lastAccessedAt && (
                            <p className="text-sm text-gray-500">Học gần nhất: {new Date(course.lastAccessedAt).toLocaleDateString('vi-VN')}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary-600">{course.progress}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedStudent.paymentHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Lịch sử thanh toán</h4>
                  <div className="space-y-2">
                    {selectedStudent.paymentHistory.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b">
                        <span className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('vi-VN')}</span>
                        <span className="font-medium text-green-600">+{payment.amount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Danh sách học viên
            students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có học viên nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div 
                    key={student._id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">{student.courses.length} khóa học</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">{student.totalPaid.toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-gray-500">Tổng đã trả</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>

      {/* Revenue Modal */}
      <Modal
        isOpen={showRevenueModal}
        onClose={() => {
          setShowRevenueModal(false);
          setSelectedCourse(null);
        }}
        title={selectedCourse ? `Chi tiết doanh thu: ${selectedCourse.title}` : `Doanh thu tổng: ${totalRevenue.toLocaleString('vi-VN')}đ`}
      >
        <div className="max-h-[600px] overflow-y-auto">
          {loadingRevenue ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : selectedCourse ? (
            // Course Revenue Detail View
            <div className="space-y-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedCourse(null)}
                className="mb-4"
              >
                ← Quay lại danh sách
              </Button>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Giá khóa học</p>
                  <p className="text-xl font-bold text-blue-600">{selectedCourse.finalPrice.toLocaleString('vi-VN')}đ</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Số học viên</p>
                  <p className="text-xl font-bold text-purple-600">{selectedCourse.studentsCount}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Doanh thu (gộp)</p>
                  <p className="text-xl font-bold text-green-600">{selectedCourse.revenue.toLocaleString('vi-VN')}đ</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Phí nền tảng: {(selectedCourse.platformFeeAmount || 0).toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-gray-500">
                    Doanh thu ròng: {(selectedCourse.netRevenue || 0).toLocaleString('vi-VN')}đ
                  </p>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Biểu đồ doanh thu</h4>
                  <select 
                    className="px-3 py-1 border rounded-md text-sm"
                    value={revenueTimeframe}
                    onChange={(e) => setRevenueTimeframe(e.target.value as 'day' | 'month' | 'year')}
                  >
                    <option value="day">Theo ngày</option>
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  {(revenueTimeframe === 'day' ? selectedCourse.analytics.byDate :
                    revenueTimeframe === 'month' ? selectedCourse.analytics.byMonth :
                    selectedCourse.analytics.byYear
                  ).slice(0, 10).map((item: any, index: number) => {
                    const label = item.date || item.month || item.year;
                    const maxAmount = Math.max(...(revenueTimeframe === 'day' ? selectedCourse.analytics.byDate :
                      revenueTimeframe === 'month' ? selectedCourse.analytics.byMonth :
                      selectedCourse.analytics.byYear
                    ).map((i: any) => i.amount));
                    const percentage = (item.amount / maxAmount) * 100;
                    
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-24 text-sm text-gray-600">{label}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs font-medium text-white">{item.amount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Thanh toán gần đây ({selectedCourse.payments.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCourse.payments.slice(0, 10).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                          {payment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.user.name}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <span className="font-medium text-green-600">{payment.amount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCourse.reviews.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Đánh giá (⭐ {selectedCourse.rating.average.toFixed(1)} - {selectedCourse.rating.count} reviews)
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedCourse.reviews.map((review: any) => (
                      <div key={review._id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                              {review.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{review.user?.name}</span>
                          </div>
                          <div className="text-yellow-500">{'⭐'.repeat(review.rating)}</div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Revenue List View
            revenueData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có dữ liệu doanh thu</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Doanh thu (gộp)</p>
                      <p className="text-lg font-bold text-green-600">{totalRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phí nền tảng</p>
                      <p className="text-lg font-bold text-gray-700">{totalPlatformFee.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-gray-500">Tháng này: {currentMonthPlatformFee.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Doanh thu ròng</p>
                      <p className="text-lg font-bold text-orange-600">{totalNetRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </Card>
                {revenueData.map((course) => (
                  <div 
                    key={course.courseId} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>💵 {course.finalPrice.toLocaleString('vi-VN')}đ</span>
                          <span>👥 {course.studentsCount} học viên</span>
                          <span>⭐ {course.rating.average.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{course.revenue.toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-gray-500">Doanh thu (gộp)</p>
                        <p className="text-xs text-gray-500">Ròng: {(course.netRevenue || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" 
                        style={{ width: `${(course.revenue / totalRevenue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;

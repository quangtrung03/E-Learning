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
  students?: any[];
  progress?: number;
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
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [modalCourses, setModalCourses] = useState<Course[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

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

          // Show mixed courses on dashboard - prioritize enrolled courses, then created courses (defensive)
          const safeEnrolled = Array.isArray(enrolledCoursesArr) ? enrolledCoursesArr : [];
          const safeUserCourses = Array.isArray(userCoursesArr) ? userCoursesArr : [];
          const dashboardCourses = [...safeEnrolled, ...safeUserCourses].slice(0, 4);
          setMyCourses(dashboardCourses);

          // Calculate accurate stats
          const enrolledCount = enrolledCoursesArr.length;
          const createdCount = userCoursesArr.length;
          const completedCount = enrolledCoursesArr.filter((course: any) => course.progress >= 100).length;
          const totalStudents = userCoursesArr.reduce((sum: number, course: any) => {
            const students = course.students || [];
            return sum + (Array.isArray(students) ? students.length : 0);
          }, 0);

          const totalRevenue = userCoursesArr.reduce((sum: number, course: any) => {
            const price = course.finalPrice || course.price || 0;
            const studentCount = course.students?.length || 0;
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
          setMyCourses([]);
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
      setMyCourses([]);
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
              Chào mừng bạn đến với E-Learning Platform. Hãy bắt đầu hành trình học tập của bạn ngay hôm nay!
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/courses">
                <Button className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold">
                  🔍 Khám phá khóa học
                </Button>
              </Link>
              {user && (
                <Link to="/my-courses">
                  <Button className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-xl font-semibold">
                    📚 Khóa học của tôi
                  </Button>
                </Link>
              )}
            </div>
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
            </section>

            {/* My Courses Section */}
            {(Array.isArray(myCourses) && myCourses.length > 0) && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📚 Khóa học của tôi</h2>
                  <Link to="/my-courses">
                    <Button variant="outline">Xem tất cả</Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {(Array.isArray(myCourses) ? myCourses.slice(0, 4) : []).map((course) => (
                    <Card key={course._id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {getCategoryLabel(course.category)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {getLevelLabel(course.level)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {course.students?.length || 0} học viên
                        </span>
                        <Link to={`/courses/${course._id}/lessons`}>
                          <Button size="sm">Quản lý bài học</Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
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
                          {course.students?.length || 0} học viên
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
    </div>
  );
};

export default Dashboard;

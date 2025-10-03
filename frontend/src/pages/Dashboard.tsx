import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  finalPrice: number;
  duration: number;
  rating: {
    average: number;
    count: number;
  };
  instructor: {
    _id: string;
    name: string;
  };
  students: string[];
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

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent courses for discovery
      const recentResponse = await courseAPI.getAllCourses({ limit: 6, sort: 'newest' });
      setRecentCourses(recentResponse.data.data.courses || []);

      // If user is logged in, fetch their specific data
      if (user) {
        // Fetch user's created courses
        const myCoursesResponse = await courseAPI.getMyCourses({ limit: 4 });
        setMyCourses(myCoursesResponse.data.data.courses || []);

        // Calculate stats from user data
        const userStats = {
          enrolledCourses: user.enrolledCourses?.length || 0,
          createdCourses: myCoursesResponse.data.data.courses?.length || 0,
          completedCourses: user.enrolledCourses?.filter((enrollment: any) => enrollment.progress >= 100).length || 0,
          totalCourses: recentResponse.data.pagination?.total || 0,
          totalStudents: myCoursesResponse.data.data.courses?.reduce((sum: number, course: any) => sum + (course.students?.length || 0), 0) || 0,
          totalRevenue: myCoursesResponse.data.data.courses?.reduce((sum: number, course: any) => sum + (course.finalPrice * (course.students?.length || 0)), 0) || 0
        };
        
        setStats(userStats);
      }

    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu dashboard:', error);
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Khóa học đã đăng ký</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.enrolledCourses}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📖</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Khóa học đã tạo</p>
                      <p className="text-3xl font-bold text-green-600">{stats.createdCourses}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng học viên</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* My Courses Section */}
            {myCourses.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📚 Khóa học của tôi</h2>
                  <Link to="/my-courses">
                    <Button variant="outline">Xem tất cả</Button>
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {myCourses.slice(0, 4).map((course) => (
                    <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                          {course.students.length} học viên
                        </span>
                        <Link to={`/courses/${course._id}/lessons`}>
                          <Button size="sm">Quản lý bài học</Button>
                        </Link>
                      </div>
                    </div>
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
              {recentCourses.map((course) => (
                <Link key={course._id} to={`/courses/${course._id}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-xl flex items-center justify-center relative">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                      <div className="absolute top-3 right-3 bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                        ⭐ {course.rating.average.toFixed(1)}
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
                          {course.students.length} học viên
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary-600">
                            {course.finalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
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
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {user && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Hành động nhanh</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/courses" className="group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tìm khóa học</h3>
                  <p className="text-gray-600">Khám phá hàng ngàn khóa học chất lượng</p>
                </div>
              </Link>

              <Link to="/courses" className="group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tạo khóa học</h3>
                  <p className="text-gray-600">Chia sẻ kiến thức với cộng đồng</p>
                </div>
              </Link>

              <Link to="/profile" className="group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group-hover:scale-105">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cập nhật hồ sơ</h3>
                  <p className="text-gray-600">Chỉnh sửa thông tin cá nhân</p>
                </div>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
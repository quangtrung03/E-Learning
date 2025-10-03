import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';

interface Course {
  _id: string;
  title: string;
  instructor: {
    name: string;
  };
  price: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    createdCourses: 0
  });
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user's courses and stats
        if (user?.enrolledCourses) {
          setStats(prev => ({
            ...prev,
            enrolledCourses: user.enrolledCourses.length
          }));
        }

        if (user?.createdCourses) {
          setStats(prev => ({
            ...prev,
            createdCourses: user.createdCourses.length
          }));
        }

        // Fetch recent courses
        const response = await courseAPI.getAllCourses({ limit: 4, sort: 'newest' });
        setRecentCourses(response.data.data.courses);

      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 17) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Chào mừng trở lại với ELearn. Bạn có thể học tập và chia sẻ kiến thức tại đây! 🚀
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khóa học đã đăng ký</p>
                <p className="text-3xl font-bold text-gray-900">{stats.enrolledCourses}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khóa học hoàn thành</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khóa học đã tạo</p>
                <p className="text-3xl font-bold text-gray-900">{stats.createdCourses}</p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng thời gian học</p>
                <p className="text-3xl font-bold text-gray-900">24<span className="text-lg">h</span></p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hành động nhanh</h2>
            <div className="space-y-4">
              <Link
                to="/courses"
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Khám phá khóa học</h3>
                  <p className="text-sm text-gray-600">Tìm kiếm và đăng ký khóa học mới</p>
                </div>
              </Link>

              <Link
                to="/teacher/create-course"
                className="flex items-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Tạo khóa học mới</h3>
                  <p className="text-sm text-gray-600">Chia sẻ kiến thức của bạn</p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Cập nhật hồ sơ</h3>
                  <p className="text-sm text-gray-600">Chỉnh sửa thông tin cá nhân</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Courses */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Khóa học mới nhất</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/courses'}
                className="text-primary-600 hover:text-primary-700"
              >
                Xem tất cả →
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentCourses.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-gray-500">Chưa có khóa học nào</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = '/courses'}
                    className="mt-4"
                  >
                    Khám phá khóa học
                  </Button>
                </div>
              ) : (
                recentCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/courses/${course._id}`}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-all hover:shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white font-semibold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.instructor.name}</p>
                    </div>
                    <div className="text-primary-600 font-medium">
                      {course.price.toLocaleString('vi-VN')}đ
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import api from '../services/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  duration: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: Date;
}

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  totalRevenue: number;
  pendingAdminRequests?: number;
}



const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    pendingCourses: 0,
    approvedCourses: 0,
    totalRevenue: 0,
    pendingAdminRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      console.log('Fetching admin stats...');
      const statsResponse = await api.get('/admin/stats');
      console.log('Stats response:', statsResponse.data);
      
      if (statsResponse.data.success && statsResponse.data.data) {
        const data = statsResponse.data.data;
        setStats({
          totalUsers: data.users?.total || 0,
          totalCourses: data.courses?.total || 0,
          pendingCourses: data.courses?.pending || 0,
          approvedCourses: data.courses?.approved || 0,
          totalRevenue: 0, // Backend chưa có revenue logic
          pendingAdminRequests: 0
        });
      }
      
      // Fetch pending courses  
      console.log('Fetching pending courses...');
      const coursesResponse = await api.get('/admin/courses/pending');
      console.log('Courses response:', coursesResponse.data);
      
      if (coursesResponse.data.success && coursesResponse.data.data && coursesResponse.data.data.courses) {
        const courses = Array.isArray(coursesResponse.data.data.courses) 
          ? coursesResponse.data.data.courses 
          : [];
        setPendingCourses(courses);
      } else {
        setPendingCourses([]);
      }
      
    } catch (error: any) {
      console.error('Lỗi khi lấy dữ liệu admin:', error);
      console.error('Error response:', error.response?.data);
      // Set default values on error
      setPendingCourses([]);
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        pendingCourses: 0,
        approvedCourses: 0,
        totalRevenue: 0,
        pendingAdminRequests: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      setActionLoading(courseId);
      await api.put(`/admin/courses/${courseId}/approve`);
      
      // Remove from pending list
      setPendingCourses(prev => prev.filter(course => course._id !== courseId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingCourses: prev.pendingCourses - 1,
        approvedCourses: prev.approvedCourses + 1
      }));
    } catch (error) {
      console.error('Lỗi khi duyệt khóa học:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCourse = async (courseId: string, reason: string) => {
    try {
      setActionLoading(courseId);
      await api.put(`/admin/courses/${courseId}/reject`, { reason });
      
      // Remove from pending list
      setPendingCourses(prev => prev.filter(course => course._id !== courseId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingCourses: prev.pendingCourses - 1
      }));
    } catch (error) {
      console.error('Lỗi khi từ chối khóa học:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      programming: 'Lập trình',
      design: 'Thiết kế',
      business: 'Kinh doanh',
      marketing: 'Marketing',
      language: 'Ngôn ngữ',
      science: 'Khoa học',
      other: 'Khác'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getLevelLabel = (level: string) => {
    const levels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return levels[level as keyof typeof levels] || level;
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần quyền admin để xem trang này</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="container-custom py-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-purple-100 text-lg">
            Quản lý hệ thống E-Learning
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Link to="/admin/users">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/courses">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng khóa học</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingCourses}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-3xl font-bold text-green-600">{stats.approvedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-2xl font-bold text-purple-600">{(stats.totalRevenue || 0).toLocaleString('vi-VN')}đ</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </Card>

          <Link to="/admin/requests">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Requests</p>
                  <p className="text-3xl font-bold text-indigo-600">-</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Pending Courses */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Khóa học chờ duyệt ({pendingCourses.length})</h2>
          </div>
          
          {pendingCourses.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có khóa học chờ duyệt</h3>
              <p className="text-gray-600">Tất cả khóa học đã được xử lý</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingCourses.map((course) => (
                <div key={course._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                          {getLevelLabel(course.level)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-medium">
                              {course.instructor.name.charAt(0)}
                            </span>
                          </div>
                          <span>{course.instructor.name}</span>
                        </div>
                        <span>{(course.price || 0).toLocaleString('vi-VN')}đ</span>
                        <span>{course.duration} phút</span>
                        <span>{new Date(course.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Lý do từ chối:');
                          if (reason) {
                            handleRejectCourse(course._id, reason);
                          }
                        }}
                        disabled={actionLoading === course._id}
                      >
                        Từ chối
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveCourse(course._id)}
                        loading={actionLoading === course._id}
                      >
                        Duyệt
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

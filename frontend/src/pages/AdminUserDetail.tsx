import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  adminRequestPending: boolean;
  enrolledCourses: Array<{
    course: {
      _id: string;
      title: string;
      category: string;
      status: string;
    };
    enrolledAt: Date;
    progress: number;
  }>;
  createdCourses: Array<{
    _id: string;
    title: string;
    category: string;
    status: string;
    students: Array<any>;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
    if (id) {
      fetchUserDetail();
    }
  }, [currentUser, id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}`);
      
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết user:', error);
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async () => {
    if (!user) return;
    
    try {
      setActionLoading('toggle-ban');
      await api.put(`/admin/users/${user._id}/toggle-ban`);
      setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async () => {
    if (!user) return;
    
    const confirm = window.confirm('Bạn có chắc muốn cấp quyền admin cho user này?');
    if (!confirm) return;

    try {
      setActionLoading('make-admin');
      await api.put(`/admin/users/${user._id}/make-admin`);
      setUser(prev => prev ? { ...prev, isAdmin: true, adminRequestPending: false } : null);
    } catch (error) {
      console.error('Lỗi khi cấp quyền admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isAdmin) {
      return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>;
    }
    if (!user.isActive) {
      return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">Bị khóa</span>;
    }
    if (!user.emailVerified) {
      return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">Chưa xác thực email</span>;
    }
    return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>;
  };

  const getCourseStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Nháp' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ duyệt' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Bị từ chối' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy người dùng</h1>
          <Link to="/admin/users">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết người dùng</h1>
              <p className="text-gray-600 mt-1">Thông tin chi tiết và hoạt động của {user.name}</p>
            </div>
            <Link to="/admin/users">
              <Button variant="outline">
                ← Quay lại danh sách
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center">
                <div className="flex-shrink-0 mx-auto h-24 w-24 mb-4">
                  {user.avatar ? (
                    <img className="h-24 w-24 rounded-full" src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-medium text-gray-700">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                
                <div className="mb-6">
                  {getStatusBadge(user)}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {!user.isAdmin && (
                    <>
                      <Button
                        variant={user.isActive ? "danger" : "primary"}
                        onClick={handleToggleBan}
                        disabled={actionLoading === 'toggle-ban'}
                        className="w-full"
                      >
                        {actionLoading === 'toggle-ban' ? 'Đang xử lý...' : (user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản')}
                      </Button>
                      
                      <Button
                        variant="secondary"
                        onClick={handleMakeAdmin}
                        disabled={actionLoading === 'make-admin'}
                        className="w-full"
                      >
                        {actionLoading === 'make-admin' ? 'Đang xử lý...' : 'Cấp quyền Admin'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Basic Info */}
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <p className="text-sm text-gray-900">{user.phone || 'Chưa cập nhật'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiểu sử</label>
                  <p className="text-sm text-gray-900">{user.bio || 'Chưa cập nhật'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tham gia</label>
                  <p className="text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Xác thực email</label>
                  <p className="text-sm text-gray-900">
                    {user.emailVerified 
                      ? `Đã xác thực ${user.emailVerifiedAt ? `(${new Date(user.emailVerifiedAt).toLocaleDateString('vi-VN')})` : ''}`
                      : 'Chưa xác thực'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity */}
          <div className="lg:col-span-2">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{user.createdCourses.length}</div>
                  <div className="text-sm text-gray-600">Khóa học đã tạo</div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{user.enrolledCourses.length}</div>
                  <div className="text-sm text-gray-600">Khóa học đã học</div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {user.createdCourses.reduce((total, course) => total + course.students.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Tổng học viên</div>
                </div>
              </Card>
            </div>

            {/* Created Courses */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Khóa học đã tạo ({user.createdCourses.length})
              </h3>
              
              {user.createdCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa tạo khóa học nào</p>
              ) : (
                <div className="space-y-4">
                  {user.createdCourses.map((course) => (
                    <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getCourseStatusBadge(course.status)}
                          <span className="text-sm text-gray-500">
                            {course.students.length} học viên
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <Link to={`/admin/courses/${course._id}`}>
                        <Button size="sm" variant="outline">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Enrolled Courses */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Khóa học đã đăng ký ({user.enrolledCourses.length})
              </h3>
              
              {user.enrolledCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa đăng ký khóa học nào</p>
              ) : (
                <div className="space-y-4">
                  {user.enrolledCourses.map((enrollment) => (
                    <div key={enrollment.course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            Tiến độ: {enrollment.progress}%
                          </span>
                          <span className="text-sm text-gray-500">
                            Đăng ký: {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${enrollment.progress}%` }}
                          ></div>
                        </div>
                        <Link to={`/admin/courses/${enrollment.course._id}`}>
                          <Button size="sm" variant="outline">
                            Xem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
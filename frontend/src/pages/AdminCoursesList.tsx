import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import api from '../services/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  discount: number;
  duration: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  students: Array<{
    student: string;
    enrolledAt: Date;
    progress: number;
  }>;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

const AdminCoursesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, draft, pending, approved, rejected
    category: '',
    sort: 'newest'
  });

  const categories = [
    { value: '', label: 'Tất cả danh mục' },
    { value: 'programming', label: 'Lập trình' },
    { value: 'design', label: 'Thiết kế' },
    { value: 'business', label: 'Kinh doanh' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'language', label: 'Ngôn ngữ' },
    { value: 'science', label: 'Khoa học' },
    { value: 'other', label: 'Khác' }
  ];

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [user, pagination.page, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        sort: filters.sort,
        admin: true // Flag để backend trả về tất cả courses bao gồm draft
      };

      const response = await api.get('/admin/courses/all', { params });
      
      if (response.data.success) {
        setCourses(response.data.data.courses);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      await api.put(`/admin/courses/${courseId}/approve`);
      setCourses(prev => prev.map(course => 
        course._id === courseId 
          ? { ...course, status: 'approved', isPublished: true }
          : course
      ));
    } catch (error) {
      console.error('Lỗi khi duyệt khóa học:', error);
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      await api.put(`/admin/courses/${courseId}/reject`, { reason });
      setCourses(prev => prev.map(course => 
        course._id === courseId 
          ? { ...course, status: 'rejected', rejectionReason: reason }
          : course
      ));
    } catch (error) {
      console.error('Lỗi khi từ chối khóa học:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const ok = window.confirm('Bạn có chắc muốn xoá khóa học này? Hành động này không thể hoàn tác.');
    if (!ok) return;

    try {
      await api.delete(`/admin/courses/${courseId}`);
      // Remove from UI
      setCourses(prev => prev.filter(c => c._id !== courseId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (error) {
      console.error('Lỗi khi xoá khóa học:', error);
      alert('Xoá khóa học thất bại. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status: string) => {
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

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa học</h1>
              <p className="text-gray-600 mt-1">Danh sách tất cả khóa học trong hệ thống</p>
            </div>
            <Link to="/admin">
              <Button variant="outline">
                ← Quay lại Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tiêu đề khóa học..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Tất cả</option>
                <option value="draft">Nháp</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Bị từ chối</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price-high">Giá cao</option>
                <option value="price-low">Giá thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchCourses} className="w-full">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>

        {/* Courses List */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khóa học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(Array.isArray(courses) ? courses : []).map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {course.title.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {getCategoryLabel(course.category)} • {course.level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{course.instructor.name}</div>
                      <div className="text-sm text-gray-500">{course.instructor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(course.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.students.length} học viên
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(course.price || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/admin/courses/${course._id}`}>
                        <Button size="sm" variant="outline">
                          Chi tiết
                        </Button>
                      </Link>
                      {course.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveCourse(course._id)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectCourse(course._id)}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {/* Delete action available to admin always */}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteCourse(course._id)}
                      >
                        Xoá
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  variant="outline"
                >
                  Trước
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  variant="outline"
                >
                  Sau
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
                    {pagination.total} kết quả
                  </p>
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={pagination.page === page ? "primary" : "outline"}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminCoursesList;

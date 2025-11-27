import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui';
import api from '../services/api';
import resolveAvatar from '../utils/resolveAvatar';

interface Lesson {
  _id: string;
  title: string;
  duration: number;
  order: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: Date;
  progress: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail?: string;
  status: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lessons: Lesson[];
  students: Student[];
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
}

const AdminCourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
    if (id) {
      fetchCourseDetail();
    }
  }, [currentUser, id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/courses/${id}`);
      
      if (response.data.success) {
        setCourse(response.data.data.course);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết khóa học:', error);
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = () => {
    if (!course) return;
    setShowApproveDialog(true);
  };

  const confirmApproveCourse = async () => {
    if (!course) return;

    try {
      setIsProcessing(true);
      setActionLoading('approve');
      await api.put(`/admin/courses/${course._id}/approve`);
      setCourse(prev => prev ? { ...prev, status: 'approved', approvedAt: new Date() } : null);
      setShowApproveDialog(false);
    } catch (error) {
      console.error('Lỗi khi duyệt khóa học:', error);
    } finally {
      setActionLoading(null);
      setIsProcessing(false);
    }
  };

  const handleRejectCourse = async () => {
    if (!course || !rejectReason.trim()) return;

    try {
      setActionLoading('reject');
      await api.put(`/admin/courses/${course._id}/reject`, { reason: rejectReason });
      setCourse(prev => prev ? { 
        ...prev, 
        status: 'rejected', 
        rejectedAt: new Date(),
        rejectedReason: rejectReason
      } : null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Lỗi khi từ chối khóa học:', error);
    } finally {
      setActionLoading(null);
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
      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy khóa học</h1>
          <Link to="/admin/courses">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  const averageProgress = course.students.length > 0 
    ? course.students.reduce((total, student) => total + student.progress, 0) / course.students.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết khóa học</h1>
              <p className="text-gray-600 mt-1">Thông tin chi tiết và quản lý khóa học</p>
            </div>
            <Link to="/admin/courses">
              <Button variant="outline">
                ← Quay lại danh sách
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-start gap-6">
                {course.thumbnail && (
                  <div className="flex-shrink-0">
                    <img 
                      src={resolveAvatar(course.thumbnail) || undefined} 
                      alt={course.title}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
                    {getStatusBadge(course.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Danh mục:</span>
                      <p className="text-gray-900">{course.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Giá:</span>
                      <p className="text-gray-900">{formatPrice(course.price)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Bài học:</span>
                      <p className="text-gray-900">{course.lessons.length} bài</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tổng thời lượng:</span>
                      <p className="text-gray-900">{formatDuration(totalDuration)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            {course.status === 'pending' && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Duyệt khóa học</h3>
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={handleApproveCourse}
                    disabled={actionLoading === 'approve'}
                  >
                    {actionLoading === 'approve' ? 'Đang duyệt...' : 'Duyệt khóa học'}
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading === 'reject'}
                  >
                    Từ chối
                  </Button>
                </div>
              </Card>
            )}

            {/* Rejection Info */}
            {course.status === 'rejected' && course.rejectedReason && (
              <Card className="p-6 mb-6 border-red-200 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Lý do từ chối</h3>
                <p className="text-red-700">{course.rejectedReason}</p>
                {course.rejectedAt && (
                  <p className="text-sm text-red-600 mt-2">
                    Từ chối lúc: {new Date(course.rejectedAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </Card>
            )}

            {/* Lessons */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Danh sách bài học ({course.lessons.length})
              </h3>
              
              {course.lessons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có bài học nào</p>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(course.lessons) ? course.lessons : [])
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                    <div key={lesson._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <p className="text-sm text-gray-500">{formatDuration(lesson.duration)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Students */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Học viên ({course.students.length})
              </h3>
              
              {course.students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chưa có học viên nào</p>
              ) : (
                <div className="space-y-4">
                  {(Array.isArray(course.students) ? course.students : []).map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        {student.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={resolveAvatar(student.avatar) || undefined} alt={student.name || ''} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {student.name?.charAt(0) || 'N'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <p className="text-xs text-gray-400">
                            Đăng ký: {new Date(student.enrolledAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{student.progress}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <Link to={`/admin/users/${student._id}`}>
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
              
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{course.students.length}</div>
                  <div className="text-sm text-blue-800">Học viên</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{course.lessons.length}</div>
                  <div className="text-sm text-green-800">Bài học</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(averageProgress)}%</div>
                  <div className="text-sm text-purple-800">Tiến độ TB</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatDuration(totalDuration)}</div>
                  <div className="text-sm text-orange-800">Tổng thời lượng</div>
                </div>
              </div>
            </Card>

            {/* Instructor Info */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Giảng viên</h3>
              
              <div className="flex items-center gap-3 mb-4">
                {course.instructor.avatar ? (
                  <img className="h-12 w-12 rounded-full" src={resolveAvatar(course.instructor.avatar) || undefined} alt={course.instructor.name || ''} />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {course.instructor.name?.charAt(0) || 'I'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{course.instructor.name}</h4>
                  <p className="text-sm text-gray-500">{course.instructor.email}</p>
                </div>
              </div>
              
              <Link to={`/admin/users/${course.instructor._id}`}>
                <Button variant="outline" className="w-full">
                  Xem hồ sơ giảng viên
                </Button>
              </Link>
            </Card>

            {/* Course Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khóa học</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Ngày tạo:</span>
                  <p className="text-gray-900">{new Date(course.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Cập nhật:</span>
                  <p className="text-gray-900">{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
                
                {course.approvedAt && (
                  <div>
                    <span className="font-medium text-gray-700">Ngày duyệt:</span>
                    <p className="text-gray-900">{new Date(course.approvedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Từ chối khóa học</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối khóa học..."
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleRejectCourse}
                disabled={!rejectReason.trim() || actionLoading === 'reject'}
                className="flex-1"
              >
                {actionLoading === 'reject' ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={confirmApproveCourse}
        title="Xác nhận duyệt khóa học"
        message="Bạn có chắc muốn duyệt khóa học này? Khóa học sẽ được hiển thị công khai cho học viên."
        confirmText="Duyệt"
        cancelText="Huỷ"
        confirmVariant="primary"
        icon="question"
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default AdminCourseDetail;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui';
import { Card } from '../components/ui';
import { useToast } from '../context/ToastContext';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price?: number;
  finalPrice?: number;
  discount?: number;
  duration?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  totalStudents?: number; // Virtual count from backend
  createdAt: Date;
  progress?: number; // Add this line to fix the error
  instructor?: {
    name?: string;
    [key: string]: any;
  };
}

const MyCourses = () => {
  const toast = useToast();
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'enrolled'>('created');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);



  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      
      // Lấy khóa học đã tạo
      try {
        const response = await courseAPI.getMyCourses();
        console.log('Created Courses API Response:', response.data); // Debug log
        
        // Kiểm tra cấu trúc response
        const courses = response.data?.data?.courses || response.data?.courses || [];
        console.log('Parsed created courses:', courses);
        setCreatedCourses(courses);
      } catch (createdError) {
        console.error('Lỗi khi lấy khóa học đã tạo:', createdError);
        // Không có dữ liệu thì để trống
        setCreatedCourses([]);
      }
      
      // Lấy khóa học đã đăng ký
      try {
        const enrolledResponse = await courseAPI.getMyEnrolledCourses();
        console.log('Enrolled Courses API Response:', enrolledResponse.data);
        const enrolled = enrolledResponse.data?.data?.courses || enrolledResponse.data?.courses || [];
        console.log('Parsed enrolled courses:', enrolled);
        setEnrolledCourses(enrolled);
      } catch (enrolledError) {
        console.error('Lỗi khi lấy khóa học đã đăng ký:', enrolledError);
        // Không có dữ liệu thì để trống
        setEnrolledCourses([]);
      }
      
    } catch (error) {
      console.error('Lỗi chung khi lấy khóa học:', error);
      setCreatedCourses([]);
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (courseId: string) => {
    try {
      await courseAPI.submitCourseForApproval(courseId);
      toast.showToast({ type: 'success', title: 'Đã gửi khóa học để admin duyệt!' });
      fetchMyCourses(); // Refresh danh sách
    } catch (error: any) {
      console.error('Lỗi khi gửi khóa học để duyệt:', error);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi gửi khóa học để duyệt' });
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

  const renderCreatedCourses = () => {
    if (createdCourses.length === 0) {
      return (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có khóa học nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên
          </p>
          <Link to="/courses">
            <Button>
              Tạo khóa học mới
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(Array.isArray(createdCourses) ? createdCourses : []).map((course) => (
          <Card key={course._id} className="hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {course.title.charAt(0)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                {getStatusBadge(course.status)}
                <span className="text-xs text-gray-500">
                  {course.totalStudents || 0} học viên
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              {course.status === 'rejected' && course.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">
                    <strong>Lý do từ chối:</strong> {course.rejectionReason}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  {course.finalPrice?.toLocaleString('vi-VN') || 0}đ
                </span>
                <div className="flex gap-2">
                  <Link to={`/courses/${course._id}/lessons`}>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Quản lý bài học
                    </Button>
                  </Link>
                  {course.status === 'draft' && (
                    <Button 
                      size="sm"
                      onClick={() => handleSubmitForApproval(course._id)}
                    >
                      Gửi duyệt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderEnrolledCourses = () => {
    if (enrolledCourses.length === 0) {
      return (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa đăng ký khóa học nào
          </h3>
          <p className="text-gray-600 mb-6">
            Khám phá và đăng ký các khóa học để bắt đầu học tập
          </p>
          <Link to="/courses">
            <Button>
              Xem khóa học
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(Array.isArray(enrolledCourses) ? enrolledCourses : []).map((course) => (
          <Card key={course._id} className="hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-t-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {course.title.charAt(0)}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Đã đăng ký
                </span>
                <span className="text-xs text-gray-500">
                  {course.progress || 0}% hoàn thành
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Giảng viên: {course.instructor?.name || 'N/A'}
                </span>
                <Link to={`/courses/${course._id}`}>
                  <Button size="sm">
                    Tiếp tục học
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-12">
          <h1 className="text-4xl font-bold mb-4">Khóa học của tôi</h1>
          <p className="text-primary-100 text-lg">
            Quản lý khóa học bạn đã tạo và đang học
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Tabs */}
        <Card className="mb-8">
          <div className="flex">
            <button
              className={`px-6 py-4 font-medium rounded-tl-xl ${
                activeTab === 'created'
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('created')}
            >
              Khóa học đã tạo ({createdCourses.length})
            </button>
            <button
              className={`px-6 py-4 font-medium ${
                activeTab === 'enrolled'
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('enrolled')}
            >
              Khóa học đã đăng ký ({enrolledCourses.length})
            </button>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'created' ? renderCreatedCourses() : renderEnrolledCourses()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;

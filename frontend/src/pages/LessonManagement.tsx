import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseAPI, lessonAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content: string;
  contentType: 'text' | 'video' | 'pdf' | 'quiz';
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image' | 'link' | 'other';
  }>;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    _id: string;
    name: string;
  };
  category: string;
  level: string;
  price: number;
  finalPrice: number;
  discount: number;
  duration: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  students: Array<{
    student: string;
    enrolledAt: Date;
    progress: number;
  }>;
  lessons: string[];
}

const LessonManagement = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    contentType: 'text' as 'text' | 'video' | 'pdf' | 'quiz',
    videoUrl: '',
    duration: 30,
    order: 1,
    isPreview: false,
    resources: [] as Array<{
      name: string;
      url: string;
      type: 'pdf' | 'doc' | 'image' | 'link' | 'other';
    }>
  });

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await courseAPI.getCourse(courseId!);
      const courseData = courseResponse.data.data.course;
      setCourse(courseData);

      // Check if user is instructor or admin
      if (!user?.isAdmin && courseData.instructor._id !== user?._id) {
        navigate('/my-courses');
        return;
      }

      // Fetch lessons
      const lessonsResponse = await lessonAPI.getLessonsByCourse(courseId!);
      setLessons(lessonsResponse.data.data.lessons || []);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceAdd = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { name: '', url: '', type: 'other' }]
    }));
  };

  const handleResourceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const handleResourceRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      contentType: 'text',
      videoUrl: '',
      duration: 30,
      order: lessons.length + 1,
      isPreview: false,
      resources: []
    });
    setEditingLesson(null);
    setShowCreateForm(false);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      
      const lessonData = {
        ...formData,
        resources: formData.resources.filter(r => r.name && r.url)
      };

      await lessonAPI.createLesson(courseId!, lessonData);
      
      // Refresh lessons list
      const lessonsResponse = await lessonAPI.getLessonsByCourse(courseId!);
      setLessons(lessonsResponse.data.data.lessons || []);
      
      resetForm();
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài học');
    } finally {
      setCreating(false);
    }
  };

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLesson) return;

    try {
      setCreating(true);
      
      const lessonData = {
        ...formData,
        resources: formData.resources.filter(r => r.name && r.url)
      };

      await lessonAPI.updateLesson(editingLesson._id, lessonData);
      
      // Refresh lessons list
      const lessonsResponse = await lessonAPI.getLessonsByCourse(courseId!);
      setLessons(lessonsResponse.data.data.lessons || []);
      
      resetForm();
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài học');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lessonTitle}"?`)) {
      return;
    }

    try {
      await lessonAPI.deleteLesson(lessonId);
      
      // Refresh lessons list
      const lessonsResponse = await lessonAPI.getLessonsByCourse(courseId!);
      setLessons(lessonsResponse.data.data.lessons || []);
      
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa bài học');
    }
  };

  const startEdit = (lesson: Lesson) => {
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content,
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      order: lesson.order,
      isPreview: lesson.isPreview,
      resources: lesson.resources || []
    });
    setEditingLesson(lesson);
    setShowCreateForm(true);
  };

  const getContentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      text: 'Bài đọc',
      video: 'Video',
      pdf: 'Tài liệu PDF',
      quiz: 'Bài kiểm tra'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không thể tải khóa học</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/my-courses">
            <Button>Quay lại khóa học của tôi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Quản lý bài học</h1>
              <p className="text-primary-100 text-lg mb-2">{course.title}</p>
              <Link to={`/my-courses`} className="text-primary-200 hover:text-white transition-colors">
                ← Quay lại khóa học của tôi
              </Link>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">{lessons.length}</div>
              <div className="text-primary-200">bài học</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Danh sách bài học</h2>
                  
                  {!showCreateForm && (
                    <Button
                      onClick={() => {
                        resetForm();
                        setShowCreateForm(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Thêm bài học mới
                    </Button>
                  )}
                </div>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-gray-200">
                {lessons.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl text-gray-300 mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài học nào</h3>
                    <p className="text-gray-600 mb-6">
                      Hãy tạo bài học đầu tiên cho khóa học của bạn
                    </p>
                    <Button
                      onClick={() => {
                        resetForm();
                        setShowCreateForm(true);
                      }}
                    >
                      Tạo bài học đầu tiên
                    </Button>
                  </div>
                ) : (
                  lessons.map((lesson) => (
                    <div key={lesson._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold">
                              {lesson.order}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lesson.title}
                            </h3>
                            {lesson.isPreview && (
                              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                MIỄN PHÍ
                              </span>
                            )}
                          </div>
                          
                          {lesson.description && (
                            <p className="text-gray-600 mb-3">{lesson.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {lesson.duration} phút
                            </div>
                            
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                              {getContentTypeLabel(lesson.contentType)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => startEdit(lesson)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Create/Edit Form */}
          <div className="lg:col-span-1">
            {showCreateForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingLesson ? handleEditLesson : handleCreateLesson} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề bài học *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Nhập tiêu đề bài học"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Mô tả ngắn về bài học"
                    />
                  </div>

                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại nội dung *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.contentType}
                      onChange={(e) => handleInputChange('contentType', e.target.value)}
                    >
                      <option value="text">Bài đọc</option>
                      <option value="video">Video</option>
                      <option value="pdf">Tài liệu PDF</option>
                      <option value="quiz">Bài kiểm tra</option>
                    </select>
                  </div>

                  {/* Video URL */}
                  {formData.contentType === 'video' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL Video
                      </label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung bài học *
                    </label>
                    <textarea
                      rows={6}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Nhập nội dung chi tiết của bài học..."
                    />
                  </div>

                  {/* Duration & Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời lượng (phút) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thứ tự *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.order}
                        onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Is Preview */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPreview"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={formData.isPreview}
                      onChange={(e) => handleInputChange('isPreview', e.target.checked)}
                    />
                    <label htmlFor="isPreview" className="text-sm font-medium text-gray-700">
                      Cho phép xem trước miễn phí
                    </label>
                  </div>

                  {/* Resources */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tài liệu đính kèm
                      </label>
                      <button
                        type="button"
                        onClick={handleResourceAdd}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Thêm tài liệu
                      </button>
                    </div>
                    
                    {formData.resources.map((resource, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Tên tài liệu"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          value={resource.name}
                          onChange={(e) => handleResourceChange(index, 'name', e.target.value)}
                        />
                        <input
                          type="url"
                          placeholder="URL"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          value={resource.url}
                          onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                        />
                        <select
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          value={resource.type}
                          onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">DOC</option>
                          <option value="image">Hình ảnh</option>
                          <option value="link">Link</option>
                          <option value="other">Khác</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleResourceRemove(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating 
                        ? 'Đang xử lý...' 
                        : editingLesson 
                          ? 'Cập nhật bài học' 
                          : 'Tạo bài học'
                      }
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonManagement;
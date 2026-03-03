import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, lessonAPI, reviewAPI, discussionAPI, sectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface CourseSection {
  _id: string;
  title: string;
  description?: string;
  order: number;
}

interface LessonSectionRef {
  _id: string;
  title: string;
  order: number;
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  contentType: 'text' | 'video' | 'pdf' | 'quiz';
  videoUrl?: string;
  video?: {
    secureUrl: string;
    thumbnailUrl?: string;
  };
  duration: number;
  order: number;
  isPreview: boolean;
  section?: LessonSectionRef | string | null;
  resources?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image' | 'link' | 'other';
  }>;
  completedBy: Array<{
    student: string;
    completedAt: Date;
  }>;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor?: {
    _id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: string;
  level: string;
  price?: number;
  finalPrice?: number;
  discount?: number;
  duration?: number;
  rating?: {
    average: number;
    count: number;
  };
  totalStudents?: number; // Virtual count from backend
  lessons?: string[];
  requirements?: string[];
  whatYouWillLearn?: string[];
  isPublished?: boolean;
  status: string;
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userProgress, setUserProgress] = useState(0);
  const [enrollmentLastLessonId, setEnrollmentLastLessonId] = useState<string | null>(null);

  const getResumeLessonId = () => {
    if (!id) return null;

    if (enrollmentLastLessonId && lessons.some((l) => l._id === enrollmentLastLessonId)) {
      return enrollmentLastLessonId;
    }

    const stored = localStorage.getItem(`elearning:lastLesson:${id}`);
    if (stored && lessons.some((l) => l._id === stored)) return stored;
    const firstAccessible = lessons.find((l) => l.isPreview || isEnrolled);
    return firstAccessible?._id || null;
  };
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'lessons' | 'reviews' | 'discussions'>('lessons');
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  
  // Discussions state
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '', category: 'general' });
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course details
      console.log('Fetching course details for ID:', id);
      const courseResponse = await courseAPI.getCourse(id!);
      console.log('Course response:', courseResponse.data);
      
      // Handle different response structures
      let courseData;
      if (courseResponse.data.success && courseResponse.data.data) {
        courseData = courseResponse.data.data.course || courseResponse.data.data;
      } else {
        courseData = courseResponse.data;
      }
      
      if (!courseData) {
        throw new Error('Không tìm thấy thông tin khóa học');
      }
      
      setCourse(courseData);

      // Check enrollment from backend (Enrollment = source of truth)
      if (user) {
        try {
          const enrollmentResponse = await courseAPI.getMyCourseEnrollment(id!);
          const enrollmentData = enrollmentResponse.data?.success && enrollmentResponse.data?.data
            ? enrollmentResponse.data.data.enrollment
            : null;

          if (enrollmentData) {
            setIsEnrolled(true);
            setUserProgress(enrollmentData.progress || 0);
            setEnrollmentLastLessonId(enrollmentData.lastLessonId || null);
          } else {
            setIsEnrolled(false);
            setUserProgress(0);
            setEnrollmentLastLessonId(null);
          }
        } catch {
          setIsEnrolled(false);
          setUserProgress(0);
          setEnrollmentLastLessonId(null);
        }
      }

      // Fetch lessons
      try {
        console.log('Fetching lessons for course:', id);
        const lessonsResponse = await lessonAPI.getLessonsByCourse(id!);
        console.log('Lessons response:', lessonsResponse.data);
        
        let lessonsData: Lesson[] = [];
        if (lessonsResponse.data.success && lessonsResponse.data.data) {
          lessonsData = lessonsResponse.data.data.lessons || lessonsResponse.data.data || [];
        } else if (Array.isArray(lessonsResponse.data)) {
          lessonsData = lessonsResponse.data;
        }
        
        setLessons(lessonsData);
      } catch (lessonError) {
        console.error('Error fetching lessons:', lessonError);
        // Don't fail the whole page if lessons fail to load
        setLessons([]);
      }

      // Fetch sections (optional - used for curriculum grouping)
      try {
        const sectionsResponse = await sectionAPI.getSectionsByCourse(id!);
        const data = sectionsResponse.data;
        const sectionsData: CourseSection[] = data?.success && data?.data
          ? (data.data.sections || data.data || [])
          : [];
        setSections(sectionsData);
      } catch (sectionError) {
        console.error('Error fetching sections:', sectionError);
        setSections([]);
      }

    } catch (error: any) {
      console.error('Error in fetchCourseData:', error);
      setError(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await reviewAPI.getReviewsByCourse(id, { page: 1, limit: 50 });
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        const myReview = response.data.data.reviews?.find((r: any) => r.user?._id === user?._id);
        setUserReview(myReview);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch discussions
  const fetchDiscussions = async () => {
    if (!id) return;
    try {
      setDiscussionsLoading(true);
      const response = await discussionAPI.getDiscussionsByCourse(id, { page: 1, limit: 50 });
      if (response.data.success) {
        setDiscussions(response.data.data.discussions || []);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'discussions') {
      fetchDiscussions();
    }
  }, [activeTab, id]);

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim() || !isEnrolled) {
      toast.showToast({ type: 'error', title: 'Vui lòng nhập nội dung đánh giá' });
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewAPI.createReview({
        courseId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      
      toast.showToast({ type: 'success', title: 'Đã gửi đánh giá thành công!' });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi khi gửi đánh giá' });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit discussion
  const handleSubmitDiscussion = async () => {
    if (!discussionForm.title.trim() || !discussionForm.content.trim()) {
      toast.showToast({ type: 'error', title: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    try {
      setSubmittingDiscussion(true);
      await discussionAPI.createDiscussion({
        courseId: id,
        title: discussionForm.title,
        content: discussionForm.content,
        category: discussionForm.category
      });
      
      toast.showToast({ type: 'success', title: 'Đã tạo thảo luận thành công!' });
      setShowDiscussionForm(false);
      setDiscussionForm({ title: '', content: '', category: 'general' });
      fetchDiscussions();
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi khi tạo thảo luận' });
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (discussionId: string) => {
    if (!replyContent.trim()) {
      toast.showToast({ type: 'error', title: 'Vui lòng nhập nội dung trả lời' });
      return;
    }

    try {
      await discussionAPI.replyToDiscussion(discussionId, replyContent);
      toast.showToast({ type: 'success', title: 'Đã gửi trả lời!' });
      setReplyContent('');
      fetchDiscussions();
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi khi gửi trả lời' });
    }
  };

  // Toggle like discussion
  const handleLikeDiscussion = async (discussionId: string) => {
    try {
      await discussionAPI.likeDiscussion(discussionId);
      fetchDiscussions();
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      await courseAPI.enrollCourse(id!);
      setIsEnrolled(true);
      setUserProgress(0);
      
      // Reload lessons to get full access
      const lessonsResponse = await lessonAPI.getLessonsByCourse(id!);
      setLessons(lessonsResponse.data.data.lessons);
      
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký khóa học' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonOpen = (lesson: Lesson) => {
    if (!lesson.isPreview && !isEnrolled) {
      toast.showToast({ type: 'warning', title: 'Bạn cần đăng ký khóa học để xem bài học này' });
      return;
    }

    navigate(`/courses/${id}/learn/${lesson._id}`);
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!isEnrolled || !user) return;

    try {
      const response = await lessonAPI.completeLesson(lessonId);
      const { progress } = response.data.data;
      
      setUserProgress(progress);
      
      // Update lesson completion status
      setLessons(prev => prev.map(lesson => {
        if (lesson._id === lessonId) {
          return {
            ...lesson,
            completedBy: [
              ...lesson.completedBy.filter(c => c.student !== user._id),
              { student: user._id, completedAt: new Date() }
            ]
          };
        }
        return lesson;
      }));
      
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi đánh dấu hoàn thành' });
    }
  };

  const handleUncompleteLesson = async (lessonId: string) => {
    if (!isEnrolled || !user) return;

    try {
      const response = await lessonAPI.uncompleteLesson(lessonId);
      const { progress } = response.data.data;
      
      setUserProgress(progress);
      
      // Update lesson completion status
      setLessons(prev => prev.map(lesson => {
        if (lesson._id === lessonId) {
          return {
            ...lesson,
            completedBy: lesson.completedBy.filter(c => c.student !== user._id)
          };
        }
        return lesson;
      }));
      
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi hủy hoàn thành' });
    }
  };

  const isLessonCompleted = (lesson: Lesson) => {
    return lesson.completedBy.some(completion => completion.student === user?._id);
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      programming: 'Lập trình',
      design: 'Thiết kế',
      business: 'Kinh doanh',
      marketing: 'Marketing',
      language: 'Ngôn ngữ',
      science: 'Khoa học',
      other: 'Khác'
    };
    return categories[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return levels[level] || level;
  };

  const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const lessonsBySectionId = lessons.reduce(
    (acc, lesson) => {
      const sectionObj = typeof lesson.section === 'object' && lesson.section ? (lesson.section as LessonSectionRef) : null;
      const sectionKey = sectionObj?._id || (typeof lesson.section === 'string' ? lesson.section : null);
      if (!sectionKey) {
        acc.unassigned.push(lesson);
      } else {
        if (!acc.map[sectionKey]) acc.map[sectionKey] = [];
        acc.map[sectionKey].push(lesson);
      }
      return acc;
    },
    { map: {} as Record<string, Lesson[]>, unassigned: [] as Lesson[] }
  );

  Object.values(lessonsBySectionId.map).forEach((list) => list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  lessonsBySectionId.unassigned.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy khóa học</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/courses">
            <Button>Quay lại danh sách khóa học</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {getCategoryLabel(course.category || 'other')}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {getLevelLabel(course.level || 'beginner')}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{course.title || 'Khóa học'}</h1>
              <p className="text-primary-100 text-lg mb-6">{course.description || 'Mô tả khóa học'}</p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium">
                      {course.instructor?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{course.instructor?.name || 'Giảng viên'}</p>
                    <p className="text-primary-100 text-sm">Giảng viên</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-white">
                    {course.rating?.average?.toFixed(1) || '0.0'} ({course.rating?.count || 0} đánh giá)
                  </span>
                </div>
                
                <div className="text-sm">
                  <span className="text-white">
                    {course.totalStudents || 0} học viên
                  </span>
                </div>
              </div>
            </div>
            
            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg p-6 text-gray-900">
                <div className="text-center mb-6">
                  {(course.discount || 0) > 0 && (
                    <p className="text-gray-500 line-through text-lg mb-1">
                      {course.price?.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                  <p className="text-3xl font-bold text-primary-600">
                    {course.finalPrice?.toLocaleString('vi-VN')}đ
                  </p>
                  {(course.finalPrice || 0) === 0 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      MIỄN PHÍ
                    </span>
                  )}
                </div>
                
                {isEnrolled ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Tiến độ học tập</p>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${userProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-green-600">{userProgress}% hoàn thành</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 font-medium text-sm">
                        ✅ Bạn đã đăng ký khóa học này
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        const resumeId = getResumeLessonId();
                        if (!resumeId) {
                          toast.showToast({ type: 'warning', title: 'Khóa học chưa có bài học nào' });
                          return;
                        }
                        navigate(`/courses/${id}/learn/${resumeId}`);
                      }}
                      className="w-full mt-4"
                    >
                      ▶ Tiếp tục học
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Nút Thanh toán cho khóa học có phí */}
                    {(course.finalPrice || 0) > 0 ? (
                      <>
                        <Button
                          onClick={() => navigate(`/payment/checkout/${id}`)}
                          className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          💳 Thanh toán ngay
                        </Button>
                        <p className="text-center text-xs text-gray-500">
                          Thanh toán an toàn • Hoàn tiền 30 ngày
                        </p>
                      </>
                    ) : (
                      /* Nút Đăng ký miễn phí */
                      <Button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full text-lg py-3"
                      >
                        {enrolling ? 'Đang đăng ký...' : '🎉 Đăng ký miễn phí'}
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{course.duration || 0} phút</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span>{lessons.length} bài học</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <span>Truy cập trọn đời</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container-custom py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lessons'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Bài học ({lessons.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⭐ Đánh giá ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discussions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💬 Thảo luận ({discussions.length})
            </button>
          </nav>
        </div>

        {activeTab === 'lessons' && (
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nội dung khóa học</h3>
                {!isEnrolled && (
                  <p className="text-sm text-gray-600 mt-1">Bạn chỉ xem được các bài miễn phí (Preview).</p>
                )}
              </div>

              {lessons.length > 0 && (
                <Button
                  onClick={() => {
                    const firstAccessible = lessons.find((l) => l.isPreview || isEnrolled);
                    if (firstAccessible) handleLessonOpen(firstAccessible);
                    else toast.showToast({ type: 'warning', title: 'Chưa có bài học xem trước' });
                  }}
                >
                  Bắt đầu học
                </Button>
              )}
            </div>

            <div className="space-y-5">
              {sortedSections.map((section) => {
                const list = lessonsBySectionId.map[section._id] || [];
                return (
                  <div key={section._id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{section.title}</h4>
                        {section.description && <p className="text-sm text-gray-600">{section.description}</p>}
                      </div>
                      <span className="text-sm text-gray-500">{list.length} bài</span>
                    </div>

                    {list.length === 0 ? (
                      <div className="mt-2 text-sm text-gray-500">Chưa có bài học</div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {list.map((lesson) => (
                          <div
                            key={lesson._id}
                            className={`p-3 rounded-lg border transition-all ${
                              !lesson.isPreview && !isEnrolled ? 'opacity-50' : 'hover:border-gray-300'
                            } border-gray-200`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {!lesson.isPreview && !isEnrolled && (
                                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {lesson.isPreview && <span className="text-xs text-green-600 font-medium">MIỄN PHÍ</span>}
                                  <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                                </div>
                                <div className="font-medium text-gray-900 truncate">{lesson.title}</div>
                                {lesson.description && <div className="text-sm text-gray-600 truncate">{lesson.description}</div>}
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {isEnrolled && (
                                  <button
                                    onClick={() => (isLessonCompleted(lesson) ? handleUncompleteLesson(lesson._id) : handleCompleteLesson(lesson._id))}
                                    className={isLessonCompleted(lesson) ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}
                                    title={isLessonCompleted(lesson) ? 'Hủy hoàn thành' : 'Đánh dấu hoàn thành'}
                                  >
                                    {isLessonCompleted(lesson) ? '✓' : '○'}
                                  </button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleLessonOpen(lesson)}
                                  disabled={!lesson.isPreview && !isEnrolled}
                                >
                                  Xem bài
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {lessonsBySectionId.unassigned.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900">Chưa phân loại</h4>
                  <div className="mt-3 space-y-2">
                    {lessonsBySectionId.unassigned.map((lesson) => (
                      <div
                        key={lesson._id}
                        className={`p-3 rounded-lg border transition-all ${
                          !lesson.isPreview && !isEnrolled ? 'opacity-50' : 'hover:border-gray-300'
                        } border-gray-200`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {lesson.isPreview && <span className="text-xs text-green-600 font-medium">MIỄN PHÍ</span>}
                              <span className="text-xs text-gray-500">{lesson.duration} phút</span>
                            </div>
                            <div className="font-medium text-gray-900 truncate">{lesson.title}</div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleLessonOpen(lesson)}
                            disabled={!lesson.isPreview && !isEnrolled}
                          >
                            Xem bài
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sortedSections.length === 0 && lessons.length === 0 && (
                <div className="text-center py-10 text-gray-600">Chưa có bài học nào.</div>
              )}
            </div>
          </Card>
        </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl mx-auto">
            {/* Review Actions */}
            {!isEnrolled ? (
              <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
                <div className="text-center">
                  <p className="text-blue-900 mb-4">
                    🔒 Bạn cần đăng ký khóa học để viết đánh giá
                  </p>
                  <Button onClick={() => navigate(`/payment/checkout/${id}`)} className="bg-blue-600 hover:bg-blue-700">
                    Đăng ký ngay
                  </Button>
                </div>
              </Card>
            ) : userReview ? (
              <Card className="p-6 mb-6 bg-green-50 border-green-200">
                <p className="text-green-900 text-center">
                  ✅ Bạn đã đánh giá khóa học này
                </p>
              </Card>
            ) : (
              <Card className="p-6 mb-6">
                {!showReviewForm ? (
                  <Button onClick={() => setShowReviewForm(true)} className="w-full">
                    ✍️ Viết đánh giá của bạn
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Đánh giá khóa học</h3>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Đánh giá:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none"
                        >
                          <svg
                            className={`w-8 h-8 ${
                              star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({reviewForm.rating} sao)</span>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhận xét của bạn
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Chia sẻ trải nghiệm của bạn về khóa học..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="flex-1"
                      >
                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewForm({ rating: 5, comment: '' });
                        }}
                        variant="outline"
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tải đánh giá...</p>
              </div>
            ) : reviews.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl text-gray-300 mb-4">⭐</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đánh giá</h3>
                <p className="text-gray-600">Hãy là người đầu tiên đánh giá khóa học này!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review._id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-semibold">
                          {review.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{review.user?.name || 'Ẩn danh'}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                        
                        {review.helpful?.length > 0 && (
                          <div className="mt-3 text-sm text-gray-500">
                            👍 {review.helpful.length} người thấy hữu ích
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="max-w-4xl mx-auto">
            {/* Discussion Actions */}
            {isEnrolled && (
              <Card className="p-6 mb-6">
                {!showDiscussionForm ? (
                  <Button onClick={() => setShowDiscussionForm(true)} className="w-full">
                    💬 Tạo thảo luận mới
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tạo thảo luận mới</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        value={discussionForm.title}
                        onChange={(e) => setDiscussionForm({ ...discussionForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nhập tiêu đề thảo luận..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục
                      </label>
                      <select
                        value={discussionForm.category}
                        onChange={(e) => setDiscussionForm({ ...discussionForm, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="general">Chung</option>
                        <option value="question">Câu hỏi</option>
                        <option value="announcement">Thông báo</option>
                        <option value="technical">Kỹ thuật</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung
                      </label>
                      <textarea
                        value={discussionForm.content}
                        onChange={(e) => setDiscussionForm({ ...discussionForm, content: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nhập nội dung thảo luận..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSubmitDiscussion}
                        disabled={submittingDiscussion}
                        className="flex-1"
                      >
                        {submittingDiscussion ? 'Đang tạo...' : 'Tạo thảo luận'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowDiscussionForm(false);
                          setDiscussionForm({ title: '', content: '', category: 'general' });
                        }}
                        variant="outline"
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Discussions List */}
            {discussionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tải thảo luận...</p>
              </div>
            ) : discussions.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl text-gray-300 mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có thảo luận</h3>
                <p className="text-gray-600">Hãy là người đầu tiên tạo thảo luận!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion: any) => (
                  <Card key={discussion._id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-semibold">
                          {discussion.author?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{discussion.title}</h4>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {discussion.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {discussion.author?.name} • {new Date(discussion.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 whitespace-pre-wrap mb-3">{discussion.content}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <button
                            onClick={() => handleLikeDiscussion(discussion._id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-primary-600"
                          >
                            👍 {discussion.likes?.length || 0}
                          </button>
                          <button
                            onClick={() => setSelectedDiscussion(
                              selectedDiscussion?._id === discussion._id ? null : discussion
                            )}
                            className="text-gray-600 hover:text-primary-600"
                          >
                            💬 {discussion.replies?.length || 0} trả lời
                          </button>
                          <span className="text-gray-500">👁 {discussion.views || 0} lượt xem</span>
                        </div>

                        {/* Replies */}
                        {selectedDiscussion?._id === discussion._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Reply Form */}
                            {isEnrolled && (
                              <div className="mb-4">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                  placeholder="Viết trả lời..."
                                />
                                <Button
                                  onClick={() => handleSubmitReply(discussion._id)}
                                  size="sm"
                                  className="mt-2"
                                >
                                  Gửi trả lời
                                </Button>
                              </div>
                            )}

                            {/* Replies List */}
                            {discussion.replies?.map((reply: any) => (
                              <div key={reply._id} className="flex gap-3 mb-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-600 text-sm">
                                    {reply.author?.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {reply.author?.name || 'Ẩn danh'}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">{reply.content}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Course Details Sections */}
        {activeTab === 'lessons' && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bạn sẽ học được gì */}
          {course.whatYouWillLearn && (Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn.length > 0 : false) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bạn sẽ học được gì</h3>
              <ul className="space-y-2">
                {(Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Requirements */}
          {course.requirements && (Array.isArray(course.requirements) ? course.requirements.length > 0 : false) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu</h3>
              <ul className="space-y-2">
                {(Array.isArray(course.requirements) ? course.requirements : []).map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;

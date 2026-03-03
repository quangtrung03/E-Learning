import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { courseAPI, lessonAPI, sectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import resolveFileUrl from '../utils/resolveFileUrl';

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
    secureUrl?: string;
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
  instructor?: {
    _id: string;
  };
}

interface EnrollmentInfo {
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  progress: number;
  lastAccessedAt?: string;
  lastLessonId?: string | null;
  lastLessonAccessedAt?: string | null;
}

const LessonViewer = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);

  const isEnrolled = useMemo(() => {
    if (enrollment) return true;
    if (!user || !courseId) return false;
    const enrolledCourses = (user as any).enrolledCourses;
    if (!Array.isArray(enrolledCourses)) return false;
    return enrolledCourses.some((enrollment: any) => enrollment?.course === courseId || enrollment?.course?._id === courseId);
  }, [enrollment, user, courseId]);

  const isInstructorOrAdmin = useMemo(() => {
    const userId = (user as any)?._id;
    if (!userId) return false;
    if ((user as any)?.isAdmin) return true;
    const instructorId = (course as any)?.instructor?._id;
    return Boolean(instructorId && instructorId === userId);
  }, [user, course]);

  const isLessonCompleted = (lesson: Lesson) => {
    const userId = (user as any)?._id;
    if (!userId) return false;
    return Array.isArray(lesson.completedBy) && lesson.completedBy.some((completion) => completion.student === userId);
  };

  const canAccessLesson = (lesson: Lesson) => {
    return lesson.isPreview || isEnrolled || isInstructorOrAdmin;
  };

  const contentTypeLabel = (contentType: Lesson['contentType']) => {
    if (contentType === 'text') return 'Bài đọc';
    if (contentType === 'video') return 'Video';
    if (contentType === 'pdf') return 'Tài liệu PDF';
    return 'Bài kiểm tra';
  };

  const loadBaseData = async () => {
    if (!courseId) return;

    try {
      setPageLoading(true);

      const [courseResponse, lessonsResponse, sectionsResponse, enrollmentResponse] = await Promise.allSettled([
        courseAPI.getCourse(courseId),
        lessonAPI.getLessonsByCourse(courseId),
        sectionAPI.getSectionsByCourse(courseId),
        user ? courseAPI.getMyCourseEnrollment(courseId) : Promise.reject(new Error('no-user'))
      ]);

      if (courseResponse.status === 'fulfilled') {
        const data = courseResponse.value.data;
        const courseData = data?.success && data?.data ? data.data.course || data.data : data;
        setCourse(courseData);
      }

      if (lessonsResponse.status === 'fulfilled') {
        const data = lessonsResponse.value.data;
        const lessonsData = data?.success && data?.data ? data.data.lessons || [] : Array.isArray(data) ? data : [];
        setLessons(lessonsData);
      }

      if (sectionsResponse.status === 'fulfilled') {
        const data = sectionsResponse.value.data;
        const sectionsData = data?.success && data?.data ? data.data.sections || data.data || [] : [];
        setSections(sectionsData);
      }

      if (enrollmentResponse.status === 'fulfilled') {
        const data = enrollmentResponse.value.data;
        const enrollmentData = data?.success && data?.data ? data.data.enrollment : null;
        setEnrollment(enrollmentData);
      } else {
        setEnrollment(null);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const loadLesson = async (id: string) => {
    try {
      setLessonLoading(true);
      const response = await lessonAPI.getLesson(id);
      const lessonData = response.data?.success && response.data?.data ? response.data.data.lesson || response.data.data : response.data;
      setCurrentLesson(lessonData);

      if (courseId) {
        localStorage.setItem(`elearning:lastLesson:${courseId}`, id);

        // Đồng bộ resume đa thiết bị (Enrollment là nguồn truth)
        if (isEnrolled) {
          try {
            await courseAPI.updateMyLastLesson(courseId, id);
          } catch {
            // Ignore: không chặn UX nếu backend chưa sẵn sàng / không enrolled
          }
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải bài học';
      toast.showToast({ type: 'error', title: message });

      const requireEnrollment = error?.response?.data?.requireEnrollment;
      if (requireEnrollment && courseId) {
        navigate(`/courses/${courseId}`);
      }
    } finally {
      setLessonLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const normalizedSections = useMemo(() => {
    return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [sections]);

  const lessonsBySectionId = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    const unassigned: Lesson[] = [];

    for (const lesson of lessons) {
      const sectionObj = typeof lesson.section === 'object' && lesson.section ? (lesson.section as LessonSectionRef) : null;
      const sectionKey = sectionObj?._id || (typeof lesson.section === 'string' ? lesson.section : null);

      if (!sectionKey) {
        unassigned.push(lesson);
        continue;
      }

      if (!map.has(sectionKey)) map.set(sectionKey, []);
      map.get(sectionKey)!.push(lesson);
    }

    for (const [key, list] of map) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      map.set(key, list);
    }

    unassigned.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return { map, unassigned };
  }, [lessons]);

  const orderedLessons = useMemo(() => {
    const all = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return all;
  }, [lessons]);

  const currentIndex = useMemo(() => {
    if (!lessonId) return -1;
    return orderedLessons.findIndex((l) => l._id === lessonId);
  }, [orderedLessons, lessonId]);

  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  const goToLesson = (lesson: Lesson) => {
    if (!courseId) return;
    if (!canAccessLesson(lesson)) {
      toast.showToast({ type: 'warning', title: 'Bạn cần đăng ký khóa học để xem bài học này' });
      return;
    }
    navigate(`/courses/${courseId}/learn/${lesson._id}`);
  };

  const handleCompleteToggle = async () => {
    if (!currentLesson) return;
    if (!isEnrolled) {
      toast.showToast({ type: 'warning', title: 'Bạn cần đăng ký khóa học để đánh dấu hoàn thành' });
      return;
    }

    try {
      const userId = (user as any)?._id;
      const completed = isLessonCompleted(currentLesson);
      const response = completed
        ? await lessonAPI.uncompleteLesson(currentLesson._id)
        : await lessonAPI.completeLesson(currentLesson._id);

      const progress = response?.data?.data?.progress;
      if (typeof progress === 'number') {
        toast.showToast({ type: 'success', title: `Tiến độ: ${progress}%` });
      }

      setLessons((prev) =>
        prev.map((l) => {
          if (l._id !== currentLesson._id) return l;

          if (completed) {
            return { ...l, completedBy: l.completedBy.filter((c) => c.student !== userId) };
          }

          return {
            ...l,
            completedBy: [...l.completedBy.filter((c) => c.student !== userId), { student: userId, completedAt: new Date() }]
          };
        })
      );

      setCurrentLesson((prev) => {
        if (!prev) return prev;
        if (prev._id !== currentLesson._id) return prev;

        if (completed) {
          return { ...prev, completedBy: prev.completedBy.filter((c) => c.student !== userId) };
        }

        return {
          ...prev,
          completedBy: [...prev.completedBy.filter((c) => c.student !== userId), { student: userId, completedAt: new Date() }]
        };
      });
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error?.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  if (!courseId || !lessonId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold">Thiếu thông tin bài học</h2>
          <p className="text-gray-600 mt-2">Vui lòng quay lại khóa học và chọn một bài học.</p>
        </Card>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={`/courses/${courseId}`} className="text-sm text-primary-600 hover:text-primary-700">
              ← Quay lại khóa học
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{course?.title || 'Khóa học'}</h1>
          </div>

          <div className="flex items-center gap-3">
            {isEnrolled ? (
              <Button onClick={handleCompleteToggle} variant={currentLesson && isLessonCompleted(currentLesson) ? 'outline' : 'primary'}>
                {currentLesson && isLessonCompleted(currentLesson) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </Button>
            ) : (
              <Button onClick={() => navigate(`/payment/checkout/${courseId}`)} className="bg-green-600 hover:bg-green-700">
                Đăng ký khóa học
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar curriculum */}
          <div className="lg:col-span-1">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nội dung khóa học</h3>

              {!isEnrolled && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  🔒 Bạn chỉ xem được các bài miễn phí (Preview).
                </div>
              )}

              <div className="space-y-4">
                {normalizedSections.map((section) => {
                  const list = lessonsBySectionId.map.get(section._id) || [];
                  return (
                    <div key={section._id}>
                      <div className="text-sm font-semibold text-gray-800 mb-2">{section.title}</div>
                      {list.length === 0 ? (
                        <div className="text-xs text-gray-500 mb-2">Chưa có bài học</div>
                      ) : (
                        <div className="space-y-2">
                          {list.map((lesson) => {
                            const active = lesson._id === lessonId;
                            const locked = !canAccessLesson(lesson);
                            return (
                              <button
                                key={lesson._id}
                                onClick={() => goToLesson(lesson)}
                                disabled={locked}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                                } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2">
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
                                      <span className="text-xs text-gray-500">{contentTypeLabel(lesson.contentType)}</span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 truncate">{lesson.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">{lesson.duration} phút</div>
                                  </div>

                                  {isEnrolled && (
                                    <div className="flex-shrink-0">
                                      {isLessonCompleted(lesson) ? (
                                        <span className="text-green-600" title="Đã hoàn thành">
                                          ✓
                                        </span>
                                      ) : (
                                        <span className="text-gray-400" title="Chưa hoàn thành">
                                          ○
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {lessonsBySectionId.unassigned.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Chưa phân loại</div>
                    <div className="space-y-2">
                      {lessonsBySectionId.unassigned.map((lesson) => {
                        const active = lesson._id === lessonId;
                        const locked = !canAccessLesson(lesson);
                        return (
                          <button
                            key={lesson._id}
                            onClick={() => goToLesson(lesson)}
                            disabled={locked}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                            } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="text-sm font-medium text-gray-900 truncate">{lesson.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{lesson.duration} phút</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Lesson content */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title || 'Bài học'}</h2>
                    {currentLesson?.description && <p className="text-gray-600 mt-2">{currentLesson.description}</p>}
                    {currentLesson && (
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                        <span>{currentLesson.duration} phút</span>
                        <span>{contentTypeLabel(currentLesson.contentType)}</span>
                        {currentLesson.isPreview && <span className="text-green-600 font-medium">Preview</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {lessonLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
                    <span className="text-gray-600">Đang tải bài học...</span>
                  </div>
                ) : !currentLesson ? (
                  <div className="text-center py-12 text-gray-600">Không tìm thấy nội dung bài học.</div>
                ) : (
                  <>
                    {currentLesson.contentType === 'video' && (currentLesson.video?.secureUrl || currentLesson.videoUrl) ? (
                      <div className="mb-6">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden">
                          {(() => {
                            const videoSrcRaw = currentLesson.video?.secureUrl || currentLesson.videoUrl || '';
                            const thumbnailUrl = currentLesson.video?.thumbnailUrl;

                            if (videoSrcRaw.includes('youtube.com') || videoSrcRaw.includes('youtu.be')) {
                              return (
                                <iframe
                                  src={videoSrcRaw.replace('watch?v=', 'embed/')}
                                  title={currentLesson.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            }

                            const videoSrc = resolveFileUrl(videoSrcRaw) || '';

                            return (
                              <video
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                poster={thumbnailUrl}
                                className="w-full h-full"
                                src={videoSrc}
                              >
                                Trình duyệt của bạn không hỗ trợ thẻ video.
                              </video>
                            );
                          })()}
                        </div>
                      </div>
                    ) : currentLesson.contentType === 'video' ? (
                      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        Video chưa sẵn sàng hoặc thiếu URL.
                      </div>
                    ) : null}

                    {currentLesson.contentType === 'pdf' && (() => {
                      const pdfResource = (currentLesson.resources || []).find((r) => r.type === 'pdf') || (currentLesson.resources || [])[0];
                      if (!pdfResource?.url) return null;

                      const pdfUrl = resolveFileUrl(pdfResource.url);

                      return (
                        <div className="mb-6">
                          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <iframe
                              src={pdfUrl}
                              title={pdfResource.name || currentLesson.title}
                              className="w-full"
                              style={{ height: 600 }}
                            />
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Nếu không xem được, mở trực tiếp: <a className="text-primary-600 hover:text-primary-700" href={pdfUrl} target="_blank" rel="noopener noreferrer">{pdfResource.name || 'Tài liệu'}</a>
                          </div>
                        </div>
                      );
                    })()}

                    {currentLesson.contentType === 'quiz' && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                        Bài kiểm tra đang được phát triển.
                      </div>
                    )}

                    {currentLesson.contentType === 'text' && (
                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: (currentLesson.content ?? '').replace(/\n/g, '<br>') }} />
                      </div>
                    )}

                    {currentLesson.resources && currentLesson.resources.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tài liệu đính kèm</h3>
                        <div className="space-y-2">
                          {currentLesson.resources.map((resource, index) => (
                            <a
                              key={index}
                              href={resolveFileUrl(resource.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span className="font-medium text-gray-900">{resource.name}</span>
                              <span className="text-sm text-gray-500 ml-auto">{resource.type.toUpperCase()}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
                      <Button
                        variant="outline"
                        disabled={!prevLesson || (prevLesson ? !canAccessLesson(prevLesson) : false)}
                        onClick={() => prevLesson && goToLesson(prevLesson)}
                      >
                        ← Bài trước
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!nextLesson || (nextLesson ? !canAccessLesson(nextLesson) : false)}
                        onClick={() => nextLesson && goToLesson(nextLesson)}
                      >
                        Bài tiếp →
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;

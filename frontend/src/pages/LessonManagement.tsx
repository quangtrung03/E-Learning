import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseAPI, lessonAPI, sectionAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import FileUploadCard from '../components/upload/FileUploadCard';

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
  isHidden?: boolean;
  section?: null | string | { _id: string; title: string; order: number };
  resources?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image' | 'link' | 'other';
  }>;
}

interface CourseSection {
  _id: string;
  title: string;
  description?: string;
  order: number;
}

import type { Course } from '../types/course';

const LessonManagement = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toastContext = useToast();
  
  // Toast helper functions
  const toast = {
    success: (message: string) => toastContext.showToast({ type: 'success', title: message }),
    error: (message: string) => toastContext.showToast({ type: 'error', title: message }),
    info: (message: string) => toastContext.showToast({ type: 'info', title: message }),
  };
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // Video upload state
  const [videoInputType, setVideoInputType] = useState<'url' | 'file'>('url');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    contentType: 'text' as 'text' | 'video' | 'pdf' | 'quiz',
    videoUrl: '',
    duration: 30,
    order: 1,
    section: '' as string | '',
    isPreview: false,
    resources: [] as Array<{
      name: string;
      url: string;
      type: 'pdf' | 'doc' | 'image' | 'link' | 'other';
    }>
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  useEffect(() => {
    setSelectedLessonIds((prev) => {
      const existing = new Set((Array.isArray(lessons) ? lessons : []).map((l) => l._id));
      return prev.filter((id) => existing.has(id));
    });
  }, [lessons]);

  const isLessonSelected = (lessonId: string) => selectedLessonIds.includes(lessonId);

  const toggleLessonSelected = (lessonId: string, selected: boolean) => {
    setSelectedLessonIds((prev) => {
      if (selected) return prev.includes(lessonId) ? prev : [...prev, lessonId];
      return prev.filter((id) => id !== lessonId);
    });
  };

  const toggleSelectAllLessons = (selected: boolean) => {
    if (!selected) {
      setSelectedLessonIds([]);
      return;
    }
    setSelectedLessonIds((Array.isArray(lessons) ? lessons : []).map((l) => l._id));
  };

  const handleBulkVisibility = async (isHidden: boolean) => {
    if (!courseId) return;
    if (selectedLessonIds.length === 0) return;

    const actionLabel = isHidden ? 'Ẩn' : 'Hiện';
    if (!confirm(`${actionLabel} ${selectedLessonIds.length} bài học đã chọn?`)) {
      return;
    }

    try {
      await lessonAPI.bulkSetLessonVisibility(courseId, selectedLessonIds, isHidden);
      await refreshLists();
      setSelectedLessonIds([]);
      toast.success(`Đã ${actionLabel.toLowerCase()} bài học`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái hiển thị');
    }
  };

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

      // Fetch sections
      const sectionsResponse = await sectionAPI.getSectionsByCourse(courseId!);
      setSections(sectionsResponse.data.data.sections || []);

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
      resources: (Array.isArray(prev.resources) ? prev.resources : []).map((resource, i) => 
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
      section: '',
      isPreview: false,
      resources: []
    });
    setEditingLesson(null);
    setVideoInputType('url');
    setShowCreateForm(false);
  };

  const refreshLists = async () => {
    const [lessonsResponse, sectionsResponse] = await Promise.all([
      lessonAPI.getLessonsByCourse(courseId!),
      sectionAPI.getSectionsByCourse(courseId!)
    ]);
    setLessons(lessonsResponse.data.data.lessons || []);
    setSections(sectionsResponse.data.data.sections || []);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) return;

    try {
      await sectionAPI.createSection(courseId!, {
        title: sectionForm.title.trim(),
        description: sectionForm.description.trim() || undefined
      });
      setSectionForm({ title: '', description: '' });
      await refreshLists();
      toast.success('Đã tạo section');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo section');
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa section "${sectionTitle}"? (Các bài học trong section sẽ được đưa về "Chưa phân loại")`)) {
      return;
    }

    try {
      await sectionAPI.deleteSection(sectionId);
      await refreshLists();
      toast.success('Đã xóa section');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa section');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      
      const lessonData = {
        ...formData,
        section: formData.section || null,
        resources: formData.resources.filter(r => r.name && r.url)
      };

      await lessonAPI.createLesson(courseId!, lessonData);
      
      await refreshLists();
      
      resetForm();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài học');
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
        section: formData.section || null,
        resources: formData.resources.filter(r => r.name && r.url)
      };

      await lessonAPI.updateLesson(editingLesson._id, lessonData);
      
      await refreshLists();
      
      resetForm();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài học');
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
      
      await refreshLists();
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa bài học');
    }
  };

  const startEdit = (lesson: Lesson) => {
    const sectionId = typeof lesson.section === 'string'
      ? lesson.section
      : (lesson.section && typeof lesson.section === 'object')
        ? lesson.section._id
        : '';
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content,
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      order: lesson.order,
      section: sectionId,
      isPreview: lesson.isPreview,
      resources: lesson.resources || []
    });
    setEditingLesson(lesson);
    setShowCreateForm(true);
  };

  const getSectionLabel = (lesson: Lesson) => {
    if (!lesson.section) return 'Chưa phân loại';
    if (typeof lesson.section === 'string') {
      const match = sections.find(s => s._id === lesson.section);
      return match?.title || 'Section';
    }
    return lesson.section.title;
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

  const getLessonSectionId = (lesson: Lesson): string | null => {
    if (!lesson.section) return null;
    if (typeof lesson.section === 'string') return lesson.section;
    if (typeof lesson.section === 'object' && lesson.section?._id) return lesson.section._id;
    return null;
  };

  const normalizeOrder = <T extends { _id: string; order: number }>(items: T[]) => {
    return items.map((item, index) => ({ ...item, order: index + 1 }));
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (reordering) return;
    const ordered = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const normalized = normalizeOrder(ordered);
    const fromIndex = normalized.findIndex((s) => s._id === sectionId);
    if (fromIndex === -1) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= normalized.length) return;

    const swapped = normalized.slice();
    const temp = swapped[fromIndex];
    swapped[fromIndex] = swapped[toIndex];
    swapped[toIndex] = temp;

    const finalList = normalizeOrder(swapped);
    const changed = finalList.filter((s) => {
      const before = sections.find((x) => x._id === s._id);
      return before && before.order !== s.order;
    });

    // Optimistic UI
    setSections(finalList);

    try {
      setReordering(true);
      await Promise.all(changed.map((s) => sectionAPI.updateSection(s._id, { order: s.order })));
      toast.success('Đã cập nhật thứ tự section');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi sắp xếp section');
      await refreshLists();
    } finally {
      setReordering(false);
    }
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    if (reordering) return;
    const current = lessons.find((l) => l._id === lessonId);
    if (!current) return;

    const sectionKey = getLessonSectionId(current) || '__unassigned__';
    const group = lessons
      .filter((l) => (getLessonSectionId(l) || '__unassigned__') === sectionKey)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const normalized = normalizeOrder(group);
    const fromIndex = normalized.findIndex((l) => l._id === lessonId);
    if (fromIndex === -1) return;

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= normalized.length) return;

    const swapped = normalized.slice();
    const temp = swapped[fromIndex];
    swapped[fromIndex] = swapped[toIndex];
    swapped[toIndex] = temp;

    const finalGroup = normalizeOrder(swapped);
    const changed = finalGroup.filter((l) => {
      const before = lessons.find((x) => x._id === l._id);
      return before && before.order !== l.order;
    });

    // Optimistic UI
    setLessons((prev) => prev.map((l) => {
      const updated = finalGroup.find((x) => x._id === l._id);
      return updated ? { ...l, order: updated.order } : l;
    }));

    try {
      setReordering(true);
      await Promise.all(changed.map((l) => lessonAPI.updateLesson(l._id, { order: l.order })));
      toast.success('Đã cập nhật thứ tự bài học');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi sắp xếp bài học');
      await refreshLists();
    } finally {
      setReordering(false);
    }
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
              <div className="text-primary-200 mt-1">{sections.length} section</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <Card>
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

              {/* Sections */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Sections</h3>
                  <span className="text-sm text-gray-600">{sections.length}</span>
                </div>

                <form onSubmit={handleCreateSection} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tên section (VD: Chương 1 - Giới thiệu)"
                  />
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả (tuỳ chọn)"
                  />
                  <Button type="submit" className="w-full">Tạo section</Button>
                </form>

                {sections.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sections
                      .slice()
                      .sort((a, b) => a.order - b.order)
                        .map((s, index, arr) => (
                          <div key={s._id} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full">
                            <span className="text-sm text-gray-800">{s.order}. {s.title}</span>

                            <button
                              type="button"
                              disabled={reordering || index === 0}
                              onClick={() => handleMoveSection(s._id, 'up')}
                              className="text-gray-400 hover:text-primary-600 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                              title="Đưa section lên"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={reordering || index === arr.length - 1}
                              onClick={() => handleMoveSection(s._id, 'down')}
                              className="text-gray-400 hover:text-primary-600 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                              title="Đưa section xuống"
                            >
                              ↓
                            </button>

                            <button
                              type="button"
                              disabled={reordering}
                              onClick={() => handleDeleteSection(s._id, s.title)}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                              title="Xóa section"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                  </div>
                )}
              </div>

              {/* Lessons */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600"
                    checked={Array.isArray(lessons) && lessons.length > 0 && selectedLessonIds.length === lessons.length}
                    onChange={(e) => toggleSelectAllLessons(e.target.checked)}
                    disabled={!Array.isArray(lessons) || lessons.length === 0}
                  />
                  <span>Chọn tất cả</span>
                </label>

                {selectedLessonIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Đã chọn {selectedLessonIds.length}</span>
                    <Button size="sm" variant="outline" onClick={() => handleBulkVisibility(false)}>
                      Hiện
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkVisibility(true)}>
                      Ẩn
                    </Button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {(Array.isArray(lessons) && lessons.length === 0) ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl text-gray-300 mb-4">📖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có bài học nào</h3>
                    <p className="text-gray-600 mb-6">Hãy tạo bài học đầu tiên cho khóa học của bạn</p>
                    <Button onClick={() => { resetForm(); setShowCreateForm(true); }}>Tạo bài học đầu tiên</Button>
                  </div>
                ) : (
                  (() => {
                    const orderedSections = sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    const lessonsList = (Array.isArray(lessons) ? lessons : []).slice();

                    const lessonsBySection: Record<string, Lesson[]> = {};
                    const unassigned: Lesson[] = [];

                    for (const lesson of lessonsList) {
                      const sectionId = getLessonSectionId(lesson);
                      if (!sectionId) {
                        unassigned.push(lesson);
                        continue;
                      }
                      if (!lessonsBySection[sectionId]) lessonsBySection[sectionId] = [];
                      lessonsBySection[sectionId].push(lesson);
                    }

                    Object.values(lessonsBySection).forEach((list) => list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
                    unassigned.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                    const renderLessonRow = (lesson: Lesson, index: number, arr: Lesson[]) => (
                      <div key={lesson._id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-primary-600"
                                checked={isLessonSelected(lesson._id)}
                                onChange={(e) => toggleLessonSelected(lesson._id, e.target.checked)}
                                aria-label={`Chọn bài học ${lesson.title}`}
                              />
                              <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold">
                                {lesson.order}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                              <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">{getSectionLabel(lesson)}</span>
                              {lesson.isHidden && (
                                <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">ẨN</span>
                              )}
                              {lesson.isPreview && (
                                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">MIỄN PHÍ</span>
                              )}
                            </div>

                            {lesson.description && (<p className="text-gray-600 mb-3">{lesson.description}</p>)}

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {lesson.duration} phút
                              </div>

                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                {getContentTypeLabel(lesson.contentType)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              type="button"
                              disabled={reordering || index === 0}
                              onClick={() => handleMoveLesson(lesson._id, 'up')}
                              className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                              title="Đưa bài lên"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={reordering || index === arr.length - 1}
                              onClick={() => handleMoveLesson(lesson._id, 'down')}
                              className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
                              title="Đưa bài xuống"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/courses/${courseId}/learn/${lesson._id}`)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Preview như học viên"
                            >
                              ▶
                            </button>

                            <button type="button" onClick={() => startEdit(lesson)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Chỉnh sửa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>

                            <button type="button" onClick={() => handleDeleteLesson(lesson._id, lesson.title)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Xóa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <>
                        {orderedSections.map((section) => {
                          const list = lessonsBySection[section._id] || [];
                          return (
                            <div key={section._id}>
                              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-gray-900">{section.order}. {section.title}</div>
                                  <div className="text-sm text-gray-600">{list.length} bài</div>
                                </div>
                              </div>
                              {list.length === 0 ? (
                                <div className="p-6 text-sm text-gray-600">Chưa có bài học trong section này.</div>
                              ) : (
                                list.map((lesson, idx, arr) => renderLessonRow(lesson, idx, arr))
                              )}
                            </div>
                          );
                        })}

                        {unassigned.length > 0 && (
                          <div>
                            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-gray-900">Chưa phân loại</div>
                                <div className="text-sm text-gray-600">{unassigned.length} bài</div>
                              </div>
                            </div>
                            {unassigned.map((lesson, idx, arr) => renderLessonRow(lesson, idx, arr))}
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </Card>
          </div>

          {/* Create/Edit Form */}
          <div className="lg:col-span-1">
            {showCreateForm && (
              <Card className="p-6 sticky top-6">
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

                  {/* Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.section}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                    >
                      <option value="">Chưa phân loại</option>
                      {sections
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((s) => (
                          <option key={s._id} value={s._id}>{s.order}. {s.title}</option>
                        ))}
                    </select>
                  </div>

                  {/* Video Section */}
                  {formData.contentType === 'video' && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Video bài học *
                      </label>

                      {/* Radio buttons for input type */}
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="videoInputType"
                            value="url"
                            checked={videoInputType === 'url'}
                            onChange={(e) => setVideoInputType(e.target.value as 'url' | 'file')}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm text-gray-700">Liên kết URL (YouTube, Vimeo...)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="videoInputType"
                            value="file"
                            checked={videoInputType === 'file'}
                            onChange={(e) => setVideoInputType(e.target.value as 'url' | 'file')}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm text-gray-700">Upload file video</span>
                        </label>
                      </div>

                      {/* URL Input */}
                      {videoInputType === 'url' && (
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={formData.videoUrl}
                          onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                          placeholder="https://youtube.com/watch?v=... hoặc https://vimeo.com/..."
                        />
                      )}

                      {/* File Upload */}
                      {videoInputType === 'file' && (
                        <FileUploadCard
                          title="Video bài học"
                          description="Định dạng: MP4, WebM, OGG, MOV. Kích thước tối đa: 100MB"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          maxSizeMB={100}
                          uploadedUrl={formData.videoUrl}
                          validateFile={(file) => {
                            const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
                            if (!allowed.includes(file.type)) {
                              return 'Vui lòng chọn file video hợp lệ (MP4, WebM, OGG, MOV)';
                            }
                            return null;
                          }}
                          onUploadedUrlChange={(url) => {
                            handleInputChange('videoUrl', url);
                            if (url) toast.success('Upload video thành công!');
                          }}
                          uploadFile={async (file, onProgress) => {
                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);
                            const response = await uploadAPI.uploadVideo(formDataUpload, onProgress, 'lesson_video');
                            return {
                              url: response.data.data.url,
                              publicId: response.data.data.publicId,
                              format: response.data.data.format,
                              duration: response.data.data.duration,
                              width: response.data.data.width,
                              height: response.data.data.height,
                              size: response.data.data.size,
                            };
                          }}
                        />
                      )}
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
                    
                    {(Array.isArray(formData.resources) ? formData.resources : []).map((resource, index) => (
                      <div key={index} className="space-y-2 mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tên tài liệu"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                            value={resource.name}
                            onChange={(e) => handleResourceChange(index, 'name', e.target.value)}
                          />
                          <select
                            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
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
                            title="Xóa tài liệu"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>

                        {/* URL */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="url"
                            placeholder="Nhập URL (nếu là link)"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                            value={resource.url}
                            onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                          />
                        </div>

                        {/* File Upload (Cloudinary) */}
                        <FileUploadCard
                          title="Upload file tài liệu"
                          description="PDF/DOC/PPT/Excel/ZIP hoặc hình ảnh. Tối đa 10MB."
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z"
                          maxSizeMB={10}
                          uploadedUrl={resource.url}
                          onUploadedUrlChange={(url) => handleResourceChange(index, 'url', url)}
                          uploadFile={async (file, onProgress) => {
                            if (!resource.name) handleResourceChange(index, 'name', file.name);

                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (ext === 'pdf') handleResourceChange(index, 'type', 'pdf');
                            else if (ext === 'doc' || ext === 'docx') handleResourceChange(index, 'type', 'doc');
                            else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || ''))
                              handleResourceChange(index, 'type', 'image');
                            else if (ext === 'link') handleResourceChange(index, 'type', 'link');
                            else handleResourceChange(index, 'type', 'other');

                            const formDataUpload = new FormData();
                            formDataUpload.append('file', file);

                            const isImage = file.type.startsWith('image/');
                            const response = isImage
                              ? await uploadAPI.uploadImage(formDataUpload, onProgress, 'lesson_resource_image')
                              : await uploadAPI.uploadDocument(formDataUpload, onProgress, 'lesson_resource_document');

                            toast.success(`Upload ${file.name} thành công!`);
                            return response.data.data;
                          }}
                        />
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
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonManagement;

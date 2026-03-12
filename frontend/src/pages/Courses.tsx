import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { courseAPI, uploadAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import AdvancedSearchFilters from '../components/ui/AdvancedSearchFilters';
import FileUploadCard from '../components/upload/FileUploadCard';
import { useToast } from '../context/ToastContext';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  finalPrice: number;
  discount: number;
  duration: number;
  rating: {
    average: number;
    count: number;
  };
  instructor: {
    _id: string;
    name: string;
  };
  totalStudents?: number; // Virtual count from backend
}

const Courses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toastContext = useToast();
  const defaultCourseThumbnailUrl = useDefaultCourseThumbnailUrl();
  const fallbackCourseThumbnailUrl = resolveFileUrl(defaultCourseThumbnailUrl || undefined);
  
  // Toast helper functions
  const toast = {
    success: (message: string) => toastContext.showToast({ type: 'success', title: message }),
    error: (message: string) => toastContext.showToast({ type: 'error', title: message }),
    info: (message: string) => toastContext.showToast({ type: 'info', title: message }),
  };
  
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'drafts'>('browse');
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [draftCourses, setDraftCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    level: '',
    priceMin: 0,
    priceMax: 10000000,
    rating: 0,
    isFree: null as boolean | null,
    sort: 'newest'
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 1
  });

  // Form state cho tạo khóa học
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    price: 0,
    discount: 0,
    duration: 0,
    thumbnail: '',
    requirements: [''],
    whatYouWillLearn: [''],
    tags: ['']
  });
  const [formLoading, setFormLoading] = useState(false);
  const [priceType, setPriceType] = useState<string>('free');
  const [durationType, setDurationType] = useState<string>('custom');

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

  const levels = [
    { value: '', label: 'Tất cả cấp độ' },
    { value: 'beginner', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Trung cấp' },
    { value: 'advanced', label: 'Nâng cao' }
  ];

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchCourses();
      fetchFeaturedCourses();
    } else if (activeTab === 'drafts') {
      fetchDraftCourses();
    }
  }, [activeTab, filters, pagination.page]);

  const fetchFeaturedCourses = async () => {
    try {
      setFeaturedLoading(true);
      const response = await courseAPI.getAllCourses({ limit: 6, sort: 'rating' });
      if (response.data.success) {
        setFeaturedCourses(response.data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching featured courses:', error);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchDraftCourses = async () => {
    try {
      setDraftsLoading(true);
      const response = await courseAPI.getMyCourses({ status: 'draft' });
      if (response.data.success) {
        const drafts = response.data.data || [];
        setDraftCourses(drafts);
      }
    } catch (error) {
      console.error('Error fetching draft courses:', error);
      toast.error('Không thể tải bản nháp');
    } finally {
      setDraftsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.level && { level: filters.level })
      };
      
      // Advanced filters
      if (filters.priceMin > 0) params.minPrice = filters.priceMin;
      if (filters.priceMax < 10000000) params.maxPrice = filters.priceMax;
      if (filters.rating > 0) params.minRating = filters.rating;
      if (filters.isFree !== null) {
        if (filters.isFree) {
          params.maxPrice = 0;
        } else {
          params.minPrice = 1;
        }
      }
      
      const response = await courseAPI.getAllCourses(params);
      if (response.data.success) {
        setCourses(response.data.data.courses);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getLevelLabel = (level: string) => {
    const lev = levels.find(l => l.value === level);
    return lev ? lev.label : level;
  };

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: keyof typeof formData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayField = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const loadDraftForEdit = (draft: Course) => {
    const draftThumbnail = (draft as any).thumbnail || '';
    
    console.log('📝 Loading draft for edit:', {
      courseId: draft._id,
      title: draft.title,
      hasThumbnail: !!draftThumbnail,
      thumbnailUrl: draftThumbnail
    });
    
    setFormData({
      title: draft.title,
      description: draft.description,
      category: draft.category,
      level: draft.level,
      price: draft.price,
      discount: draft.discount || 0,
      duration: draft.duration,
      thumbnail: draftThumbnail,
      requirements: (draft as any).requirements || [''],
      whatYouWillLearn: (draft as any).whatYouWillLearn || [''],
      tags: (draft as any).tags || ['']
    });

    if (draftThumbnail) console.log('✅ Thumbnail loaded from draft:', draftThumbnail);
    
    setPriceType(draft.price === 0 ? 'free' : 'custom');
    setDurationType('custom');
    setActiveTab('create');
    toast.info('Đã tải bản nháp' + (draftThumbnail ? ' (có ảnh)' : ' (chưa có ảnh)'));
  };

  const deleteDraft = async (courseId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản nháp này?')) return;
    
    try {
      await courseAPI.deleteCourse(courseId);
      toast.success('Đã xóa bản nháp');
      fetchDraftCourses();
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa bản nháp');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateCourse('pending');
  };

  // Hàm dùng chung cho cả tạo mới và lưu nháp
  const handleCreateCourse = async (status: 'pending' | 'draft') => {
    try {
      setFormLoading(true);
      // Validate - chỉ kiểm tra title và description
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (Tiêu đề và Mô tả)');
        return;
      }
      // Filter empty values
      const courseData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim()),
        whatYouWillLearn: formData.whatYouWillLearn.filter(obj => obj.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        status
      };
      
      // Debug: Log thumbnail URL before sending
      console.log('📤 Sending course data:', {
        title: courseData.title,
        thumbnail: courseData.thumbnail,
        hasThumbnail: !!courseData.thumbnail
      });
      
      const response = await courseAPI.createCourse(courseData);
      if (response.data.success) {
        console.log('✅ Course created successfully:', response.data);
        toast.success(status === 'draft' ? 'Đã lưu bản nháp!' : 'Tạo khóa học thành công!');
        navigate('/my-courses');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khóa học');
    } finally {
      setFormLoading(false);
    }
  };

  const renderBrowseTab = () => (
    <div className="space-y-8">
      {/* Phần khóa học nổi bật */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🌟 Khóa học nổi bật</h2>
            <p className="text-gray-600 mt-1">Những khóa học được yêu thích nhất</p>
          </div>
        </div>

        {featuredLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {(Array.isArray(featuredCourses) ? featuredCourses : []).map((course) => (
              <Link key={course._id} to={`/courses/${course._id}`}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="h-48 rounded-t-xl flex items-center justify-center relative overflow-hidden bg-gray-100">
                    {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                      <img
                        src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                        alt={course.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">{course.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                      ⭐ {course.rating?.average?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                        {getCategoryLabel(course.category)}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {getLevelLabel(course.level)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {course.totalStudents || 0} học viên
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary-600">
                          {(course.finalPrice || course.price || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Advanced Search Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFilterChange={handleAdvancedFilterChange}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Tìm thấy <span className="font-semibold">{pagination.total}</span> khóa học
          </p>
          <p className="text-gray-600">
            Trang {pagination.page} / {pagination.pages}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
              <Card key={item} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(Array.isArray(courses) ? courses : []).map((course) => (
                <Link key={course._id} to={`/courses/${course._id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="h-48 rounded-t-xl flex items-center justify-center relative overflow-hidden bg-gray-100">
                      {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                        <img
                          src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">{course.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {getLevelLabel(course.level)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                              {course.instructor.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {course.instructor.name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {course.rating?.average?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course.duration} phút • {course.totalStudents || 0} học viên
                        </div>
                        <div className="text-right">
                          {course.discount > 0 && (
                            <span className="text-sm text-gray-500 line-through mr-2">
                              {(course.price || 0).toLocaleString('vi-VN')}đ
                            </span>
                          )}
                          <span className="text-lg font-bold text-primary-600">
                            {(course.finalPrice || course.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Trước
                  </Button>
                  {Array.from({ length: Math.min(5, pagination.pages) }).map((_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={pagination.page === page ? 'primary' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Sau
                  </Button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Không tìm thấy khóa học
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi bộ lọc để tìm kiếm khóa học phù hợp
            </p>
            <Button
              onClick={() => {
                const resetFilters = {
                  search: '',
                  category: '',
                  level: '',
                  priceMin: 0,
                  priceMax: 10000000,
                  rating: 0,
                  isFree: null as boolean | null,
                  sort: 'newest'
                };
                setFilters(resetFilters);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              Xóa bộ lọc
            </Button>
          </Card>
        )}
      </section>
    </div>
  );

  const renderDraftsTab = () => (
    <div className="max-w-7xl mx-auto">
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Bản nháp của tôi
          </h2>
          <p className="text-gray-600">
            Các khóa học đang được soạn thảo
          </p>
        </div>

        {draftsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : draftCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftCourses.map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-all duration-300">
                <div className="h-48 rounded-t-xl flex items-center justify-center relative overflow-hidden bg-gray-100">
                  {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                    <img
                      src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                      alt={course.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">{course.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    NHÁP
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {getCategoryLabel(course.category)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {getLevelLabel(course.level)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <span>{course.duration} phút</span>
                    <span>{course.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadDraftForEdit(course)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                      size="sm"
                    >
                      ✏️ Chỉnh sửa
                    </Button>
                    <Button
                      onClick={() => deleteDraft(course._id)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có bản nháp nào
            </h3>
            <p className="text-gray-600 mb-6">
              Bắt đầu tạo khóa học và lưu bản nháp để tiếp tục sau
            </p>
            <Button
              onClick={() => setActiveTab('create')}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              ✨ Tạo khóa học mới
            </Button>
          </Card>
        )}
      </Card>
    </div>
  );

  const renderCreateTab = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ Tạo khóa học mới
          </h2>
          <p className="text-gray-600">
            Chia sẻ kiến thức của bạn với cộng đồng học tập
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
              📋 Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề khóa học *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Nhập tiêu đề hấp dẫn cho khóa học"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả khóa học *
                </label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về nội dung và mục tiêu của khóa học"
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh minh họa khóa học (tùy chọn)
                </label>
                <div className="space-y-3">
                  <FileUploadCard
                    title="Upload ảnh minh họa"
                    description="Định dạng: JPG, PNG, GIF. Tối đa 10MB. Khuyến nghị: 1200x800px"
                    accept="image/*"
                    maxSizeMB={10}
                    validateFile={(file) => {
                      if (!file.type.startsWith('image/')) return 'Vui lòng chọn file ảnh hợp lệ';
                      return null;
                    }}
                    uploadedUrl={formData.thumbnail}
                    onUploadedUrlChange={(url) => {
                      handleInputChange('thumbnail', url);
                      if (url) toast.success('Upload ảnh thành công!');
                    }}
                    uploadFile={async (file, onProgress) => {
                      const formDataUpload = new FormData();
                      formDataUpload.append('file', file);
                      const response = await uploadAPI.uploadImage(formDataUpload, onProgress, 'course_thumbnail');
                      return response.data.data;
                    }}
                  />

                  {formData.thumbnail && (
                    <div className="inline-block">
                      <img
                        src={formData.thumbnail}
                        alt="Ảnh minh họa khóa học"
                        className="h-48 w-auto object-cover rounded-lg border border-gray-200 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {categories.filter(c => c.value).map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cấp độ *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                >
                  {levels.filter(l => l.value).map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá khóa học (VNĐ) *
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={priceType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPriceType(value);
                      if (value !== 'custom') {
                        handleInputChange('price', parseInt(value));
                      }
                    }}
                  >
                    <option value="free">Miễn phí</option>
                    <option value="299000">299,000 VNĐ (Khóa ngắn)</option>
                    <option value="499000">499,000 VNĐ (Phổ biến)</option>
                    <option value="799000">799,000 VNĐ (Trung cấp)</option>
                    <option value="999000">999,000 VNĐ</option>
                    <option value="1499000">1,499,000 VNĐ (Nâng cao)</option>
                    <option value="1990000">1,990,000 VNĐ</option>
                    <option value="2990000">2,990,000 VNĐ (Cao cấp)</option>
                    <option value="custom">Tùy chỉnh...</option>
                  </select>
                  {priceType === 'custom' && (
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      placeholder="Nhập giá tùy chỉnh"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời lượng *
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={durationType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDurationType(value);
                      if (value !== 'custom') {
                        handleInputChange('duration', parseInt(value));
                      }
                    }}
                  >
                    <option value="30">30 phút (Video ngắn)</option>
                    <option value="60">1 giờ</option>
                    <option value="90">1.5 giờ</option>
                    <option value="120">2 giờ</option>
                    <option value="180">3 giờ</option>
                    <option value="240">4 giờ</option>
                    <option value="300">5 giờ</option>
                    <option value="360">6 giờ</option>
                    <option value="480">8 giờ (Một ngày)</option>
                    <option value="600">10 giờ</option>
                    <option value="720">12 giờ</option>
                    <option value="900">15 giờ</option>
                    <option value="1200">20 giờ (Khóa dài)</option>
                    <option value="1800">30 giờ</option>
                    <option value="2400">40 giờ (Khóa chuyên sâu)</option>
                    <option value="3000">50 giờ</option>
                    <option value="3600">60 giờ (Khóa tăng tốc)</option>
                    <option value="custom">Tùy chỉnh...</option>
                  </select>
                  {durationType === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                        placeholder="Nhập số phút"
                      />
                      <span className="flex items-center px-3 text-gray-600 text-sm">phút</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
              ✅ Yêu cầu trước khi học
            </h3>
            {(Array.isArray(formData.requirements) ? formData.requirements : []).map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={req}
                  onChange={(e) => handleArrayInputChange('requirements', index, e.target.value)}
                  placeholder="Ví dụ: Biết HTML/CSS cơ bản"
                />
                {formData.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeArrayField('requirements', index)}
                    className="px-3"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayField('requirements')}
              className="w-full"
            >
              + Thêm yêu cầu
            </Button>
          </section>

          {/* Learning Objectives */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
              🎯 Những gì học viên sẽ học được
            </h3>
            {(Array.isArray(formData.whatYouWillLearn) ? formData.whatYouWillLearn : []).map((obj, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={obj}
                  onChange={(e) => handleArrayInputChange('whatYouWillLearn', index, e.target.value)}
                  placeholder="Ví dụ: Tạo website responsive với React"
                />
                {formData.whatYouWillLearn.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeArrayField('whatYouWillLearn', index)}
                    className="px-3"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayField('whatYouWillLearn')}
              className="w-full"
            >
              + Thêm mục tiêu học tập
            </Button>
          </section>

          {/* Tags */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
              🏷️ Từ khóa (tùy chọn)
            </h3>
            {(Array.isArray(formData.tags) ? formData.tags : []).map((tag, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={tag}
                  onChange={(e) => handleArrayInputChange('tags', index, e.target.value)}
                  placeholder="Ví dụ: javascript, frontend, web"
                />
                {formData.tags.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeArrayField('tags', index)}
                    className="px-3"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayField('tags')}
              className="w-full"
            >
              + Thêm từ khóa
            </Button>
          </section>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab('browse')}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={formLoading}
              onClick={() => handleCreateCourse('draft')}
            >
              {formLoading ? 'Đang lưu...' : 'Lưu bản nháp'}
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              className="px-8"
            >
              {formLoading ? 'Đang tạo...' : '🚀 Tạo khóa học'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🎓 Trung tâm Khóa học
            </h1>
            <p className="text-primary-100 text-lg mb-8 max-w-3xl mx-auto">
              Khám phá hàng ngàn khóa học chất lượng cao hoặc chia sẻ kiến thức của bạn với cộng đồng
            </p>
            
            {/* Tabs */}
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-8 py-4 rounded-xl font-medium transition-all ${
                  activeTab === 'browse'
                    ? 'bg-white text-primary-600 shadow-lg transform scale-105'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                🔍 Tìm kiếm khóa học
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`px-8 py-4 rounded-xl font-medium transition-all ${
                  activeTab === 'drafts'
                    ? 'bg-white text-primary-600 shadow-lg transform scale-105'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                📝 Bản nháp ({draftCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-8 py-4 rounded-xl font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-white text-primary-600 shadow-lg transform scale-105'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                ✨ Tạo khóa học mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'drafts' && renderDraftsTab()}
        {activeTab === 'create' && renderCreateTab()}
      </div>
    </div>
  );
};

export default Courses;

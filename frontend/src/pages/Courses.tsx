import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface Course {
  _id: string;
  title: string;
  description: string;
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
  students: string[];
}

const Courses = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    sort: 'newest'
  });
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
    requirements: [''],
    whatYouWillLearn: [''],
    tags: ['']
  });
  const [formLoading, setFormLoading] = useState(false);

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

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'price-low', label: 'Giá thấp' },
    { value: 'price-high', label: 'Giá cao' },
    { value: 'rating', label: 'Đánh giá cao' }
  ];

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchCourses();
      fetchFeaturedCourses();
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

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.level && { level: filters.level })
      };
      
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateCourse('pending');
  };

  // Hàm dùng chung cho cả tạo mới và lưu nháp
  const handleCreateCourse = async (status: 'pending' | 'draft') => {
    try {
      setFormLoading(true);
      // Validate
      if (!formData.title.trim() || !formData.description.trim()) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
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
      const response = await courseAPI.createCourse(courseData);
      if (response.data.success) {
        alert(status === 'draft' ? 'Đã lưu bản nháp!' : 'Tạo khóa học thành công!');
        navigate('/my-courses');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khóa học');
    } finally {
      setFormLoading(false);
    }
  };

  const renderBrowseTab = () => (
    <div className="space-y-8">
      {/* Featured Courses Section */}
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
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-xl flex items-center justify-center relative">
                    <span className="text-white text-4xl font-bold">
                      {course.title.charAt(0)}
                    </span>
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                      ⭐ {course.rating.average.toFixed(1)}
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
                        {course.students.length} học viên
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

      {/* Filters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Tìm kiếm nâng cao</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tìm khóa học..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cấp độ
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              {levels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sắp xếp
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setFilters({ search: '', category: '', level: '', sort: 'newest' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              variant="outline"
              className="w-full"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </Card>

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
                    <div className="h-48 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-t-xl flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
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
                            {course.rating.average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course.duration} phút • {course.students.length} học viên
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
                setFilters({ search: '', category: '', level: '', sort: 'newest' });
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
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời lượng (phút) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  placeholder="120"
                />
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
              🏷️ Tags (tùy chọn)
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
              + Thêm tag
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
        {activeTab === 'browse' ? renderBrowseTab() : renderCreateTab()}
      </div>
    </div>
  );
};

export default Courses;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI, contentAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  count: string;
  imageUrl: string;
  gradient: string;
}

interface Instructor {
  _id: string;
  name: string;
  title: string;
  experience: string;
  imageUrl: string;
  gradient: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  finalPrice: number;
  rating: {
    average: number;
    count: number;
  };
  totalStudents?: number; // Virtual count from backend
  instructor: {
    name: string;
  };
}

const Home = () => {
  const defaultCourseThumbnailUrl = useDefaultCourseThumbnailUrl();
  const fallbackCourseThumbnailUrl = resolveFileUrl(defaultCourseThumbnailUrl || undefined);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, categoriesRes, instructorsRes] = await Promise.all([
        courseAPI.getAllCourses({ limit: 8, sort: 'newest' }),
        contentAPI.getCategories(),
        contentAPI.getInstructors()
      ]);
      
      if (coursesRes.data.success && coursesRes.data.data.courses) {
        setFeaturedCourses(coursesRes.data.data.courses);
      }
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
      
      if (instructorsRes.data.success) {
        setInstructors(instructorsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };



  const testimonials = [
    {
      name: 'Nguyễn Anh',
      role: 'Kỹ sư phần mềm tại FPT',
      initial: 'NA',
      comment: 'Chương trình học có lộ trình rõ ràng và giảng viên tận tâm đã giúp tôi đạt được công việc mơ ước.',
      rating: 5
    },
    {
      name: 'Trần Văn B',
      role: 'Chuyển hướng nghề nghiệp',
      initial: 'TB',
      comment: 'Tôi tìm đúng thứ mình cần. Cách giảng dạy dễ hiểu và hỗ trợ rất tốt.',
      rating: 5
    },
    {
      name: 'Lê Thị C',
      role: 'Sinh viên mới tốt nghiệp',
      initial: 'LC',
      comment: 'Tăng sự tự tin nhờ kiến thức thực tiễn và cơ hội kết nối tuyệt vời.',
      rating: 5
    }
  ];

  const getCategoryLabel = (category: string) => {
    const map: { [key: string]: string } = {
      'programming': 'Lập trình',
      'design': 'Thiết kế',
      'business': 'Kinh doanh',
      'marketing': 'Marketing',
      'language': 'Ngôn ngữ',
      'science': 'Khoa học',
      'other': 'Khác'
    };
    return map[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const map: Record<string, string> = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return map[level] || level;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern Image Background */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/dtv6qnrwy/image/upload/v1764396833/elearning/hero-backgrounds/dxj1reyn3t3em6uymicv.jpg" 
            alt="Hình nền học tập" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          <div className="max-w-2xl">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-white">
                <span className="block text-8xl md:text-9xl font-bold mb-4 tracking-tight">
                  HỌC
                </span>
                <span className="block text-5xl md:text-6xl font-semibold tracking-wide">
                  bất cứ điều gì bạn muốn
                </span>
              </h1>

              <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-xl">
                Luôn cập nhật những điều đang diễn ra trong hành trình học tập của bạn và hơn thế nữa.
              </p>

              <div className="pt-6">
                <Link to="/courses">
                  <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-4 rounded-lg text-lg shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105 uppercase tracking-wide">
                    Bắt đầu học
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-10 left-10 text-white/40 text-sm hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-white/40"></div>
            <span>Cuộn để khám phá</span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Khám phá danh mục nổi bật
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chọn lộ trình và bắt đầu hành trình học tập của bạn ngay hôm nay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link key={index} to="/courses">
                <div className="group backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 bg-white border-gray-200 hover:border-blue-400 cursor-pointer shadow-lg hover:shadow-2xl">
                  <div className="h-48 relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-4xl font-bold">{cat.name.charAt(0)}</div>
                    </div>
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{cat.description}</p>
                    <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                      <span className="mr-2">Khám phá</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Phần khóa học nổi bật */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-blue-100 text-blue-600 rounded-full mb-4 font-semibold">
              Nổi bật
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Khóa học phổ biến
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Những khóa học được đánh giá cao và yêu thích
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <Link key={course._id} to={`/courses/${course._id}`}>
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full border-0 overflow-hidden">
                    <div className="relative h-48 flex items-center justify-center overflow-hidden bg-gray-100">
                      {(course.totalStudents || 0) > 10 && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-cyan-400 text-blue-900 text-xs font-bold rounded-full">
                          BÁN CHẠY
                        </div>
                      )}
                      {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                        <img
                          src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                          alt={course.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                          <div className="text-white text-4xl font-bold">
                            {getCategoryLabel(course.category).charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {course.totalStudents || 0} học viên
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-bold">{course.rating.average.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({course.rating.count})</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {getLevelLabel(course.level)}
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        {course.finalPrice < course.price ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-blue-600">
                              {course.finalPrice.toLocaleString('vi-VN')}đ
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {course.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-blue-600">
                            {course.price.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-semibold">
                Xem tất cả khóa học
              </Button>
            </Link>
          </div>
        </div>
      </section>

      

      {/* Trusted Ecosystems & Partners */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Học kỹ năng được doanh nghiệp hàng đầu đánh giá cao
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nâng cao năng lực với nền tảng và công cụ được các tổ chức hàng đầu sử dụng
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: 'Google', logo: 'https://www.vectorlogo.zone/logos/google/google-icon.svg', field: 'Công nghệ' },
              { name: 'Microsoft', logo: 'https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg', field: 'Doanh nghiệp' },
              { name: 'Amazon', logo: 'https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg', field: 'Thương mại điện tử' },
              { name: 'Apple', logo: 'https://www.vectorlogo.zone/logos/apple/apple-icon.svg', field: 'Đổi mới' },
              { name: 'Facebook', logo: 'https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg', field: 'Mạng xã hội' },
              { name: 'Netflix', logo: 'https://www.vectorlogo.zone/logos/netflix/netflix-icon.svg', field: 'Phát trực tuyến' },
              { name: 'Adobe', logo: 'https://www.vectorlogo.zone/logos/adobe/adobe-icon.svg', field: 'Sáng tạo' },
              { name: 'Salesforce', logo: 'https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg', field: 'CRM' },
              { name: 'IBM', logo: 'https://www.vectorlogo.zone/logos/ibm/ibm-icon.svg', field: 'AI & Đám mây' },
              { name: 'Oracle', logo: 'https://www.vectorlogo.zone/logos/oracle/oracle-icon.svg', field: 'Cơ sở dữ liệu' },
              { name: 'SAP', logo: 'https://www.vectorlogo.zone/logos/sap/sap-icon.svg', field: 'ERP' },
              { name: 'LinkedIn', logo: 'https://www.vectorlogo.zone/logos/linkedin/linkedin-icon.svg', field: 'Nghề nghiệp' }
            ].map((company, index) => (
              <div 
                key={index}
                className="group flex flex-col items-center p-6 backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl hover:border-blue-400 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer"
                title={`${company.name} - ${company.field}`}
              >
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="w-16 h-16 mb-3 object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                  {company.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">{company.field}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6 text-lg">Khóa học giúp bạn sẵn sàng cho sự nghiệp tại các công ty này và hơn thế nữa</p>
            <Link to="/courses">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg">
                Khám phá tất cả khóa học
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Instructors */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Học cùng chuyên gia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Giảng viên là những chuyên gia hàng đầu trong lĩnh vực
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor, idx) => (
              <div key={idx} className="group backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 bg-white/90 border-gray-200 hover:border-blue-400 shadow-lg hover:shadow-2xl">
                <div className={`h-64 bg-gradient-to-br ${instructor.gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-5xl font-bold">{instructor.name.charAt(0)}</div>
                  </div>
                  <img 
                    src={instructor.imageUrl} 
                    alt={instructor.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{instructor.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{instructor.title}</p>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {instructor.experience}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Câu chuyện thành công của học viên
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Xem những điều học viên đã đạt được
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="backdrop-blur-sm border rounded-2xl p-8 transition-all duration-500 hover:scale-105 bg-white/90 border-gray-200 hover:border-blue-400">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">{testimonial.initial}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

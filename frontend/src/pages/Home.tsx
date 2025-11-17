import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Star,
  Code,
  Palette,
  Briefcase,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  finalPrice: number;
  rating: {
    average: number;
    count: number;
  };
  students: any[];
  instructor: {
    name: string;
  };
}

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses({ limit: 8, sort: 'newest' });
      if (response.data.success && response.data.data.courses) {
        setFeaturedCourses(response.data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { icon: Code, name: 'Phát Triển Web', color: 'from-blue-500 to-cyan-500', count: '2,500+' },
    { icon: Palette, name: 'Thiết Kế Đồ Họa', color: 'from-purple-500 to-pink-500', count: '1,800+' },
    { icon: Briefcase, name: 'Marketing Digital', color: 'from-orange-500 to-red-500', count: '1,200+' },
    { icon: MessageSquare, name: 'Tiếng Anh Giao Tiếp', color: 'from-green-500 to-emerald-500', count: '900+' }
  ];

  const features = [
    {
      icon: Award,
      title: 'Giảng Viên Hàng Đầu',
      description: 'Học hỏi từ các chuyên gia hàng đầu với nhiều năm kinh nghiệm thực tế'
    },
    {
      icon: CheckCircle,
      title: 'Nội Dung Thực Chiến',
      description: 'Bài học bám sát thực tế công việc, dễ dàng áp dụng ngay sau khóa học'
    },
    {
      icon: Clock,
      title: 'Hỗ Trợ Tận Tâm 24/7',
      description: 'Giải đáp hay vướng mắc bất cứ lúc nào, đảm bảo hành trình học tập suôn sẻ'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Anh A',
      role: 'Kỹ sư Phần mềm tại FPT',
      avatar: '👨‍💼',
      rating: 5,
      comment: 'Lộ trình học rất bài bản, giảng viên nhiệt tình, tôi đã có công việc mới nhờ các kỹ năng học được ở đây!'
    },
    {
      name: 'Nguyễn Văn A',
      role: 'Khóa học thay đổi sự nghiệp',
      avatar: '👩‍💼',
      rating: 5,
      comment: 'Tôi đã tìm thấy đúng khóa học tôi cần. Giáo viên giảng dạy rất dễ hiểu và hỗ trợ tận tình!'
    },
    {
      name: 'Tên Học Sinh Hạnh Mới Điều',
      role: 'Vừa tốt nghiệp và tìm được việc',
      avatar: '👨‍🎓',
      rating: 5,
      comment: 'Khóa học giúp tôi tự tin hơn, kiến thức thực tế và cơ hội networking tuyệt vời!'
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Hơn 10,000+ học viên tin tưởng</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Học hỏi và Phát triển Kỹ Năng
                <span className="block text-cyan-300 mt-2">Nâng Cao Cho Tương Lai</span>
              </h1>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                Khám phá hơn 10.000 khóa học chất lượng cao từ các chuyên gia hàng đầu. 
                Học mọi lúc, mọi nơi với nền tảng E-Learning hiện đại.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={isAuthenticated ? "/courses" : "/register"}>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-xl">
                    🎯 Khám Phá Khóa Học Ngay
                  </Button>
                </Link>
                <Link to={isAuthenticated ? "/dashboard" : "/courses"}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
                  >
                    ✨ Trải Nghiệm Miễn Phí
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-blue-200 text-sm">Học viên</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-blue-200 text-sm">Khóa học</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-blue-200 text-sm">Hài lòng</div>
                </div>
              </div>
            </div>

            <div className="hidden md:block relative">
              <div className="relative w-full h-[500px]">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl rotate-6 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute w-64 h-64 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 animate-ping"></div>
                    <div className="relative text-center space-y-6">
                      <div className="text-8xl">👩‍🎓👨‍💻👩‍💼</div>
                      <div className="text-6xl">💻📚🎯</div>
                      <div className="text-2xl font-bold">Học tập mọi lúc, mọi nơi</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-blue-100 text-sm font-medium mb-6">
              Được tin tưởng bởi các đối tác hàng đầu
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'IBM'].map((brand) => (
                <div key={brand} className="px-8 py-4 bg-white rounded-xl shadow-lg">
                  <span className="text-xl font-bold text-gray-800">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              📌 Danh Mục Khóa Học Hàng Đầu
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chọn lĩnh vực bạn muốn phát triển và bắt đầu hành trình học tập ngay hôm nay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link key={index} to="/courses">
                <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden">
                  <div className={`h-32 bg-gradient-to-br ${cat.color} flex items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                    <cat.icon className="w-16 h-16 text-white relative z-10" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.name}</h3>
                    <p className="text-gray-600 font-medium">{cat.count} khóa học</p>
                    <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform inline-flex items-center">
                      Khám phá ngay →
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-600 rounded-full mb-4">
              <Star className="w-4 h-4 mr-2 fill-current" />
              <span className="font-semibold">Nổi bật</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🔥 Khóa Học Nổi Bật
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Các khóa học được yêu thích và đánh giá cao nhất từ học viên
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
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full">
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                      <span className="text-6xl relative z-10">📚</span>
                      {course.students?.length > 10 && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          BEST SELLER
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {getCategoryLabel(course.category)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-bold">{course.rating.average.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({course.rating.count})</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          👥 {course.students?.length || 0}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          {course.finalPrice < course.price ? (
                            <>
                              <div>
                                <span className="text-2xl font-bold text-blue-600">
                                  {course.finalPrice.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-sm text-gray-400 line-through ml-2">
                                  {course.price.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-blue-600">
                              {course.price.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button size="lg" variant="outline" className="px-8 py-4">
                Xem tất cả khóa học →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-600 rounded-full mb-4">
              <Target className="w-4 h-4 mr-2" />
              <span className="font-semibold">Lộ trình học</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🎯 Lộ Trình Học Tập
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Học theo lộ trình được thiết kế bài bản, từ cơ bản đến nâng cao
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white space-y-4">
                  <div className="text-6xl">💻</div>
                  <h3 className="text-3xl font-bold">Full-stack Developer</h3>
                  <p className="text-blue-100">12 khóa học • 6 tháng</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Trở thành lập trình viên Full-stack với HTML, CSS, JavaScript, React, Node.js và Database
                </p>
                <Button className="w-full">Xem chi tiết lộ trình</Button>
              </div>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white space-y-4">
                  <div className="text-6xl">📊</div>
                  <h3 className="text-3xl font-bold">Data Analyst</h3>
                  <p className="text-purple-100">10 khóa học • 5 tháng</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Làm chủ phân tích dữ liệu với Excel, SQL, Python, Power BI và kỹ năng visualization
                </p>
                <Button className="w-full">Xem chi tiết lộ trình</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Tại Sao Chọn Chúng Tôi
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Những lý do khiến hàng nghìn học viên tin tưởng và lựa chọn nền tảng của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Instructors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-600 rounded-full mb-4">
              <Award className="w-4 h-4 mr-2" />
              <span className="font-semibold">Đội ngũ chuyên gia</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              👨‍🏫 Giảng Viên Hàng Đầu
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Học từ các chuyên gia hàng đầu với nhiều năm kinh nghiệm thực tế tại các tập đoàn lớn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Instructor 1: Trần Minh Huy */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👨‍💻
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Trần Minh Huy</h3>
                    <p className="text-blue-100 font-medium">Chuyên gia Phát triển Full-Stack</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Với 10 năm kinh nghiệm tại các startup công nghệ, anh Huy tập trung vào các dự án thực tế và tư duy giải quyết vấn đề, giúp bạn xây dựng ứng dụng hoàn chỉnh từ A-Z."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">💻 Full-Stack</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">10+ năm</span>
                </div>
              </div>
            </Card>

            {/* Instructor 2: Dr. Nguyễn An Nhiên */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👩‍🔬
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Dr. Nguyễn An Nhiên</h3>
                    <p className="text-purple-100 font-medium">Tiến sĩ Khoa học Dữ liệu</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Tốt nghiệp từ Đại học Stanford, cô An Nhiên có đam mê biến những con số phức tạp thành các quyết định kinh doanh thông minh và dễ hiểu cho mọi người."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">📊 Data Science</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">🎓 PhD Stanford</span>
                </div>
              </div>
            </Card>

            {/* Instructor 3: Lê Quang Dũng */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👨‍🎨
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Lê Quang Dũng</h3>
                    <p className="text-orange-100 font-medium">Giám đốc Sáng tạo & UX/UI</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Anh Dũng là Giám đốc Sáng tạo tại Z-Creative. Anh sẽ hướng dẫn bạn cách tư duy thiết kế lấy người dùng làm trung tâm và xây dựng một portfolio ấn tượng."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">🎨 UX/UI Design</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Creative Director</span>
                </div>
              </div>
            </Card>

            {/* Instructor 4: Hoàng Thu Thảo */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👩‍💼
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Hoàng Thu Thảo</h3>
                    <p className="text-green-100 font-medium">Chuyên gia Digital Marketing</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Chuyên gia Google Ads & SEO với 8 năm kinh nghiệm thực chiến. Chị Thảo nổi tiếng với các case study thành công về tăng trưởng doanh thu cho doanh nghiệp vừa và nhỏ."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">📈 Marketing</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">8+ năm</span>
                </div>
              </div>
            </Card>

            {/* Instructor 5: Phạm Gia Bảo */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👨‍💼
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Phạm Gia Bảo</h3>
                    <p className="text-indigo-100 font-medium">Chuyên gia Quản trị & Lãnh đạo</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Hơn 15 năm kinh nghiệm quản lý cấp cao tại các tập đoàn đa quốc gia. Thầy Bảo chuyên sâu về kỹ năng lãnh đạo, xây dựng chiến lược và quản trị nhân sự hiệu quả."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">👔 Leadership</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">15+ năm</span>
                </div>
              </div>
            </Card>

            {/* Instructor 6: Jessica Chen */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                <div className="relative text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl border-4 border-white/40">
                    👩‍🏫
                  </div>
                  <div className="px-4">
                    <h3 className="text-2xl font-bold mb-2">Jessica Chen</h3>
                    <p className="text-pink-100 font-medium">Chuyên gia Giao tiếp & Tiếng Anh</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  "Thạc sĩ Ngôn ngữ học ứng dụng, Jessica giúp hàng ngàn học viên phá bỏ rào cản ngôn ngữ, tự tin thuyết trình và đàm phán trong môi trường quốc tế."
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">🗣️ English</span>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">🎓 MA</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              💬 Cảm Nhận Học Viên
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hàng nghìn học viên đã thành công với chúng tôi. Đây là câu chuyện của họ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.comment}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Sẵn sàng khai phá tiềm năng của bạn?
          </h2>
          <p className="text-2xl text-blue-100 mb-12 leading-relaxed">
            Tham gia SkillStream ngay hôm nay. Bắt đầuc hành trình học tập và phát triển sự nghiệp của bạn!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? "/courses" : "/register"}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-6 text-xl font-bold shadow-2xl">
                🚀 Đăng Ký Khóa Học Đầu Tiên
              </Button>
            </Link>
            <Link to="/courses">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 px-12 py-6 text-xl font-bold backdrop-blur-sm"
              >
                📚 Khám Phá Khóa Học
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Học viên</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Khóa học</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <div className="text-blue-200">Chứng chỉ</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/Button";
import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getAllCourses({ limit: 3 });
        if (response.data.success) {
          setFeaturedCourses(response.data.data.courses);
        }
      } catch (error) {
        console.error('Error fetching featured courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'programming': 'Lập trình',
      'design': 'Thiết kế',
      'business': 'Kinh doanh',
      'marketing': 'Marketing',
      'language': 'Ngôn ngữ',
      'science': 'Khoa học',
      'other': 'Khác'
    };
    return categories[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'beginner': 'Cơ bản',
      'intermediate': 'Trung cấp',
      'advanced': 'Nâng cao'
    };
    return levels[level] || level;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-10 py-20">
        <div className="max-w-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary-700 leading-snug">
            Học trực tuyến <span className="text-secondary-600">mọi lúc, mọi nơi</span>
          </h2>
          <p className="mt-6 text-gray-600 text-lg">
            Nền tảng e-learning hiện đại giúp bạn dễ dàng tiếp cận tri thức,
            học tập hiệu quả và kết nối cùng cộng đồng.
          </p>
          <div className="mt-8 flex gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg" className="rounded-xl">
                  🎯 Vào Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button variant="primary" size="lg" className="rounded-xl">
                  🎯 Đăng ký ngay
                </Button>
              </Link>
            )}
            <Link to="/login">
              <Button variant="outline" size="lg" className="rounded-xl">
                📚 Đăng nhập
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 md:mt-0">
          {/* <img
            src="https://illustrations.popsy.co/green/online-learning.svg"
            alt="Learning Illustration"
            className="w-[450px] max-w-full"
          /> */}
        </div>  
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-10 grid md:grid-cols-3 gap-10 text-center">
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-primary-600">
          <div className="mx-auto w-12 h-12 text-primary-600 text-4xl">📚</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Nhiều khóa học</h3>
          <p className="text-gray-600 mt-2">
            Hàng trăm khóa học đa dạng, phù hợp cho mọi cấp độ.
          </p>
        </div>
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-secondary-600">
          <div className="mx-auto w-12 h-12 text-secondary-600 text-4xl">🎥</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Học dễ dàng</h3>
          <p className="text-gray-600 mt-2">
            Nội dung được thiết kế khoa học, dễ tiếp thu và áp dụng thực tế.
          </p>
        </div>
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-primary-600">
          <div className="mx-auto w-12 h-12 text-primary-600 text-4xl">👥</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Cộng đồng học tập</h3>
          <p className="text-gray-600 mt-2">
            Kết nối với giảng viên và bạn học trên toàn quốc.
          </p>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-10 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Khóa học nổi bật</h2>
          <p className="text-gray-600 text-lg">
            Khám phá những khóa học chất lượng cao từ các chuyên gia hàng đầu
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
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
              </div>
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <Link key={course._id} to={`/courses/${course._id}`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
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
                    
                    <div className="flex items-center justify-between">
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
                      <div className="text-right">
                        {course.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through mr-2">
                            {course.price.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        <span className="text-lg font-bold text-primary-600">
                          {course.finalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có khóa học nào
            </h3>
            <p className="text-gray-600">
              Hệ thống đang được cập nhật, vui lòng quay lại sau
            </p>
          </div>
        )}

        <div className="text-center mt-12">
          {isAuthenticated ? (
            <Link to="/courses">
              <Button variant="primary" size="lg" className="rounded-xl">
                Xem tất cả khóa học
              </Button>
            </Link>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-xl">
                  Đăng nhập để xem thêm
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="lg" className="rounded-xl">
                  Đăng ký ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16 px-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Bắt đầu hành trình học tập của bạn</h2>
        <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
          Tham gia cùng hàng ngàn học viên khác để nâng cao kỹ năng và phát triển sự nghiệp của bạn
        </p>
        <div className="flex gap-4 justify-center">
          {!isAuthenticated && (
            <>
              <Link to="/register">
                <Button variant="outline" size="lg" className="rounded-xl text-white border-white hover:bg-white hover:text-primary-600">
                  Đăng ký miễn phí
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="primary" size="lg" className="rounded-xl bg-white text-primary-600 hover:bg-gray-100">
                  Đăng nhập
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

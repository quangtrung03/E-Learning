import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, Award, TrendingUp, Star, ArrowRight, Palette, Play } from 'lucide-react';

import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
  thumbnail?: string;
}

const Home = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAllCourses({ limit: 6 });
        console.log('Home page API response:', response.data); // Debug log
        if (response.data.success && response.data.data.courses) {
          setCourses(response.data.data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const stats = [
    { icon: BookOpen, label: 'Khóa học', value: '100+' },
    { icon: Users, label: 'Học viên', value: '10K+' },
    { icon: Award, label: 'Chứng chỉ', value: '5K+' },
    { icon: TrendingUp, label: 'Tỷ lệ hoàn thành', value: '95%' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Học tập không giới hạn
              <br />
              <span className="text-yellow-300">Phát triển kỹ năng</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90"
            >
              Khám phá hàng ngàn khóa học chất lượng cao từ các chuyên gia hàng đầu.
              Học mọi lúc, mọi nơi với nền tảng E-Learning hiện đại.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {!isAuthenticated ? (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4">
                      Bắt đầu học ngay
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/courses">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4">
                      Khám phá khóa học
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard">
                    <Button size="lg" className="bg- text-blue-600 hover:bg-gray-100 px-8 py-4">
                      Vào Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/courses">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4">
                      Xem khóa học
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full mb-4">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Khóa học nổi bật
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Được chọn lọc kỹ càng từ các chuyên gia hàng đầu trong ngành
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(Array.isArray(courses) ? courses : []).map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hoverable className="h-full">
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 overflow-hidden">
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-80" />
                      </div>
                      {course.discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                          -{course.discount}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {course.rating.average.toFixed(1)} ({course.rating.count})
                          </span>
                        </div>
                        <div className="text-right">
                          {course.discount > 0 ? (
                            <>
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {course.finalPrice.toLocaleString()}đ
                              </div>
                              <div className="text-sm text-gray-500 line-through">
                                {course.price.toLocaleString()}đ
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {course.price.toLocaleString()}đ
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Link to={`/courses/${course._id}`} className="block">
                        <Button className="w-full">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button size="lg" variant="outline">
                Xem tất cả khóa học
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Tham gia cùng hàng nghìn học viên đã tin tưởng và phát triển kỹ năng tại ELearn
          </p>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Đăng ký miễn phí
                </Button>
              </Link>
              <Link to="/theme-settings">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Palette className="w-5 h-5 mr-2" />
                  Khám phá giao diện mới
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Tiếp tục học tập
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
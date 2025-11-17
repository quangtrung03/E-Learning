import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    { 
      name: 'Web Development', 
      count: '2,500+', 
      gradient: 'from-blue-600 to-cyan-600',
      description: 'Build modern web applications'
    },
    { 
      name: 'Data Science', 
      count: '1,800+', 
      gradient: 'from-cyan-600 to-blue-600',
      description: 'Analyze data and build ML models'
    },
    { 
      name: 'UI/UX Design', 
      count: '1,200+', 
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Create beautiful user experiences'
    },
    { 
      name: 'Digital Marketing', 
      count: '900+', 
      gradient: 'from-cyan-500 to-blue-500',
      description: 'Master online marketing strategies'
    }
  ];

  const features = [
    {
      title: 'Expert Instructors',
      description: 'Learn from industry professionals with years of real-world experience',
      gradient: 'from-blue-600 to-cyan-600',
      svg: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: 'Practical Content',
      description: 'Hands-on projects and real-world applications you can use immediately',
      gradient: 'from-cyan-600 to-blue-600',
      svg: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      title: '24/7 Support',
      description: 'Get help whenever you need it with our dedicated support team',
      gradient: 'from-blue-500 to-cyan-500',
      svg: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];

  const instructors = [
    { name: 'Trần Minh Huy', title: 'Full-Stack Development', experience: '10+ years', initial: 'TH', gradient: 'from-blue-600 to-cyan-600' },
    { name: 'Dr. Nguyễn An Nhiên', title: 'Data Science', experience: 'PhD Stanford', initial: 'NA', gradient: 'from-cyan-600 to-blue-600' },
    { name: 'Lê Quang Dũng', title: 'UX/UI Design', experience: 'Lead Designer', initial: 'LD', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Hoàng Thu Thảo', title: 'Digital Marketing', experience: '8+ years', initial: 'HT', gradient: 'from-cyan-500 to-blue-500' },
    { name: 'Phạm Gia Bảo', title: 'Business Strategy', experience: '15+ years', initial: 'PB', gradient: 'from-blue-600 to-cyan-600' },
    { name: 'Jessica Chen', title: 'Business English', experience: 'MA Linguistics', initial: 'JC', gradient: 'from-cyan-600 to-blue-600' }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Anh',
      role: 'Software Engineer at FPT',
      initial: 'NA',
      comment: 'The structured curriculum and dedicated instructors helped me land my dream job.',
      rating: 5
    },
    {
      name: 'Trần Văn B',
      role: 'Career Changer',
      initial: 'TB',
      comment: 'Found exactly what I needed. The teaching style is clear and support is excellent.',
      rating: 5
    },
    {
      name: 'Lê Thị C',
      role: 'Recent Graduate',
      initial: 'LC',
      comment: 'Boosted my confidence with practical knowledge and great networking opportunities.',
      rating: 5
    }
  ];

  const getCategoryLabel = (category: string) => {
    const map: { [key: string]: string } = {
      'programming': 'Programming',
      'design': 'Design',
      'business': 'Business',
      'marketing': 'Marketing',
      'language': 'Language',
      'science': 'Science',
      'other': 'Other'
    };
    return map[category] || category;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Simple Backdrop Blur */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white">
        {/* Simple decorative blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-sm font-medium">Trusted by 50,000+ Students Worldwide</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Master Skills That
              <span className="block bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent mt-2">
                Matter Most
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto leading-relaxed">
              Transform your career with industry-leading courses taught by world-class experts
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/courses">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-10 py-4 text-lg rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all">
                  Explore Courses
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button size="lg" className="bg-cyan-500 text-white hover:bg-cyan-400 font-semibold px-10 py-4 text-lg rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Students', value: '50,000+' },
              { label: 'Expert Courses', value: '15,000+' },
              { label: 'Top Instructors', value: '1,200+' },
              { label: '5-Star Reviews', value: '98%' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trusted By */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-blue-100 text-sm font-medium mb-6">
              Trusted by Leading Companies
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'IBM'].map((brand) => (
                <div key={brand} className="px-8 py-4 bg-white rounded-lg shadow-lg">
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore Top Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your path and start your learning journey today
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link key={index} to="/courses">
                <div className={`group backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 bg-white/90 border-gray-200 hover:border-blue-400 cursor-pointer`}>
                  <div className={`h-40 bg-gradient-to-br ${cat.gradient} flex items-center justify-center relative p-6`}>
                    <div className="text-center text-white">
                      <div className="text-4xl font-bold mb-2">{String(index + 1).padStart(2, '0')}</div>
                      <div className="text-sm opacity-90">{cat.count} courses</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{cat.description}</p>
                    <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                      <span className="mr-2">Explore</span>
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

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-blue-100 text-blue-600 rounded-full mb-4 font-semibold">
              Featured
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Top-rated courses loved by students worldwide
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
                    <div className="relative h-48 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      {course.students?.length > 10 && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-cyan-400 text-blue-900 text-xs font-bold rounded-full">
                          BESTSELLER
                        </div>
                      )}
                      <div className="text-white text-4xl font-bold">
                        {getCategoryLabel(course.category).charAt(0)}
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {course.students?.length || 0} students
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
                          {course.level}
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
                View All Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Structured Learning Paths
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Follow our curated paths designed to take you from beginner to expert
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 border-0 text-white p-8">
              <div className="text-5xl font-bold text-white/20 mb-4">01</div>
              <h3 className="text-3xl font-bold mb-4">Full-Stack Development</h3>
              <p className="text-blue-100 mb-6">Master both frontend and backend development with modern technologies</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-300 rounded-full"></div>
                  <span>6 courses • 120 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-300 rounded-full"></div>
                  <span>Beginner to Advanced</span>
                </div>
              </div>
              <Link to="/courses">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Start Learning
                </Button>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-600 to-blue-600 border-0 text-white p-8">
              <div className="text-5xl font-bold text-white/20 mb-4">02</div>
              <h3 className="text-3xl font-bold mb-4">Data Science & AI</h3>
              <p className="text-cyan-100 mb-6">Learn data analysis, machine learning, and artificial intelligence</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  <span>8 courses • 150 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  <span>Intermediate to Expert</span>
                </div>
              </div>
              <Link to="/courses">
                <Button className="bg-white text-cyan-600 hover:bg-cyan-50 font-semibold">
                  Start Learning
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group backdrop-blur-sm border rounded-2xl p-8 transition-all duration-500 hover:scale-105 bg-white/90 border-gray-200 hover:border-blue-400">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.svg}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies & Skills */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Master In-Demand Technologies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn the most popular and sought-after technologies in the industry
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: 'React', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg', category: 'Frontend' },
              { name: 'Node.js', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg', category: 'Backend' },
              { name: 'Python', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg', category: 'Language' },
              { name: 'TypeScript', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg', category: 'Language' },
              { name: 'MongoDB', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg', category: 'Database' },
              { name: 'Docker', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg', category: 'DevOps' },
              { name: 'AWS', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg', category: 'Cloud' },
              { name: 'Firebase', icon: 'https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg', category: 'Backend' },
              { name: 'Figma', icon: 'https://www.vectorlogo.zone/logos/figma/figma-icon.svg', category: 'Design' },
              { name: 'Git', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg', category: 'Tools' },
              { name: 'Next.js', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg', category: 'Framework' },
              { name: 'Vue.js', icon: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/vuejs/vuejs-original.svg', category: 'Frontend' }
            ].map((tech, index) => (
              <div 
                key={index}
                className="group flex flex-col items-center p-6 backdrop-blur-sm bg-white/80 border border-gray-200 rounded-2xl hover:border-blue-400 hover:scale-110 transition-all duration-300 cursor-pointer"
                title={`${tech.name} - ${tech.category}`}
              >
                <img 
                  src={tech.icon} 
                  alt={tech.name} 
                  className="w-16 h-16 mb-3 group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                  {tech.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">{tech.category}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">And many more technologies to explore!</p>
            <Link to="/courses">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold">
                View All Courses
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
              Learn From The Best
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our instructors are industry leaders and experts in their fields
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor, idx) => (
              <div key={idx} className="group backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 bg-white/90 border-gray-200 hover:border-blue-400">
                <div className={`h-32 bg-gradient-to-br ${instructor.gradient} flex items-center justify-center relative`}>
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">{instructor.initial}</span>
                  </div>
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
              Student Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our students have achieved
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

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students already learning with us
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-10 py-4 text-lg rounded-xl shadow-2xl">
                Get Started Now
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="lg" className="bg-cyan-500 text-white hover:bg-cyan-400 font-semibold px-10 py-4 text-lg rounded-xl shadow-2xl">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

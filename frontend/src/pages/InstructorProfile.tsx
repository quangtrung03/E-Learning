import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentAPI, courseAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  User, 
  Mail, 
  BookOpen, 
  Users, 
  Star, 
  Award, 
  Calendar,
  MapPin,
  Briefcase,
  Facebook,
  Linkedin,
  Twitter,
  Globe
} from 'lucide-react';
import resolveAvatar from '../utils/resolveAvatar';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  title?: string;
  location?: string;
  website?: string;
  social?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  stats?: {
    totalCourses: number;
    totalStudents: number;
    averageRating: number;
    totalReviews: number;
  };
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  price?: number;
  finalPrice?: number;
  rating?: {
    average: number;
    count: number;
  };
  totalStudents?: number;
  status: string;
}

const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const defaultCourseThumbnailUrl = useDefaultCourseThumbnailUrl();
  const fallbackCourseThumbnailUrl = resolveFileUrl(defaultCourseThumbnailUrl || undefined);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInstructorData();
    }
  }, [id]);

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      
      // Fetch instructor info
      const instructorResponse = await contentAPI.getInstructor(id!);
      setInstructor(instructorResponse.data.data.instructor);

      // Fetch instructor's courses
      setCoursesLoading(true);
      const coursesResponse = await courseAPI.getAllCourses({ 
        status: 'approved',
        limit: 50
      } as any);
      setCourses(coursesResponse.data.data.courses || []);
    } catch (error) {
      console.error('Error fetching instructor:', error);
    } finally {
      setLoading(false);
      setCoursesLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy giảng viên
          </h2>
          <p className="text-gray-600 mb-4">
            Giảng viên này không tồn tại hoặc đã bị xóa
          </p>
          <Link to="/courses">
            <Button>Xem khóa học</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                  {instructor.avatar ? (
                    <img
                      src={resolveAvatar(instructor.avatar)}
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <User className="w-16 h-16 md:w-20 md:h-20 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {instructor.name}
                </h1>
                
                {instructor.title && (
                  <p className="text-xl text-blue-100 mb-3 flex items-center justify-center md:justify-start gap-2">
                    <Briefcase className="w-5 h-5" />
                    {instructor.title}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-100 mb-4">
                  {instructor.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{instructor.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{instructor.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Tham gia {new Date(instructor.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(instructor.website || instructor.social) && (
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    {instructor.website && (
                      <a
                        href={instructor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.social?.facebook && (
                      <a
                        href={instructor.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.social?.linkedin && (
                      <a
                        href={instructor.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.social?.twitter && (
                      <a
                        href={instructor.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats */}
          {instructor.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {instructor.stats.totalCourses}
                </div>
                <div className="text-sm text-gray-600">Khóa học</div>
              </Card>

              <Card className="p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {instructor.stats.totalStudents}
                </div>
                <div className="text-sm text-gray-600">Học viên</div>
              </Card>

              <Card className="p-4 text-center">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {instructor.stats.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Đánh giá TB</div>
              </Card>

              <Card className="p-4 text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {instructor.stats.totalReviews}
                </div>
                <div className="text-sm text-gray-600">Nhận xét</div>
              </Card>
            </div>
          )}

          {/* Bio */}
          {instructor.bio && (
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Giới thiệu
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {instructor.bio}
              </p>
            </Card>
          )}

          {/* Expertise */}
          {instructor.expertise && instructor.expertise.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chuyên môn
              </h2>
              <div className="flex flex-wrap gap-2">
                {instructor.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Courses */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Khóa học ({courses.length})
              </h2>
            </div>

            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link key={course._id} to={`/courses/${course._id}`}>
                    <Card className="hover:shadow-lg transition-all duration-300 h-full">
                      <div className="h-48 rounded-t-xl flex items-center justify-center relative overflow-hidden bg-gray-100">
                        {resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl ? (
                          <img
                            src={(resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl)!}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-4xl font-bold">{course.title.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {getCategoryLabel(course.category)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {getLevelLabel(course.level)}
                          </span>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-900">
                              {course.rating?.average?.toFixed(1) || 'Chưa có'}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({course.rating?.count || 0})
                            </span>
                          </div>

                          <div className="text-right">
                            {course.finalPrice !== undefined && course.finalPrice > 0 ? (
                              <div>
                                <span className="text-lg font-bold text-blue-600">
                                  {course.finalPrice.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-green-600">
                                Miễn phí
                              </span>
                            )}
                          </div>
                        </div>

                        {course.totalStudents !== undefined && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-1 text-gray-600 text-sm">
                            <Users className="w-4 h-4" />
                            <span>{course.totalStudents} học viên</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Giảng viên chưa có khóa học nào được công khai
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;

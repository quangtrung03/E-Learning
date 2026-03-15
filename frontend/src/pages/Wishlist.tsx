import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, ShoppingCart, Trash2, Star } from 'lucide-react';
import { wishlistAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';

interface WishlistCourse {
  _id: string;
  title: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  finalPrice?: number;
  rating?: { average: number; count: number };
  instructor?: { name: string; avatar?: string };
  status: string;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao'
};

const WishlistCourseThumbnail = ({ course }: { course: WishlistCourse }) => {
  const defaultThumbnail = useDefaultCourseThumbnailUrl();
  const src = course.thumbnail ? resolveFileUrl(course.thumbnail) : (defaultThumbnail || undefined);
  return (
    <img
      src={src}
      alt={course.title}
      className="w-full h-40 object-cover rounded-t-xl"
      onError={(e) => {
        if (defaultThumbnail) (e.target as HTMLImageElement).src = defaultThumbnail;
      }}
    />
  );
};

const Wishlist = () => {
  const toast = useToast();
  const [wishlist, setWishlist] = useState<WishlistCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.getWishlist();
      if (res.data.success) {
        setWishlist(res.data.data.wishlist || []);
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải danh sách yêu thích' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId: string) => {
    try {
      setRemovingId(courseId);
      await wishlistAPI.removeFromWishlist(courseId);
      setWishlist(prev => prev.filter(c => c._id !== courseId));
      toast.showToast({ type: 'success', title: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh sách yêu thích</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {wishlist.length > 0 ? `${wishlist.length} khóa học đã lưu` : 'Chưa có khóa học nào'}
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <Card className="p-16 text-center">
          <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">Danh sách yêu thích trống</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Bắt đầu khám phá các khóa học và nhấn ♥ để lưu vào danh sách yêu thích của bạn.
          </p>
          <Link to="/courses">
            <Button className="flex items-center gap-2 mx-auto">
              <BookOpen className="w-4 h-4" />
              Khám phá khóa học
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map(course => (
              <Card key={course._id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <Link to={`/courses/${course._id}`}>
                    <WishlistCourseThumbnail course={course} />
                  </Link>
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(course._id)}
                    disabled={removingId === course._id}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Xóa khỏi yêu thích"
                  >
                    {removingId === course._id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  {/* Level badge */}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-medium bg-black/60 text-white rounded">
                    {LEVEL_LABELS[course.level] || course.level}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-blue-600 font-medium mb-1">{course.category}</p>
                  <Link to={`/courses/${course._id}`}>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 hover:text-blue-600 line-clamp-2 transition-colors">
                      {course.title}
                    </h3>
                  </Link>

                  {course.instructor && (
                    <p className="text-xs text-gray-500 mb-2">bởi {course.instructor.name}</p>
                  )}

                  {course.rating && course.rating.count > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-gray-800">
                        {course.rating.average.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">({course.rating.count})</span>
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t flex items-center justify-between">
                    <div>
                      {(course.finalPrice ?? course.price) === 0 ? (
                        <span className="text-green-600 font-bold text-sm">Miễn phí</span>
                      ) : (
                        <div>
                          <span className="text-blue-600 font-bold text-sm">
                            {(course.finalPrice ?? course.price).toLocaleString('vi-VN')}đ
                          </span>
                          {course.finalPrice !== undefined && course.finalPrice < course.price && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              {course.price.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link to={`/payment/checkout/${course._id}`}>
                      <Button size="sm" className="flex items-center gap-1 text-xs">
                        <ShoppingCart className="w-3 h-3" />
                        Mua ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link to="/courses">
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Tìm thêm khóa học
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;

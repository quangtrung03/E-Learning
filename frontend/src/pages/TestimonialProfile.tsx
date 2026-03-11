import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { contentAPI } from '../services/api';
import resolveFileUrl from '../utils/resolveFileUrl';

interface Testimonial {
  _id: string;
  name: string;
  slug: string;
  role: string;
  comment: string;
  rating: number;
  avatarUrl?: string;
  bio?: string;
  highlights?: string[];
}

const TestimonialProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await contentAPI.getTestimonial(slug);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error('Error fetching testimonial profile:', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
          <p className="text-gray-600 mb-6">Nhân vật này không tồn tại hoặc đã bị ẩn.</p>
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const avatar = resolveFileUrl(data.avatarUrl);
  const initial = data.name?.trim()?.split(' ').slice(-1)[0]?.slice(0, 1)?.toUpperCase() || data.name?.slice(0, 1)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                  <div className="relative w-full h-full flex items-center justify-center bg-blue-100">
                    <span className="text-5xl font-bold text-blue-600">{initial}</span>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={data.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.name}</h1>
                <p className="text-xl text-blue-100 mb-4">{data.role}</p>

                <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < (data.rating || 0) ? 'text-yellow-300' : 'text-white/30'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center md:justify-start">
                  <Link to="/">
                    <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      Về trang chủ
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chia sẻ</h2>
            <p className="text-gray-700 leading-relaxed italic">"{data.comment}"</p>
          </Card>

          {data.bio && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.bio}</p>
            </Card>
          )}

          {Array.isArray(data.highlights) && data.highlights.length > 0 && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Điểm nổi bật</h2>
              <ul className="space-y-2">
                {data.highlights.map((h, idx) => (
                  <li key={idx} className="text-gray-700 flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialProfile;

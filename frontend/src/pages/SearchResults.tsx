import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/api';

type SearchType = 'all' | 'courses' | 'users' | 'posts' | 'categories';

interface Course { _id: string; title: string; description: string; thumbnail: string; instructor: { name: string }; price: number; rating: number; enrollmentCount: number }
interface User { _id: string; name: string; bio: string; avatar: string; followerCount: number }
interface Post { _id: string; content: string; author: { _id: string; name: string; avatar: string }; likeCount: number; commentCount: number; createdAt: string }
interface Category { _id: string; name: string; description: string; icon: string; courseCount: number }

const TABS: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'courses', label: 'Khóa học' },
  { value: 'users', label: 'Người dùng' },
  { value: 'posts', label: 'Bài viết' },
  { value: 'categories', label: 'Danh mục' },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as SearchType;
  const [results, setResults] = useState<{ courses: Course[]; users: User[]; posts: Post[]; categories: Category[] }>({
    courses: [], users: [], posts: [], categories: []
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState({ courses: 0, users: 0, posts: 0, categories: 0 });

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    searchAPI.global({ q, type, page: 1, limit: 20 })
      .then(res => {
        const d = res.data;
        setResults({
          courses: d.courses?.results || [],
          users: d.users?.results || [],
          posts: d.posts?.results || [],
          categories: d.categories?.results || [],
        });
        setTotal({
          courses: d.courses?.total || 0,
          users: d.users?.total || 0,
          posts: d.posts?.total || 0,
          categories: d.categories?.total || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, type]);

  const setType = (t: SearchType) => setSearchParams({ q, type: t });
  const grandTotal = total.courses + total.users + total.posts + total.categories;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {q ? (
              <>Kết quả cho <span className="text-blue-600 dark:text-blue-400">"{q}"</span></>
            ) : 'Tìm kiếm'}
          </h1>
          {!loading && q && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{grandTotal} kết quả tìm thấy</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setType(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${type === tab.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {tab.label}
              {tab.value !== 'all' && total[tab.value as keyof typeof total] > 0 && (
                <span className={`ml-1.5 text-xs ${type === tab.value ? 'text-blue-200' : 'text-gray-400'}`}>
                  {total[tab.value as keyof typeof total]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-4 animate-pulse">
                  <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && q && grandTotal === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Không tìm thấy kết quả</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thử tìm với từ khóa khác hoặc kiểm tra chính tả</p>
          </div>
        )}

        {/* No query */}
        {!q && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔎</div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nhập từ khóa để tìm kiếm</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-8">
            {/* Courses */}
            {(type === 'all' || type === 'courses') && results.courses.length > 0 && (
              <section>
                {type === 'all' && <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">📚 Khóa học ({total.courses})</h2>}
                <div className="space-y-3">
                  {results.courses.map(c => (
                    <Link key={c._id} to={`/courses/${c._id}`}
                      className="flex gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0 group-hover:opacity-90" />
                      ) : (
                        <div className="w-20 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-2xl">📚</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{c.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{c.instructor?.name}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span>⭐ {c.rating?.toFixed(1) || 'Mới'}</span>
                          <span>👥 {c.enrollmentCount || 0} học viên</span>
                          {c.price === 0 ? <span className="text-green-600 font-medium">Miễn phí</span> : <span>{c.price?.toLocaleString('vi-VN')}₫</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Users */}
            {(type === 'all' || type === 'users') && results.users.length > 0 && (
              <section>
                {type === 'all' && <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">👤 Người dùng ({total.users})</h2>}
                <div className="space-y-3">
                  {results.users.map(u => (
                    <Link key={u._id} to={`/users/${u._id}`}
                      className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{u.name?.[0]?.toUpperCase()}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{u.name}</p>
                        {u.bio && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{u.bio}</p>}
                        <p className="text-xs text-gray-400 mt-1">{u.followerCount || 0} người theo dõi</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {(type === 'all' || type === 'posts') && results.posts.length > 0 && (
              <section>
                {type === 'all' && <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">📝 Bài viết ({total.posts})</h2>}
                <div className="space-y-3">
                  {results.posts.map(p => (
                    <Link key={p._id} to={`/users/${p.author?._id}`}
                      className="block bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-600">
                          {p.author?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.author?.name}</span>
                        <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{p.content}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>❤️ {p.likeCount || 0}</span>
                        <span>💬 {p.commentCount || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            {(type === 'all' || type === 'categories') && results.categories.length > 0 && (
              <section>
                {type === 'all' && <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">🗂️ Danh mục ({total.categories})</h2>}
                <div className="grid grid-cols-2 gap-3">
                  {results.categories.map(cat => (
                    <Link key={cat._id} to={`/courses?category=${cat._id}`}
                      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                      <span className="text-2xl">{cat.icon || '📁'}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{cat.courseCount || 0} khóa học</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

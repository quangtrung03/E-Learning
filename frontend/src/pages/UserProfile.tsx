import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { socialAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  isAdmin: boolean;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

interface Post {
  _id: string;
  content: string;
  images: { url: string }[];
  likeCount: number;
  commentCount: number;
  type: string;
  createdAt: string;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  const socialIconMap: Record<string, string> = {
    facebook: '📘', twitter: '🐦', linkedin: '💼', github: '🐙', youtube: '▶️', instagram: '📷'
  };

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        socialAPI.getUserProfile(id),
        socialAPI.getUserPosts(id, { limit: 18 })
      ]);
      setUserData(profileRes.data.user);
      setPosts(postsRes.data.posts || []);
    } catch {
      navigate('/404');
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // If own profile, redirect to /profile
  useEffect(() => {
    if (userData?.isOwnProfile && currentUser) {
      navigate('/profile', { replace: true });
    }
  }, [userData, currentUser, navigate]);

  const handleFollow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!userData) return;
    setFollowLoading(true);
    try {
      const res = await socialAPI.toggleFollow(userData._id);
      setUserData(prev => prev ? {
        ...prev,
        isFollowing: res.data.following,
        followerCount: res.data.followerCount
      } : null);
    } catch { /* ignore */ }
    setFollowLoading(false);
  };

  const handleMessage = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 -mt-16 py-4">
          <div className="flex items-end gap-4">
            <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse border-4 border-white dark:border-gray-900" />
            <div className="flex-1 pb-2 space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {userData.coverImage && (
          <img src={userData.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="relative -mt-16 flex flex-col md:flex-row items-start md:items-end gap-4 pb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 overflow-hidden shadow-xl">
              {userData.avatar ? (
                <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {userData.isAdmin && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>

          {/* Info + Actions */}
          <div className="flex-1 md:pb-2">
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {userData.name}
                  {userData.isAdmin && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
                  )}
                </h1>
                {userData.location && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {userData.location}
                  </p>
                )}
              </div>

              {isAuthenticated && !userData.isOwnProfile && (
                <div className="flex gap-2 md:ml-auto">
                  <button onClick={handleFollow} disabled={followLoading}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${userData.isFollowing
                        ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      }`}>
                    {followLoading ? '...' : userData.isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi'}
                  </button>
                  <button onClick={handleMessage}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    💬 Nhắn tin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 py-4 border-t border-b border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{userData.postCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bài viết</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{userData.followerCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Người theo dõi</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{userData.followingCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Đang theo dõi</p>
          </div>
        </div>

        {/* Bio */}
        {userData.bio && (
          <p className="py-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{userData.bio}</p>
        )}
        {userData.website && (
          <a href={userData.website} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1 mb-3">
            🌐 {userData.website.replace(/^https?:\/\//, '')}
          </a>
        )}
        {userData.socialLinks && Object.entries(userData.socialLinks).some(([, v]) => v) && (
          <div className="flex gap-3 mb-4">
            {Object.entries(userData.socialLinks).filter(([, v]) => v).map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-xl hover:scale-110 transition-transform" title={key}>
                {socialIconMap[key] || '🔗'}
              </a>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex">
            {[
              { id: 'posts', label: '📝 Bài viết' },
              { id: 'about', label: '👤 Giới thiệu' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="pb-12">
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Người dùng này chưa đăng bài</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map(post => (
                  <div key={post._id} className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
                    {post.images?.[0] ? (
                      <img src={post.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-3">
                        <p className="text-gray-700 dark:text-gray-300 text-xs text-center line-clamp-4">{post.content}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-medium">
                      <span>❤️ {post.likeCount}</span>
                      <span>💬 {post.commentCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">👤 Giới thiệu</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {userData.bio || 'Người dùng này chưa có giới thiệu.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📬 Thông tin</h3>
                <div className="space-y-2">
                  {userData.location && (
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">📍 {userData.location}</p>
                  )}
                  {userData.website && (
                    <a href={userData.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      🌐 {userData.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    📅 Tham gia {new Date(userData.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Social links */}
              {userData.socialLinks && Object.entries(userData.socialLinks).some(([, v]) => v) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🔗 Mạng xã hội</h3>
                  <div className="space-y-2">
                    {Object.entries(userData.socialLinks).filter(([, v]) => v).map(([key, url]) => (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <span>{socialIconMap[key] || '🔗'}</span>
                        <span>{url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

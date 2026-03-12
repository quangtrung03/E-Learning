import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { uploadAPI, socialAPI } from '../services/api';
import FileUploadCard from '../components/upload/FileUploadCard';
import resolveAvatar from '../utils/resolveAvatar';

// ─── Types ───────────────────────────────────────────
interface SocialLinks {
  facebook?: string; twitter?: string; linkedin?: string;
  github?: string; youtube?: string; instagram?: string;
}
interface Post {
  _id: string; content: string; images: { url: string }[];
  likeCount: number; commentCount: number; viewCount: number; createdAt: string; type: string;
}

// ─── Admin Request Section ───────────────────────────
const AdminRequestSection: React.FC = () => {
  const { showToast } = useToast();
  const [requesting, setRequesting] = useState(false);

  const handleRequestAdmin = async () => {
    setRequesting(true);
    try {
      await api.post('/auth/admin/request');
      showToast({ type: 'success', title: 'Đã gửi yêu cầu thành công!', message: 'Vui lòng kiểm tra email để hoàn tất thông tin.' });
    } catch (error: any) {
      showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Trở thành Quản trị viên</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">Bạn muốn trở thành quản trị viên để quản lý hệ thống? Gửi yêu cầu và chúng tôi sẽ xem xét.</p>
          <button onClick={handleRequestAdmin} disabled={requesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {requesting && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {requesting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Profile Modal ───────────────────────────────
const EditProfileModal: React.FC<{ user: any; onClose: () => void; onSaved: (updated: any) => void }> = ({ user, onClose, onSaved }) => {
  const { updateProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'social' | 'avatar'>('basic');

  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    bio: user.bio || '',
    website: user.website || '',
    location: user.location || '',
    socialLinks: {
      facebook: user.socialLinks?.facebook || '',
      twitter: user.socialLinks?.twitter || '',
      linkedin: user.socialLinks?.linkedin || '',
      github: user.socialLinks?.github || '',
      youtube: user.socialLinks?.youtube || '',
      instagram: user.socialLinks?.instagram || '',
    } as SocialLinks
  });
  const [pendingAvatar, setPendingAvatar] = useState('');
  const [pendingCover, setPendingCover] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [e.target.name]: e.target.value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('bio', form.bio);
      if (pendingAvatar) fd.append('avatarUrl', pendingAvatar);
      await updateProfile(fd);

      const socialData: any = { website: form.website, location: form.location, socialLinks: form.socialLinks };
      if (pendingAvatar) socialData.avatar = pendingAvatar;
      if (pendingCover) socialData.coverImage = pendingCover;
      await socialAPI.updateSocialProfile(socialData);

      showToast({ type: 'success', title: 'Cập nhật hồ sơ thành công!' });
      onSaved({ ...user, ...form, avatar: pendingAvatar || user.avatar, coverImage: pendingCover || user.coverImage });
      onClose();
    } catch {
      showToast({ type: 'error', title: 'Có lỗi khi cập nhật hồ sơ' });
    }
    setSaving(false);
  };

  const sections = [
    { id: 'basic', label: '📋 Thông tin cơ bản' },
    { id: 'avatar', label: '🖼️ Ảnh đại diện' },
    { id: 'social', label: '🔗 Mạng xã hội' }
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-3 space-y-1 flex-shrink-0">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${activeSection === s.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên *</label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (không thể thay đổi)</label>
                  <input value={user.email} readOnly
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm" placeholder="+84..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiểu sử</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm resize-none" placeholder="Viết vài dòng về bản thân..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí / Địa chỉ</label>
                  <input name="location" value={form.location} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm" placeholder="Hà Nội, Việt Nam" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input name="website" value={form.website} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm" placeholder="https://..." />
                </div>
              </div>
            )}

            {activeSection === 'avatar' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ảnh đại diện</p>
                  <div className="flex items-center gap-4 mb-3">
                    {(pendingAvatar || user.avatar) && (
                      <img src={pendingAvatar || resolveAvatar(user.avatar) || ''} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500" />
                    )}
                    <div className="flex-1">
                      <FileUploadCard
                        title="Tải ảnh đại diện"
                        description="JPG, PNG, GIF. Tối đa 5MB."
                        accept="image/*"
                        maxSizeMB={5}
                        validateFile={f => f.type.startsWith('image/') ? null : 'Chỉ chấp nhận file ảnh'}
                        uploadedUrl={pendingAvatar}
                        onUploadedUrlChange={setPendingAvatar}
                        uploadFile={async (file, onProgress) => {
                          const fd = new FormData(); fd.append('file', file);
                          const res = await uploadAPI.uploadImage(fd, onProgress, 'avatar');
                          return res.data.data;
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ảnh bìa</p>
                  <div className="mb-3">
                    {(pendingCover || user.coverImage) && (
                      <img src={pendingCover || user.coverImage} alt="" className="w-full h-28 object-cover rounded-xl mb-2" />
                    )}
                    <FileUploadCard
                      title="Tải ảnh bìa"
                      description="Khuyến nghị 1200×400px. JPG, PNG."
                      accept="image/*"
                      maxSizeMB={10}
                      validateFile={f => f.type.startsWith('image/') ? null : 'Chỉ chấp nhận file ảnh'}
                      uploadedUrl={pendingCover}
                      onUploadedUrlChange={setPendingCover}
                      uploadFile={async (file, onProgress) => {
                        const fd = new FormData(); fd.append('file', file);
                        const res = await uploadAPI.uploadImage(fd, onProgress, 'cover');
                        return res.data.data;
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'social' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Thêm link mạng xã hội để mọi người dễ kết nối với bạn.</p>
                {[
                  { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username', icon: '📘' },
                  { name: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/username', icon: '🐦' },
                  { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', icon: '💼' },
                  { name: 'github', label: 'GitHub', placeholder: 'https://github.com/username', icon: '🐙' },
                  { name: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel', icon: '▶️' },
                  { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', icon: '📷' },
                ].map(({ name, label, placeholder, icon }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{icon} {label}</label>
                    <input name={name} value={(form.socialLinks as any)[name]} onChange={handleSocialChange}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────
const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'courses' | 'saved' | 'about'>('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) setProfileData(user);
  }, [user, isAuthenticated, navigate]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      const [postsRes, profileRes] = await Promise.all([
        socialAPI.getUserPosts(user._id, { limit: 20 }),
        socialAPI.getUserProfile(user._id)
      ]);
      setPosts(postsRes.data.posts || []);
      setStats({
        posts: profileRes.data.user?.postCount || 0,
        followers: profileRes.data.user?.followerCount || 0,
        following: profileRes.data.user?.followingCount || 0
      });
    } catch { /* ignore */ }
    setLoadingPosts(false);
  }, [user]);

  const loadSavedPosts = useCallback(async () => {
    try {
      const res = await socialAPI.getSavedPosts({ limit: 20 });
      setSavedPosts(res.data.posts || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) loadPosts();
  }, [user, loadPosts]);

  useEffect(() => {
    if (activeTab === 'saved' && savedPosts.length === 0) loadSavedPosts();
  }, [activeTab, savedPosts.length, loadSavedPosts]);

  const handleProfileSaved = (updated: any) => setProfileData((prev: any) => ({ ...prev, ...updated }));

  if (!user || !profileData) return null;

  const avatar = resolveAvatar(profileData.avatar || user.avatar);
  const coverImage = profileData.coverImage || user.coverImage;

  const socialIconMap: Record<string, string> = {
    facebook: '📘', twitter: '🐦', linkedin: '💼', github: '🐙', youtube: '▶️', instagram: '📷'
  };

  const tabs = [
    { id: 'posts', label: '📝 Bài viết' },
    { id: 'courses', label: '📚 Khóa học' },
    { id: 'saved', label: '🔖 Đã lưu' },
    { id: 'about', label: '👤 Giới thiệu' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 overflow-hidden">
        {coverImage && <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/10" />
        <button onClick={() => setShowEditModal(true)}
          className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-1 shadow">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Đổi ảnh bìa
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile header */}
        <div className="relative -mt-16 flex flex-col md:flex-row items-start md:items-end gap-4 pb-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 overflow-hidden shadow-xl">
              {avatar ? (
                <img src={avatar as string} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {user.isAdmin && (
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>

          <div className="flex-1 md:pb-2">
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {profileData.name || user.name}
                  {user.isAdmin && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Admin</span>}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                {(profileData.location || user.location) && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profileData.location || user.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2 md:ml-auto">
                <button onClick={() => setShowEditModal(true)}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  ✏️ Chỉnh sửa
                </button>
                <Link to="/settings" className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  ⚙️ Cài đặt
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.posts}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bài viết</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-70 transition-opacity">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.followers}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Người theo dõi</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-70 transition-opacity">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.following}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Đang theo dõi</p>
          </div>
        </div>

        {/* Bio & Links */}
        {(profileData.bio || user.bio) && (
          <p className="py-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{profileData.bio || user.bio}</p>
        )}
        {(profileData.website || user.website) && (
          <a href={profileData.website || user.website} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1 mb-3">
            🌐 {(profileData.website || user.website)?.replace(/^https?:\/\//, '')}
          </a>
        )}
        {profileData.socialLinks && Object.entries(profileData.socialLinks as SocialLinks).some(([, v]) => v) && (
          <div className="flex gap-3 mb-4">
            {Object.entries(profileData.socialLinks as SocialLinks).filter(([, v]) => v).map(([key, url]) => (
              <a key={key} href={url as string} target="_blank" rel="noopener noreferrer" className="text-xl hover:scale-110 transition-transform" title={key}>
                {socialIconMap[key] || '🔗'}
              </a>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="pb-12">
          {activeTab === 'posts' && (
            loadingPosts ? (
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Hãy chia sẻ kiến thức và trải nghiệm của bạn</p>
                <Link to="/feed" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Đăng bài đầu tiên
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map(post => (
                  <Link key={post._id} to="/feed" className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
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
                  </Link>
                ))}
              </div>
            )
          )}

          {activeTab === 'courses' && (
            <div>
              <div className="flex gap-3 mb-6">
                <Link to="/my-courses" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">📚 Khóa học đang học</Link>
                <Link to="/courses" className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">🔍 Khám phá</Link>
                <Link to="/certificates" className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">🏆 Chứng chỉ</Link>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            savedPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔖</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết đã lưu</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Lưu các bài viết hay để xem lại sau</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {savedPosts.map(post => (
                  <Link key={post._id} to="/feed" className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                    {post.images?.[0] ? (
                      <img src={post.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3">
                        <p className="text-gray-700 dark:text-gray-300 text-xs text-center line-clamp-4">{post.content}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-medium">
                      <span>❤️ {post.likeCount}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">👤 Giới thiệu</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {profileData.bio || user.bio || 'Chưa có giới thiệu. Nhấn "Chỉnh sửa" để thêm.'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📬 Thông tin liên hệ</h3>
                <div className="space-y-2">
                  {(profileData.location || user.location) && (
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">📍 {profileData.location || user.location}</p>
                  )}
                  {(profileData.website || user.website) && (
                    <a href={profileData.website || user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      🌐 {(profileData.website || user.website)?.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    📅 Tham gia {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>

              {!user.isAdmin && <AdminRequestSection />}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal user={{ ...user, ...profileData }} onClose={() => setShowEditModal(false)} onSaved={handleProfileSaved} />
      )}
    </div>
  );
};

export default Profile;

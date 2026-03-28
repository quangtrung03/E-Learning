import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { socialAPI } from '../services/api';
import api from '../services/api';

type Section = 'appearance' | 'notifications' | 'privacy' | 'account' | 'language';

interface Preferences {
  language: 'vi' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    newMessage: boolean;
    courseUpdates: boolean;
    promotions: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
    allowMessages: 'everyone' | 'followers' | 'none';
  };
  reminders?: {
    enabled?: boolean;
    time?: string;
    frequency?: 'daily' | 'weekdays' | 'weekends';
    channels?: {
      inApp?: boolean;
      email?: boolean;
    };
  };
}

const defaultPreferences: Preferences = {
  language: 'vi',
  theme: 'system',
  notifications: {
    email: true,
    newFollower: true,
    newComment: true,
    newLike: true,
    newMessage: true,
    courseUpdates: true,
    promotions: false
  },
  privacy: {
    profilePublic: true,
    showEmail: false,
    showPhone: false,
    allowMessages: 'everyone'
  },
  reminders: {
    enabled: true,
    time: '19:00',
    frequency: 'daily',
    channels: {
      inApp: true,
      email: false
    }
  }
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)] ${checked ? 'bg-[var(--app-accent)]' : 'bg-[color:color-mix(in_srgb,var(--app-accent)_22%,var(--app-surface-soft))]'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('appearance');
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadPreferences();
  }, [isAuthenticated, navigate]);

  const loadPreferences = async () => {
    try {
      const res = await socialAPI.getPreferences();
      if (res.data.preferences) {
        setPrefs(prev => ({ ...prev, ...res.data.preferences }));
      }
    } catch { /* use defaults */ }
    setLoading(false);
  };

  const savePreferences = async (updates: Partial<Preferences>) => {
    setSaving(true);
    try {
      await socialAPI.updatePreferences(updates);
      showToast({ type: 'success', title: 'Đã lưu cài đặt' });
    } catch {
      showToast({ type: 'error', title: 'Lỗi khi lưu cài đặt' });
    }
    setSaving(false);
  };

  const handleThemeChange = (theme: Preferences['theme']) => {
    setPrefs(prev => ({ ...prev, theme }));
    savePreferences({ theme });
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark'); else root.classList.remove('dark');
    }
  };

  const handleLanguageChange = (language: Preferences['language']) => {
    setPrefs(prev => ({ ...prev, language }));
    savePreferences({ language });
  };

  const handleNotifChange = (key: keyof Preferences['notifications'], val: boolean) => {
    const updated = { ...prefs.notifications, [key]: val };
    setPrefs(prev => ({ ...prev, notifications: updated }));
    savePreferences({ notifications: updated });
  };

  const handleReminderChange = (updates: Partial<NonNullable<Preferences['reminders']>>) => {
    const updated = {
      ...prefs.reminders,
      ...updates,
      channels: {
        ...prefs.reminders?.channels,
        ...(updates.channels || {})
      }
    };
    setPrefs(prev => ({ ...prev, reminders: updated }));
    savePreferences({ reminders: updated });
  };

  const handlePrivacyChange = (key: keyof Preferences['privacy'], val: any) => {
    const updated = { ...prefs.privacy, [key]: val };
    setPrefs(prev => ({ ...prev, privacy: updated }));
    savePreferences({ privacy: updated });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast({ type: 'error', title: 'Mật khẩu mới không khớp' }); return;
    }
    if (pwForm.newPassword.length < 6) {
      showToast({ type: 'error', title: 'Mật khẩu phải có ít nhất 6 ký tự' }); return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/update-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast({ type: 'success', title: 'Đã đổi mật khẩu thành công!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast({ type: 'error', title: err.response?.data?.message || 'Lỗi khi đổi mật khẩu' });
    }
    setPwLoading(false);
  };

  const menuItems: { id: Section; label: string; icon: string }[] = [
    { id: 'appearance', label: 'Giao diện', icon: '🎨' },
    { id: 'language', label: 'Ngôn ngữ', icon: '🌐' },
    { id: 'notifications', label: 'Thông báo', icon: '🔔' },
    { id: 'privacy', label: 'Quyền riêng tư', icon: '🔒' },
    { id: 'account', label: 'Tài khoản', icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div className="app-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--app-accent)]" />
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--app-text)]">Cài đặt</h1>
          <p className="text-sm text-[var(--app-muted)] mt-1">Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <div className="app-panel p-2 sticky top-6">
              {menuItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`app-menu-item ${activeSection === item.id ? 'app-menu-item-active' : ''}`}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div className="mt-2 pt-2 border-t border-[color:color-mix(in_srgb,var(--app-accent)_20%,transparent)]">
                <Link to="/profile" className="app-menu-item">
                  <span>👤</span> Xem hồ sơ
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* ─── Appearance ─── */}
            {activeSection === 'appearance' && (
              <div className="app-panel p-6">
                <h2 className="text-lg font-semibold text-[var(--app-text)] mb-1">🎨 Giao diện</h2>
                <p className="text-sm text-[var(--app-muted)] mb-6">Chọn chủ đề màu sắc phù hợp với bạn</p>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Sáng', icon: '☀️', desc: 'Nền trắng, sáng sủa' },
                    { value: 'dark', label: 'Tối', icon: '🌙', desc: 'Nền tối, dễ nhìn đêm' },
                    { value: 'system', label: 'Hệ thống', icon: '💻', desc: 'Theo cài đặt thiết bị' }
                  ].map(opt => (
                    <button key={opt.value} onClick={() => handleThemeChange(opt.value as any)}
                      className={`app-option-card ${prefs.theme === opt.value ? 'app-option-card-active' : ''}`}>
                      <div className="text-2xl mb-2">{opt.icon}</div>
                      <p className="font-medium text-[var(--app-text)] text-sm">{opt.label}</p>
                      <p className="text-xs text-[var(--app-muted)] mt-0.5">{opt.desc}</p>
                      {prefs.theme === opt.value && (
                        <div className="mt-2 flex items-center gap-1 text-[var(--app-accent)] text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Đang dùng
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Language ─── */}
            {activeSection === 'language' && (
              <div className="app-panel p-6">
                <h2 className="text-lg font-semibold text-[var(--app-text)] mb-1">🌐 Ngôn ngữ</h2>
                <p className="text-sm text-[var(--app-muted)] mb-6">Chọn ngôn ngữ hiển thị trên nền tảng</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', desc: 'Ngôn ngữ mặc định' },
                    { value: 'en', label: 'English', flag: '🇺🇸', desc: 'International language' }
                  ].map(lang => (
                    <button key={lang.value} onClick={() => handleLanguageChange(lang.value as any)}
                      className={`app-option-card ${prefs.language === lang.value ? 'app-option-card-active' : ''}`}>
                      <div className="text-2xl mb-2">{lang.flag}</div>
                      <p className="font-medium text-[var(--app-text)] text-sm">{lang.label}</p>
                      <p className="text-xs text-[var(--app-muted)] mt-0.5">{lang.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Notifications ─── */}
            {activeSection === 'notifications' && (
              <div className="app-panel p-6">
                <h2 className="text-lg font-semibold text-[var(--app-text)] mb-1">🔔 Thông báo</h2>
                <p className="text-sm text-[var(--app-muted)] mb-6">Quản lý những thông báo bạn muốn nhận</p>

                <div className="space-y-1">
                  {[
                    { key: 'email', label: 'Thông báo qua Email', desc: 'Nhận email về hoạt động quan trọng' },
                    { key: 'newFollower', label: 'Người theo dõi mới', desc: 'Khi có người theo dõi bạn' },
                    { key: 'newComment', label: 'Bình luận mới', desc: 'Khi có người bình luận vào bài viết của bạn' },
                    { key: 'newLike', label: 'Lượt thích', desc: 'Khi có người thích bài viết của bạn' },
                    { key: 'newMessage', label: 'Tin nhắn mới', desc: 'Khi nhận được tin nhắn mới' },
                    { key: 'courseUpdates', label: 'Cập nhật khóa học', desc: 'Thông báo về khóa học bạn đang học' },
                    { key: 'promotions', label: 'Khuyến mãi & Ưu đãi', desc: 'Thông tin về khuyến mại và giảm giá' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-[color:color-mix(in_srgb,var(--app-accent)_16%,transparent)] last:border-0">
                      <div>
                        <p className="font-medium text-[var(--app-text)] text-sm">{item.label}</p>
                        <p className="text-xs text-[var(--app-muted)] mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={prefs.notifications[item.key as keyof typeof prefs.notifications]}
                        onChange={val => handleNotifChange(item.key as keyof typeof prefs.notifications, val)}
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[color:color-mix(in_srgb,var(--app-accent)_16%,transparent)]">
                  <h3 className="text-base font-semibold text-[var(--app-text)] mb-1">⏰ Nhắc học tập thông minh</h3>
                  <p className="text-xs text-[var(--app-muted)] mb-3">Cài đặt giờ nhắc học, tần suất và kênh thông báo cho lộ trình của bạn</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--app-text)] text-sm">Bật nhắc học</p>
                        <p className="text-xs text-[var(--app-muted)]">Gửi nhắc nhở theo lịch đã đặt</p>
                      </div>
                      <Toggle
                        checked={Boolean(prefs.reminders?.enabled)}
                        onChange={(val) => handleReminderChange({ enabled: val })}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--app-muted)] mb-1">Giờ nhắc</label>
                        <input
                          type="time"
                          value={prefs.reminders?.time || '19:00'}
                          onChange={(e) => handleReminderChange({ time: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 text-sm bg-[var(--app-surface)] text-[var(--app-text)] border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]"
                          disabled={saving || !prefs.reminders?.enabled}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--app-muted)] mb-1">Tần suất</label>
                        <select
                          value={prefs.reminders?.frequency || 'daily'}
                          onChange={(e) => handleReminderChange({ frequency: e.target.value as 'daily' | 'weekdays' | 'weekends' })}
                          className="w-full border rounded-xl px-3 py-2 text-sm bg-[var(--app-surface)] text-[var(--app-text)] border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]"
                          disabled={saving || !prefs.reminders?.enabled}
                        >
                          <option value="daily">Mỗi ngày</option>
                          <option value="weekdays">Thứ 2 - Thứ 6</option>
                          <option value="weekends">Cuối tuần</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                        <input
                          type="checkbox"
                          checked={Boolean(prefs.reminders?.channels?.inApp)}
                          onChange={(e) => handleReminderChange({ channels: { inApp: e.target.checked } })}
                          disabled={saving || !prefs.reminders?.enabled}
                        />
                        Trong ứng dụng
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                        <input
                          type="checkbox"
                          checked={Boolean(prefs.reminders?.channels?.email)}
                          onChange={(e) => handleReminderChange({ channels: { email: e.target.checked } })}
                          disabled={saving || !prefs.reminders?.enabled}
                        />
                        Email
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Privacy ─── */}
            {activeSection === 'privacy' && (
              <div className="space-y-4">
                <div className="app-panel p-6">
                  <h2 className="text-lg font-semibold text-[var(--app-text)] mb-1">🔒 Quyền riêng tư</h2>
                  <p className="text-sm text-[var(--app-muted)] mb-6">Kiểm soát những gì người khác có thể thấy về bạn</p>

                  <div className="space-y-1">
                    {[
                      { key: 'profilePublic', label: 'Hồ sơ công khai', desc: 'Cho phép mọi người xem hồ sơ của bạn' },
                      { key: 'showEmail', label: 'Hiển thị email', desc: 'Hiển thị email trên trang hồ sơ' },
                      { key: 'showPhone', label: 'Hiển thị số điện thoại', desc: 'Hiển thị số điện thoại trên hồ sơ' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-[color:color-mix(in_srgb,var(--app-accent)_16%,transparent)] last:border-0">
                        <div>
                          <p className="font-medium text-[var(--app-text)] text-sm">{item.label}</p>
                          <p className="text-xs text-[var(--app-muted)] mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle
                          checked={prefs.privacy[item.key as keyof typeof prefs.privacy] as boolean}
                          onChange={val => handlePrivacyChange(item.key as keyof typeof prefs.privacy, val)}
                          disabled={saving}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Allow messages select */}
                  <div className="pt-3">
                    <label className="block text-sm font-medium text-[var(--app-text)] mb-1">Ai có thể nhắn tin cho bạn?</label>
                    <p className="text-xs text-[var(--app-muted)] mb-2">Kiểm soát ai có thể gửi tin nhắn cho bạn</p>
                    <select value={prefs.privacy.allowMessages}
                      onChange={e => handlePrivacyChange('allowMessages', e.target.value)}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm bg-[var(--app-surface)] text-[var(--app-text)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]">
                      <option value="everyone">🌍 Mọi người</option>
                      <option value="followers">👥 Chỉ người theo dõi</option>
                      <option value="none">🚫 Không ai</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Account ─── */}
            {activeSection === 'account' && (
              <div className="space-y-4">
                {/* Account info */}
                <div className="app-panel p-6">
                  <h2 className="text-lg font-semibold text-[var(--app-text)] mb-4">⚙️ Thông tin tài khoản</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[color:color-mix(in_srgb,var(--app-accent)_16%,transparent)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--app-text)]">Họ và tên</p>
                        <p className="text-sm text-[var(--app-muted)]">{user?.name}</p>
                      </div>
                      <Link to="/profile" className="text-[var(--app-accent)] text-sm hover:underline">Sửa</Link>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[color:color-mix(in_srgb,var(--app-accent)_16%,transparent)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--app-text)]">Email</p>
                        <p className="text-sm text-[var(--app-muted)]">{user?.email}</p>
                      </div>
                      <span className="text-xs text-[var(--app-muted)]">Không thể thay đổi</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--app-text)]">Loại tài khoản</p>
                        <p className="text-sm text-[var(--app-muted)]">{user?.isAdmin ? 'Quản trị viên' : 'Học viên'}</p>
                      </div>
                      {!user?.isAdmin && (
                        <Link to="/admin/request" className="text-[var(--app-accent)] text-sm hover:underline">Nâng cấp</Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div className="app-panel p-6">
                  <h3 className="text-base font-semibold text-[var(--app-text)] mb-4">🔐 Đổi mật khẩu</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--app-text)] mb-1">Mật khẩu hiện tại</label>
                      <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required
                        className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] text-sm border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--app-text)] mb-1">Mật khẩu mới</label>
                      <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6}
                        className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] text-sm border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]" placeholder="Ít nhất 6 ký tự" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--app-text)] mb-1">Xác nhận mật khẩu mới</label>
                      <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required
                        className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 bg-[var(--app-surface)] text-[var(--app-text)] text-sm ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'border-[color:color-mix(in_srgb,var(--app-danger)_70%,transparent)] focus:ring-[var(--app-danger)]' : 'focus:ring-[var(--app-accent)] border-[color:color-mix(in_srgb,var(--app-accent)_28%,transparent)]'}`}
                        placeholder="Nhập lại mật khẩu mới" />
                      {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                        <p className="text-[var(--app-danger)] text-xs mt-1">Mật khẩu không khớp</p>
                      )}
                    </div>
                    <button type="submit" disabled={pwLoading}
                      className="w-full bg-[var(--app-accent)] text-[var(--app-on-accent)] rounded-xl py-2.5 font-medium text-sm hover:brightness-95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {pwLoading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                      {pwLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
                    </button>
                  </form>
                </div>

                {/* Quick links */}
                <div className="app-panel p-6">
                  <h3 className="text-base font-semibold text-[var(--app-text)] mb-4">🔗 Liên kết nhanh</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { to: '/payment-history', label: '💳 Lịch sử thanh toán' },
                      { to: '/certificates', label: '🏆 Chứng chỉ của tôi' },
                      { to: '/my-courses', label: '📚 Khóa học của tôi' },
                      { to: '/messages', label: '💬 Tin nhắn' },
                      { to: '/study-groups', label: '👥 Nhóm học tập' },
                      { to: '/analytics', label: '📊 Phân tích học tập' },
                    ].map(({ to, label }) => (
                      <Link key={to} to={to} className="flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm text-[var(--app-text)] border-[color:color-mix(in_srgb,var(--app-accent)_20%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--app-accent)_10%,var(--app-surface))]">
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="app-panel-soft p-6 border-[color:color-mix(in_srgb,var(--app-danger)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--app-danger-soft)_55%,var(--app-surface-soft))]">
                  <h3 className="text-base font-semibold text-[var(--app-danger)] mb-1">⚠️ Vùng nguy hiểm</h3>
                  <p className="text-sm text-[color:color-mix(in_srgb,var(--app-danger)_82%,var(--app-text))] mb-4">Các hành động dưới đây không thể hoàn tác. Hãy cẩn thận.</p>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
                        showToast({ type: 'error', title: 'Tính năng xóa tài khoản cần xác nhận qua email. Vui lòng liên hệ hỗ trợ.' });
                      }
                    }}
                    className="px-4 py-2 border rounded-xl text-sm font-medium transition-colors border-[color:color-mix(in_srgb,var(--app-danger)_55%,transparent)] text-[var(--app-danger)] hover:bg-[color:color-mix(in_srgb,var(--app-danger)_16%,var(--app-surface))]">
                    🗑️ Xóa tài khoản
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

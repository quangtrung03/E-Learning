import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, User, LogOut, Home, Award, MessageCircle, Users, Info, HelpCircle, Map, CreditCard, Award as Certificate, Rss, Settings, CalendarDays, Heart, Bell, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import NotificationCenter from "./NotificationCenter";
import { getUserNotifications, markAllNotificationsRead, markNotificationRead } from "../../utils/userNotifications";
import type { UserNotificationItem } from "../../utils/userNotifications";


const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!isNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNavOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNavOpen]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setNotifications([]);
      return;
    }

    const load = () => setNotifications(getUserNotifications(user._id));
    load();

    const onNotifUpdated = () => load();
    window.addEventListener('user-notifications-updated', onNotifUpdated as EventListener);
    window.addEventListener('focus', onNotifUpdated as EventListener);

    return () => {
      window.removeEventListener('user-notifications-updated', onNotifUpdated as EventListener);
      window.removeEventListener('focus', onNotifUpdated as EventListener);
    };
  }, [isAuthenticated, user?._id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavToggleButton = ({ isOpen }: { isOpen: boolean }) => {
    const barBase =
      "block h-1 rounded bg-primary-600 transition-all duration-500";

    return (
      <button
        type="button"
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={isOpen}
        onClick={() => setIsNavOpen(!isOpen)}
        className={`relative w-10 h-10 cursor-pointer flex flex-col items-center justify-center gap-2 transition-transform duration-500 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        <span
          className={`${barBase} ${
            isOpen ? "absolute w-10 rotate-45" : "w-7"
          }`}
        />
        <span
          className={`${barBase} w-10 transition-transform duration-700 ${
            isOpen ? "scale-x-0 opacity-0 duration-500" : ""
          }`}
        />
        <span
          className={`${barBase} ${
            isOpen ? "absolute w-10 -rotate-45" : "w-7"
          }`}
        />
      </button>
    );
  };

  return (
    <header className="relative z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                ELearn
              </span>
            </motion.div>
          </Link>

          <div className="flex items-center gap-2 relative">
            {isAuthenticated && (
              <button
                type="button"
                aria-label="Mở trung tâm thông báo"
                onClick={() => setIsNotifOpen((v) => !v)}
                className="relative w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <NavToggleButton isOpen={isNavOpen} />
            <NotificationCenter
              isOpen={isNotifOpen}
              items={notifications}
              onClose={() => setIsNotifOpen(false)}
              onMarkRead={(id) => user?._id && markNotificationRead(user._id, id)}
              onMarkAllRead={() => user?._id && markAllNotificationsRead(user._id)}
            />
          </div>
        </div>
      </div>

      {isNavOpen && (
        <div className="absolute right-4 sm:right-6 lg:right-8 top-16 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Điều hướng</div>
            {isAuthenticated && user?.name && (
              <div className="text-sm text-gray-600 truncate">{user.name}</div>
            )}
          </div>

          <nav className="p-2 space-y-1">
              <Link
                to="/"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">Trang chủ</span>
              </Link>
              <Link
                to="/courses"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">Khóa học</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Bảng điều khiển</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-gray-900">Yêu thích</span>
                  </Link>
                  <Link
                    to="/schedule"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">Lịch học</span>
                  </Link>
                  <Link
                    to="/achievements"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">Thành tích</span>
                  </Link>
                  <Link
                    to="/my-certificates"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Certificate className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">Chứng chỉ</span>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Tin nhắn</span>
                  </Link>
                  <Link
                    to="/study-groups"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Nhóm học</span>
                  </Link>
                  <Link
                    to="/feed"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Rss className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">Bảng tin</span>
                  </Link>
                </>
              )}

              {/* Divider: Khám phá */}
              <div className="pt-3 pb-1 px-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Khám phá</span>
              </div>
              <Link
                to="/about"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Info className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Về chúng tôi</span>
              </Link>
              <Link
                to="/faq"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Câu hỏi thường gặp</span>
              </Link>
              <Link
                to="/sitemap"
                onClick={() => setIsNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Map className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Sơ đồ trang</span>
              </Link>

              <div className="pt-3 mt-1 border-t border-gray-200 space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsNavOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-900">Hồ sơ</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsNavOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">Cài đặt</span>
                    </Link>
                    <Link
                      to="/payment/history"
                      onClick={() => setIsNavOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">Lịch sử thanh toán</span>
                    </Link>
                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-semibold text-blue-700">⚙ Quản trị</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsNavOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsNavOpen(false)}
                      className="block w-full px-3 py-2 text-center rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-900"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsNavOpen(false)}
                      className="block w-full px-3 py-2 text-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

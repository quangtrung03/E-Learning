import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, User, LogOut, Home, Award, MessageCircle, Users, BarChart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);

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

          <div className="flex items-center">
            <NavToggleButton isOpen={isNavOpen} />
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

              {isAuthenticated && (
                <>
                  <Link
                    to="/courses"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Khóa học</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Bảng điều khiển</span>
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
                    to="/analytics"
                    onClick={() => setIsNavOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <BarChart className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-900">Phân tích</span>
                  </Link>
                </>
              )}

              <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
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
                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">Quản trị</span>
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

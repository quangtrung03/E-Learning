import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo + About */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl md:text-3xl font-bold text-white">ELearn</span>
          </div>
          <p className="text-gray-400 mb-4 max-w-md">
            Nền tảng học trực tuyến hiện đại, giúp bạn vừa học vừa dạy dễ dàng
            hơn. Khám phá hàng ngàn khóa học chất lượng.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors" aria-label="Facebook">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors" aria-label="Instagram">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-2.508 0-4.541-2.033-4.541-4.541s2.033-4.541 4.541-4.541s4.541 2.033 4.541 4.541s-2.033 4.541-4.541 4.541zm7.072 0c-2.508 0-4.541-2.033-4.541-4.541s2.033-4.541 4.541-4.541s4.541 2.033 4.541 4.541s-2.033 4.541-4.541 4.541z"/>
                <circle cx="12" cy="12" r="3.5"/>
                <circle cx="18.5" cy="5.5" r="1.5"/>
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-red-500 transition-colors" aria-label="YouTube">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Liên kết nhanh
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/courses"
                className="hover:text-primary-400 transition-colors"
              >
                Khóa học
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="hover:text-primary-400 transition-colors"
              >
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-primary-400 transition-colors"
              >
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Hỗ trợ</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/help"
                className="hover:text-primary-400 transition-colors"
              >
                Trung tâm trợ giúp
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="hover:text-primary-400 transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:text-primary-400 transition-colors"
              >
                Điều khoản sử dụng
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © 2025 ELearn Platform. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-sm text-gray-400 hover:text-emerald-400"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-400 hover:text-emerald-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

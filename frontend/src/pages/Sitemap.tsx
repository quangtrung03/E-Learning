import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SitemapSection {
  title: string;
  icon: string;
  color: string;
  links: { label: string; path: string; desc?: string; authRequired?: boolean; adminRequired?: boolean }[];
}

const Sitemap = () => {
  const { isAuthenticated, user } = useAuth();

  const sections: SitemapSection[] = [
    {
      title: 'Trang chính',
      icon: '🏠',
      color: 'blue',
      links: [
        { label: 'Trang chủ', path: '/', desc: 'Khám phá khóa học nổi bật và giảng viên hàng đầu' },
        { label: 'Tất cả khóa học', path: '/courses', desc: 'Duyệt toàn bộ danh mục khóa học' },
        { label: 'Về chúng tôi', path: '/about', desc: 'Sứ mệnh, giá trị và đội ngũ ELearn' },
        { label: 'Liên hệ', path: '/contact', desc: 'Gửi tin nhắn hoặc tìm thông tin liên hệ' },
      ],
    },
    {
      title: 'Tài khoản',
      icon: '👤',
      color: 'purple',
      links: [
        { label: 'Đăng nhập', path: '/login', desc: 'Truy cập tài khoản của bạn' },
        { label: 'Đăng ký', path: '/register', desc: 'Tạo tài khoản mới miễn phí' },
        { label: 'Quên mật khẩu', path: '/forgot-password', desc: 'Đặt lại mật khẩu qua email' },
      ],
    },
    {
      title: 'Học tập',
      icon: '📚',
      color: 'green',
      links: [
        { label: 'Bảng điều khiển', path: '/dashboard', desc: 'Tổng quan tiến trình học tập', authRequired: true },
        { label: 'Khóa học của tôi', path: '/my-courses', desc: 'Danh sách khóa học đã đăng ký', authRequired: true },
        { label: 'Phân tích học tập', path: '/analytics', desc: 'Thống kê thời gian và kết quả học', authRequired: true },
        { label: 'Chứng chỉ của tôi', path: '/my-certificates', desc: 'Xem và chia sẻ chứng chỉ đã đạt', authRequired: true },
      ],
    },
    {
      title: 'Tương tác',
      icon: '💬',
      color: 'orange',
      links: [
        { label: 'Tin nhắn', path: '/messages', desc: 'Nhắn tin với giảng viên và học viên', authRequired: true },
        { label: 'Nhóm học', path: '/study-groups', desc: 'Tham gia hoặc tạo nhóm học tập', authRequired: true },
        { label: 'Tạo nhóm học', path: '/study-groups/create', desc: 'Khởi tạo nhóm học mới', authRequired: true },
      ],
    },
    {
      title: 'Thanh toán',
      icon: '💳',
      color: 'cyan',
      links: [
        { label: 'Lịch sử thanh toán', path: '/payment/history', desc: 'Xem các giao dịch đã thực hiện', authRequired: true },
      ],
    },
    {
      title: 'Hồ sơ',
      icon: '⚙️',
      color: 'gray',
      links: [
        { label: 'Hồ sơ cá nhân', path: '/profile', desc: 'Chỉnh sửa thông tin và ảnh đại diện', authRequired: true },
        { label: 'Yêu cầu quản trị', path: '/admin-request', desc: 'Đăng ký trở thành giảng viên hoặc admin', authRequired: true },
      ],
    },
    {
      title: 'Quản trị',
      icon: '🛡️',
      color: 'red',
      links: [
        { label: 'Bảng điều khiển Admin', path: '/admin', desc: 'Tổng quan hệ thống', adminRequired: true },
        { label: 'Quản lý người dùng', path: '/admin/users', desc: 'Xem và chỉnh sửa tài khoản', adminRequired: true },
        { label: 'Quản lý khóa học', path: '/admin/courses', desc: 'Duyệt và quản lý nội dung', adminRequired: true },
        { label: 'Quản lý thanh toán', path: '/admin/payments', desc: 'Theo dõi giao dịch và doanh thu', adminRequired: true },
        { label: 'Quản lý coupon', path: '/admin/coupons', desc: 'Tạo và quản lý mã giảm giá', adminRequired: true },
        { label: 'Quản lý đánh giá', path: '/admin/reviews', desc: 'Kiểm duyệt đánh giá khóa học', adminRequired: true },
        { label: 'Media Manager', path: '/admin/media', desc: 'Quản lý tài nguyên Cloudinary', adminRequired: true },
      ],
    },
    {
      title: 'Hỗ trợ & Pháp lý',
      icon: '📋',
      color: 'indigo',
      links: [
        { label: 'Câu hỏi thường gặp', path: '/faq', desc: 'Giải đáp các thắc mắc phổ biến' },
        { label: 'Trung tâm trợ giúp', path: '/help', desc: 'Hướng dẫn sử dụng nền tảng' },
        { label: 'Chính sách bảo mật', path: '/privacy', desc: 'Cách chúng tôi bảo vệ dữ liệu của bạn' },
        { label: 'Điều khoản dịch vụ', path: '/terms', desc: 'Quy định sử dụng nền tảng' },
        { label: 'Xác minh chứng chỉ', path: '/certificates/verify/:hash', desc: 'Kiểm tra tính xác thực của chứng chỉ' },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-700',   dot: 'bg-cyan-500' },
    gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-500' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  };

  const isVisible = (link: { authRequired?: boolean; adminRequired?: boolean }) => {
    if (link.adminRequired) return isAuthenticated && user?.isAdmin;
    if (link.authRequired) return isAuthenticated;
    return true;
  };

  const visibleSections = sections.map(s => ({
    ...s,
    links: s.links.filter(l => isVisible(l)),
  })).filter(s => s.links.length > 0);

  const totalLinks = visibleSections.reduce((sum, s) => sum + s.links.length, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Sơ đồ trang</h1>
          <p className="text-gray-300 text-lg mb-4">
            Toàn bộ {totalLinks} trang trên nền tảng ELearn
          </p>
          {!isAuthenticated && (
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-sm px-4 py-2 rounded-lg">
              <span>⚠️</span>
              Một số trang yêu cầu đăng nhập — 
              <Link to="/login" className="underline font-medium hover:text-yellow-100">Đăng nhập</Link>
              {' '}hoặc{' '}
              <Link to="/register" className="underline font-medium hover:text-yellow-100">Đăng ký</Link>
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSections.map((section) => {
            const c = colorMap[section.color] || colorMap.gray;
            return (
              <div key={section.title} className={`rounded-2xl border ${c.border} ${c.bg} p-6`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h2 className="font-bold text-gray-900">{section.title}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                      {section.links.length} trang
                    </span>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      {link.path.includes(':') ? (
                        <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-white/60 opacity-60 cursor-default">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                          <div>
                            <span className="text-sm font-medium text-gray-700">{link.label}</span>
                            {link.desc && <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>}
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={link.path}
                          className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-white/80 hover:bg-white hover:shadow-sm transition-all group"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${c.dot}`} />
                          <div>
                            <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                              {link.label}
                            </span>
                            {link.desc && <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">{link.desc}</p>}
                          </div>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-500 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            Có thể truy cập không cần đăng nhập
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Yêu cầu đăng nhập
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Chỉ dành cho quản trị viên
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;

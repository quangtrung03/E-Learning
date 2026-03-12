import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sitemap = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu quyền Admin</h1>
          <p className="text-gray-600 mb-6">Sơ đồ hệ thống chỉ dành cho quản trị viên.</p>
          <Link to={isAuthenticated ? '/dashboard' : '/login'}
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            {isAuthenticated ? 'Về trang chủ' : 'Đăng nhập'}
          </Link>
        </div>
      </div>
    );
  }

  // ─── Data ────────────────────────────────────────────────────────────────

  const publicPages = [
    { label: '🏠 Trang chủ', path: '/', desc: 'Banner, khóa học nổi bật, giảng viên, testimonials' },
    { label: '📚 Danh sách khóa học', path: '/courses', desc: 'Tìm kiếm, lọc theo danh mục/giá/rating' },
    { label: '📖 Chi tiết khóa học', path: '/courses/:id', desc: 'Mô tả, curriculum, đánh giá, nút đăng ký/mua' },
    { label: 'ℹ️ Về chúng tôi', path: '/about', desc: 'Sứ mệnh, đội ngũ, giá trị' },
    { label: '📞 Liên hệ', path: '/contact', desc: 'Form gửi tin nhắn, thông tin liên lạc' },
    { label: '❓ FAQ', path: '/faq', desc: 'Câu hỏi thường gặp' },
    { label: '🛡️ Chính sách bảo mật', path: '/privacy', desc: 'GDPR, xử lý dữ liệu cá nhân' },
    { label: '📋 Điều khoản dịch vụ', path: '/terms', desc: 'Điều khoản sử dụng nền tảng' },
    { label: '🏆 Xác minh chứng chỉ', path: '/certificates/verify/:hash', desc: 'Kiểm tra chứng chỉ công khai qua mã hash' },
    { label: '👨‍🏫 Hồ sơ giảng viên', path: '/instructors/:id', desc: 'Thông tin, khóa học của giảng viên' },
  ];

  const authPages = [
    { label: '📊 Bảng điều khiển', path: '/dashboard', desc: 'Tiến trình học, thống kê, khóa học gần đây' },
    { label: '📚 Khóa học của tôi', path: '/my-courses', desc: 'Danh sách khóa đã đăng ký, tiến độ từng khóa' },
    { label: '▶️ Xem bài học', path: '/courses/:id/learn/:lessonId', desc: 'Video player, tài liệu, ghi chú, tiến trình' },
    { label: '📈 Phân tích học tập', path: '/analytics', desc: 'Thời gian học, điểm số, hoạt động theo tuần' },
    { label: '🏆 Chứng chỉ của tôi', path: '/my-certificates', desc: 'Tải, chia sẻ, xác minh chứng chỉ' },
    { label: '👤 Hồ sơ cá nhân', path: '/profile', desc: 'Ảnh bìa, avatar, mạng xã hội, bài viết, khóa học' },
    { label: '👥 Hồ sơ người dùng', path: '/users/:id', desc: 'Xem hồ sơ công khai, theo dõi, nhắn tin' },
    { label: '⚙️ Cài đặt', path: '/settings', desc: 'Giao diện, ngôn ngữ, thông báo, quyền riêng tư' },
    { label: '💬 Tin nhắn', path: '/messages', desc: 'Chat realtime (Socket.IO), danh sách hội thoại' },
    { label: '📰 Bảng tin xã hội', path: '/feed', desc: 'Bài viết, stories, khám phá, tạo bài đăng' },
    { label: '🔍 Tìm kiếm', path: '/search', desc: 'Tìm khóa học, người dùng, bài viết, danh mục' },
    { label: '👥 Nhóm học tập', path: '/study-groups', desc: 'Khám phá và tham gia nhóm học' },
    { label: '➕ Tạo nhóm học', path: '/study-groups/create', desc: 'Tạo nhóm, mời thành viên' },
    { label: '🔔 Chi tiết nhóm học', path: '/study-groups/:id', desc: 'Thảo luận, tài nguyên chung, thành viên' },
    { label: '💳 Lịch sử thanh toán', path: '/payment/history', desc: 'Tất cả giao dịch, trạng thái, hóa đơn' },
  ];

  const coursePages = [
    { label: '📝 Quản lý bài học', path: '/courses/:id/lessons', desc: 'Tạo, sắp xếp section, upload video/tài liệu' },
    { label: '🗣️ Thảo luận khóa học', path: '/courses/:id/discussions', desc: 'Forum Q&A trong từng khóa học' },
    { label: '📝 Bài tập / Kiểm tra', path: '/assignments/:id', desc: 'Nộp bài, xem đề, trạng thái chấm điểm' },
    { label: '📋 Danh sách bài nộp', path: '/assignments/:id/submissions', desc: 'Xem tất cả bài nộp của học viên' },
    { label: '✅ Chấm điểm bài nộp', path: '/assignments/:id/submissions/:id/grade', desc: 'Giao diện chấm điểm chi tiết cho giảng viên' },
  ];

  const paymentPages = [
    { label: '🛒 Thanh toán khóa học', path: '/payment/checkout/:courseId', desc: 'VNPay / chuyển khoản, áp dụng coupon' },
    { label: '↩️ Kết quả thanh toán', path: '/payment/return', desc: 'Xử lý callback VNPay, cập nhật trạng thái' },
    { label: '🧪 Mô phỏng thanh toán', path: '/payment/simulate', desc: 'Dev-only: test thanh toán thủ công' },
  ];

  const adminPages = [
    { label: '🖥️ Dashboard Admin', path: '/admin', desc: 'Tổng doanh thu, người dùng mới, khóa học, thống kê' },
    { label: '👥 Quản lý người dùng', path: '/admin/users', desc: 'Danh sách, tìm kiếm, active/ban tài khoản' },
    { label: '👤 Chi tiết người dùng', path: '/admin/users/:id', desc: 'Hồ sơ, lịch sử học, chỉnh sửa quyền' },
    { label: '📚 Quản lý khóa học', path: '/admin/courses', desc: 'Duyệt, ẩn/hiện, xem thống kê từng khóa' },
    { label: '📖 Chi tiết khóa học', path: '/admin/courses/:id', desc: 'Nội dung, đăng ký, doanh thu khóa học' },
    { label: '💰 Quản lý thanh toán', path: '/admin/payments', desc: 'Tất cả giao dịch, xác nhận thủ công, hoàn tiền' },
    { label: '🎟️ Quản lý coupon', path: '/admin/coupons', desc: 'Tạo mã giảm giá, loại %, cố định, giới hạn dùng' },
    { label: '⭐ Quản lý đánh giá', path: '/admin/reviews', desc: 'Kiểm duyệt, ẩn đánh giá không phù hợp' },
    { label: '📬 Quản lý yêu cầu', path: '/admin/requests', desc: 'Duyệt đơn trở thành giảng viên/admin' },
    { label: '🗂️ Media Manager', path: '/admin/media', desc: 'Quản lý tài nguyên Cloudinary, dung lượng' },
    { label: '🖼️ Thumbnails mặc định', path: '/admin/settings/thumbnails', desc: 'Cài ảnh bìa mặc định cho khóa học' },
  ];

  const flows = [
    {
      title: '🎓 Hành trình học viên',
      color: 'green',
      steps: [
        'Truy cập trang chủ → Duyệt khóa học',
        'Xem chi tiết khóa học → Đọc curriculum',
        'Đăng ký tài khoản (Register)',
        'Chọn khóa học → Thanh toán (VNPay / miễn phí)',
        'Vào Bảng điều khiển → Bắt đầu học',
        'Xem video bài học → Làm bài tập',
        'Tham gia thảo luận / Nhóm học',
        'Hoàn thành 100% → Nhận Chứng chỉ',
        'Chia sẻ chứng chỉ / Xác minh công khai',
      ],
    },
    {
      title: '👨‍🏫 Hành trình giảng viên',
      color: 'blue',
      steps: [
        'Đăng ký tài khoản học viên',
        'Gửi yêu cầu nâng cấp giảng viên (/admin-request)',
        'Admin duyệt → Nhận quyền instructor',
        'Tạo khóa học → Upload video, tài liệu',
        'Tạo sections, bài học, bài tập',
        'Đặt giá / miễn phí / coupon',
        'Publish khóa học → Học viên đăng ký',
        'Theo dõi tiến độ học viên, chấm bài',
        'Xem doanh thu trong Analytics',
      ],
    },
    {
      title: '⚙️ Quy trình Admin',
      color: 'red',
      steps: [
        'Đăng nhập → Vào /admin Dashboard',
        'Xem thống kê tổng quan hệ thống',
        'Duyệt yêu cầu giảng viên / admin (/admin/requests)',
        'Quản lý và kiểm duyệt khóa học',
        'Theo dõi giao dịch thanh toán',
        'Tạo / quản lý coupon khuyến mãi',
        'Kiểm duyệt đánh giá của học viên',
        'Quản lý media / thumbnails mặc định',
        'Ban/unban tài khoản vi phạm',
      ],
    },
    {
      title: '💳 Quy trình Thanh toán',
      color: 'purple',
      steps: [
        'Học viên chọn khóa học có phí',
        'Áp dụng coupon (nếu có)',
        'Chuyển sang trang Checkout',
        'Chọn VNPay → Redirect sang cổng thanh toán',
        'Hoàn tất giao dịch trên VNPay',
        'Callback /payment/return → Xác thực chữ ký',
        'Tạo Enrollment → Mở khóa khóa học',
        'Gửi email xác nhận thanh toán',
        'Hiển thị trong Lịch sử thanh toán',
      ],
    },
  ];

  const techStack = [
    { layer: 'Frontend', items: ['React 18 + TypeScript', 'Tailwind CSS', 'React Router v6', 'Vite', 'Framer Motion', 'Socket.IO client'] },
    { layer: 'Backend', items: ['Node.js + Express', 'MongoDB + Mongoose', 'JWT Authentication', 'Socket.IO', 'Cloudinary (media)', 'Brevo (email)'] },
    { layer: 'Thanh toán', items: ['VNPay integration', 'Webhook callback', 'Mã hóa HMAC-SHA512', 'Xác thực chữ ký'] },
    { layer: 'Deploy', items: ['Frontend: Vercel', 'Backend: Railway / VPS', 'DB: MongoDB Atlas', 'CDN: Cloudinary'] },
  ];

  const colorCls: Record<string, { header: string; badge: string; dot: string; step: string }> = {
    green:  { header: 'bg-green-600',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  step: 'bg-green-50 border-green-200 text-green-800' },
    blue:   { header: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   step: 'bg-blue-50 border-blue-200 text-blue-800' },
    red:    { header: 'bg-red-600',    badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    step: 'bg-red-50 border-red-200 text-red-800' },
    purple: { header: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', step: 'bg-purple-50 border-purple-200 text-purple-800' },
  };

  const PageList = ({ pages, title, accent }: { pages: typeof publicPages; title: string; accent: string }) => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className={`${accent} px-5 py-3 flex items-center justify-between`}>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{pages.length} trang</span>
      </div>
      <div className="divide-y divide-gray-100">
        {pages.map(p => (
          <div key={p.path} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{p.label}</span>
                <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{p.path}</code>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
            </div>
            {!p.path.includes(':') && (
              <Link to={p.path} target="_blank" className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors mt-0.5" title="Mở trang">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Chỉ dành cho Admin
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">🗺️ Sơ đồ hệ thống ELearn</h1>
              <p className="text-gray-400 text-sm max-w-xl">Toàn bộ kiến trúc, trang, nghiệp vụ và luồng hoạt động của nền tảng E-Learning. Tài liệu tham chiếu dành cho quản trị viên và chủ doanh nghiệp.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { n: publicPages.length + authPages.length + coursePages.length + paymentPages.length + adminPages.length, label: 'Tổng trang' },
                { n: flows.length, label: 'Nghiệp vụ' },
                { n: techStack.length, label: 'Lớp kỹ thuật' },
                { n: adminPages.length, label: 'Trang Admin' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
                  <div className="text-2xl font-bold text-white">{s.n}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

        {/* ── SECTION 1: Trang theo phân quyền ─────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full" />
            Danh sách trang theo phân quyền
          </h2>
          <div className="space-y-4">
            <PageList pages={publicPages} title="🌐 Công khai — Không cần đăng nhập" accent="bg-gray-700" />
            <PageList pages={authPages} title="🔑 Yêu cầu đăng nhập (Member)" accent="bg-blue-600" />
            <PageList pages={coursePages} title="📖 Nội dung khóa học & Giảng viên" accent="bg-teal-600" />
            <PageList pages={paymentPages} title="💳 Luồng thanh toán" accent="bg-purple-600" />
            <PageList pages={adminPages} title="🛡️ Quản trị — Chỉ Admin" accent="bg-red-600" />
          </div>
        </section>

        {/* ── SECTION 2: Nghiệp vụ ──────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-600 rounded-full" />
            Luồng nghiệp vụ chính
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {flows.map(flow => {
              const c = colorCls[flow.color];
              return (
                <div key={flow.title} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className={`${c.header} px-5 py-3`}>
                    <h3 className="font-semibold text-white text-sm">{flow.title}</h3>
                  </div>
                  <ol className="p-4 space-y-2">
                    {flow.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full ${c.header} text-white text-xs flex items-center justify-center font-bold mt-0.5`}>{i + 1}</span>
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 3: Kiến trúc hệ thống ───────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-600 rounded-full" />
            Kiến trúc kỹ thuật
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map(layer => (
              <div key={layer.layer} className="bg-white rounded-2xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">{layer.layer}</h4>
                <ul className="space-y-1.5">
                  {layer.items.map(item => (
                    <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: Ma trận vai trò ───────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full" />
            Ma trận phân quyền theo vai trò
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 font-semibold text-gray-700 w-64">Tính năng</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-500">🌐 Khách</th>
                    <th className="px-4 py-3 text-center font-semibold text-blue-600">👨‍🎓 Học viên</th>
                    <th className="px-4 py-3 text-center font-semibold text-teal-600">👨‍🏫 Giảng viên</th>
                    <th className="px-4 py-3 text-center font-semibold text-red-600">🛡️ Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Xem trang chủ & khóa học', '✅', '✅', '✅', '✅'],
                    ['Đăng ký / Đăng nhập', '✅', '—', '—', '—'],
                    ['Mua khóa học', '—', '✅', '✅', '✅'],
                    ['Xem bài học', '—', '✅', '✅', '✅'],
                    ['Làm bài tập & kiểm tra', '—', '✅', '✅', '✅'],
                    ['Nhận chứng chỉ', '—', '✅', '✅', '✅'],
                    ['Nhắn tin & Nhóm học', '—', '✅', '✅', '✅'],
                    ['Đăng bài social / Feed', '—', '✅', '✅', '✅'],
                    ['Tạo & quản lý khóa học', '—', '—', '✅', '✅'],
                    ['Chấm bài học viên', '—', '—', '✅', '✅'],
                    ['Xem doanh thu cá nhân', '—', '—', '✅', '✅'],
                    ['Quản lý toàn bộ người dùng', '—', '—', '—', '✅'],
                    ['Duyệt / ẩn khóa học', '—', '—', '—', '✅'],
                    ['Quản lý thanh toán hệ thống', '—', '—', '—', '✅'],
                    ['Tạo coupon, quản lý media', '—', '—', '—', '✅'],
                  ].map(([feat, ...perms]) => (
                    <tr key={feat} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-700 font-medium">{feat}</td>
                      {perms.map((p, i) => (
                        <td key={i} className={`px-4 py-2.5 text-center text-base ${p === '✅' ? 'text-green-500' : 'text-gray-300'}`}>{p}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Truy cập nhanh Admin ─────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-600 rounded-full" />
            Truy cập nhanh — Bảng điều khiển Admin
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { to: '/admin', label: 'Dashboard', icon: '🖥️' },
              { to: '/admin/users', label: 'Người dùng', icon: '👥' },
              { to: '/admin/courses', label: 'Khóa học', icon: '📚' },
              { to: '/admin/payments', label: 'Thanh toán', icon: '💰' },
              { to: '/admin/coupons', label: 'Coupon', icon: '🎟️' },
              { to: '/admin/reviews', label: 'Đánh giá', icon: '⭐' },
              { to: '/admin/requests', label: 'Yêu cầu', icon: '📬' },
              { to: '/admin/media', label: 'Media', icon: '🗂️' },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md hover:border-red-200 transition-all group">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Sitemap;

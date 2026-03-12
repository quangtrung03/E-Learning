import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  category: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    category: 'Tài khoản & Đăng ký',
    icon: '👤',
    items: [
      { q: 'Làm thế nào để tạo tài khoản?', a: 'Nhấn nút "Đăng ký" trên góc trên cùng, điền email và mật khẩu, sau đó xác minh địa chỉ email qua mã OTP được gửi về hộp thư.' },
      { q: 'Tôi quên mật khẩu, phải làm gì?', a: 'Nhấn "Quên mật khẩu" trên trang đăng nhập, nhập email đã đăng ký, kiểm tra hộp thư để nhận liên kết đặt lại mật khẩu.' },
      { q: 'Tôi có thể thay đổi email đăng ký không?', a: 'Hiện tại email đăng ký không thể thay đổi trực tiếp. Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cần thay đổi.' },
      { q: 'Một người có thể có nhiều tài khoản không?', a: 'Mỗi người chỉ được phép có một tài khoản duy nhất. Việc tạo nhiều tài khoản có thể dẫn đến khóa tất cả tài khoản liên quan.' },
    ],
  },
  {
    category: 'Khóa học & Học tập',
    icon: '📚',
    items: [
      { q: 'Tôi có thể học trên thiết bị di động không?', a: 'Có, nền tảng ELearn được tối ưu hóa cho tất cả thiết bị — máy tính, tablet và smartphone. Bạn chỉ cần trình duyệt web là có thể học bất cứ đâu.' },
      { q: 'Video bài học có thể tải về xem offline không?', a: 'Tính năng tải xuống video đang trong quá trình phát triển. Hiện tại bạn cần kết nối internet để xem bài học.' },
      { q: 'Khóa học có thời hạn truy cập không?', a: 'Sau khi đăng ký, bạn có quyền truy cập trọn đời vào nội dung khóa học, kể cả các cập nhật trong tương lai.' },
      { q: 'Tốc độ phát video có thể điều chỉnh không?', a: 'Có, bạn có thể điều chỉnh tốc độ phát từ 0.5x đến 2x theo nhu cầu học tập của mình.' },
      { q: 'Nội dung khóa học có được cập nhật không?', a: 'Giảng viên thường xuyên cập nhật nội dung để đảm bảo tính chính xác và theo kịp xu hướng công nghiệp mới nhất.' },
    ],
  },
  {
    category: 'Thanh toán & Hoàn tiền',
    icon: '💳',
    items: [
      { q: 'Các phương thức thanh toán nào được chấp nhận?', a: 'Chúng tôi chấp nhận thanh toán qua VNPay (thẻ nội địa, ví điện tử), thẻ quốc tế Visa/Mastercard và chuyển khoản ngân hàng.' },
      { q: 'Chính sách hoàn tiền như thế nào?', a: 'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ khi mua, với điều kiện chưa xem quá 20% nội dung khóa học. Tiền sẽ được hoàn về phương thức thanh toán ban đầu trong 3–5 ngày làm việc.' },
      { q: 'Tôi có thể sử dụng mã giảm giá như thế nào?', a: 'Nhập mã giảm giá tại bước thanh toán trước khi xác nhận đơn hàng. Mỗi mã có điều kiện sử dụng riêng (số lần, thời hạn, danh sách khóa học áp dụng).' },
      { q: 'Hóa đơn có được gửi qua email không?', a: 'Có, hóa đơn điện tử sẽ được gửi tự động về email đăng ký sau khi thanh toán thành công.' },
    ],
  },
  {
    category: 'Chứng chỉ',
    icon: '🏆',
    items: [
      { q: 'Khi nào tôi nhận được chứng chỉ hoàn thành?', a: 'Chứng chỉ được cấp tự động sau khi bạn hoàn thành 100% nội dung khóa học và đạt điểm tối thiểu trong các bài kiểm tra (nếu có).' },
      { q: 'Chứng chỉ có giá trị pháp lý không?', a: 'Chứng chỉ của ELearn là bằng chứng hoàn thành khóa học và được nhiều doanh nghiệp đối tác công nhận. Mỗi chứng chỉ có mã xác minh duy nhất có thể kiểm tra tại trang web của chúng tôi.' },
      { q: 'Tôi có thể chia sẻ chứng chỉ lên LinkedIn không?', a: 'Có, chứng chỉ có thể xuất ra file PDF và chia sẻ trực tiếp lên LinkedIn, Facebook hoặc bất kỳ nền tảng nào khác.' },
    ],
  },
  {
    category: 'Giảng viên & Nội dung',
    icon: '🎓',
    items: [
      { q: 'Làm thế nào để trở thành giảng viên trên ELearn?', a: 'Đăng nhập và gửi yêu cầu trở thành giảng viên qua mục "Cài đặt tài khoản". Bộ phận kiểm duyệt sẽ xem xét và phản hồi trong vòng 2–3 ngày làm việc.' },
      { q: 'Giảng viên nhận được bao nhiêu % doanh thu?', a: 'Giảng viên nhận 75% doanh thu từ mỗi đăng ký khóa học. Phần còn lại là phí vận hành nền tảng.' },
      { q: 'Có yêu cầu gì về chất lượng video không?', a: 'Video bài giảng cần đạt tối thiểu độ phân giải 720p, âm thanh rõ ràng và không có tiếng ồn nền. Đội ngũ ELearn sẽ kiểm duyệt trước khi công bố.' },
    ],
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const displayed = activeCategory
    ? faqData.filter(s => s.category === activeCategory)
    : faqData;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Câu hỏi thường gặp</h1>
          <p className="text-xl text-blue-100">Tìm câu trả lời cho các thắc mắc phổ biến nhất về ELearn.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2 rounded-full font-medium transition-colors text-sm ${
              !activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {faqData.map(s => (
            <button
              key={s.category}
              onClick={() => setActiveCategory(s.category === activeCategory ? null : s.category)}
              className={`px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                activeCategory === s.category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.icon} {s.category}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {displayed.map(section => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span>{section.icon}</span>
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.items.map((item, idx) => {
                  const key = `${section.category}-${idx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-gray-50">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-10 text-center border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Vẫn còn thắc mắc?</h3>
          <p className="text-gray-600 mb-6">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn mọi lúc.</p>
          <Link
            to="/contact"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Liên hệ hỗ trợ
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

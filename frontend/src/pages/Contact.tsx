import { useState } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission - in production connect to backend
    await new Promise(res => setTimeout(res, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  const contacts = [
    {
      icon: '📧',
      title: 'Email hỗ trợ',
      detail: 'support@elearn.vn',
      sub: 'Phản hồi trong vòng 24 giờ',
    },
    {
      icon: '📞',
      title: 'Hotline',
      detail: '1800 xxxx (miễn phí)',
      sub: 'Thứ 2 – Thứ 6, 8:00 – 18:00',
    },
    {
      icon: '📍',
      title: 'Địa chỉ',
      detail: '123 Nguyễn Huệ, Q.1, TP.HCM',
      sub: 'Việt Nam',
    },
  ];

  const subjects = [
    'Hỗ trợ kỹ thuật',
    'Thanh toán & Hoàn tiền',
    'Khóa học & Nội dung',
    'Hợp tác giảng viên',
    'Hợp tác doanh nghiệp',
    'Khác',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Liên hệ chúng tôi</h1>
          <p className="text-xl text-blue-100">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {contacts.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-blue-600 font-semibold mb-1">{c.detail}</p>
                <p className="text-gray-500 text-sm">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + FAQ link */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gửi tin nhắn cho chúng tôi</h2>
            <p className="text-gray-600 mb-8">Điền vào biểu mẫu dưới đây, chúng tôi sẽ liên hệ lại sớm nhất có thể.</p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Đã gửi thành công!</h3>
                <p className="text-green-700 mb-6">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ban@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Chọn chủ đề...</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang gửi...
                    </>
                  ) : 'Gửi tin nhắn'}
                </button>
              </form>
            )}
          </div>

          {/* FAQ Teaser */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Câu hỏi thường gặp</h2>
            <p className="text-gray-600 mb-8">Tìm câu trả lời nhanh cho các thắc mắc phổ biến.</p>

            <div className="space-y-4">
              {[
                { q: 'Tôi có thể học trên điện thoại không?', a: 'Có, nền tảng ELearn tối ưu cho mọi thiết bị — desktop, tablet và smartphone.' },
                { q: 'Bằng chứng nhận có giá trị không?', a: 'Chứng chỉ có thể chia sẻ online và được công nhận bởi nhiều doanh nghiệp đối tác.' },
                { q: 'Học phí có hoàn lại không?', a: 'Chúng tôi có chính sách hoàn tiền trong 7 ngày nếu bạn chưa xem quá 20% nội dung.' },
                { q: 'Khóa học có cập nhật nội dung không?', a: 'Tất cả khóa học được cập nhật thường xuyên theo xu hướng công nghiệp mới nhất.' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-2">❓ {item.q}</h4>
                  <p className="text-gray-600 text-sm">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                to="/faq"
                className="inline-flex items-center text-blue-600 font-semibold hover:underline"
              >
                Xem tất cả câu hỏi thường gặp
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

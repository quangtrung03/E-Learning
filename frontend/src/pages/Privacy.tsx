const Privacy = () => {
  const sections = [
    {
      title: '1. Thông tin chúng tôi thu thập',
      content: [
        'Chúng tôi thu thập thông tin bạn cung cấp trực tiếp khi đăng ký tài khoản: họ tên, địa chỉ email, mật khẩu (được mã hóa), và tùy chọn: ảnh đại diện, số điện thoại.',
        'Chúng tôi tự động thu thập dữ liệu sử dụng: địa chỉ IP, loại trình duyệt, thời gian truy cập, các trang đã xem, tiến độ học tập, và kết quả bài kiểm tra.',
        'Khi thực hiện thanh toán, chúng tôi nhận thông tin giao dịch từ cổng thanh toán — chúng tôi không lưu trữ thông tin thẻ ngân hàng của bạn.',
      ],
    },
    {
      title: '2. Cách chúng tôi sử dụng thông tin',
      content: [
        'Cung cấp, vận hành và cải thiện dịch vụ ELearn.',
        'Gửi thông báo về khóa học, chứng chỉ, tiến độ học tập và các cập nhật quan trọng.',
        'Phân tích hành vi học tập để cá nhân hóa trải nghiệm và đề xuất nội dung phù hợp.',
        'Ngăn chặn gian lận, xử lý tranh chấp và thực thi chính sách của nền tảng.',
        'Tuân thủ các yêu cầu pháp lý hiện hành.',
      ],
    },
    {
      title: '3. Chia sẻ thông tin',
      content: [
        'Chúng tôi KHÔNG bán thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.',
        'Thông tin có thể được chia sẻ với các nhà cung cấp dịch vụ đáng tin cậy (xử lý thanh toán, lưu trữ đám mây, dịch vụ email) nhằm vận hành nền tảng.',
        'Chúng tôi có thể công bố thông tin khi được yêu cầu bởi cơ quan có thẩm quyền theo quy định pháp luật.',
        'Trong trường hợp sáp nhập hoặc mua lại công ty, thông tin người dùng có thể được chuyển giao với thông báo trước.',
      ],
    },
    {
      title: '4. Bảo mật dữ liệu',
      content: [
        'Tất cả dữ liệu truyền tải được mã hóa bằng TLS/HTTPS.',
        'Mật khẩu người dùng được băm (hash) bằng bcrypt trước khi lưu trữ — chúng tôi không thể đọc mật khẩu của bạn.',
        'Hệ thống sử dụng xác thực JWT với thời hạn phiên đăng nhập có giới hạn.',
        'Chúng tôi thực hiện kiểm tra bảo mật định kỳ và áp dụng các biện pháp bảo vệ chống tấn công phổ biến (SQL injection, XSS, CSRF).',
      ],
    },
    {
      title: '5. Quyền của bạn',
      content: [
        'Truy cập: Bạn có quyền yêu cầu bản sao dữ liệu cá nhân mà chúng tôi đang lưu trữ.',
        'Sửa đổi: Bạn có thể cập nhật thông tin cá nhân bất cứ lúc nào qua trang hồ sơ.',
        'Xóa: Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân qua bộ phận hỗ trợ.',
        'Từ chối: Bạn có thể hủy đăng ký email marketing bất cứ lúc nào qua liên kết ở cuối mỗi email.',
      ],
    },
    {
      title: '6. Cookie và theo dõi',
      content: [
        'Chúng tôi sử dụng cookie cần thiết để duy trì phiên đăng nhập và lưu tùy chọn người dùng.',
        'Cookie phân tích giúp chúng tôi hiểu cách người dùng sử dụng nền tảng để cải thiện trải nghiệm.',
        'Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên điều này có thể ảnh hưởng đến một số tính năng.',
      ],
    },
    {
      title: '7. Thông tin trẻ em',
      content: [
        'Dịch vụ ELearn không dành cho trẻ em dưới 13 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em.',
        'Nếu bạn phát hiện trẻ em đã đăng ký tài khoản, vui lòng liên hệ để chúng tôi xử lý kịp thời.',
      ],
    },
    {
      title: '8. Thay đổi chính sách',
      content: [
        'Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Mọi thay đổi quan trọng sẽ được thông báo qua email và hiển thị trên trang web ít nhất 30 ngày trước khi có hiệu lực.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Chính sách bảo mật</h1>
          <p className="text-gray-300 text-lg">Cập nhật lần cuối: Tháng 1 năm 2026</p>
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto">
            ELearn cam kết bảo vệ quyền riêng tư của bạn. Tài liệu này mô tả cách chúng tôi thu thập,
            sử dụng và bảo vệ thông tin cá nhân của bạn.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-gray max-w-none space-y-10">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.content.map((point, j) => (
                  <li key={j} className="flex gap-3 text-gray-600 leading-relaxed">
                    <span className="text-blue-500 flex-shrink-0 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Liên hệ về quyền riêng tư</h2>
            <p className="text-gray-600 mb-4">
              Nếu bạn có câu hỏi hoặc lo ngại về chính sách bảo mật, vui lòng liên hệ chúng tôi:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Email:</span> privacy@elearn.vn</p>
              <p><span className="font-medium">Địa chỉ:</span> 123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

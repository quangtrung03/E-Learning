import { Link } from 'react-router-dom';

const Terms = () => {
  const sections = [
    {
      title: '1. Chấp nhận điều khoản',
      content: [
        'Bằng cách truy cập hoặc sử dụng nền tảng ELearn, bạn đồng ý bị ràng buộc bởi các Điều khoản dịch vụ này.',
        'Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ của chúng tôi.',
        'ELearn có quyền cập nhật các điều khoản này bất cứ lúc nào. Tiếp tục sử dụng dịch vụ sau khi thay đổi đồng nghĩa với việc chấp nhận điều khoản mới.',
      ],
    },
    {
      title: '2. Tài khoản người dùng',
      content: [
        'Bạn phải đủ 13 tuổi trở lên để tạo tài khoản trên ELearn.',
        'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và tất cả hoạt động xảy ra dưới tài khoản của mình.',
        'Thông tin tài khoản phải chính xác, đầy đủ và cập nhật.',
        'Không được tạo tài khoản dưới danh nghĩa người khác hoặc sử dụng thông tin giả mạo.',
        'ELearn có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản sử dụng mà không cần thông báo trước.',
      ],
    },
    {
      title: '3. Quyền truy cập khóa học',
      content: [
        'Sau khi thanh toán thành công, bạn có quyền truy cập trọn đời vào nội dung khóa học đã mua.',
        'Giấy phép này là cá nhân, không thể chuyển nhượng và chỉ dành cho mục đích học tập cá nhân.',
        'Nghiêm cấm chia sẻ tài khoản, tải xuống và phân phối lại nội dung dưới mọi hình thức.',
        'ELearn có quyền thu hồi quyền truy cập nếu phát hiện vi phạm bản quyền hoặc điều khoản sử dụng.',
      ],
    },
    {
      title: '4. Quy tắc ứng xử cộng đồng',
      content: [
        'Tôn trọng giảng viên và các học viên khác trong mọi tương tác trên nền tảng.',
        'Không đăng tải nội dung thù ghét, phân biệt đối xử, bạo lực hoặc xúc phạm.',
        'Không spam, quảng cáo spam hoặc sử dụng nền tảng vào mục đích thương mại ngoài phạm vi cho phép.',
        'Không cố gắng truy cập trái phép vào hệ thống, dữ liệu của người dùng khác.',
        'Tuân thủ luật bản quyền: chỉ chia sẻ nội dung mà bạn có quyền sở hữu hoặc quyền phân phối.',
      ],
    },
    {
      title: '5. Thanh toán và hoàn tiền',
      content: [
        'Giá khóa học hiển thị đã bao gồm VAT (nếu có). Giá cuối cùng sẽ được xác nhận trước khi thanh toán.',
        'Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày sau khi mua, với điều kiện chưa xem quá 20% nội dung.',
        'Hoàn tiền sẽ được xử lý trong 3–5 ngày làm việc về phương thức thanh toán ban đầu.',
        'Mã giảm giá chỉ có giá trị trong thời hạn quy định và không thể quy đổi thành tiền mặt.',
        'Giao dịch gian lận hoặc vi phạm điều khoản sẽ không được hoàn tiền.',
      ],
    },
    {
      title: '6. Nội dung của giảng viên',
      content: [
        'Giảng viên duy trì quyền sở hữu trí tuệ đối với nội dung do họ tạo ra.',
        'Bằng cách đăng tải nội dung lên ELearn, giảng viên cấp cho chúng tôi quyền sử dụng, phân phối và hiển thị nội dung đó trên nền tảng.',
        'Giảng viên chịu trách nhiệm đảm bảo nội dung không vi phạm quyền sở hữu trí tuệ của bên thứ ba.',
        'ELearn có quyền xóa nội dung vi phạm mà không cần thông báo trước.',
      ],
    },
    {
      title: '7. Giới hạn trách nhiệm',
      content: [
        'ELearn cung cấp nền tảng "nguyên trạng" và không đảm bảo tính liên tục hoặc không có lỗi.',
        'Chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng dịch vụ.',
        'Trách nhiệm tối đa của ELearn trong mọi trường hợp không vượt quá số tiền bạn đã thanh toán trong 12 tháng gần nhất.',
        'Nội dung khóa học chỉ mang tính giáo dục, không phải tư vấn chuyên nghiệp về pháp lý, y tế hay tài chính.',
      ],
    },
    {
      title: '8. Chấm dứt dịch vụ',
      content: [
        'Bạn có thể xóa tài khoản bất cứ lúc nào qua bộ phận hỗ trợ.',
        'ELearn có thể chấm dứt hoặc đình chỉ tài khoản của bạn nếu vi phạm các điều khoản này.',
        'Sau khi tài khoản bị xóa, bạn sẽ mất quyền truy cập vào tất cả nội dung đã mua. Dữ liệu cá nhân sẽ được xử lý theo Chính sách bảo mật của chúng tôi.',
      ],
    },
    {
      title: '9. Luật áp dụng',
      content: [
        'Các điều khoản này được điều chỉnh theo pháp luật Việt Nam.',
        'Mọi tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.',
        'Nếu bất kỳ điều khoản nào được coi là không hợp lệ, các điều khoản còn lại vẫn có hiệu lực đầy đủ.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Điều khoản dịch vụ</h1>
          <p className="text-gray-300 text-lg">Cập nhật lần cuối: Tháng 1 năm 2026</p>
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto">
            Vui lòng đọc kỹ các điều khoản này trước khi sử dụng nền tảng ELearn.
            Sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận toàn bộ điều khoản dưới đây.
          </p>
        </div>
      </section>

      {/* Quick Nav */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-2 font-medium">Điều hướng nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-12">
          {sections.map((section, i) => (
            <div key={i} id={`section-${i}`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-5 pb-2 border-b border-gray-200">
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

          {/* Footer note */}
          <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
            <h3 className="font-bold text-gray-900 mb-3">📋 Lưu ý quan trọng</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tài liệu này là điều khoản pháp lý ràng buộc giữa bạn và ELearn. Nếu bạn có bất kỳ
              câu hỏi nào về điều khoản, hãy liên hệ chúng tôi trước khi sử dụng dịch vụ.
            </p>
            <div className="flex gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center text-blue-600 font-semibold hover:underline text-sm"
              >
                Liên hệ hỗ trợ →
              </Link>
              <Link
                to="/privacy"
                className="inline-flex items-center text-blue-600 font-semibold hover:underline text-sm"
              >
                Chính sách bảo mật →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

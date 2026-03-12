import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { value: '10.000+', label: 'Học viên đang học' },
    { value: '200+', label: 'Khóa học chất lượng' },
    { value: '50+', label: 'Giảng viên chuyên gia' },
    { value: '98%', label: 'Tỉ lệ hài lòng' },
  ];

  const team = [
    {
      name: 'Nguyễn Minh Trí',
      role: 'CEO & Đồng sáng lập',
      bio: '10+ năm kinh nghiệm trong lĩnh vực giáo dục công nghệ.',
      initial: 'T',
    },
    {
      name: 'Trần Phương Linh',
      role: 'CTO & Đồng sáng lập',
      bio: 'Chuyên gia phát triển nền tảng e-learning quy mô lớn.',
      initial: 'L',
    },
    {
      name: 'Lê Thanh Tuấn',
      role: 'Giám đốc Nội dung',
      bio: 'Định hướng chương trình giảng dạy và kiểm duyệt chất lượng.',
      initial: 'T',
    },
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Tập trung vào kết quả',
      desc: 'Chúng tôi đo lường thành công qua sự nghiệp và cuộc sống của học viên, không chỉ bằng số lượng khóa học.',
    },
    {
      icon: '🤝',
      title: 'Cộng đồng học tập',
      desc: 'Xây dựng môi trường mà mọi người kết nối, hỗ trợ lẫn nhau trong hành trình phát triển.',
    },
    {
      icon: '💡',
      title: 'Nội dung thực tiễn',
      desc: 'Mỗi bài học được thiết kế từ kinh nghiệm thực tế, áp dụng được ngay vào công việc.',
    },
    {
      icon: '🌱',
      title: 'Học suốt đời',
      desc: 'Cung cấp lộ trình học tập liên tục, cập nhật kiến thức theo xu hướng công nghiệp mới nhất.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Về ELearn</h1>
          <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            Chúng tôi xây dựng nền tảng học tập trực tuyến giúp bất kỳ ai có thể tiếp cận kiến thức
            chất lượng cao và phát triển sự nghiệp theo cách của riêng mình.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{s.value}</div>
                <div className="text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Sứ mệnh của chúng tôi</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-6">Dân chủ hóa việc học</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              ELearn được thành lập năm 2023 với sứ mệnh đơn giản: giúp mọi người — không phân biệt
              điều kiện kinh tế hay địa lý — có thể tiếp cận kiến thức từ những chuyên gia giỏi nhất.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Chúng tôi tin rằng giáo dục chất lượng là quyền của tất cả mọi người. Mỗi khóa học trên
              nền tảng đều được kiểm duyệt xây dựng từ kinh nghiệm thực tiễn.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Khám phá khóa học
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-10 text-center">
            <div className="text-8xl mb-6">🎓</div>
            <blockquote className="text-xl text-gray-700 italic leading-relaxed">
              "Đầu tư vào kiến thức là khoản đầu tư mang lại lợi nhuận cao nhất."
            </blockquote>
            <cite className="text-gray-500 text-sm mt-4 block">— Benjamin Franklin</cite>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-gray-600 text-lg">Những nguyên tắc định hướng chúng tôi mỗi ngày</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Đội ngũ sáng lập</h2>
          <p className="text-gray-600 text-lg">Những người đã xây dựng và định hình ELearn</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <div key={i} className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">{member.initial}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-blue-600 font-medium text-sm mb-2">{member.role}</p>
              <p className="text-gray-600 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Tham gia cùng hàng nghìn học viên đang phát triển sự nghiệp tại ELearn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Liên hệ chúng tôi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

import { Button } from "../components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100">
      

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-10 py-20">
        <div className="max-w-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary-700 leading-snug">
            Học trực tuyến <span className="text-secondary-600">mọi lúc, mọi nơi</span>
          </h2>
          <p className="mt-6 text-gray-600 text-lg">
            Nền tảng e-learning hiện đại giúp bạn dễ dàng tiếp cận tri thức,
            học tập hiệu quả và kết nối cùng cộng đồng.
          </p>
          <div className="mt-8 flex gap-4">
            <Button variant="primary" size="lg" className="rounded-xl">
              🎯 Bắt đầu ngay
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl">
              📚 Xem khóa học
            </Button>
          </div>
        </div>

        <div className="mt-12 md:mt-0">
          {/* <img
            src="https://illustrations.popsy.co/green/online-learning.svg"
            alt="Learning Illustration"
            className="w-[450px] max-w-full"
          /> */}
        </div>  
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-10 grid md:grid-cols-3 gap-10 text-center">
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-primary-600">
          <div className="mx-auto w-12 h-12 text-primary-600 text-4xl">📚</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Nhiều khóa học</h3>
          <p className="text-gray-600 mt-2">
            Hàng trăm khóa học đa dạng, phù hợp cho mọi cấp độ.
          </p>
        </div>
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-secondary-600">
          <div className="mx-auto w-12 h-12 text-secondary-600 text-4xl">🎥</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Học dễ dàng</h3>
          <p className="text-gray-600 mt-2">
            Nội dung được thiết kế khoa học, dễ tiếp thu và áp dụng thực tế.
          </p>
        </div>
        <div className="p-6 rounded-2xl shadow-md border-t-4 border-primary-600">
          <div className="mx-auto w-12 h-12 text-primary-600 text-4xl">👥</div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Cộng đồng học tập</h3>
          <p className="text-gray-600 mt-2">
            Kết nối với giảng viên và bạn học trên toàn quốc.
          </p>
        </div>
      </section>
    </div>
  );
}

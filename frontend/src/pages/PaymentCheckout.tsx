import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle, Tag, Loader2, X } from 'lucide-react';
import { courseAPI, paymentAPI, couponAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import useDefaultCourseThumbnailUrl from '../hooks/useDefaultCourseThumbnailUrl';
import resolveFileUrl from '../utils/resolveFileUrl';

interface Course {
  _id: string;
  title: string;
  price: number;
  discount?: number;
  thumbnail?: string;
  instructor: {
    name: string;
  };
}

const PaymentCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const defaultCourseThumbnailUrl = useDefaultCourseThumbnailUrl();
  const fallbackCourseThumbnailUrl = resolveFileUrl(defaultCourseThumbnailUrl || undefined);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'zalopay' | 'bank-transfer'>('vnpay');

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; description?: string } | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getCourse(courseId!);
        setCourse(response.data?.data?.course);
      } catch (error: any) {
        showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải thông tin khóa học' });
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const calculateFinalPrice = () => {
    if (!course) return 0;
    const discountPercent = course.discount || 0;
    const discountAmount = (course.price * discountPercent) / 100;
    const priceAfterCourseDiscount = course.price - discountAmount;
    return Math.max(0, priceAfterCourseDiscount - (appliedCoupon?.discountAmount || 0));
  };

  const handleCouponCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value.toUpperCase());
    setCouponError('');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const response = await couponAPI.validateCoupon({ code: couponCode.trim(), courseId: course._id });
      const data = response.data?.data;
      if (response.data?.success && data) {
        const priceAfterCourseDiscount = course.price - (course.price * (course.discount || 0)) / 100;
        const discountAmount = data.discountAmount ?? 0;
        setAppliedCoupon({
          code: couponCode.trim(),
          discountAmount: Math.min(discountAmount, priceAfterCourseDiscount),
          description: data.coupon?.name || data.coupon?.description || ''
        });
        setCouponCode('');
      } else {
        setCouponError(response.data?.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handlePayment = async () => {
    if (!course) return;
    
    setProcessing(true);
    try {
      const response = await paymentAPI.createPayment({
        courseId: course._id,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        paymentMethod: {
          type: paymentMethod,
          provider: paymentMethod
        }
      });

      const redirectUrl: string | null = response.data?.data?.redirectUrl || null;
      if (response.data?.success && redirectUrl) {
        if (/^https?:\/\//i.test(redirectUrl)) {
          window.location.href = redirectUrl;
        } else {
          navigate(redirectUrl);
        }
      } else {
        showToast({
          type: 'info',
          title: response.data?.message || 'Đang phát triển tính năng thanh toán'
        });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const courseThumbnailSrc = resolveFileUrl(course.thumbnail) || fallbackCourseThumbnailUrl;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Thanh toán khóa học</h1>
            <p className="text-blue-100 mt-1">Hoàn tất thanh toán để bắt đầu học ngay</p>
          </div>

          <div className="p-8">
            {/* Course Info */}
            <div className="flex items-start space-x-4 pb-6 border-b">
              {courseThumbnailSrc && (
                <img
                  src={courseThumbnailSrc}
                  alt={course.title}
                  className="w-32 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
                <p className="text-gray-600 mt-1">Giảng viên: {course.instructor.name}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="py-6 border-b">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Giá gốc:</span>
                  <span>{course.price.toLocaleString('vi-VN')}đ</span>
                </div>
                {(course.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({course.discount}%):</span>
                    <span>-{((course.price * (course.discount || 0)) / 100).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-purple-600">
                    <span>Mã giảm giá ({appliedCoupon.code}):</span>
                    <span>-{appliedCoupon.discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Tổng thanh toán:</span>
                  <span className="text-blue-600">{calculateFinalPrice().toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="py-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                Mã giảm giá
              </h3>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div>
                    <span className="font-semibold text-purple-800">{appliedCoupon.code}</span>
                    {appliedCoupon.description && (
                      <p className="text-sm text-purple-600 mt-0.5">{appliedCoupon.description}</p>
                    )}
                    <p className="text-sm text-green-700 mt-0.5">
                      Giảm {appliedCoupon.discountAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Xóa mã giảm giá"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={handleCouponCodeChange}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chọn phương thức thanh toán
              </h3>
              
              <div className="space-y-3">
                {/* VNPay */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'vnpay'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">VNPay</div>
                      <div className="text-sm text-gray-500">Thanh toán qua VNPay QR</div>
                    </div>
                  </div>
                  {paymentMethod === 'vnpay' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </motion.button>

                {/* MoMo */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('momo')}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'momo'
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">MoMo</div>
                      <div className="text-sm text-gray-500">Ví điện tử MoMo</div>
                    </div>
                  </div>
                  {paymentMethod === 'momo' && (
                    <CheckCircle className="w-6 h-6 text-pink-600" />
                  )}
                </motion.button>

                {/* ZaloPay */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('zalopay')}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'zalopay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Z</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">ZaloPay</div>
                      <div className="text-sm text-gray-500">Ví điện tử ZaloPay</div>
                    </div>
                  </div>
                  {paymentMethod === 'zalopay' && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </motion.button>

                {/* Bank transfer (offline/manual) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('bank-transfer')}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'bank-transfer'
                      ? 'border-gray-700 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Chuyển khoản ngân hàng</div>
                      <div className="text-sm text-gray-500">Thanh toán offline, admin sẽ duyệt</div>
                    </div>
                  </div>
                  {paymentMethod === 'bank-transfer' && (
                    <CheckCircle className="w-6 h-6 text-gray-800" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900">Thanh toán bảo mật</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Thông tin thanh toán của bạn được mã hóa và bảo vệ bởi các cổng thanh toán uy tín
                  </p>
                </div>
              </div>
            </div>

            {/* Development Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900">Thông báo</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Thanh toán online (VNPay/MoMo/ZaloPay) đang ở chế độ mô phỏng. Bạn có thể chọn chuyển khoản để tạo yêu cầu thanh toán offline và admin sẽ duyệt.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  'Thanh toán ngay'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCheckout;

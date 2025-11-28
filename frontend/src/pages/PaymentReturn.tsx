import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { paymentAPI } from '../services/api';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment params from URL
        const vnpayParams = {
          vnp_Amount: searchParams.get('vnp_Amount'),
          vnp_BankCode: searchParams.get('vnp_BankCode'),
          vnp_BankTranNo: searchParams.get('vnp_BankTranNo'),
          vnp_CardType: searchParams.get('vnp_CardType'),
          vnp_OrderInfo: searchParams.get('vnp_OrderInfo'),
          vnp_PayDate: searchParams.get('vnp_PayDate'),
          vnp_ResponseCode: searchParams.get('vnp_ResponseCode'),
          vnp_TmnCode: searchParams.get('vnp_TmnCode'),
          vnp_TransactionNo: searchParams.get('vnp_TransactionNo'),
          vnp_TransactionStatus: searchParams.get('vnp_TransactionStatus'),
          vnp_TxnRef: searchParams.get('vnp_TxnRef'),
          vnp_SecureHash: searchParams.get('vnp_SecureHash')
        };

        const responseCode = searchParams.get('vnp_ResponseCode');
        const txnRef = searchParams.get('vnp_TxnRef');

        setOrderId(txnRef || '');

        // Check response code
        if (responseCode === '00') {
          // Success
          setStatus('success');
          setMessage('Thanh toán thành công! Bạn đã đăng ký khóa học thành công.');
        } else {
          // Failed
          setStatus('failed');
          setMessage(getErrorMessage(responseCode));
        }

        // Call API to verify and update payment status
        try {
          await paymentAPI.verifyPayment(vnpayParams);
        } catch (error) {
          console.error('Error verifying payment:', error);
        }
      } catch (error) {
        setStatus('failed');
        setMessage('Có lỗi xảy ra khi xác thực thanh toán');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const getErrorMessage = (code: string | null) => {
    switch (code) {
      case '07':
        return 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).';
      case '09':
        return 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.';
      case '10':
        return 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần';
      case '11':
        return 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.';
      case '12':
        return 'Thẻ/Tài khoản của khách hàng bị khóa.';
      case '13':
        return 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.';
      case '24':
        return 'Khách hàng hủy giao dịch';
      case '51':
        return 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.';
      case '65':
        return 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.';
      case '75':
        return 'Ngân hàng thanh toán đang bảo trì.';
      case '79':
        return 'KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch';
      default:
        return 'Giao dịch không thành công';
    }
  };

  const handleRedirect = () => {
    if (status === 'success') {
      navigate('/dashboard');
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Đang xử lý thanh toán
              </h2>
              <p className="text-gray-600">
                Vui lòng đợi trong giây lát...
              </p>
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thành công!
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Mã đơn hàng</p>
                  <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                </div>
              )}
              <button
                onClick={handleRedirect}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Đi tới khóa học của tôi
              </button>
            </motion.div>
          )}

          {status === 'failed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thất bại
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Mã đơn hàng</p>
                  <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={handleRedirect}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Quay lại khóa học
                </button>
                <button
                  onClick={() => window.location.href = 'mailto:support@elearn.com'}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Liên hệ hỗ trợ
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Cần hỗ trợ? <a href="mailto:support@elearn.com" className="text-blue-600 hover:underline">Liên hệ với chúng tôi</a>
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentReturn;

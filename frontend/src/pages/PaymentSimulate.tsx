import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { CreditCard, Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

interface PaymentByOrderResponse {
  _id: string;
  orderId: string;
  status: PaymentStatus;
  amount: { original: number; discount: number; final: number; currency?: string };
  course?: { _id: string; title: string; thumbnail?: string };
  paymentGatewayResponse?: any;
}

const PaymentSimulate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const orderId = searchParams.get('orderId') || '';
  const provider = (searchParams.get('provider') || 'gateway').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentByOrderResponse | null>(null);

  const bankInfo = useMemo(() => {
    const fromGateway = payment?.paymentGatewayResponse?.bankInfo;
    const transferNote = `EL${orderId}`;

    return {
      bank: fromGateway?.bank || 'Vietcombank',
      accountNumber: fromGateway?.accountNumber || '1234567890',
      accountName: fromGateway?.accountName || 'CÔNG TY HỌC TRỰC TUYẾN',
      transferNote: fromGateway?.transferNote || transferNote,
      amount: payment?.amount?.final || 0
    };
  }, [orderId, payment]);

  const qrValue = useMemo(() => {
    // Đây là QR demo để “trông giống thật”. Không phải chuẩn VietQR.
    // Nội dung QR có đủ thông tin để test UX + copy/paste dễ.
    return [
      'ELPAY-DEMO',
      `PROVIDER=${provider}`,
      `ORDER=${orderId}`,
      `AMOUNT=${bankInfo.amount}`,
      `BANK=${bankInfo.bank}`,
      `ACC=${bankInfo.accountNumber}`,
      `NAME=${bankInfo.accountName}`,
      `NOTE=${bankInfo.transferNote}`
    ].join('|');
  }, [bankInfo, orderId, provider]);

  useEffect(() => {
    const run = async () => {
      if (!orderId) {
        showToast({ type: 'error', title: 'Thiếu mã đơn hàng' });
        navigate('/payment/history');
        return;
      }

      try {
        const response = await paymentAPI.getPaymentByOrderId(orderId);
        setPayment(response.data?.data?.payment || null);
      } catch (error: any) {
        showToast({
          type: 'error',
          title: error.response?.data?.message || 'Không thể tải thông tin giao dịch'
        });
        navigate('/payment/history');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate, orderId, showToast]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ type: 'success', title: `Đã sao chép ${label}` });
    } catch {
      showToast({ type: 'error', title: 'Không thể sao chép. Vui lòng sao chép thủ công.' });
    }
  };

  const handleSimulateSuccess = async () => {
    if (!orderId) return;

    setSubmitting(true);
    try {
      await paymentAPI.fakeSuccess(orderId);
      navigate(`/payment/return?orderId=${encodeURIComponent(orderId)}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      // Nếu đã completed thì coi như thành công và chuyển qua return
      if (msg && String(msg).toLowerCase().includes('được thanh toán rồi')) {
        navigate(`/payment/return?orderId=${encodeURIComponent(orderId)}`);
        return;
      }
      showToast({ type: 'error', title: msg || 'Không thể giả lập thanh toán' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="px-8 py-6 border-b bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Cổng thanh toán (giả lập)</h1>
                  <p className="text-sm text-gray-600">
                    Nhà cung cấp: <span className="font-medium">{provider}</span> • Mã đơn: <span className="font-medium">{payment.orderId}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/payment/return?orderId=${encodeURIComponent(orderId)}`)}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
              >
                Xem trạng thái
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Quét QR để thanh toán</h2>
              <div className="bg-white border rounded-xl p-6 inline-block">
                <QRCode value={qrValue} size={220} />
              </div>
              <p className="text-sm text-gray-600 mt-3">
                QR này là demo để thử trải nghiệm. Với cổng thanh toán thật (VNPay/MoMo), QR sẽ theo chuẩn của nhà cung cấp.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm">
                    <div className="text-gray-500">Số tiền</div>
                    <div className="font-semibold text-gray-900">{payment.amount.final.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <button
                    onClick={() => copyText(String(payment.amount.final), 'số tiền')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" /> Sao chép
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500">Nội dung chuyển khoản</div>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="font-semibold text-gray-900 break-all">{bankInfo.transferNote}</div>
                    <button
                      onClick={() => copyText(bankInfo.transferNote, 'nội dung chuyển khoản')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                    >
                      <Copy className="w-4 h-4" /> Sao chép
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Thông tin nhận tiền</h2>
              <div className="border rounded-xl p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Ngân hàng</span>
                    <span className="font-medium text-gray-900">{bankInfo.bank}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Số tài khoản</span>
                    <span className="font-medium text-gray-900">{bankInfo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Chủ tài khoản</span>
                    <span className="font-medium text-gray-900">{bankInfo.accountName}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  Trang này dùng để giả lập cổng thanh toán (QR + xác nhận). Khi tích hợp cổng thật, nút “Giả lập” sẽ được thay bằng callback/webhook thật.
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSimulateSuccess}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Giả lập thanh toán thành công
                  </button>

                  <button
                    onClick={() => navigate('/payment/history')}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-gray-700 hover:bg-gray-100"
                  >
                    <XCircle className="w-5 h-5" /> Hủy / Quay lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSimulate;

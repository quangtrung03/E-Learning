import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Sparkles, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { couponAPI } from '../services/api';

export interface PublicCoupon {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed-amount';
  value: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  validUntil?: string;
  applicableCategories?: string[];
  remainingUses?: number | null;
}

interface VoucherModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /** Price after course-level discount (the base price to compare against minOrderAmount) */
  orderAmount: number;
  appliedCode?: string;
  onApply: (coupon: { code: string; discountAmount: number; description?: string }) => void;
}

/** Calculate how much a coupon saves for a given amount */
function calcDiscount(coupon: PublicCoupon, amount: number): number {
  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) return 0;
  let discount =
    coupon.type === 'percentage'
      ? (amount * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount;
  }
  return Math.min(discount, amount);
}

const VoucherModal = ({
  open,
  onClose,
  courseId,
  orderAmount,
  appliedCode,
  onApply,
}: VoucherModalProps) => {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<{ [code: string]: string }>({});

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await couponAPI.getPublicCoupons(courseId);
      setCoupons(res.data?.data?.coupons || []);
    } catch {
      setError('Không thể tải danh sách voucher. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (open) {
      fetchCoupons();
      setApplyError({});
    }
  }, [open, fetchCoupons]);

  /** Pick the coupon with the highest discount for the current orderAmount */
  const handlePickBest = () => {
    const eligible = coupons.filter(c => (discountMap[c.code] ?? 0) > 0);
    if (eligible.length === 0) return;
    const best = eligible.reduce((prev, cur) =>
      (discountMap[cur.code] ?? 0) > (discountMap[prev.code] ?? 0) ? cur : prev
    );
    handleApply(best);
  };

  const handleApply = async (coupon: PublicCoupon) => {
    const discount = discountMap[coupon.code] ?? calcDiscount(coupon, orderAmount);
    if (discount <= 0) {
      setApplyError(prev => ({
        ...prev,
        [coupon.code]: `Đơn hàng chưa đạt tối thiểu ${(coupon.minOrderAmount || 0).toLocaleString('vi-VN')}đ`
      }));
      return;
    }
    setApplying(coupon.code);
    setApplyError(prev => ({ ...prev, [coupon.code]: '' }));
    try {
      // Validate with server before confirming (auth-guarded endpoint)
      const res = await couponAPI.validateCoupon({ code: coupon.code, courseId });
      if (res.data?.success) {
        const serverDiscount = res.data?.data?.discountAmount ?? discount;
        onApply({
          code: coupon.code,
          discountAmount: Math.min(serverDiscount, orderAmount),
          description: coupon.name || coupon.description
        });
        onClose();
      } else {
        setApplyError(prev => ({
          ...prev,
          [coupon.code]: res.data?.message || 'Không thể áp dụng mã này'
        }));
      }
    } catch (err: any) {
      setApplyError(prev => ({
        ...prev,
        [coupon.code]: err.response?.data?.message || 'Không thể áp dụng mã này'
      }));
    } finally {
      setApplying(null);
    }
  };

  const formatDiscount = (c: PublicCoupon) => {
    if (c.type === 'percentage') {
      const label = `Giảm ${c.value}%`;
      return c.maxDiscountAmount ? `${label} (tối đa ${c.maxDiscountAmount.toLocaleString('vi-VN')}đ)` : label;
    }
    return `Giảm ${c.value.toLocaleString('vi-VN')}đ`;
  };

  const formatExpiry = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const bestCode = (() => {
    const eligible = coupons.filter(c => calcDiscount(c, orderAmount) > 0);
    if (eligible.length === 0) return null;
    return eligible.reduce((p, c) => calcDiscount(c, orderAmount) > calcDiscount(p, orderAmount) ? c : p).code;
  })();

  /** Pre-compute discount once per coupon per render to avoid repetitive calls */
  const discountMap = Object.fromEntries(
    coupons.map(c => [c.code, calcDiscount(c, orderAmount)])
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Chọn Voucher</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-select bar */}
            {!loading && coupons.length > 0 && (
              <div className="px-5 py-3 bg-purple-50 border-b flex items-center justify-between gap-3">
                <p className="text-sm text-purple-700">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Chúng tôi tìm thấy <strong>{coupons.length}</strong> voucher khả dụng
                </p>
                <button
                  onClick={handlePickBest}
                  disabled={!bestCode}
                  className="shrink-0 text-sm font-semibold text-purple-700 bg-white border border-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ✨ Chọn mã tốt nhất
                </button>
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {loading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}

              {!loading && error && (
                <div className="flex items-center gap-2 text-red-600 text-sm py-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {!loading && !error && coupons.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Không có voucher nào khả dụng</p>
                  <p className="text-sm mt-1">Bạn có thể nhập thủ công nếu có mã riêng.</p>
                </div>
              )}

              {!loading &&
                coupons.map(coupon => {
                  const discount = discountMap[coupon.code] ?? 0;
                  const isApplicable = discount > 0;
                  const isApplied = appliedCode === coupon.code;
                  const isBest = bestCode === coupon.code;
                  const isApplying = applying === coupon.code;
                  const errMsg = applyError[coupon.code];

                  return (
                    <div
                      key={coupon.code}
                      className={`relative border-2 rounded-xl p-4 transition-all ${
                        isApplied
                          ? 'border-purple-500 bg-purple-50'
                          : isApplicable
                          ? 'border-gray-200 hover:border-purple-300 bg-white'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                      }`}
                    >
                      {/* Best badge */}
                      {isBest && isApplicable && (
                        <span className="absolute -top-2.5 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⭐ Tiết kiệm nhất
                        </span>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isApplicable ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <Tag className={`w-5 h-5 ${isApplicable ? 'text-purple-600' : 'text-gray-400'}`} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 font-mono">{coupon.code}</span>
                            {coupon.remainingUses != null && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                Còn {coupon.remainingUses} lượt
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-purple-700 mt-0.5">{formatDiscount(coupon)}</p>
                          {coupon.name && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{coupon.name}</p>
                          )}
                          {(coupon.minOrderAmount || 0) > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Đơn tối thiểu: {coupon.minOrderAmount!.toLocaleString('vi-VN')}đ
                            </p>
                          )}
                          {coupon.validUntil && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> HSD: {formatExpiry(coupon.validUntil)}
                            </p>
                          )}
                          {isApplicable && (
                            <p className="text-xs text-green-700 font-medium mt-1">
                              Bạn tiết kiệm được: {discount.toLocaleString('vi-VN')}đ
                            </p>
                          )}
                          {!isApplicable && (
                            <p className="text-xs text-red-500 mt-1">
                              Đơn hàng chưa đạt điều kiện tối thiểu
                            </p>
                          )}
                          {errMsg && (
                            <p className="text-xs text-red-500 mt-1">{errMsg}</p>
                          )}
                        </div>

                        {/* Apply button */}
                        <div className="shrink-0">
                          {isApplied ? (
                            <span className="flex items-center gap-1 text-purple-700 font-semibold text-sm">
                              <CheckCircle className="w-4 h-4" /> Đã dùng
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApply(coupon)}
                              disabled={!isApplicable || isApplying}
                              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                              {isApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Áp dụng
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoucherModal;

import { useState, useEffect } from 'react';
import { couponAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { Pagination } from '../components/ui/Pagination';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  Tag, 
  Calendar,
  Search,
  Copy,
  RefreshCw,
  BarChart2,
  CheckCircle
} from 'lucide-react';

/** Shape returned by the backend Coupon model */
interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed-amount';
  value: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  usageLimit: {
    total?: number | null;
    perUser: number;
  };
  currentUsage: {
    total: number;
  };
  validity: {
    startDate: string;
    endDate: string;
  };
  /** 'active' | 'inactive' | 'expired' | 'exhausted' */
  status: string;
  analytics?: {
    totalDiscountGiven: number;
    revenueGenerated: number;
  };
  createdAt: string;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
}

const AdminCouponManagement = () => {
  const toast = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed-amount',
    value: 0,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    usageLimitTotal: '',
    usageLimitPerUser: 1,
    validFrom: '',
    validUntil: '',
    status: 'active' as string
  });

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await couponAPI.getAllCoupons(params);
      if (response.data.success) {
        setCoupons(response.data.data.coupons || []);
        setTotalPages(response.data.pagination?.pages || 1);
        if (response.data.stats) setCouponStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải danh sách coupon' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCoupons();
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = formData.name.replace(/\s+/g, '').toUpperCase().substring(0, 4) || 'CODE';
    const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setFormData(prev => ({ ...prev, code: `${prefix}${suffix}` }));
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.showToast({ type: 'error', title: 'Không thể copy mã' });
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
        minOrderAmount: coupon.minOrderAmount,
        usageLimitTotal: coupon.usageLimit.total?.toString() || '',
        usageLimitPerUser: coupon.usageLimit.perUser,
        validFrom: new Date(coupon.validity.startDate).toISOString().slice(0, 16),
        validUntil: new Date(coupon.validity.endDate).toISOString().slice(0, 16),
        status: coupon.status === 'inactive' ? 'inactive' : 'active'
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        maxDiscountAmount: '',
        minOrderAmount: 0,
        usageLimitTotal: '',
        usageLimitPerUser: 1,
        validFrom: '',
        validUntil: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) { toast.showToast({ type: 'warning', title: 'Vui lòng nhập mã coupon' }); return; }
    if (!formData.name.trim()) { toast.showToast({ type: 'warning', title: 'Vui lòng nhập tên coupon' }); return; }
    if (formData.value <= 0) { toast.showToast({ type: 'warning', title: 'Giá trị coupon phải lớn hơn 0' }); return; }
    if (!formData.validFrom || !formData.validUntil) { toast.showToast({ type: 'warning', title: 'Vui lòng chọn thời gian hiệu lực' }); return; }
    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      toast.showToast({ type: 'warning', title: 'Ngày kết thúc phải sau ngày bắt đầu' });
      return;
    }

    try {
      setSaving(true);
      const couponData: any = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: formData.value,
        minOrderAmount: formData.minOrderAmount,
        usageLimit: {
          total: formData.usageLimitTotal ? parseInt(formData.usageLimitTotal) : null,
          perUser: formData.usageLimitPerUser
        },
        validity: {
          startDate: new Date(formData.validFrom).toISOString(),
          endDate: new Date(formData.validUntil).toISOString()
        },
        status: formData.status
      };
      if (formData.maxDiscountAmount) couponData.maxDiscountAmount = parseFloat(formData.maxDiscountAmount);

      let response;
      if (editingCoupon) {
        response = await couponAPI.updateCoupon(editingCoupon._id, couponData);
      } else {
        response = await couponAPI.createCoupon(couponData);
      }
      if (response.data.success) {
        toast.showToast({ type: 'success', title: editingCoupon ? 'Đã cập nhật coupon' : 'Đã tạo coupon mới' });
        setShowModal(false);
        fetchCoupons();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể lưu coupon' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (couponId: string) => {
    try {
      const response = await couponAPI.toggleCouponStatus(couponId);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã cập nhật trạng thái' });
        fetchCoupons();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể cập nhật trạng thái' });
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa coupon này?')) return;
    try {
      setDeleting(couponId);
      const response = await couponAPI.deleteCoupon(couponId);
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã xóa coupon' });
        fetchCoupons();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể xóa coupon' });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');
  const formatValue = (coupon: Coupon) =>
    coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toLocaleString('vi-VN')} VNĐ`;
  const isExpired = (coupon: Coupon) => new Date(coupon.validity.endDate) < new Date();
  const isExhausted = (coupon: Coupon) =>
    !!(coupon.usageLimit.total && coupon.currentUsage.total >= coupon.usageLimit.total);

  const statusBadge = (coupon: Coupon) => {
    if (coupon.status === 'inactive')
      return <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">Tạm dừng</span>;
    if (isExpired(coupon))
      return <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded">Hết hạn</span>;
    if (isExhausted(coupon))
      return <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded">Hết lượt</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">Hoạt động</span>;
  };

  if (loading && coupons.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Quản lý Coupon</h1>
          <p className="text-gray-600">Tạo và quản lý mã giảm giá cho các khóa học</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo Coupon mới
        </Button>
      </div>

      {/* Stats Bar */}
      {couponStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {([
            { label: 'Tổng coupon', value: couponStats.totalCoupons, color: 'text-gray-900', bg: 'bg-gray-50' },
            { label: 'Đang hoạt động', value: couponStats.activeCoupons, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Hết hạn', value: couponStats.expiredCoupons, color: 'text-gray-500', bg: 'bg-gray-50' },
            { label: 'Tổng lượt dùng', value: couponStats.totalUsage, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Đã giảm (VNĐ)', value: (couponStats.totalDiscountGiven || 0).toLocaleString('vi-VN'), color: 'text-orange-700', bg: 'bg-orange-50' },
            { label: 'Doanh thu từ coupon', value: (couponStats.totalRevenueGenerated || 0).toLocaleString('vi-VN'), color: 'text-purple-700', bg: 'bg-purple-50' }
          ] as const).map(stat => (
            <Card key={stat.label} className={`p-3 ${stat.bg}`}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã hoặc tên coupon..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Tìm</Button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
          <option value="expired">Hết hạn</option>
          <option value="exhausted">Hết lượt</option>
        </select>
        <Button size="sm" variant="outline" onClick={() => fetchCoupons()} title="Làm mới" className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : coupons.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có coupon nào</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Không tìm thấy coupon phù hợp với bộ lọc.'
              : 'Tạo coupon đầu tiên để bắt đầu khuyến mãi.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={() => handleOpenModal()}>Tạo Coupon đầu tiên</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="group flex items-center gap-1 font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      title="Click để copy mã"
                    >
                      <span className="font-mono">{coupon.code}</span>
                      {copiedCode === coupon.code
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                    {statusBadge(coupon)}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{coupon.name}</p>
                </div>
              </div>

              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{formatValue(coupon)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {coupon.type === 'percentage' ? 'Giảm theo phần trăm' : 'Giảm cố định'}
                </p>
              </div>

              <div className="space-y-1.5 mb-3 text-sm flex-1">
                {coupon.minOrderAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đơn tối thiểu:</span>
                    <span className="font-medium">{coupon.minOrderAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                {coupon.maxDiscountAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giảm tối đa:</span>
                    <span className="font-medium">{coupon.maxDiscountAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Đã dùng:</span>
                  <span className="font-medium flex items-center gap-1">
                    <BarChart2 className="w-3 h-3 text-blue-400" />
                    {coupon.currentUsage.total}/{coupon.usageLimit.total ?? '∞'}
                  </span>
                </div>
                {coupon.usageLimit.total ? (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (coupon.currentUsage.total / coupon.usageLimit.total) * 100)}%` }}
                    />
                  </div>
                ) : null}
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {formatDate(coupon.validity.startDate)} → {formatDate(coupon.validity.endDate)}
                  </span>
                </div>
                {coupon.analytics && coupon.analytics.totalDiscountGiven > 0 && (
                  <div className="flex justify-between text-xs text-purple-700 bg-purple-50 rounded px-2 py-1">
                    <span>Tổng đã giảm:</span>
                    <span className="font-semibold">{coupon.analytics.totalDiscountGiven.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t mt-auto">
                <Button size="sm" variant="outline" onClick={() => handleOpenModal(coupon)} className="flex-1 flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" />
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(coupon._id)}
                  className={`flex-1 flex items-center justify-center gap-1 ${coupon.status === 'active' ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}`}
                >
                  <Power className="w-3 h-3" />
                  {coupon.status === 'active' ? 'Tắt' : 'Bật'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(coupon._id)}
                  disabled={deleting === coupon._id}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {deleting === coupon._id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3 h-3" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              {editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon mới'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mã Coupon <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: GIAMGIA2024"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                    maxLength={20}
                    disabled={!!editingCoupon}
                  />
                  {!editingCoupon && (
                    <Button type="button" size="sm" variant="outline" onClick={generateCode} className="flex items-center gap-1 shrink-0">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tạo tự động
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tối đa 20 ký tự, tự động in hoa.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tên Coupon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Giảm giá đặc biệt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về coupon..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    disabled={!!editingCoupon}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed-amount">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Giá trị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    disabled={!!editingCoupon}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    min="0"
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tổng lượt sử dụng</label>
                  <input
                    type="number"
                    value={formData.usageLimitTotal}
                    onChange={(e) => setFormData({ ...formData, usageLimitTotal: e.target.value })}
                    min="1"
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lượt/người dùng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    min={formData.validFrom}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="active">Kích hoạt ngay</option>
                  <option value="inactive">Lưu nháp (chưa kích hoạt)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <><LoadingSpinner size="sm" /> Đang lưu...</> : (editingCoupon ? 'Cập nhật' : 'Tạo Coupon')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminCouponManagement;

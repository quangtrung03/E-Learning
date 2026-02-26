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
  Calendar
} from 'lucide-react';

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
    total?: number;
    perUser: number;
  };
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableFor: string;
  applicableCourses?: string[];
  applicableCategories?: string[];
  createdAt: string;
}

const AdminCouponManagement = () => {
  const toast = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed-amount',
    value: 0,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    usageLimit: {
      total: '',
      perUser: 1
    },
    validFrom: '',
    validUntil: '',
    applicableFor: 'all',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: 20
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await couponAPI.getAllCoupons(params);
      
      if (response.data.success) {
        setCoupons(response.data.data.coupons || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải danh sách coupon' 
      });
    } finally {
      setLoading(false);
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
        usageLimit: {
          total: coupon.usageLimit.total?.toString() || '',
          perUser: coupon.usageLimit.perUser
        },
        validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
        applicableFor: coupon.applicableFor,
        isActive: coupon.isActive
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
        usageLimit: {
          total: '',
          perUser: 1
        },
        validFrom: '',
        validUntil: '',
        applicableFor: 'all',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.code.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập mã coupon' });
      return;
    }
    if (!formData.name.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập tên coupon' });
      return;
    }
    if (formData.value <= 0) {
      toast.showToast({ type: 'warning', title: 'Giá trị coupon phải lớn hơn 0' });
      return;
    }
    if (!formData.validFrom || !formData.validUntil) {
      toast.showToast({ type: 'warning', title: 'Vui lòng chọn thời gian hiệu lực' });
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
          total: formData.usageLimit.total ? parseInt(formData.usageLimit.total) : null,
          perUser: formData.usageLimit.perUser
        },
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        applicableFor: formData.applicableFor,
        isActive: formData.isActive
      };

      if (formData.maxDiscountAmount) {
        couponData.maxDiscountAmount = parseFloat(formData.maxDiscountAmount);
      }

      let response;
      if (editingCoupon) {
        response = await couponAPI.updateCoupon(editingCoupon._id, couponData);
      } else {
        response = await couponAPI.createCoupon(couponData);
      }

      if (response.data.success) {
        toast.showToast({ 
          type: 'success', 
          title: editingCoupon ? 'Đã cập nhật coupon' : 'Đã tạo coupon mới' 
        });
        setShowModal(false);
        fetchCoupons();
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể lưu coupon' 
      });
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
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể cập nhật trạng thái' 
      });
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa coupon này?')) {
      return;
    }

    try {
      setDeleting(couponId);
      
      const response = await couponAPI.deleteCoupon(couponId);
      
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã xóa coupon' });
        fetchCoupons();
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể xóa coupon' 
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    }
    return `${coupon.value.toLocaleString('vi-VN')} VNĐ`;
  };

  const isExpired = (coupon: Coupon) => {
    return new Date(coupon.validUntil) < new Date();
  };

  const isUsageLimitReached = (coupon: Coupon) => {
    return coupon.usageLimit.total && coupon.usageCount >= coupon.usageLimit.total;
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý Coupon
          </h1>
          <p className="text-gray-600">
            Tạo và quản lý mã giảm giá cho các khóa học
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo Coupon mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có coupon nào
          </h3>
          <p className="text-gray-500 mb-6">
            Tạo coupon đầu tiên để bắt đầu khuyến mãi
          </p>
          <Button onClick={() => handleOpenModal()}>
            Tạo Coupon đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
                    {coupon.isActive ? (
                      isExpired(coupon) ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                          Hết hạn
                        </span>
                      ) : isUsageLimitReached(coupon) ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                          Hết lượt
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                          Hoạt động
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                        Tạm dừng
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{coupon.name}</p>
                </div>
              </div>

              {/* Value */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatValue(coupon)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {coupon.type === 'percentage' ? 'Giảm theo phần trăm' : 'Giảm cố định'}
                </p>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 text-sm">
                {coupon.minOrderAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Đơn tối thiểu:</span>
                    <span className="font-medium">{coupon.minOrderAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                {coupon.maxDiscountAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Giảm tối đa:</span>
                    <span className="font-medium">{coupon.maxDiscountAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Đã dùng:</span>
                  <span className="font-medium">
                    {coupon.usageCount}/{coupon.usageLimit.total || '∞'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenModal(coupon)}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(coupon._id)}
                  className={`flex-1 flex items-center justify-center gap-1 ${
                    coupon.isActive ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {coupon.isActive ? 'Tắt' : 'Bật'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(coupon._id)}
                  disabled={deleting === coupon._id}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {deleting === coupon._id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              {editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon mới'}
            </h3>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã Coupon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: GIAMGIA2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  maxLength={20}
                  disabled={!!editingCoupon}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên Coupon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Giảm giá đặc biệt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về coupon..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed-amount">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá trị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Min Order and Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    min="0"
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượt sử dụng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit.total}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usageLimit: { ...formData.usageLimit, total: e.target.value }
                    })}
                    min="0"
                    placeholder="Không giới hạn"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lượt/người dùng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit.perUser}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usageLimit: { ...formData.usageLimit, perUser: parseInt(e.target.value) }
                    })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Valid Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Kích hoạt coupon ngay
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang lưu...
                  </>
                ) : (
                  editingCoupon ? 'Cập nhật' : 'Tạo Coupon'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminCouponManagement;

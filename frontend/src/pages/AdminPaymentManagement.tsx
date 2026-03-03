import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface Payment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
  };
  amount: { original: number; discount: number; final: number; currency?: string };
  paymentMethod: { type: string; provider: string };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedPayments: number;
  revenueGrowth: number;
}

const AdminPaymentManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    revenueGrowth: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchPayments();
  }, [user, currentPage, statusFilter, sortBy, sortOrder]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: 15
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await adminAPI.getAllPayments(params);
      
      if (response.data.success) {
        const paymentsData = response.data.data.payments || [];
        setPayments(paymentsData);
        
        // Calculate stats
        const statsData = response.data.stats || {
          totalAmount: 0,
          totalDiscount: 0,
          completedPayments: 0,
          failedPayments: 0
        };

        setStats({
          totalRevenue: statsData.totalAmount || 0,
          totalTransactions: response.data.pagination?.total || paymentsData.length,
          pendingPayments: paymentsData.filter((p: Payment) => p.status === 'pending').length,
          completedPayments: paymentsData.filter((p: Payment) => p.status === 'completed').length,
          failedPayments: paymentsData.filter((p: Payment) => p.status === 'failed').length,
          refundedPayments: paymentsData.filter((p: Payment) => p.status === 'refunded').length,
          revenueGrowth: 0
        });

        const pagination = response.data.pagination;
        if (pagination) {
          setTotalPages(pagination.pages || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('Xác nhận duyệt thanh toán này?')) return;
    
    try {
      setProcessingId(paymentId);
      await adminAPI.approvePayment(paymentId);
      alert('Đã duyệt thanh toán thành công!');
      fetchPayments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt thanh toán');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefundPayment = async (paymentId: string, amount: number) => {
    const reason = prompt('Nhập lý do hoàn tiền:');
    if (!reason) return;

    if (!confirm(`Xác nhận hoàn tiền ${amount.toLocaleString('vi-VN')}đ?`)) return;
    
    try {
      setProcessingId(paymentId);
      await adminAPI.processRefund(paymentId, reason, amount);
      alert('Đã hoàn tiền thành công!');
      fetchPayments();
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi hoàn tiền');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisputePayment = async (paymentId: string) => {
    const reason = prompt('Nhập lý do đánh dấu tranh chấp:');
    if (!reason) return;

    if (!confirm('Xác nhận đánh dấu payment này là tranh chấp?')) return;

    try {
      setProcessingId(paymentId);
      await adminAPI.markPaymentDisputed(paymentId, reason);
      alert('Đã đánh dấu tranh chấp thành công!');
      fetchPayments();
    } catch (error: any) {
      console.error('Error disputing payment:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đánh dấu tranh chấp');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending: {
        label: 'Đang xử lý',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      completed: {
        label: 'Hoàn thành',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      disputed: {
        label: 'Tranh chấp',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle
      },
      failed: {
        label: 'Thất bại',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      refunded: {
        label: 'Đã hoàn tiền',
        color: 'bg-purple-100 text-purple-800',
        icon: RefreshCw
      }
    };
    return configs[status] || configs.pending;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      vnpay: 'VNPay',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
      stripe: 'Stripe',
      banking: 'Chuyển khoản',
      'bank-transfer': 'Chuyển khoản'
    };
    return methods[method] || method;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const amountA = a.amount?.final || 0;
      const amountB = b.amount?.final || 0;
      return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">💳 Quản lý thanh toán</h1>
          <p className="text-blue-100">
            Theo dõi và quản lý tất cả giao dịch thanh toán
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Tổng doanh thu</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalRevenue.toLocaleString('vi-VN')}đ
            </p>
            {stats.revenueGrowth !== 0 && (
              <p className="text-sm text-green-600 mt-2">
                +{stats.revenueGrowth}% so với tháng trước
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Tổng giao dịch</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalTransactions}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Hoàn thành: {stats.completedPayments}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Đang xử lý</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.pendingPayments}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Thất bại / Hoàn tiền</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.failedPayments + stats.refundedPayments}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, khóa học, mã giao dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="disputed">Tranh chấp</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'amount');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Mới nhất</option>
              <option value="date-asc">Cũ nhất</option>
              <option value="amount-desc">Số tiền cao nhất</option>
              <option value="amount-asc">Số tiền thấp nhất</option>
            </select>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={fetchPayments}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khóa học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : sortedPayments.length > 0 ? (
                  sortedPayments.map((payment) => {
                    const statusConfig = getStatusConfig(payment.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {payment.course.title}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500 font-mono">
                              {payment.transactionId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {(payment.amount?.final || 0).toLocaleString('vi-VN')}đ
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getPaymentMethodLabel(payment.paymentMethod?.provider || payment.paymentMethod?.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                          <div className="text-xs text-gray-400">
                            {new Date(payment.createdAt).toLocaleTimeString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayment(payment._id)}
                                disabled={processingId === payment._id}
                              >
                                {processingId === payment._id ? 'Đang xử lý...' : 'Duyệt'}
                              </Button>
                            )}
                            {payment.status === 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDisputePayment(payment._id)}
                                  disabled={processingId === payment._id}
                                >
                                  {processingId === payment._id ? 'Đang xử lý...' : 'Tranh chấp'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRefundPayment(payment._id, payment.amount?.final || 0)}
                                  disabled={processingId === payment._id}
                                >
                                  {processingId === payment._id ? 'Đang xử lý...' : 'Hoàn tiền'}
                                </Button>
                              </>
                            )}
                            {payment.status === 'disputed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRefundPayment(payment._id, payment.amount?.final || 0)}
                                disabled={processingId === payment._id}
                              >
                                {processingId === payment._id ? 'Đang xử lý...' : 'Hoàn tiền'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Không tìm thấy giao dịch nào</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentManagement;

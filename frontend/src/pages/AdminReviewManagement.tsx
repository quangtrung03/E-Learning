import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { Pagination } from '../components/ui/Pagination';
import { Star, Check, X, AlertCircle, ThumbsUp, MessageSquare } from 'lucide-react';

interface Review {
  _id: string;
  reviewer: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  course: {
    _id: string;
    title: string;
    instructor: {
      _id: string;
      name: string;
    };
  };
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  replyCount: number;
  createdAt: string;
  moderatedAt?: string;
  rejectionReason?: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const AdminReviewManagement = () => {
  const toast = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moderating, setModerating] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: 20,
        sortBy: '-createdAt'
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await reviewAPI.getAllReviews(params);
      
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setStats(response.data.stats);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải danh sách đánh giá' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      setModerating(reviewId);
      
      const response = await reviewAPI.moderateReview(reviewId, {
        action: 'approve'
      });

      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã duyệt đánh giá' });
        fetchReviews();
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể duyệt đánh giá' 
      });
    } finally {
      setModerating(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!rejectionReason.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập lý do từ chối' });
      return;
    }

    try {
      setModerating(reviewId);
      
      const response = await reviewAPI.moderateReview(reviewId, {
        action: 'reject',
        reason: rejectionReason
      });

      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã từ chối đánh giá' });
        setShowRejectModal(null);
        setRejectionReason('');
        fetchReviews();
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể từ chối đánh giá' 
      });
    } finally {
      setModerating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
            ⏳ Chờ duyệt
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
            ✓ Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
            ✗ Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý đánh giá
        </h1>
        <p className="text-gray-600">
          Kiểm duyệt và quản lý các đánh giá từ học viên
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Tổng đánh giá</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Chờ duyệt</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600 mt-1">Đã duyệt</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600 mt-1">Đã từ chối</div>
          </Card>
        </div>
      )}

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
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Không có đánh giá nào
          </h3>
          <p className="text-gray-500">
            Chưa có đánh giá nào phù hợp với bộ lọc
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="p-6">
              <div className="flex gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {review.reviewer.avatar ? (
                    <img 
                      src={review.reviewer.avatar} 
                      alt={review.reviewer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {review.reviewer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Khóa học: <span className="font-medium">{review.course.title}</span>
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpfulCount} hữu ích</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{review.replyCount} phản hồi</span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {review.status === 'rejected' && review.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Lý do từ chối:</strong> {review.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {review.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleApprove(review._id)}
                        disabled={moderating === review._id}
                        size="sm"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {moderating === review._id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Duyệt
                      </Button>
                      <Button
                        onClick={() => setShowRejectModal(review._id)}
                        disabled={moderating === review._id}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Từ chối đánh giá
            </h3>
            <p className="text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối đánh giá này:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                disabled={moderating !== null}
              >
                Hủy
              </Button>
              <Button
                onClick={() => handleReject(showRejectModal)}
                disabled={moderating !== null || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {moderating === showRejectModal ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang xử lý...
                  </>
                ) : (
                  'Từ chối'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReviewManagement;

import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface AdminRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  email: string;
  fullName: string;
  citizenId: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  occupation?: string;
  experience?: string;
  reason: string;
  status: 'pending_validation' | 'pending_approval' | 'approved' | 'rejected';
  processedBy?: {
    name: string;
    email: string;
  };
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminRequestManagement: React.FC = () => {
  const { showToast } = useToast();
  
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'view'>('view');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/requests', {
        params: {
          status: statusFilter,
          page: currentPage,
          limit: 10
        }
      });
      
      setRequests(response.data.data.requests);
      setTotalPages(response.data.pagination.pages);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: error.response?.data?.message || 'Có lỗi khi tải dữ liệu'
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request: AdminRequest, action: 'approve' | 'reject' | 'view') => {
    setSelectedRequest(request);
    setModalAction(action);
    setShowModal(true);
    setRejectionReason('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(true);
    try {
      await api.put(`/admin/requests/${requestId}/approve`);
      showToast({
        type: 'success',
        title: 'Đã duyệt yêu cầu thành công'
      });
      closeModal();
      fetchRequests();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: error.response?.data?.message || 'Có lỗi khi duyệt yêu cầu'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      showToast({
        type: 'error',
        title: 'Vui lòng nhập lý do từ chối'
      });
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/admin/requests/${requestId}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      showToast({
        type: 'success',
        title: 'Đã từ chối yêu cầu'
      });
      closeModal();
      fetchRequests();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: error.response?.data?.message || 'Có lỗi khi từ chối yêu cầu'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_validation: { text: 'Chờ xác thực', color: 'bg-yellow-100 text-yellow-800' },
      pending_approval: { text: 'Chờ duyệt', color: 'bg-blue-100 text-blue-800' },
      approved: { text: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Từ chối', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_validation;
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu Admin</h1>
        <p className="mt-2 text-gray-600">
          Xem và duyệt các yêu cầu trở thành admin từ người dùng
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="pending_approval">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin cá nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Không có yêu cầu nào
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={request.user.avatar || '/default-avatar.png'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div><strong>Tên:</strong> {request.fullName}</div>
                        <div><strong>CCCD:</strong> {request.citizenId}</div>
                        <div><strong>SĐT:</strong> {request.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(request, 'view')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem chi tiết
                        </button>
                        {request.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => openModal(request, 'approve')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => openModal(request, 'reject')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Trang trước
              </button>
              
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalAction === 'approve' && 'Duyệt yêu cầu'}
                  {modalAction === 'reject' && 'Từ chối yêu cầu'}
                  {modalAction === 'view' && 'Chi tiết yêu cầu'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Request Details */}
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Thông tin tài khoản
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Tên tài khoản:</strong> {selectedRequest.user.name}</p>
                      <p><strong>Email:</strong> {selectedRequest.user.email}</p>
                      <p><strong>Ngày gửi:</strong> {formatDate(selectedRequest.createdAt)}</p>
                      <p><strong>Trạng thái:</strong> {getStatusBadge(selectedRequest.status)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Thông tin cá nhân
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Họ tên đầy đủ:</strong> {selectedRequest.fullName}</p>
                      <p><strong>CCCD:</strong> {selectedRequest.citizenId}</p>
                      <p><strong>Ngày sinh:</strong> {new Date(selectedRequest.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Số điện thoại:</strong> {selectedRequest.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Address & Occupation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin bổ sung
                  </h3>
                  <div className="space-y-2">
                    <p><strong>Địa chỉ:</strong> {selectedRequest.address}</p>
                    {selectedRequest.occupation && (
                      <p><strong>Nghề nghiệp:</strong> {selectedRequest.occupation}</p>
                    )}
                  </div>
                </div>

                {/* Experience */}
                {selectedRequest.experience && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Kinh nghiệm
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.experience}
                    </p>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Lý do muốn trở thành Admin
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* Processing info */}
                {selectedRequest.processedBy && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Thông tin xử lý
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Người xử lý:</strong> {selectedRequest.processedBy.name}</p>
                      <p><strong>Thời gian xử lý:</strong> {selectedRequest.processedAt ? formatDate(selectedRequest.processedAt) : 'N/A'}</p>
                      {selectedRequest.rejectionReason && (
                        <div>
                          <p><strong>Lý do từ chối:</strong></p>
                          <p className="text-red-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg mt-2">
                            {selectedRequest.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-8 border-t pt-6">
                {modalAction === 'approve' && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={processing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                    </button>
                  </div>
                )}

                {modalAction === 'reject' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                        Lý do từ chối *
                      </label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Vui lòng nêu rõ lý do từ chối yêu cầu..."
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {rejectionReason.length}/500 ký tự
                      </p>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleReject(selectedRequest._id)}
                        disabled={processing || !rejectionReason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                      </button>
                    </div>
                  </div>
                )}

                {modalAction === 'view' && selectedRequest.status === 'pending_approval' && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => setModalAction('approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Duyệt yêu cầu
                    </button>
                    <button
                      onClick={() => setModalAction('reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Từ chối yêu cầu
                    </button>
                  </div>
                )}

                {modalAction === 'view' && selectedRequest.status !== 'pending_approval' && (
                  <div className="flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestManagement;
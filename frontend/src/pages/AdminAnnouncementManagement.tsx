import { useState, useEffect } from 'react';
import { announcementAPI } from '../services/api';
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
  Megaphone,
  Calendar,
  Search,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  linkUrl?: string;
  linkText?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  dismissible: boolean;
  priority: number;
  targetAudience: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />
};

const TYPE_LABELS: Record<string, string> = {
  info: 'Thông tin',
  warning: 'Cảnh báo',
  success: 'Thành công',
  error: 'Lỗi'
};

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-amber-100 text-amber-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800'
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Tất cả',
  students: 'Học viên',
  instructors: 'Giảng viên',
  admins: 'Admin'
};

const AdminAnnouncementManagement = () => {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const emptyForm = {
    title: '',
    message: '',
    type: 'info' as Announcement['type'],
    linkUrl: '',
    linkText: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    dismissible: true,
    priority: 0,
    targetAudience: 'all'
  };

  const [formData, setFormData] = useState({ ...emptyForm });

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, statusFilter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await announcementAPI.getAllAnnouncements(params);
      if (res.data.success) {
        setAnnouncements(res.data.data.announcements || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể tải thông báo' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ann?: Announcement) => {
    if (ann) {
      setEditingAnn(ann);
      setFormData({
        title: ann.title,
        message: ann.message,
        type: ann.type,
        linkUrl: ann.linkUrl || '',
        linkText: ann.linkText || '',
        startDate: new Date(ann.startDate).toISOString().slice(0, 16),
        endDate: new Date(ann.endDate).toISOString().slice(0, 16),
        dismissible: ann.dismissible,
        priority: ann.priority,
        targetAudience: ann.targetAudience
      });
    } else {
      setEditingAnn(null);
      setFormData({ ...emptyForm });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.showToast({ type: 'warning', title: 'Vui lòng nhập tiêu đề' }); return; }
    if (!formData.message.trim()) { toast.showToast({ type: 'warning', title: 'Vui lòng nhập nội dung' }); return; }
    if (!formData.endDate) { toast.showToast({ type: 'warning', title: 'Vui lòng chọn ngày kết thúc' }); return; }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.showToast({ type: 'warning', title: 'Ngày kết thúc phải sau ngày bắt đầu' });
      return;
    }

    try {
      setSaving(true);
      const data: any = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        dismissible: formData.dismissible,
        priority: formData.priority,
        targetAudience: formData.targetAudience
      };
      if (formData.linkUrl.trim()) data.linkUrl = formData.linkUrl.trim();
      if (formData.linkText.trim()) data.linkText = formData.linkText.trim();

      let res;
      if (editingAnn) {
        res = await announcementAPI.updateAnnouncement(editingAnn._id, data);
      } else {
        res = await announcementAPI.createAnnouncement(data);
      }

      if (res.data.success) {
        toast.showToast({ type: 'success', title: editingAnn ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo mới' });
        setShowModal(false);
        fetchAnnouncements();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể lưu thông báo' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (annId: string) => {
    try {
      const res = await announcementAPI.toggleAnnouncement(annId);
      if (res.data.success) {
        toast.showToast({ type: 'success', title: 'Đã cập nhật trạng thái' });
        fetchAnnouncements();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Lỗi cập nhật trạng thái' });
    }
  };

  const handleDelete = async (annId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      setDeleting(annId);
      const res = await announcementAPI.deleteAnnouncement(annId);
      if (res.data.success) {
        toast.showToast({ type: 'success', title: 'Đã xóa thông báo' });
        fetchAnnouncements();
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Không thể xóa thông báo' });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (ann: Announcement) => {
    const now = new Date();
    if (!ann.isActive) return <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded">Tắt</span>;
    if (new Date(ann.startDate) > now) return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">Lên lịch</span>;
    if (new Date(ann.endDate) < now) return <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded">Hết hạn</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded">Đang hiện</span>;
  };

  const filtered = announcements.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && announcements.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Quản lý Thông báo</h1>
          <p className="text-gray-600">Tạo và quản lý thông báo hiển thị cho người dùng</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo thông báo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang hiện</option>
          <option value="scheduled">Lên lịch</option>
          <option value="expired">Hết hạn</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <Button size="sm" variant="outline" onClick={() => fetchAnnouncements()} className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có thông báo nào</h3>
          <p className="text-gray-500 mb-6">Tạo thông báo đầu tiên để hiển thị cho người dùng.</p>
          <Button onClick={() => handleOpenModal()}>Tạo thông báo đầu tiên</Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(ann => (
            <Card key={ann._id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  {TYPE_ICONS[ann.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{ann.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${TYPE_COLORS[ann.type]}`}>
                      {TYPE_LABELS[ann.type]}
                    </span>
                    {getStatusBadge(ann)}
                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                      {AUDIENCE_LABELS[ann.targetAudience]}
                    </span>
                    {ann.priority > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                        Ưu tiên: {ann.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ann.message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ann.startDate)} → {formatDate(ann.endDate)}
                    </span>
                    {ann.linkUrl && (
                      <a href={ann.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <ExternalLink className="w-3 h-3" />
                        {ann.linkText || ann.linkUrl}
                      </a>
                    )}
                    {ann.createdBy && <span>Tạo bởi: {ann.createdBy.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleOpenModal(ann)} className="flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(ann._id)}
                    className={ann.isActive ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}
                  >
                    <Power className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(ann._id)}
                    disabled={deleting === ann._id}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {deleting === ann._id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
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
              {editingAnn ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Bảo trì hệ thống ngày 15/3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mô tả chi tiết thông báo..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.message.length}/1000</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại thông báo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="info">ℹ️ Thông tin</option>
                    <option value="warning">⚠️ Cảnh báo</option>
                    <option value="success">✅ Thành công</option>
                    <option value="error">❌ Lỗi / Khẩn cấp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đối tượng</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">👥 Tất cả</option>
                    <option value="students">🎓 Học viên</option>
                    <option value="instructors">👨‍🏫 Giảng viên</option>
                    <option value="admins">🔑 Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL liên kết</label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://... hoặc /courses"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Text liên kết</label>
                  <input
                    type="text"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    placeholder="VD: Xem chi tiết"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Độ ưu tiên (số cao = hiện trước)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dismissible}
                      onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Cho phép đóng thông báo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <><LoadingSpinner size="sm" /> Đang lưu...</> : (editingAnn ? 'Cập nhật' : 'Tạo thông báo')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementManagement;

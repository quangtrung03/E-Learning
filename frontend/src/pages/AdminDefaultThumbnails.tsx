import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, uploadAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import FileUploadCard from '../components/upload/FileUploadCard';
import { useToast } from '../context/ToastContext';

type ThumbnailItem = {
  url: string;
  addedAt?: string;
};

export default function AdminDefaultThumbnails() {
  const toastContext = useToast();
  const toast = useMemo(
    () => ({
      success: (message: string) => toastContext.showToast({ type: 'success', title: message }),
      error: (message: string) => toastContext.showToast({ type: 'error', title: message }),
    }),
    [toastContext]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ThumbnailItem[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCourseThumbnails();
      if (res.data?.success) {
        setActiveUrl(res.data.data?.activeUrl || null);
        setItems(Array.isArray(res.data.data?.items) ? res.data.data.items : []);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tải danh sách thumbnails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetActive = async (url: string) => {
    try {
      setSaving(true);
      const res = await adminAPI.setActiveCourseThumbnail(url);
      if (res.data?.success) {
        setActiveUrl(res.data.data?.activeUrl || url);
        setItems(Array.isArray(res.data.data?.items) ? res.data.data.items : []);
        toast.success('Đã đặt thumbnail mặc định');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể đặt thumbnail mặc định');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (url: string) => {
    try {
      setSaving(true);
      const res = await adminAPI.removeCourseThumbnail(url);
      if (res.data?.success) {
        setActiveUrl(res.data.data?.activeUrl || null);
        setItems(Array.isArray(res.data.data?.items) ? res.data.data.items : []);
        toast.success('Đã xóa thumbnail');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa thumbnail');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thumbnail mặc định</h1>
            <p className="text-sm text-gray-600 mt-1">Upload và chọn thumbnail mặc định cho các khóa học chưa có ảnh.</p>
          </div>
          <Link to="/admin">
            <Button variant="outline">Quay lại Admin</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Upload thumbnail mới</h2>
            <FileUploadCard
              title="Ảnh thumbnail"
              description="JPG/PNG/WebP. Khuyến nghị: 1200x800px."
              accept="image/*"
              maxSizeMB={10}
              uploadedUrl={''}
              onUploadedUrlChange={() => {
                // no-op: managed by uploadFile return
              }}
              uploadFile={async (file, onProgress) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await uploadAPI.uploadImage(formData, onProgress, 'default_course_thumbnail');
                const uploaded = response.data.data;

                // Persist to settings and set active by default
                const saved = await adminAPI.addCourseThumbnail(uploaded.url, true);
                setActiveUrl(saved.data.data?.activeUrl || uploaded.url);
                setItems(Array.isArray(saved.data.data?.items) ? saved.data.data.items : []);
                toast.success('Upload & đặt làm mặc định thành công');

                return uploaded;
              }}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Đang dùng</h2>
            {activeUrl ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                <img src={activeUrl} alt="Default thumbnail" className="w-full h-56 object-cover" />
              </div>
            ) : (
              <div className="text-sm text-gray-600">Chưa đặt thumbnail mặc định.</div>
            )}
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách thumbnails</h2>
            <Button variant="outline" onClick={fetchData} disabled={loading || saving}>
              Làm mới
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-600">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600">Chưa có thumbnail nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const isActive = item.url === activeUrl;
                return (
                  <div key={item.url} className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <img src={item.url} alt="Thumbnail" className="w-full h-40 object-cover" />
                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-500 truncate">{isActive ? 'Đang dùng' : ' '}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isActive ? 'primary' : 'outline'}
                          disabled={saving}
                          onClick={() => handleSetActive(item.url)}
                        >
                          {isActive ? 'Mặc định' : 'Chọn'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => handleRemove(item.url)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

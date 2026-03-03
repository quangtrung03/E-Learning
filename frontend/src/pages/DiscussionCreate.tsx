import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { ArrowLeft, Save } from 'lucide-react';

const DiscussionCreate = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: 'Thảo luận chung' },
    { value: 'question', label: 'Câu hỏi' },
    { value: 'announcement', label: 'Thông báo' },
    { value: 'resource', label: 'Tài nguyên' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập tiêu đề' });
      return;
    }
    if (formData.title.length < 10) {
      toast.showToast({ type: 'warning', title: 'Tiêu đề phải có ít nhất 10 ký tự' });
      return;
    }
    if (!formData.content.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập nội dung' });
      return;
    }
    if (formData.content.length < 20) {
      toast.showToast({ type: 'warning', title: 'Nội dung phải có ít nhất 20 ký tự' });
      return;
    }

    try {
      setSubmitting(true);

      const discussionData = {
        course: courseId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      };

      const response = await discussionAPI.createDiscussion(discussionData);

      if (response.data.success) {
        toast.showToast({ 
          type: 'success', 
          title: 'Đã tạo thảo luận thành công!' 
        });
        navigate(`/courses/${courseId}/discussions/${response.data.data.discussion._id}`);
      }
    } catch (error: any) {
      console.error('Error creating discussion:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tạo thảo luận' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/courses/${courseId}/discussions`)}
        className="mb-6 flex items-center gap-2"
        disabled={submitting}
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Button>

      {/* Create Form */}
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Tạo thảo luận mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề thảo luận (tối thiểu 10 ký tự)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 ký tự
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Nhập nội dung thảo luận của bạn (tối thiểu 20 ký tự)..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              disabled={submitting}
              maxLength={5000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.content.length}/5000 ký tự
            </p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
              Từ khóa (tùy chọn)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Nhập các từ khóa cách nhau bằng dấu phẩy (ví dụ: javascript, react, học tập)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              Từ khóa giúp người khác dễ dàng tìm thấy thảo luận của bạn
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📝 Hướng dẫn viết thảo luận</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Tiêu đề ngắn gọn, rõ ràng (10-200 ký tự)</li>
              <li>Nội dung chi tiết, có cấu trúc (tối thiểu 20 ký tự)</li>
              <li>Sử dụng danh mục phù hợp để phân loại</li>
              <li>Thêm tags để dễ tìm kiếm</li>
              <li>Thêm từ khóa để dễ tìm kiếm</li>
              <li>Tôn trọng ý kiến của người khác</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/courses/${courseId}/discussions`)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Tạo thảo luận
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DiscussionCreate;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { ThumbsUp, MessageSquare, Clock, ArrowLeft, Send } from 'lucide-react';

interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  likesCount: number;
  isLikedByUser: boolean;
  createdAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  course: {
    _id: string;
    title: string;
  };
  category: string;
  tags: string[];
  likesCount: number;
  isLikedByUser: boolean;
  replies: Reply[];
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

const DiscussionDetail = () => {
  const { courseId, discussionId } = useParams<{ courseId: string; discussionId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likingDiscussion, setLikingDiscussion] = useState(false);

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion();
    }
  }, [discussionId]);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const response = await discussionAPI.getDiscussion(discussionId!);
      if (response.data.success) {
        setDiscussion(response.data.data.discussion);
      }
    } catch (error: any) {
      console.error('Error fetching discussion:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải thảo luận' 
      });
      navigate(`/courses/${courseId}/discussions`);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeDiscussion = async () => {
    if (likingDiscussion || !discussion) return;

    try {
      setLikingDiscussion(true);
      
      if (discussion.isLikedByUser) {
        await discussionAPI.unlikeDiscussion(discussion._id);
        setDiscussion({
          ...discussion,
          isLikedByUser: false,
          likesCount: discussion.likesCount - 1
        });
      } else {
        await discussionAPI.likeDiscussion(discussion._id);
        setDiscussion({
          ...discussion,
          isLikedByUser: true,
          likesCount: discussion.likesCount + 1
        });
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể thích thảo luận' 
      });
    } finally {
      setLikingDiscussion(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast.showToast({ type: 'warning', title: 'Vui lòng nhập nội dung phản hồi' });
      return;
    }

    if (discussion?.isLocked) {
      toast.showToast({ type: 'warning', title: 'Thảo luận này đã bị khóa' });
      return;
    }

    try {
      setSubmittingReply(true);
      const response = await discussionAPI.replyToDiscussion(discussionId!, replyContent);
      
      if (response.data.success) {
        toast.showToast({ type: 'success', title: 'Đã gửi phản hồi' });
        setReplyContent('');
        fetchDiscussion(); // Reload to get new reply
      }
    } catch (error: any) {
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể gửi phản hồi' 
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Không tìm thấy thảo luận</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/courses/${courseId}/discussions`)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </Button>

      {/* Discussion Card */}
      <Card className="p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          {discussion.isPinned && (
            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
              📌 Ghim
            </span>
          )}
          {discussion.isLocked && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
              🔒 Đã khóa
            </span>
          )}
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            {discussion.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {discussion.title}
        </h1>

        {/* Author Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="flex items-center gap-3">
            {discussion.author.avatar ? (
              <img 
                src={discussion.author.avatar} 
                alt={discussion.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {discussion.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{discussion.author.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(discussion.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="prose max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: discussion.content }}
        />

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {discussion.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center gap-4 pt-6 border-t">
          <Button
            variant={discussion.isLikedByUser ? 'primary' : 'outline'}
            onClick={handleLikeDiscussion}
            disabled={likingDiscussion}
            className="flex items-center gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            {discussion.likesCount} lượt thích
          </Button>
          <div className="flex items-center gap-2 text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>{discussion.replies?.length || 0} phản hồi</span>
          </div>
        </div>
      </Card>

      {/* Replies Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Phản hồi ({discussion.replies?.length || 0})
        </h2>

        {discussion.replies && discussion.replies.length > 0 ? (
          <div className="space-y-4 mb-6">
            {discussion.replies.map(reply => (
              <Card key={reply._id} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {reply.author.avatar ? (
                      <img 
                        src={reply.author.avatar} 
                        alt={reply.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                        {reply.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{reply.author.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(reply.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{reply.content}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{reply.likesCount} lượt thích</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-6">Chưa có phản hồi nào</p>
        )}
      </div>

      {/* Reply Form */}
      {!discussion.isLocked ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Viết phản hồi</h3>
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập phản hồi của bạn..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              disabled={submittingReply}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submittingReply || !replyContent.trim()}
                className="flex items-center gap-2"
              >
                {submittingReply ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi phản hồi
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-gray-50">
          <p className="text-gray-600">🔒 Thảo luận này đã bị khóa, không thể thêm phản hồi mới</p>
        </Card>
      )}
    </div>
  );
};

export default DiscussionDetail;

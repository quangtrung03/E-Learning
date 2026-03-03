import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { discussionAPI, courseAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui';
import { MessageSquare, ThumbsUp, Clock, Plus, Search } from 'lucide-react';

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  likesCount: number;
  repliesCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  instructor: {
    _id: string;
    name: string;
  };
}

const DiscussionList = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  
  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'general', label: 'Thảo luận chung' },
    { value: 'question', label: 'Câu hỏi' },
    { value: 'announcement', label: 'Thông báo' },
    { value: 'resource', label: 'Tài nguyên' }
  ];

  useEffect(() => {
    if (courseId) {
      fetchCourseAndDiscussions();
    }
  }, [courseId, categoryFilter]);

  const fetchCourseAndDiscussions = async () => {
    try {
      setLoading(true);
      
      // Fetch course info
      const courseRes = await courseAPI.getCourse(courseId!);
      if (courseRes.data.success) {
        setCourse(courseRes.data.data.course);
      }

      // Fetch discussions
      const params: any = { page: 1, limit: 50 };
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      const discussionsRes = await discussionAPI.getDiscussionsByCourse(courseId!, params);
      if (discussionsRes.data.success) {
        setDiscussions(discussionsRes.data.data.discussions || []);
      }
    } catch (error: any) {
      console.error('Error fetching discussions:', error);
      toast.showToast({ 
        type: 'error', 
        title: error.response?.data?.message || 'Không thể tải thảo luận' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = () => {
    navigate(`/courses/${courseId}/discussions/create`);
  };

  const filteredDiscussions = discussions
    .filter(d => 
      searchQuery === '' || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likesCount + b.repliesCount) - (a.likesCount + a.repliesCount);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Diễn đàn thảo luận
            </h1>
            {course && (
              <p className="text-gray-600">
                Khóa học: <Link to={`/courses/${courseId}`} className="text-blue-600 hover:underline">{course.title}</Link>
              </p>
            )}
          </div>
          <Button onClick={handleCreateDiscussion} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tạo thảo luận mới
          </Button>
        </div>

        {/* Tìm kiếm và bộ lọc */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thảo luận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="latest">Mới nhất</option>
            <option value="popular">Phổ biến nhất</option>
          </select>
        </div>
      </div>

      {/* Discussions List */}
      {filteredDiscussions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có thảo luận nào
          </h3>
          <p className="text-gray-500 mb-6">
            Hãy là người đầu tiên bắt đầu cuộc thảo luận!
          </p>
          <Button onClick={handleCreateDiscussion}>
            Tạo thảo luận đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map(discussion => (
            <div
              key={discussion._id}
              onClick={() => navigate(`/courses/${courseId}/discussions/${discussion._id}`)}
              className="cursor-pointer"
            >
              <Card 
                className={`p-6 hover:shadow-md transition-shadow ${
                  discussion.isPinned ? 'border-2 border-yellow-400' : ''
                }`}
              >
              <div className="flex gap-4">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
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
                </div>

                {/* Discussion Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {discussion.isPinned && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                            📌 Ghim
                          </span>
                        )}
                        {discussion.isLocked && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            🔒 Đã khóa
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {categories.find(c => c.value === discussion.category)?.label || discussion.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
                        {discussion.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {discussion.content.replace(/<[^>]*>/g, '')}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium">{discussion.author.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(discussion.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {discussion.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{discussion.likesCount} lượt thích</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{discussion.repliesCount} phản hồi</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>            </div>          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionList;

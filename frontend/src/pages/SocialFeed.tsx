import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { socialAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Author {
  _id: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  likes: string[];
  createdAt: string;
}

interface Post {
  _id: string;
  author: Author;
  content: string;
  images: { url: string; caption?: string }[];
  type: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isOwner: boolean;
  visibility: string;
  isEdited: boolean;
  createdAt: string;
  relatedCourse?: { title: string; slug: string; thumbnail: string };
}

interface StoryGroup {
  author: Author;
  stories: any[];
  hasUnviewed: boolean;
}

const PostCard: React.FC<{ post: Post; onLike: (id: string) => void; onSave: (id: string) => void; onDelete: (id: string) => void; currentUserId?: string }> = ({
  post, onLike, onSave, onDelete, currentUserId
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await socialAPI.getPost(post._id);
      setComments(res.data.post.comments || []);
    } catch { /* ignore */ }
    setLoadingComments(false);
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments(p => !p);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await socialAPI.addComment(post._id, commentText);
      setComments(prev => [...prev, res.data.comment]);
      setCommentText('');
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const typeLabel: Record<string, string> = {
    post: '',
    article: '📝 Bài viết',
    announcement: '📢 Thông báo',
    achievement: '🏆 Thành tích'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link to={`/users/${post.author._id}`} className="flex items-center gap-3 group">
          <div className="relative">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            {post.author.isAdmin && (
              <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">✓</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">{post.author.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
              {post.isEdited && <span className="ml-1">(đã chỉnh sửa)</span>}
              {post.visibility !== 'public' && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                  {post.visibility === 'followers' ? '👥 Người theo dõi' : '🔒 Riêng tư'}
                </span>
              )}
            </p>
          </div>
        </Link>

        <div className="relative">
          <button onClick={() => setShowMenu(p => !p)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 py-1 min-w-[160px]">
              <button onClick={() => { onSave(post._id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                {post.isSaved ? '🔖 Bỏ lưu' : '🔖 Lưu bài viết'}
              </button>
              {post.isOwner && (
                <button onClick={() => { onDelete(post._id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                  🗑️ Xóa bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type badge */}
      {post.type !== 'post' && (
        <div className="px-4 pb-1">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
            {typeLabel[post.type] || post.type}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map(tag => (
              <span key={tag} className="text-blue-500 dark:text-blue-400 text-xs hover:underline cursor-pointer">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative bg-black">
          <img
            src={post.images[imageIndex]?.url}
            alt={post.images[imageIndex]?.caption || 'Post image'}
            className="w-full max-h-96 object-contain"
          />
          {post.images.length > 1 && (
            <>
              <button onClick={() => setImageIndex(p => Math.max(0, p - 1))} disabled={imageIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30">‹</button>
              <button onClick={() => setImageIndex(p => Math.min(post.images.length - 1, p + 1))} disabled={imageIndex === post.images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30">›</button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.images.map((_, i) => (
                  <div key={i} onClick={() => setImageIndex(i)} className={`w-1.5 h-1.5 rounded-full cursor-pointer ${i === imageIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Related course */}
      {post.relatedCourse && (
        <Link to={`/courses/${post.relatedCourse.slug}`} className="mx-4 mb-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <img src={post.relatedCourse.thumbnail} alt={post.relatedCourse.title} className="w-12 h-12 rounded-lg object-cover" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Khóa học liên quan</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{post.relatedCourse.title}</p>
          </div>
        </Link>
      )}

      {/* Actions bar */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post._id)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all ${post.isLiked ? 'text-red-500 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
            <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likeCount > 0 && <span>{post.likeCount}</span>}
          </button>

          <button onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
          </button>
        </div>

        <button onClick={() => onSave(post._id)}
          className={`transition-colors ${post.isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}>
          <svg className="w-5 h-5" fill={post.isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          {loadingComments ? (
            <div className="py-4 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-3 mt-3 max-h-64 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-2">Chưa có bình luận nào</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="flex gap-2">
                    <Link to={`/users/${comment.author._id}`}>
                      {comment.author.avatar ? (
                        <img src={comment.author.avatar} alt={comment.author.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 flex-1">
                      <Link to={`/users/${comment.author._id}`} className="font-semibold text-xs text-gray-800 dark:text-gray-200 hover:text-blue-600">{comment.author.name}</Link>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentUserId && (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button type="submit" disabled={!commentText.trim() || submitting}
                className="bg-blue-500 text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors">
                Gửi
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

const CreatePostModal: React.FC<{ onClose: () => void; onCreated: (post: Post) => void }> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState('post');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadAPI.uploadImage(fd);
      setImages(prev => [...prev, { url: res.data.url, publicId: res.data.public_id || '' }]);
    } catch { alert('Lỗi tải ảnh'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await socialAPI.createPost({ content, type, visibility, tags: tagList, images: images.map(img => ({ url: img.url, publicId: img.publicId })) });
      onCreated(res.data.post);
      onClose();
    } catch { alert('Lỗi khi đăng bài'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo bài viết mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{user?.name}</p>
              <select value={visibility} onChange={e => setVisibility(e.target.value)}
                className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded-lg px-2 py-0.5 mt-0.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="public">🌍 Công khai</option>
                <option value="followers">👥 Người theo dõi</option>
                <option value="private">🔒 Riêng tư</option>
              </select>
            </div>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì? Chia sẻ với mọi người..."
            rows={4}
            className="w-full resize-none text-gray-800 dark:text-gray-200 bg-transparent text-sm focus:outline-none placeholder-gray-400"
            autoFocus
          />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <select value={type} onChange={e => setType(e.target.value)}
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="post">📝 Bài đăng</option>
              <option value="article">📰 Bài viết dài</option>
              <option value="announcement">📢 Thông báo</option>
              <option value="achievement">🏆 Thành tích</option>
            </select>
            <label className={`flex items-center gap-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {uploading ? 'Đang tải...' : 'Ảnh'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>

          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Thêm tags... (cách nhau bằng dấu phẩy)"
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button type="submit" disabled={!content.trim() || submitting}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
            {submitting ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </form>
      </div>
    </div>
  );
};

const StoriesBar: React.FC<{ storyGroups: StoryGroup[]; currentUserId?: string }> = ({ storyGroups, currentUserId }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
    <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
      {/* Add your own story */}
      {currentUserId && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-blue-500 transition-colors">
            <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center w-14 truncate">Tin của bạn</span>
        </div>
      )}

      {storyGroups.map(group => (
        <div key={group.author._id} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
          <div className={`w-14 h-14 rounded-full p-0.5 ${group.hasUnviewed ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
              {group.author.avatar ? (
                <img src={group.author.avatar} alt={group.author.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {group.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 text-center w-14 truncate">{group.author.name}</span>
        </div>
      ))}

      {storyGroups.length === 0 && !currentUserId && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">Đăng nhập để xem tin</p>
      )}
    </div>
  </div>
);

export default function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'explore'>('feed');
  const [exploreTag, setExploreTag] = useState('');

  const POPULAR_TAGS = ['hocbai', 'laptrinhweb', 'reactjs', 'nodejs', 'python', 'datascience', 'machinelearning', 'design'];

  const loadPosts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currPage = reset ? 1 : page;
      const apiCall = isAuthenticated && activeTab === 'feed'
        ? socialAPI.getFeed({ page: currPage, limit: 10 })
        : socialAPI.getExplorePosts({ page: currPage, limit: 10, tag: exploreTag || undefined });
      const res = await apiCall;
      const newPosts = res.data.posts || [];
      if (reset) {
        setPosts(newPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      setHasMore(currPage < (res.data.pagination?.pages || res.data.pages || 1));
    } catch { /* ignore */ }
    setLoading(false);
  }, [isAuthenticated, activeTab, page, exploreTag]);

  const loadStories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await socialAPI.getStories();
      setStoryGroups(res.data.storyGroups || []);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPosts(true);
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, exploreTag, isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await socialAPI.toggleLike(postId);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, isLiked: res.data.liked, likeCount: res.data.likeCount }
        : p
      ));
    } catch { /* ignore */ }
  };

  const handleSave = async (postId: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await socialAPI.toggleSave(postId);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isSaved: res.data.saved } : p));
    } catch { /* ignore */ }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await socialAPI.deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch { /* ignore */ }
  };

  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const loadMore = () => {
    setPage(p => p + 1);
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Stories */}
        <StoriesBar storyGroups={storyGroups} currentUserId={user?._id} />

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
          <button onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
            🏠 Bảng tin
          </button>
          <button onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'explore' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
            🔍 Khám phá
          </button>
        </div>

        {/* Explore tag filter */}
        {activeTab === 'explore' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setExploreTag('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!exploreTag ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-blue-400'}`}>
              Tất cả
            </button>
            {POPULAR_TAGS.map(tag => (
              <button key={tag} onClick={() => setExploreTag(tag)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${exploreTag === tag ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-blue-400'}`}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Create post box */}
        {isAuthenticated && (
          <button onClick={() => setShowCreateModal(true)}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-sm">Bạn đang nghĩ gì? Chia sẻ với mọi người...</span>
          </button>
        )}

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'feed' ? 'Bảng tin trống' : 'Chưa có bài viết nào'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeTab === 'feed' ? 'Hãy theo dõi thêm người dùng để xem bài viết của họ' : 'Hãy là người đầu tiên đăng bài!'}
            </p>
            {isAuthenticated && (
              <button onClick={() => setShowCreateModal(true)} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Tạo bài viết đầu tiên
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  currentUserId={user?._id}
                />
              ))}
            </div>

            {hasMore && (
              <button onClick={loadMore} disabled={loading}
                className="w-full py-3 text-center text-blue-600 dark:text-blue-400 text-sm font-medium bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50">
                {loading ? 'Đang tải...' : 'Xem thêm bài viết'}
              </button>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handlePostCreated} />
      )}
    </div>
  );
}

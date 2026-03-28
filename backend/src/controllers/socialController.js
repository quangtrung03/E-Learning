const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const mongoose = require('mongoose');

// ─────────────────────────────────────────
//  POSTS
// ─────────────────────────────────────────

// GET /api/social/feed  - personalized feed
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Current user's following list
    const user = await User.findById(userId).select('following');
    const followingIds = user?.following || [];

    // Feed = own posts + followed users' public posts
    const feedUserIds = [userId, ...followingIds];

    const [posts, total] = await Promise.all([
      Post.find({
        author: { $in: feedUserIds },
        $or: [
          { visibility: 'public' },
          { visibility: 'followers', author: { $in: feedUserIds } },
          { author: userId }
        ]
      })
        .populate('author', 'name avatar location isAdmin')
        .populate('relatedCourse', 'title thumbnail slug')
        .populate('relatedCertificate', 'certificateId completionDate')
        .populate('comments.author', 'name avatar')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      Post.countDocuments({
        author: { $in: feedUserIds },
        $or: [
          { visibility: 'public' },
          { visibility: 'followers', author: { $in: feedUserIds } },
          { author: userId }
        ]
      })
    ]);

    // Add isLiked, isSaved flags
    const enriched = posts.map(post => ({
      ...post,
      isLiked: post.likes?.some(id => id.toString() === userId.toString()),
      isSaved: post.saves?.some(id => id.toString() === userId.toString()),
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      isOwner: post.author?._id?.toString() === userId.toString()
    }));

    res.json({
      success: true,
      posts: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tải bảng tin' });
  }
};

// GET /api/social/posts/explore  - public posts for non-following
exports.getExplorePosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 20, tag } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { visibility: 'public' };
    if (tag) filter.tags = tag.toLowerCase();

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name avatar location isAdmin')
        .populate('relatedCourse', 'title thumbnail slug')
        .sort({ viewCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(filter)
    ]);

    const enriched = posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes?.some(id => id.toString() === userId.toString()) : false,
      isSaved: userId ? post.saves?.some(id => id.toString() === userId.toString()) : false,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0
    }));

    res.json({ success: true, posts: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/social/users/:userId/posts  - user's public posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?._id;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const isOwner = viewerId?.toString() === userId;

    // Determine visibility filter based on relationship
    let visibilityFilter;
    if (isOwner) {
      visibilityFilter = {}; // owner sees all own posts
    } else {
      // Check if viewer follows this user
      const targetUser = await User.findById(userId).select('followers');
      const isFollower = targetUser?.followers?.some(id => id.toString() === viewerId?.toString());
      visibilityFilter = isFollower
        ? { visibility: { $in: ['public', 'followers'] } }
        : { visibility: 'public' };
    }

    const [posts, total] = await Promise.all([
      Post.find({ author: userId, ...visibilityFilter })
        .populate('relatedCourse', 'title thumbnail slug')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments({ author: userId, ...visibilityFilter })
    ]);

    const enriched = posts.map(post => ({
      ...post,
      isLiked: viewerId ? post.likes?.some(id => id.toString() === viewerId.toString()) : false,
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0
    }));

    res.json({ success: true, posts: enriched, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/social/posts
exports.createPost = async (req, res) => {
  try {
    const { content, images, type, tags, visibility, relatedCourse, relatedCertificate } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bài viết không được để trống' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      images: images || [],
      type: type || 'post',
      tags: tags ? tags.map(t => t.toLowerCase().trim()) : [],
      visibility: visibility || 'public',
      relatedCourse: relatedCourse || undefined,
      relatedCertificate: relatedCertificate || undefined
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar location isAdmin')
      .populate('relatedCourse', 'title thumbnail slug')
      .lean();

    res.status(201).json({ success: true, post: { ...populated, likeCount: 0, commentCount: 0, isLiked: false } });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bài viết' });
  }
};

// GET /api/social/posts/:id
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const post = await Post.findById(id)
      .populate('author', 'name avatar location isAdmin')
      .populate('relatedCourse', 'title thumbnail slug')
      .populate('comments.author', 'name avatar')
      .populate('comments.replies.author', 'name avatar')
      .lean();

    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    // Increment view count
    await Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      post: {
        ...post,
        isLiked: userId ? post.likes?.some(id => id.toString() === userId.toString()) : false,
        isSaved: userId ? post.saves?.some(id => id.toString() === userId.toString()) : false,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/social/posts/:id
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content, images, tags, visibility } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (post.author.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa' });
    }

    if (content !== undefined) { post.content = content.trim(); post.isEdited = true; post.editedAt = new Date(); }
    if (images !== undefined) post.images = images;
    if (tags !== undefined) post.tags = tags.map(t => t.toLowerCase().trim());
    if (visibility !== undefined) post.visibility = visibility;

    await post.save();
    const updated = await Post.findById(id).populate('author', 'name avatar').lean();
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài viết' });
  }
};

// DELETE /api/social/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bài viết' });
  }
};

// POST /api/social/posts/:id/like  - toggle like
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const alreadyLiked = post.likes.some(uid => uid.toString() === userId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter(uid => uid.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }
    await post.save();

    res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/social/posts/:id/save  - toggle save
exports.toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const alreadySaved = post.saves.some(uid => uid.toString() === userId.toString());
    if (alreadySaved) {
      post.saves = post.saves.filter(uid => uid.toString() !== userId.toString());
    } else {
      post.saves.push(userId);
    }
    await post.save();

    res.json({ success: true, saved: !alreadySaved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/social/posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung bình luận không được rỗng' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const comment = { author: req.user._id, content: content.trim() };
    post.comments.push(comment);
    await post.save();

    const updated = await Post.findById(id).populate('comments.author', 'name avatar').lean();
    const newComment = updated.comments[updated.comments.length - 1];

    res.status(201).json({ success: true, comment: newComment, commentCount: updated.comments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi thêm bình luận' });
  }
};

// DELETE /api/social/posts/:id/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });

    const canDelete = comment.author.toString() === req.user._id.toString()
      || post.author.toString() === req.user._id.toString()
      || req.user.isAdmin;

    if (!canDelete) return res.status(403).json({ success: false, message: 'Không có quyền xóa bình luận' });

    comment.deleteOne();
    await post.save();

    res.json({ success: true, message: 'Đã xóa bình luận', commentCount: post.comments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/social/posts/:id/comments/:commentId/like
exports.likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });

    const alreadyLiked = comment.likes?.some(uid => uid.toString() === userId.toString());
    if (alreadyLiked) {
      comment.likes = comment.likes.filter(uid => uid.toString() !== userId.toString());
    } else {
      comment.likes.push(userId);
    }
    await post.save();

    res.json({ success: true, liked: !alreadyLiked, likeCount: comment.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────
//  STORIES
// ─────────────────────────────────────────

// GET /api/social/stories  - get active stories from following
exports.getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('following');
    const followingIds = user?.following || [];
    const relevantIds = [userId, ...followingIds];

    const stories = await Story.find({
      author: { $in: relevantIds },
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Group stories by author
    const grouped = {};
    stories.forEach(story => {
      const aid = story.author._id.toString();
      if (!grouped[aid]) {
        grouped[aid] = {
          author: story.author,
          stories: [],
          hasUnviewed: false
        };
      }
      const viewed = story.viewers?.some(v => v.user?.toString() === userId.toString());
      grouped[aid].stories.push({ ...story, viewed });
      if (!viewed) grouped[aid].hasUnviewed = true;
    });

    // Own stories first, then others
    const result = Object.values(grouped).sort((a, b) => {
      const aIsMe = a.author._id.toString() === userId.toString();
      const bIsMe = b.author._id.toString() === userId.toString();
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      return (b.hasUnviewed ? 1 : 0) - (a.hasUnviewed ? 1 : 0);
    });

    res.json({ success: true, storyGroups: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi tải stories' });
  }
};

// POST /api/social/stories
exports.createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaPublicId, mediaType, caption, backgroundColor, textOverlay, linkUrl, linkLabel } = req.body;
    if (!mediaUrl) return res.status(400).json({ success: false, message: 'Cần có media URL' });

    const story = await Story.create({
      author: req.user._id,
      mediaUrl,
      mediaPublicId,
      mediaType: mediaType || 'image',
      caption,
      backgroundColor,
      textOverlay,
      linkUrl,
      linkLabel
    });

    const populated = await Story.findById(story._id).populate('author', 'name avatar').lean();
    res.status(201).json({ success: true, story: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi tạo story' });
  }
};

// POST /api/social/stories/:id/view
exports.viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy story' });

    const alreadyViewed = story.viewers.some(v => v.user?.toString() === userId.toString());
    if (!alreadyViewed) {
      story.viewers.push({ user: userId });
      await story.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/social/stories/:id/react
exports.reactToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy story' });

    const viewerEntry = story.viewers.find(v => v.user?.toString() === userId.toString());
    if (viewerEntry) {
      viewerEntry.reaction = reaction || null;
    } else {
      story.viewers.push({ user: userId, reaction: reaction || null });
    }
    await story.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/social/stories/:id
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ success: false, message: 'Không tìm thấy story' });
    if (story.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }
    await story.deleteOne();
    res.json({ success: true, message: 'Đã xóa story' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────
//  FOLLOW / UNFOLLOW
// ─────────────────────────────────────────

// POST /api/social/users/:id/follow  - toggle follow
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user._id;

    if (targetId === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Không thể tự theo dõi chính mình' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetId)
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const isFollowing = currentUser.following.some(id => id.toString() === targetId);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId.toString());
    } else {
      currentUser.following.push(targetId);
      targetUser.followers.push(userId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      following: !isFollowing,
      followerCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error('toggleFollow error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/social/users/:id/followers
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name avatar bio location')
      .select('followers')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, followers: user.followers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/social/users/:id/following
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name avatar bio location')
      .select('following')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, following: user.following });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────
//  PUBLIC USER PROFILE
// ─────────────────────────────────────────

// GET /api/social/users/:id/profile
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?._id;

    const user = await User.findById(id)
      .select('-password -emailVerified -emailVerifiedAt -adminRequestPending -preferences.notifications -preferences.privacy')
      .populate('createdCourses', 'title thumbnail slug rating totalStudents')
      .lean();

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const isOwnProfile = viewerId?.toString() === id;
    const isFollowing = viewerId
      ? user.followers?.some(fid => fid.toString() === viewerId.toString())
      : false;

    // Post count
    const postCount = await Post.countDocuments({ author: id, visibility: { $in: ['public', 'followers'] } });

    res.json({
      success: true,
      user: {
        ...user,
        followerCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        postCount,
        isOwnProfile,
        isFollowing,
        // Hide private data from non-owners
        followers: undefined,
        following: undefined
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ─────────────────────────────────────────
//  UPDATE USER SOCIAL PROFILE
// ─────────────────────────────────────────

// PUT /api/social/profile  - update own social profile fields
exports.updateSocialProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'phone', 'avatar', 'coverImage', 'website', 'location', 'socialLinks'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ', error: err.message });
  }
};

// PUT /api/social/preferences  - update preferences (language, theme, notifications, privacy, onboarding, learningPath, reminders)
exports.updatePreferences = async (req, res) => {
  try {
    const { language, theme, notifications, privacy, onboarding, learningPath, reminders } = req.body;
    const updateObj = {};
    const flattenToUpdateObj = (prefix, input) => {
      Object.keys(input || {}).forEach((key) => {
        const value = input[key];
        const nextPrefix = `${prefix}.${key}`;
        if (
          value &&
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          flattenToUpdateObj(nextPrefix, value);
        } else {
          updateObj[nextPrefix] = value;
        }
      });
    };

    if (language) updateObj['preferences.language'] = language;
    if (theme) updateObj['preferences.theme'] = theme;
    if (notifications) flattenToUpdateObj('preferences.notifications', notifications);
    if (privacy) flattenToUpdateObj('preferences.privacy', privacy);
    if (onboarding) flattenToUpdateObj('preferences.onboarding', onboarding);
    if (learningPath) flattenToUpdateObj('preferences.learningPath', learningPath);
    if (reminders) flattenToUpdateObj('preferences.reminders', reminders);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updateObj }, { new: true })
      .select('preferences');

    res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật cài đặt' });
  }
};

// GET /api/social/preferences  - get own preferences
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/social/saved  - get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Post.find({ saves: userId })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit)).lean(),
      Post.countDocuments({ saves: userId })
    ]);

    res.json({ success: true, posts, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

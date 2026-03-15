const Course = require('../models/Course');
const User = require('../models/User');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { escapeRegex } = require('../utils/regexHelpers');

// GET /api/search?q=&type=all|courses|users|posts|categories&page=1&limit=10
exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' });
    }

    const query = q.trim();
    const regex = new RegExp(escapeRegex(query), 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);

    const results = {};

    const runCourses = type === 'all' || type === 'courses';
    const runUsers = type === 'all' || type === 'users';
    const runPosts = type === 'all' || type === 'posts';
    const runCategories = type === 'all' || type === 'categories';

    const promises = [];

    if (runCourses) {
      promises.push(
        Course.find({
          $or: [
            { title: regex },
            { description: regex },
            { tags: regex }
          ],
          isPublished: true
        })
          .select('title thumbnail slug description rating totalStudents price level')
          .populate('instructor', 'name avatar')
          .sort({ rating: -1, totalStudents: -1 })
          .skip(skip).limit(lim)
          .lean()
          .then(data => { results.courses = data; })
          .catch(() => { results.courses = []; })
      );
    }

    if (runUsers) {
      promises.push(
        User.find({
          $or: [{ name: regex }, { bio: regex }],
          isActive: true
        })
          .select('name avatar bio location followerCount isAdmin')
          .sort({ createdAt: -1 })
          .skip(skip).limit(lim)
          .lean()
          .then(users => {
            results.users = users.map(u => ({
              ...u,
              followerCount: u.followers?.length || 0,
              followers: undefined
            }));
          })
          .catch(() => { results.users = []; })
      );
    }

    if (runPosts) {
      promises.push(
        Post.find({
          $or: [{ content: regex }, { tags: regex }],
          visibility: 'public'
        })
          .select('content images type tags likeCount commentCount viewCount createdAt')
          .populate('author', 'name avatar')
          .sort({ viewCount: -1, createdAt: -1 })
          .skip(skip).limit(lim)
          .lean()
          .then(posts => {
            results.posts = posts.map(p => ({
              ...p,
              likeCount: p.likes?.length || 0,
              commentCount: p.comments?.length || 0,
              likes: undefined,
              comments: undefined,
              saves: undefined
            }));
          })
          .catch(() => { results.posts = []; })
      );
    }

    if (runCategories) {
      promises.push(
        Category.find({ $or: [{ name: regex }, { description: regex }] })
          .select('name slug description image courseCount')
          .limit(6)
          .lean()
          .then(data => { results.categories = data; })
          .catch(() => { results.categories = []; })
      );
    }

    await Promise.all(promises);

    // Total estimated hits for "all" type
    const totalHits = [
      results.courses?.length || 0,
      results.users?.length || 0,
      results.posts?.length || 0,
      results.categories?.length || 0
    ].reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      query,
      type,
      results,
      totalHits,
      page: parseInt(page),
      limit: lim
    });
  } catch (err) {
    console.error('globalSearch error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm' });
  }
};

// GET /api/search/suggestions?q=  - quick autocomplete suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, suggestions: [] });

    const regex = new RegExp(escapeRegex(q.trim()), 'i');

    const [courses, users, tags] = await Promise.all([
      Course.find({ title: regex, isPublished: true })
        .select('title slug thumbnail')
        .limit(4).lean(),
      User.find({ name: regex, isActive: true })
        .select('name avatar')
        .limit(3).lean(),
      Post.distinct('tags', { tags: regex, visibility: 'public' }).limit(5)
    ]);

    res.json({
      success: true,
      suggestions: {
        courses: courses.map(c => ({ type: 'course', id: c._id, title: c.title, slug: c.slug, thumbnail: c.thumbnail })),
        users: users.map(u => ({ type: 'user', id: u._id, name: u.name, avatar: u.avatar })),
        tags: tags.slice(0, 5).map(t => ({ type: 'tag', value: t }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, suggestions: [] });
  }
};

const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const social = require('../controllers/socialController');

// ─── Feed & Explore ───
router.get('/feed', protect, social.getFeed);
router.get('/posts/explore', optionalAuth, social.getExplorePosts);
router.get('/saved', protect, social.getSavedPosts);

// ─── Posts ───
router.route('/posts')
  .post(protect, social.createPost);

router.route('/posts/:id')
  .get(optionalAuth, social.getPost)
  .put(protect, social.updatePost)
  .delete(protect, social.deletePost);

router.post('/posts/:id/like', protect, social.toggleLike);
router.post('/posts/:id/save', protect, social.toggleSave);
router.post('/posts/:id/comments', protect, social.addComment);
router.delete('/posts/:id/comments/:commentId', protect, social.deleteComment);
router.post('/posts/:id/comments/:commentId/like', protect, social.likeComment);

// ─── Stories ───
router.get('/stories', protect, social.getStories);
router.post('/stories', protect, social.createStory);
router.post('/stories/:id/view', protect, social.viewStory);
router.post('/stories/:id/react', protect, social.reactToStory);
router.delete('/stories/:id', protect, social.deleteStory);

// ─── Users (social) ───
router.get('/users/:id/profile', optionalAuth, social.getUserProfile);
router.get('/users/:id/posts', optionalAuth, social.getUserPosts);
router.post('/users/:id/follow', protect, social.toggleFollow);
router.get('/users/:id/followers', protect, social.getFollowers);
router.get('/users/:id/following', protect, social.getFollowing);

// ─── Preferences / Settings ───
router.get('/preferences', protect, social.getPreferences);
router.put('/preferences', protect, social.updatePreferences);
router.put('/profile', protect, social.updateSocialProfile);

module.exports = router;

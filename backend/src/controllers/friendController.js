const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const Block = require('../models/Block');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePair = (userId1, userId2) => {
  const a = String(userId1);
  const b = String(userId2);
  return a < b ? [userId1, userId2] : [userId2, userId1];
};

const getRelationshipForUserIds = async ({ currentUserId, otherUserIds }) => {
  const currentUserIdStr = String(currentUserId);
  const otherIds = otherUserIds.map((id) => String(id));

  const [blockedByMe, blockedMe, friendships, outgoingPending, incomingPending] = await Promise.all([
    Block.find({ blocker: currentUserIdStr, blocked: { $in: otherIds } }).select('blocked'),
    Block.find({ blocked: currentUserIdStr, blocker: { $in: otherIds } }).select('blocker'),
    Friendship.find({
      $or: [
        { userA: currentUserIdStr, userB: { $in: otherIds } },
        { userB: currentUserIdStr, userA: { $in: otherIds } }
      ]
    }).select('userA userB'),
    FriendRequest.find({ fromUser: currentUserIdStr, toUser: { $in: otherIds }, status: 'pending' }).select('toUser'),
    FriendRequest.find({ toUser: currentUserIdStr, fromUser: { $in: otherIds }, status: 'pending' }).select('fromUser')
  ]);

  const blockedByMeSet = new Set(blockedByMe.map((d) => String(d.blocked)));
  const blockedMeSet = new Set(blockedMe.map((d) => String(d.blocker)));
  const friendSet = new Set(
    friendships.map((f) => {
      const other = String(f.userA) === currentUserIdStr ? String(f.userB) : String(f.userA);
      return other;
    })
  );
  const outgoingSet = new Set(outgoingPending.map((r) => String(r.toUser)));
  const incomingSet = new Set(incomingPending.map((r) => String(r.fromUser)));

  const relationships = {};
  for (const otherId of otherIds) {
    relationships[otherId] = {
      isFriend: friendSet.has(otherId),
      pendingOutgoing: outgoingSet.has(otherId),
      pendingIncoming: incomingSet.has(otherId),
      isBlockedByMe: blockedByMeSet.has(otherId),
      hasBlockedMe: blockedMeSet.has(otherId)
    };
  }

  return relationships;
};

// @desc    Search users + relationship context
// @route   GET /api/friends/search?q=
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: { users: [] } });
    }

    const regex = new RegExp(escapeRegExp(q), 'i');

    const users = await User.find({
      _id: { $ne: req.user.id },
      isActive: true,
      $or: [{ name: regex }, { email: regex }]
    })
      .select('name email avatar')
      .limit(10);

    const relationships = await getRelationshipForUserIds({
      currentUserId: req.user.id,
      otherUserIds: users.map((u) => u._id)
    });

    const enriched = users.map((u) => ({
      ...u.toObject(),
      relationship: relationships[String(u._id)]
    }));

    res.json({ success: true, data: { users: enriched } });
  } catch (error) {
    console.error('Error searching friends:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm người dùng' });
  }
};

// @desc    Send friend request
// @route   POST /api/friends/requests
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) {
      return res.status(400).json({ success: false, message: 'toUserId là bắt buộc' });
    }

    if (String(toUserId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Không thể kết bạn với chính mình' });
    }

    const targetUser = await User.findById(toUserId).select('_id isActive');
    if (!targetUser || targetUser.isActive === false) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const blockExists = await Block.findOne({
      $or: [
        { blocker: req.user.id, blocked: toUserId },
        { blocker: toUserId, blocked: req.user.id }
      ]
    }).select('_id');

    if (blockExists) {
      return res.status(403).json({ success: false, message: 'Không thể gửi lời mời do bị chặn' });
    }

    const [userA, userB] = normalizePair(req.user.id, toUserId);
    const alreadyFriends = await Friendship.findOne({ userA, userB }).select('_id');
    if (alreadyFriends) {
      return res.status(400).json({ success: false, message: 'Hai bạn đã là bạn bè' });
    }

    const reversePending = await FriendRequest.findOne({
      fromUser: toUserId,
      toUser: req.user.id,
      status: 'pending'
    }).select('_id');

    if (reversePending) {
      return res.status(400).json({ success: false, message: 'Người này đã gửi lời mời cho bạn. Hãy chấp nhận trong danh sách yêu cầu.' });
    }

    const request = await FriendRequest.create({
      fromUser: req.user.id,
      toUser: toUserId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi lời mời kết bạn',
      data: { requestId: request._id }
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Lời mời kết bạn đang chờ xử lý' });
    }
    console.error('Error sending friend request:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi lời mời kết bạn' });
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    const [incoming, outgoing] = await Promise.all([
      FriendRequest.find({ toUser: req.user.id, status: 'pending' })
        .populate('fromUser', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(50),
      FriendRequest.find({ fromUser: req.user.id, status: 'pending' })
        .populate('toUser', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(50)
    ]);

    res.json({ success: true, data: { incoming, outgoing } });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lời mời kết bạn' });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/requests/:id/accept
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn' });
    }

    if (String(request.toUser) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác lời mời này' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Lời mời không còn ở trạng thái chờ' });
    }

    const blockExists = await Block.findOne({
      $or: [
        { blocker: req.user.id, blocked: request.fromUser },
        { blocker: request.fromUser, blocked: req.user.id }
      ]
    }).select('_id');

    if (blockExists) {
      return res.status(403).json({ success: false, message: 'Không thể chấp nhận do bị chặn' });
    }

    const [userA, userB] = normalizePair(request.fromUser, request.toUser);

    await Friendship.updateOne(
      { userA, userB },
      { $setOnInsert: { userA, userB, createdAt: new Date() } },
      { upsert: true }
    );

    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    await FriendRequest.updateMany(
      {
        status: 'pending',
        $or: [
          { fromUser: request.fromUser, toUser: request.toUser },
          { fromUser: request.toUser, toUser: request.fromUser }
        ]
      },
      { $set: { status: 'canceled', respondedAt: new Date() } }
    );

    res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi chấp nhận lời mời kết bạn' });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/requests/:id/reject
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời kết bạn' });
    }

    if (String(request.toUser) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác lời mời này' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Lời mời không còn ở trạng thái chờ' });
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Đã từ chối lời mời kết bạn' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi từ chối lời mời kết bạn' });
  }
};

// @desc    Block user
// @route   POST /api/friends/block
// @access  Private
const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId là bắt buộc' });
    }

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Không thể tự chặn chính mình' });
    }

    const target = await User.findById(userId).select('_id');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    await Block.updateOne(
      { blocker: req.user.id, blocked: userId },
      { $setOnInsert: { blocker: req.user.id, blocked: userId, createdAt: new Date() } },
      { upsert: true }
    );

    const [userA, userB] = normalizePair(req.user.id, userId);
    await Promise.all([
      Friendship.deleteOne({ userA, userB }),
      FriendRequest.updateMany(
        {
          status: 'pending',
          $or: [
            { fromUser: req.user.id, toUser: userId },
            { fromUser: userId, toUser: req.user.id }
          ]
        },
        { $set: { status: 'canceled', respondedAt: new Date() } }
      )
    ]);

    res.json({ success: true, message: 'Đã chặn người dùng' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi chặn người dùng' });
  }
};

// @desc    Unblock user
// @route   DELETE /api/friends/block/:userId
// @access  Private
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await Block.deleteOne({ blocker: req.user.id, blocked: userId });
    res.json({ success: true, message: 'Đã bỏ chặn' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi bỏ chặn' });
  }
};

// @desc    List friends
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ userA: req.user.id }, { userB: req.user.id }]
    })
      .populate('userA', 'name email avatar')
      .populate('userB', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(200);

    const friends = friendships.map((f) => {
      const other = String(f.userA._id) === String(req.user.id) ? f.userB : f.userA;
      return other;
    });

    res.json({ success: true, data: { friends } });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bạn bè' });
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  unblockUser,
  getFriends
};

const Group = require('../models/Group');
const ScheduledMessage = require('../models/ScheduledMessage');

// Save a new group chat ID with a display name
exports.saveGroup = async (req, res) => {
  try {
    const { groupId, displayName } = req.body;
    const userId = req.user.id;

    // Check if group already exists for this user
    let group = await Group.findOne({ groupId, user: userId });
    if (group) return res.status(400).json({ msg: 'Group already saved' });

    group = new Group({ groupId, displayName, user: userId });
    await group.save();

    res.status(201).json({ msg: 'Group saved', group });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all saved groups for the logged-in user
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ user: req.user.id });
    const chatList = await Promise.all(
      groups.map(async (g) => {
        const lastMsg = await ScheduledMessage.findOne({ groupId: g.groupId })
          .sort({ createdAt: -1 });
        return {
          groupId: g.groupId,
          displayName: g.displayName,
          createdAt: g.createdAt,
          lastMessageTime: lastMsg ? lastMsg.createdAt : g.createdAt,
        };
      })
    );
    res.json(chatList);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
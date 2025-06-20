const Group = require('../models/Group');

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
    const userId = req.user.id;
    const groups = await Group.find({ user: userId }).select('-__v');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
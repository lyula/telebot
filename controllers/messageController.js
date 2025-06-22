const ScheduledMessage = require('../models/ScheduledMessage');
const Group = require('../models/Group');
const User = require('../models/User');
const mainBot = require('../telegramBot');

// Schedule a message
exports.scheduleMessage = async (req, res, next) => {
  try {
    const { groupId, message, schedule, userSchedule, isAutomated } = req.body;
    const userId = req.user.id;

    if (!groupId || !message || !schedule) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const group = await Group.findOne({ groupId });

    // Determine if this is an instant/automated message
    const isInstant = isAutomated || schedule === "* * * * *";

    // Save to DB
    const saved = await ScheduledMessage.create({
      groupId,
      groupName: group?.displayName || "",
      message,
      schedule,
      userSchedule,
      user: userId,
      isAutomated: !!isAutomated,
      paused: false,
      isSent: isInstant,           // Mark as sent if instant/automated
      sentAt: isInstant ? new Date() : undefined, // Set sent time if instant/automated
    });

    // For instant/automated messages, send immediately
    if (isInstant) {
      try {
        await mainBot.sendMessage(groupId, message);
      } catch (err) {
        console.error('Failed to send immediate message:', err);
      }
    }

    res.json({ success: true, msg: 'Message scheduled!', saved });
  } catch (err) {
    next(err);
  }
};

// Get all scheduled messages for the user
exports.getScheduledMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    let messages = await ScheduledMessage.find({ user: userId }).select('-__v');
    messages = messages.map(msg => ({
      ...msg.toObject(),
      isScheduled: !!msg.schedule, // true if scheduled
    }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all scheduled and sent messages for a user and group
exports.getMessagesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await ScheduledMessage.find({ groupId })
      .sort({ createdAt: 1 })
      .select('-__v');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all messages for a group
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await ScheduledMessage.find({ groupId })
      .sort({ createdAt: 1 })
      .select('-__v');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Toggle scheduled message (pause/resume)
exports.toggleScheduledMessage = async (req, res) => {
  try {
    const msg = await ScheduledMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ msg: 'Message not found' });

    msg.paused = !msg.paused;
    await msg.save();

    res.json({ paused: msg.paused });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
const ScheduledMessage = require('../models/ScheduledMessage');
const Group = require('../models/Group');
const User = require('../models/User');
const mainBot = require('../telegramBot');

// Schedule a message
exports.scheduleMessage = async (req, res, next) => {
  try {
    console.log("Received schedule request:", req.body);
    
    const { groupId, message, scheduleType, intervalValue, intervalUnit, repeatCount, scheduleDateTime } = req.body;
    const userId = req.user.id;

    if (!groupId || !message || !scheduleType) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Only require interval fields for recurring schedules
    if (
      scheduleType === "interval" &&
      (
        typeof intervalValue !== "number" || isNaN(intervalValue) || intervalValue <= 0 ||
        typeof intervalUnit !== "string" || !["minutes", "hours", "days"].includes(intervalUnit) ||
        typeof repeatCount !== "number" || isNaN(repeatCount) || repeatCount <= 0
      )
    ) {
      return res.status(400).json({ error: 'Invalid interval fields for recurring schedule.' });
    }

    const group = await Group.findOne({ groupId });

    // Build the message object based on scheduleType
    const msgData = {
      groupId,
      groupName: group?.displayName || "",
      message,
      user: userId,
      paused: false,
      isSent: false,
      sentCount: 0,
      lastSentAt: null,
      scheduleType, // <-- add this
    };

    if (scheduleType === "interval") {
      msgData.intervalValue = intervalValue;
      msgData.intervalUnit = intervalUnit;
      msgData.repeatCount = repeatCount;
    }
    if (scheduleType === "datetime" && scheduleDateTime) {
      msgData.scheduleTime = scheduleDateTime;
    }

    const saved = await ScheduledMessage.create(msgData);

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
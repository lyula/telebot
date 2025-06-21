const nodeCron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const ScheduledMessage = require('../models/ScheduledMessage');
const Group = require('../models/Group');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Schedule a message
exports.scheduleMessage = async (req, res, next) => {
  try {
    const { groupId, message, schedule, userSchedule } = req.body;
    const userId = req.user.id; // assuming you use auth middleware

    if (!groupId || !message || !schedule) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Save to DB
    const saved = await ScheduledMessage.create({
      groupId,
      message,
      schedule,
      userSchedule,
      user: userId,
    });

    res.json({ success: true, msg: "Message scheduled!", saved });
  } catch (err) {
    next(err);
  }
};

// Get all scheduled messages for the user
exports.getScheduledMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await ScheduledMessage.find({ user: userId }).select('-__v');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all scheduled and sent messages for a user and group
exports.getMessagesByGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    // Return all messages for this user and group, sorted by creation time
    const messages = await ScheduledMessage.find({ user: userId, groupId }).sort({ createdAt: 1 }).select('-__v');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupMessages = async (req, res) => {
  const groupId = req.params.groupId;
  const messages = await ScheduledMessage.find({ groupId }).sort({ createdAt: 1 });
  res.json({ messages });
};

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
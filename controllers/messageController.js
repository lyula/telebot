const nodeCron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const ScheduledMessage = require('../models/ScheduledMessage');
const Group = require('../models/Group');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Schedule a message
exports.scheduleMessage = async (req, res) => {
  try {
    const { groupId, message, scheduleTime } = req.body;
    const userId = req.user.id;

    // Check if group exists and belongs to user
    const group = await Group.findOne({ groupId, user: userId });
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Save scheduled message
    const scheduledMessage = new ScheduledMessage({
      user: userId,
      groupId,
      message,
      scheduleTime,
    });
    await scheduledMessage.save();

    // Schedule the message using node-cron
    nodeCron.schedule(scheduleTime, async () => {
      await bot.sendMessage(groupId, message);
    });

    res.status(201).json({ msg: 'Message scheduled', scheduledMessage });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
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

// Get all scheduled messages for a user and group
exports.getMessagesByGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const messages = await ScheduledMessage.find({ user: userId, groupId }).sort({ createdAt: 1 }).select('-__v');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
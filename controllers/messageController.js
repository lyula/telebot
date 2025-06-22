const nodeCron = require('node-cron');
const ScheduledMessage = require('../models/ScheduledMessage');
const CronSent = require('../models/CronSent');
const Group = require('../models/Group');
const User = require('../models/User');
const mainBot = require('../telegramBot');
const cronJobs = new Map(); // In-memory store for jobs

// Schedule a message
exports.scheduleMessage = async (req, res, next) => {
  try {
    const { groupId, message, schedule, userSchedule, isAutomated } = req.body;
    const userId = req.user.id; // Assuming auth middleware

    if (!groupId || !message || !schedule) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate cron schedule
    if (!nodeCron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron schedule.' });
    }

    const group = await Group.findOne({ groupId }); // or however you fetch group info

    // Save to DB
    const saved = await ScheduledMessage.create({
      groupId,
      groupName: group?.displayName || "", // <-- ensure this is set
      message,
      schedule,
      userSchedule,
      user: userId,
      isAutomated: !!isAutomated, // Store as boolean
      paused: false,
    });

    // For automated messages, send the first instance immediately
    if (isAutomated) {
      try {
        await mainBot.sendMessage(groupId, message);
      } catch (err) {
        console.error('Failed to send immediate automated message:', err);
      }
    }

    // Schedule the cron job (for both automated and scheduled messages)
    const job = nodeCron.schedule(saved.schedule, async () => {
      try {
        // Check if paused
        const msg = await ScheduledMessage.findById(saved._id);
        if (msg.paused) return;

        await mainBot.sendMessage(msg.groupId, msg.message);

        // Fetch group name
        let groupName = msg.groupName;
        if (!groupName) {
          const group = await Group.findOne({ groupId: msg.groupId });
          groupName = group ? group.displayName : "";
        }

        // Fetch user name
        let userName = "";
        if (msg.user) {
          const userDoc = await User.findById(msg.user);
          userName = userDoc ? userDoc.username : "";
        }

        // Record in CronSent
        await CronSent.create({
          groupId: msg.groupId,
          groupName,
          message: msg.message,
          user: msg.user,
          userName,
          originalScheduledMessage: msg._id,
          userSchedule: msg.userSchedule || "",
          sentAt: new Date(),
        });

        // Mark as sent only for one-time messages
        if (!msg.schedule || msg.schedule === 'one-time') {
          await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true, sentAt: new Date() });
        }
      } catch (err) {
        console.error("Error sending or recording scheduled message:", err);
      }
    }, { scheduled: !saved.paused });

    cronJobs.set(saved._id.toString(), job);

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
    let messages = await ScheduledMessage.find({ groupId })
      .sort({ createdAt: 1 })
      .select('-__v');

    // For each message, count how many times it was sent via cron
    const messagesWithCount = await Promise.all(
      messages.map(async (msg) => {
        const sentCount = await CronSent.countDocuments({ originalScheduledMessage: msg._id });
        return {
          ...msg.toObject(),
          isScheduled: !!msg.schedule,
          sentCount,
        };
      })
    );

    res.json({ messages: messagesWithCount });
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

    const job = cronJobs.get(req.params.id);
    if (job) {
      if (msg.paused) {
        job.stop();
      } else {
        job.start();
      }
    }

    res.json({ paused: msg.paused });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
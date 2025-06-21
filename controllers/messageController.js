const nodeCron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const ScheduledMessage = require('../models/ScheduledMessage');
const mainBot = require('../telegramBot'); // Use the main bot instance
const Group = require('../models/Group'); // Import Group model

// In-memory store for cron jobs to allow pausing/resuming
const cronJobs = new Map();

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
    const job = nodeCron.schedule(schedule, async () => {
      try {
        // Check if the message is paused
        const msg = await ScheduledMessage.findById(saved._id);
        if (!msg.paused) {
          await mainBot.sendMessage(groupId, message);
        }
      } catch (err) {
        console.error(`Failed to send scheduled message to group ${groupId}:`, err);
      }
    }, {
      scheduled: false, // Start manually to respect paused state
    });

    // Store the cron job for later control (e.g., pausing)
    cronJobs.set(saved._id.toString(), job);

    // Start the job if not paused
    if (!saved.paused) {
      job.start();
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
    const userId = req.user.id;
    const { groupId } = req.params;
    const messages = await ScheduledMessage.find({ user: userId, groupId })
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
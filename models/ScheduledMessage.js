const mongoose = require('mongoose');

const ScheduledMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  groupId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 4096, // Telegram's max message length
  },
  scheduleTime: {
    type: String, // cron format string
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ScheduledMessage', ScheduledMessageSchema);
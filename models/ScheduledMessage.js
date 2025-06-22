const mongoose = require("mongoose");

const ScheduledMessageSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  scheduleTime: { type: String }, // cron string or ISO date
  interval: { type: String }, // e.g. "every 5 minutes"
  isSent: { type: Boolean, default: false }, // true if actually sent by cron
  sentAt: { type: Date }, // when actually sent by cron
  sent: { type: Boolean, default: false }, // for frontend compatibility
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // add if you want user-specific messages
  paused: { type: Boolean, default: false },
  userSchedule: { type: String }, // Add this line
  intervalMinutes: { type: Number, default: 0 }, // e.g., 10 for every 10 minutes
  intervalValue: { type: Number, required: true }, // e.g. 10
  intervalUnit: { type: String, enum: ['minutes', 'hours', 'days'], required: true }, // e.g. "minutes"
  repeatCount: { type: Number, required: true },
  sentCount: { type: Number, default: 0 },
  lastSentAt: { type: Date },
});

module.exports = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
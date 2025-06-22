const mongoose = require("mongoose");

const ScheduledMessageSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  groupName: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  scheduleTime: { type: String }, // cron string or ISO date
  interval: { type: String }, // e.g. "every 5 minutes"
  isSent: { type: Boolean, default: false },
  sentAt: { type: Date },
  sent: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paused: { type: Boolean, default: false },
  userSchedule: { type: String },
  intervalValue: { type: Number, required: true }, // e.g. 10
  intervalUnit: { type: String, enum: ['minutes', 'hours', 'days'], required: true }, // e.g. "minutes"
  repeatCount: { type: Number, required: true },
  sentCount: { type: Number, default: 0 },
  lastSentAt: { type: Date },
});

module.exports = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
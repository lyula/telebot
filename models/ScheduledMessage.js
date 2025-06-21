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
});

module.exports = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
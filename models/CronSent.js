const mongoose = require("mongoose");

const CronSentSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  groupName: { type: String },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String },
  originalScheduledMessage: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledMessage" },
  userSchedule: { type: String },
});

module.exports = mongoose.model("CronSent", CronSentSchema);
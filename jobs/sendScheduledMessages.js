const cron = require("node-cron");
const cronParser = require("cron-parser");
const ScheduledMessage = require("../models/ScheduledMessage");
const CronSent = require("../models/CronSent");
const bot = require("../telegramBot"); // Use the main bot instance

// Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const messages = await ScheduledMessage.find({
    isSent: false,
    paused: false,
  });

  for (const msg of messages) {
    try {
      // Parse the cron schedule
      const interval = cronParser.parseExpression(msg.schedule, { currentDate: now });
      const prev = interval.prev().toDate();

      // If the previous scheduled time is within the last minute, send now
      if (Math.abs(now - prev) < 60000) {
        await bot.sendMessage(msg.groupId, msg.message);

        // Save to cronSent collection with both groupId and groupName
        await CronSent.create({
          groupId: msg.groupId,
          groupName: msg.groupName, // <-- add this line
          message: msg.message,
          user: msg.user,
          originalScheduledMessage: msg._id,
          userSchedule: msg.userSchedule,
          sentAt: new Date(),
        });

        // Mark as sent (for one-time messages)
        await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true, sentAt: new Date() });
      }
    } catch (err) {
      console.error("Cron parse/send error:", err);
    }
  }
});
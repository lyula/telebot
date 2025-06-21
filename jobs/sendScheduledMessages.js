const cron = require("node-cron");
const cronParserModule = require("cron-parser");
const parseExpression = cronParserModule.parseExpression || cronParserModule.default?.parseExpression;
const ScheduledMessage = require("../models/ScheduledMessage");
const CronSent = require("../models/CronSent");
const bot = require("../telegramBot");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const messages = await ScheduledMessage.find({
    isSent: false,
    paused: false,
  });

  for (const msg of messages) {
    try {
      const interval = parseExpression(msg.schedule, { currentDate: now });
      const prev = interval.prev().toDate();

      if (Math.abs(now - prev) < 60000) {
        await bot.sendMessage(msg.groupId, msg.message);

        // Save to CronSent collection
        await CronSent.create({
          groupId: msg.groupId,
          groupName: msg.groupName,
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
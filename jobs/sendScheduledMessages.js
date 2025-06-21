const cron = require("node-cron");
const cronParserModule = require("cron-parser");
const parseExpression = cronParserModule.parseExpression || cronParserModule.default?.parseExpression;
const ScheduledMessage = require("../models/ScheduledMessage");
const CronSent = require("../models/CronSent");
const Group = require("../models/Group");
const User = require("../models/User"); // Add this import at the top
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

        // Ensure groupName is present
        let groupName = msg.groupName;
        if (!groupName) {
          const group = await Group.findOne({ groupId: msg.groupId });
          groupName = group ? group.displayName : "";
        }

        // Fetch user string name using the real field name
        let userName = "";
        if (msg.user) {
          const userDoc = await User.findById(msg.user);
          userName = userDoc ? userDoc.username : "";
        }

        // Always log to CronSent collection for every send
        await CronSent.create({
          groupId: msg.groupId,
          groupName: groupName,
          message: msg.message,
          user: msg.user, // ObjectId reference
          userName: userName, // String username
          originalScheduledMessage: msg._id,
          userSchedule: msg.userSchedule,
          sentAt: new Date(),
        });

        // Mark as sent only for one-time messages (optional)
        if (!msg.schedule || msg.schedule === 'one-time') {
          await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true, sentAt: new Date() });
        }
      }
    } catch (err) {
      console.error("Cron parse/send error:", err);
    }
  }
});
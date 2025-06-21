const cron = require("node-cron");
const cronParserModule = require("cron-parser");
const parseExpression = cronParserModule.parseExpression || cronParserModule.default?.parseExpression;
const ScheduledMessage = require("../models/ScheduledMessage");
const CronSent = require("../models/CronSent");
const Group = require("../models/Group");
const User = require("../models/User");
const bot = require("../telegramBot");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  let messages;
  try {
    messages = await ScheduledMessage.find({
      isSent: false,
      paused: false,
    });
  } catch (err) {
    console.error("Failed to fetch scheduled messages:", err);
    return;
  }

  for (const msg of messages) {
    try {
      const interval = parseExpression(msg.schedule, { currentDate: now });
      const prev = interval.prev().toDate();

      if (Math.abs(now - prev) < 60000) {
        await bot.sendMessage(msg.groupId, msg.message);

        // Ensure groupName is present
        let groupName = msg.groupName;
        if (!groupName) {
          try {
            const group = await Group.findOne({ groupId: msg.groupId });
            groupName = group ? group.displayName : "";
          } catch (err) {
            console.warn("Failed to fetch group name:", err);
            groupName = "";
          }
        }

        // Fetch user string name using the real field name
        let userName = "";
        if (msg.user) {
          try {
            const userDoc = await User.findById(msg.user);
            userName = userDoc ? userDoc.username : "";
          } catch (err) {
            console.warn("Failed to fetch user name:", err);
            userName = "";
          }
        } else {
          console.warn("Scheduled message missing user field:", msg._id);
        }

        // Ensure userSchedule is present
        let userSchedule = msg.userSchedule;
        if (!userSchedule) {
          try {
            const scheduledMsg = await ScheduledMessage.findOne({
              message: msg.message,
              groupId: msg.groupId,
            });
            userSchedule = scheduledMsg ? scheduledMsg.userSchedule : "";
          } catch (err) {
            console.warn("Failed to fetch userSchedule:", err);
            userSchedule = "";
          }
        }

        // Log before creating CronSent
        console.log("Creating CronSent record for message:", {
          groupId: msg.groupId,
          groupName,
          message: msg.message,
          user: msg.user,
          userName,
          originalScheduledMessage: msg._id,
          userSchedule,
          sentAt: new Date(),
        });

        try {
          await CronSent.create({
            groupId: msg.groupId,
            groupName: groupName,
            message: msg.message,
            user: msg.user,
            userName: userName,
            originalScheduledMessage: msg._id,
            userSchedule: userSchedule,
            sentAt: new Date(),
          });
          console.log("CronSent record created successfully for message:", msg._id);
        } catch (err) {
          console.error("Failed to create CronSent record:", err);
        }

        // Mark as sent only for one-time messages (optional)
        if (!msg.schedule || msg.schedule === 'one-time') {
          try {
            await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true, sentAt: new Date() });
          } catch (err) {
            console.error("Failed to update ScheduledMessage as sent:", err);
          }
        }
      }
    } catch (err) {
      console.error("Cron parse/send error for message", msg._id, ":", err);
    }
  }
});
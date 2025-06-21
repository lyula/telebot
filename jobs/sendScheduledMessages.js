const cron = require("node-cron");
const ScheduledMessage = require("../models/ScheduledMessage");
const CronSent = require("../models/CronSent");
const Group = require("../models/Group");
const User = require("../models/User");
const bot = require("../telegramBot");

// Run every minute to check all scheduled messages
cron.schedule("* * * * *", async () => {
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
    // Schedule a cron job for each message if not already scheduled
    if (!msg.schedule) continue; // skip if no schedule

    // Schedule the message using node-cron
    cron.schedule(msg.schedule, async () => {
      try {
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

        // Fetch user string name
        let userName = "";
        if (msg.user) {
          try {
            const userDoc = await User.findById(msg.user);
            userName = userDoc ? userDoc.username : "";
          } catch (err) {
            console.warn("Failed to fetch user name:", err);
            userName = "";
          }
        }

        // Ensure userSchedule is present
        let userSchedule = msg.userSchedule || "";

        // Record in CronSent
        await CronSent.create({
          groupId: msg.groupId,
          groupName,
          message: msg.message,
          user: msg.user,
          userName,
          originalScheduledMessage: msg._id,
          userSchedule,
          sentAt: new Date(),
        });

        // Mark as sent only for one-time messages
        if (!msg.schedule || msg.schedule === 'one-time') {
          await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true, sentAt: new Date() });
        }
      } catch (err) {
        console.error("Error sending or recording scheduled message:", err);
      }
    }, { scheduled: true });
  }
});
const nodeCron = require('node-cron');
const ScheduledMessage = require('./models/ScheduledMessage');
const CronSent = require('./models/CronSent');
const Group = require('./models/Group');
const User = require('./models/User');
const mainBot = require('./telegramBot');
const cronJobs = new Map();

async function scheduleAllMessages() {
  const messages = await ScheduledMessage.find({ paused: false });
  for (const msg of messages) {
    if (cronJobs.has(msg._id.toString())) continue;

    const job = nodeCron.schedule(msg.schedule, async () => {
      try {
        const freshMsg = await ScheduledMessage.findById(msg._id);
        if (!freshMsg || freshMsg.paused) return;

        await mainBot.sendMessage(freshMsg.groupId, freshMsg.message);

        let groupName = freshMsg.groupName;
        if (!groupName) {
          const group = await Group.findOne({ groupId: freshMsg.groupId });
          groupName = group ? group.displayName : "";
        }

        let userName = "";
        if (freshMsg.user) {
          const userDoc = await User.findById(freshMsg.user);
          userName = userDoc ? userDoc.username : "";
        }

        await CronSent.create({
          groupId: freshMsg.groupId,
          groupName,
          message: freshMsg.message,
          user: freshMsg.user,
          userName,
          originalScheduledMessage: freshMsg._id,
          userSchedule: freshMsg.userSchedule || "",
          sentAt: new Date(),
        });

        if (!freshMsg.schedule || freshMsg.schedule === 'one-time') {
          await ScheduledMessage.findByIdAndUpdate(freshMsg._id, { isSent: true, sentAt: new Date() });
        }
      } catch (err) {
        console.error("Error sending or recording scheduled message:", err);
      }
    }, { scheduled: true });

    cronJobs.set(msg._id.toString(), job);
  }
}

module.exports = { scheduleAllMessages, cronJobs };
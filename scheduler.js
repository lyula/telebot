const ScheduledMessage = require('./models/ScheduledMessage');
const CronSent = require('./models/CronSent');
const Group = require('./models/Group');
const User = require('./models/User');
const mainBot = require('./telegramBot');

async function scheduleAllMessages() {
  setInterval(async () => {
    const now = new Date();
    // Find scheduled messages due to be sent and not yet sent
    const messages = await ScheduledMessage.find({
      scheduledAt: { $lte: now },
      isSent: false,
      paused: false,
    });

    for (const msg of messages) {
      try {
        await mainBot.sendMessage(msg.groupId, msg.message);
        msg.isSent = true;
        msg.sentAt = new Date();
        await msg.save();
      } catch (err) {
        console.error("Failed to send scheduled message:", err);
      }
    }
  }, 60 * 1000); // Check every minute
}

module.exports = { scheduleAllMessages };
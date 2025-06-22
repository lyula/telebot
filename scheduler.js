const ScheduledMessage = require('./models/ScheduledMessage');
const mainBot = require('./telegramBot');

async function scheduleAllMessages() {
  setInterval(async () => {
    const now = new Date();
    const messages = await ScheduledMessage.find({
      paused: false,
      isSent: false,
    });

    for (const msg of messages) {
      // DATETIME LOGIC
      if (msg.scheduleType === "datetime" && msg.scheduleTime && !msg.isSent) {
        const scheduledDate = new Date(msg.scheduleTime);
        if (now >= scheduledDate && msg.sentCount < 1) {
          try {
            await mainBot.sendMessage(msg.groupId, msg.message);
            msg.lastSentAt = now;
            msg.sentCount = 1;
            msg.isSent = true;
            await msg.save();
          } catch (err) {
            console.error("Failed to send scheduled message:", err);
          }
        }
      }
    }
  }, 60 * 1000); // Check every minute
}

module.exports = { scheduleAllMessages };
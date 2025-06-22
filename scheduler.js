const ScheduledMessage = require('./models/ScheduledMessage');
const mainBot = require('./telegramBot');

async function scheduleAllMessages() {
  setInterval(async () => {
    const messages = await ScheduledMessage.find({
      paused: false,
      isSent: false,
    });

    const now = new Date();

    for (const msg of messages) {
      // Handle one-time scheduled messages
      if (msg.scheduleType === "datetime" && msg.scheduleTime && !msg.isSent) {
        const scheduledDate = new Date(msg.scheduleTime);
        if (now >= scheduledDate && msg.sentCount < 1) {
          try {
            await mainBot.sendMessage(msg.groupId, msg.message);
            msg.lastSentAt = new Date();
            msg.sentCount = 1;
            msg.isSent = true;
            await msg.save();
          } catch (err) {
            console.error("Failed to send scheduled message:", err);
          }
        }
      }

      // Handle recurring/interval messages
      if (msg.scheduleType === "interval" && msg.intervalValue && msg.intervalUnit && msg.repeatCount) {
        let shouldSend = false;
        let nextSendTime = msg.lastSentAt ? new Date(msg.lastSentAt) : null;

        if (!msg.lastSentAt) {
          shouldSend = true;
        } else if (msg.sentCount < msg.repeatCount) {
          switch (msg.intervalUnit) {
            case "minutes":
              nextSendTime.setMinutes(nextSendTime.getMinutes() + msg.intervalValue);
              break;
            case "hours":
              nextSendTime.setHours(nextSendTime.getHours() + msg.intervalValue);
              break;
            case "days":
              nextSendTime.setDate(nextSendTime.getDate() + msg.intervalValue);
              break;
            default:
              break;
          }
          if (now >= nextSendTime) shouldSend = true;
        }

        if (shouldSend && msg.sentCount < msg.repeatCount) {
          try {
            await mainBot.sendMessage(msg.groupId, msg.message);
            msg.lastSentAt = new Date();
            msg.sentCount += 1;
            if (msg.sentCount >= msg.repeatCount) msg.isSent = true;
            await msg.save();
          } catch (err) {
            console.error("Failed to send recurring message:", err);
          }
        }
      }
    }
  }, 60 * 1000); // Check every minute
}

module.exports = { scheduleAllMessages };
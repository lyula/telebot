const ScheduledMessage = require('./models/ScheduledMessage');
const mainBot = require('./telegramBot');
const { DateTime } = require('luxon');

async function scheduleAllMessages() {
  setInterval(async () => {
    const messages = await ScheduledMessage.find({
      paused: false,
      isSent: false,
    });

    const nowUtc = DateTime.utc();

    for (const msg of messages) {
      // Handle one-time scheduled messages
      if (msg.scheduleType === "datetime" && msg.scheduleTime && !msg.isSent) {
        const userScheduled = DateTime.fromISO(msg.scheduleTime, { zone: msg.userTimezone || "UTC" });
        const scheduledUtc = userScheduled.toUTC();

        if (nowUtc >= scheduledUtc && msg.sentCount < 1) {
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
        // If never sent, send immediately
        let shouldSend = false;
        let nextSendTime = msg.lastSentAt ? DateTime.fromJSDate(msg.lastSentAt) : null;

        if (!msg.lastSentAt) {
          shouldSend = true;
        } else if (msg.sentCount < msg.repeatCount) {
          // Calculate next send time
          switch (msg.intervalUnit) {
            case "minutes":
              nextSendTime = nextSendTime.plus({ minutes: msg.intervalValue });
              break;
            case "hours":
              nextSendTime = nextSendTime.plus({ hours: msg.intervalValue });
              break;
            case "days":
              nextSendTime = nextSendTime.plus({ days: msg.intervalValue });
              break;
            default:
              break;
          }
          if (nowUtc >= nextSendTime) shouldSend = true;
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
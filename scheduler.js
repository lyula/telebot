const ScheduledMessage = require('./models/ScheduledMessage');
const mainBot = require('./telegramBot');

function getIntervalMs(value, unit) {
  if (unit === 'minutes') return value * 60 * 1000;
  if (unit === 'hours') return value * 60 * 60 * 1000;
  if (unit === 'days') return value * 24 * 60 * 60 * 1000;
  return 0;
}

async function scheduleAllMessages() {
  setInterval(async () => {
    const now = new Date();
    const messages = await ScheduledMessage.find({
      paused: false,
      isSent: false,
    });

    for (const msg of messages) {
      const intervalMs = getIntervalMs(msg.intervalValue, msg.intervalUnit);
      if (!intervalMs || isNaN(intervalMs) || intervalMs <= 0) {
        console.error("Invalid interval for message:", msg._id, msg.intervalValue, msg.intervalUnit);
        continue;
      }

      if (msg.sentCount < msg.repeatCount) {
        if (
          !msg.lastSentAt ||
          (now - msg.lastSentAt) >= intervalMs
        ) {
          try {
            await mainBot.sendMessage(msg.groupId, msg.message);
            msg.lastSentAt = now;
            msg.sentCount += 1;
            if (msg.sentCount >= msg.repeatCount) {
              msg.isSent = true;
            }
            await msg.save();
          } catch (err) {
            console.error("Failed to send scheduled message:", err);
          }
        }
      } else if (!msg.isSent) {
        msg.isSent = true;
        await msg.save();
      }
    }
  }, 60 * 1000); // Check every minute
}

module.exports = { scheduleAllMessages };
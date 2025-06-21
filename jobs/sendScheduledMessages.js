const cron = require("node-cron");
const ScheduledMessage = require("../models/ScheduledMessage");

// Run every minute (adjust as needed)
cron.schedule("* * * * *", async () => {
  const now = new Date();
  // Find all scheduled messages that should be sent now or at this interval
  const messages = await ScheduledMessage.find({
    isSent: false,
    paused: false, // <-- Make sure this is included!
    // Add your logic to match the current time with scheduleTime/interval
    // For example, you could use a library like cron-parser to check if now matches scheduleTime
  });

  for (const msg of messages) {
    // 1. Send the message to Telegram here (your bot logic)
    // 2. Log the sent message in the DB as a new document
    await ScheduledMessage.create({
      groupId: msg.groupId,
      message: msg.message,
      createdAt: new Date(),
      isSent: true,
      sentAt: new Date(),
      scheduleTime: msg.scheduleTime,
      interval: msg.interval,
      sent: true,
      user: msg.user, // if you track user
    });

    // 3. If this is a one-time schedule, mark the original as sent
    // For recurring, you may want to keep the original for future runs
    // await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true });
  }
});
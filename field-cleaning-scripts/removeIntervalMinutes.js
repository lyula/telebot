const mongoose = require('mongoose');
const ScheduledMessage = require('../models/ScheduledMessage');

// Replace with your actual MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telebot';

async function removeField() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await ScheduledMessage.updateMany(
    { intervalMinutes: { $exists: true } },
    { $unset: { intervalMinutes: "" } }
  );
  console.log(`Removed intervalMinutes from ${result.nModified || result.modifiedCount} documents.`);
  await mongoose.disconnect();
}

removeField().catch(err => {
  console.error(err);
  process.exit(1);
});
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const bot = require('./telegramBot');
const mongoose = require('mongoose'); // <-- Add this line at the top
const { scheduleAllMessages } = require('./scheduler');

console.log("Loading environment variables...");
dotenv.config();

console.log("Connecting to MongoDB...");
connectDB();
console.log("MongoDB connection initiated.");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("INTERNAL ERROR:", err); // This will show up in Render logs
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
  // Optionally: Notify admin, or try to restart polling after a delay
});

mongoose.connection.once('open', async () => {
  await scheduleAllMessages();
  // ...any other startup logic...
});
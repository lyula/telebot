const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const TelegramBot = require('node-telegram-bot-api');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Start Telegram bot
require('./telegramBot'); // <-- Add this line

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

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('message', (msg) => {
  // ...your bot logic...
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log('Telegram bot is running!');
});
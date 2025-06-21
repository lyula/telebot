const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

console.log("Loading environment variables...");
dotenv.config();

console.log("Connecting to MongoDB...");
connectDB();
console.log("MongoDB connection initiated.");

console.log("Starting Telegram bot...");
require('./telegramBot');
console.log("Telegram bot started.");

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
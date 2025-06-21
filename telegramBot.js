const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

function getGreetingByHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userDate = new Date(msg.date * 1000);
  const hour = userDate.getUTCHours();
  const greeting = getGreetingByHour(hour);

  const usage = `
${greeting}, ${msg.from.first_name || "there"}! 👋

Welcome to Telebot. Here’s how to use me:

1. Add me to your Telegram group and make me an admin.
2. In your Telebot web app, add the group using its Group ID (e.g. -100...).
3. Schedule messages from the web app. I’ll deliver them to your group as scheduled!

You can:
- Send messages instantly or schedule them for later.
- Set recurring messages (daily, hourly, etc).
- Manage all your groups from the web dashboard.

*Note:* I only work in groups where I’m an admin.
`;

  bot.sendMessage(chatId, usage, { parse_mode: "Markdown" });
});

module.exports = bot;
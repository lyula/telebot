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

Welcome to Telebot.

**How to set me up:**

1. **Find me:** Search for my username [@ShunMeiBot](https://t.me/ShunMeiBot) in Telegram or go to https://t.me/ShunMeiBot.
2. **Add me to your group:** Open your group, tap "Add Members", search for my username, and add me.
3. **Make me an admin:** Go to your group members list, tap my name, and promote me to admin. This is required for me to send messages.
4. **Get your group ID:** 
   - Add [@userinfobot](https://t.me/userinfobot) or [@getidsbot](https://t.me/getidsbot) to your group.
   - Send any message in the group.
   - The helper bot will reply with your group’s ID (it looks like \`-100xxxxxxxxxx\`).

**Using the web app:**
- Log in to the Telebot web app.
- Add your group using the group ID you got above.
- Schedule messages or send them instantly from the dashboard.
- I’ll deliver your messages to the group as scheduled!

*Note:* I only work in groups where I’m an admin.

© Owned by Shunmei
`;

  bot.sendMessage(chatId, usage, { parse_mode: "Markdown" });
});

module.exports = bot;
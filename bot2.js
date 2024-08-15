require('dotenv').config(); 
const TelegramBot = require('node-telegram-bot-api');


const token = process.env.TOKEN2;
const bot = new TelegramBot(token, { polling: true });
const users = []
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if(!users.includes(chatId)) users.push(chatId)
    bot.sendMessage(chatId,`Total User who have accessed this bot = ${users.length}`)
})

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if(!users.includes(chatId)) users.push(chatId)
    bot.sendMessage(chatId,`Total User who have accessed this bot = ${users.length}`)
})
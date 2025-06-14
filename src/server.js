


import dotenv from 'dotenv';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsPath = path.join(__dirname, 'subscribers/whiteList.js');
const jsonPath = path.join(__dirname, 'subscribers/whiteList.json');
console.log("jsonPath in server:", jsonPath)

import subscribeMessage from './components/subscribe_message.js';
import { loadWhiteList, saveWhiteList } from './lib/handleWhiteList.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

const TOKEN = process.env.TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const bot = new TelegramBot(TOKEN);
app.use(express.json());
bot.setWebHook(WEBHOOK_URL);

app.post('/webhook', async (req, res) => {
    console.log("req.body in webhook:", req.body)

    try{

        if (typeof req.body === 'object' && (
          req.body.message && req.body.message.chat.id || 
          req.body.callback_query)) {
            console.log("Receiving a message from Telegram in webhook")

            bot.processUpdate(req.body);
            return res.sendStatus(200);
        } 

    } catch (e){

      console.log("Receiving a message from external source in webhook")

        let message = JSON.stringify(req.body)

        bot.sendMessage(process.env.CHAT_ID || '7017491148', message)
        res.sendStatus(200);

    }
});

bot.on('message', async(msg) => {
    const chatId = msg.chat.id;
    console.log("chatId in message:", chatId)


    if (msg.text.toLowerCase() === 'hi') {
        bot.sendMessage(chatId, 'Hello World');
    }

    await subscribeMessage(bot, chatId);
});

bot.on('callback_query', async (query) => {
  const cbChatId = query.message.chat.id;
  const action = query.data;

  let whiteList = await loadWhiteList();
  // console.log("whiteList in callback_query:", whiteList);

  if (action === 'subscribe') {
    if (!whiteList.includes(cbChatId)) {
      whiteList.push(cbChatId);
      await saveWhiteList(whiteList);
      await bot.sendMessage(cbChatId, `✅ You've been added to the subscription list.`);
    } else {
      await bot.sendMessage(cbChatId, `ℹ️ You're already subscribed.`);
    }
  }

  if (action === 'unsubscribe') {
    if (whiteList.includes(cbChatId)) {
      whiteList = whiteList.filter(id => id !== cbChatId);
      await saveWhiteList(whiteList);
      await bot.sendMessage(cbChatId, `❎ You've been removed from the subscription list.`);
    } else {
      await bot.sendMessage(cbChatId, `ℹ️ You're not currently subscribed.`);
    }
  }

  await bot.answerCallbackQuery(query.id);
  
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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

import logger from './lib/logger.js';
if (['production', 'staging'].includes(process.env.NODE_ENV)) {
  console.log = (...args) => logger.info(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
}

const allowedOrigins = process.env.ALLOWED_ORIGENS;
// console.log("allowedOrigins:", allowedOrigins)

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.options('*', cors());

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

      console.error("Receiving a message from external source in webhook")

        let message = JSON.stringify(req.body)

        bot.sendMessage('7017491148', message)
        res.sendStatus(200);
    }
});

bot.on('message', async(msg) => {
    const chatId = msg.chat.id;
    console.log("chatId in bot.on message:", chatId)


    if (msg.text.toLowerCase() === 'teken') {
        await subscribeMessage(bot, chatId);
        return;
    } 

    await bot.sendMessage(chatId, 
      `Baie welkom by ons Onthou die Sabbatdag Kanaal! Teken in vir die link om na die nuuste boodskap te luister.

  1.  Stuur die woordjie, teken`
    )

});

bot.on('callback_query', async (query) => {
  const cbChatId = query.message.chat.id;
  const action = query.data;

  let whiteList = await loadWhiteList();
  console.log("whiteList in callback_query:", whiteList);

  if (action === 'subscribe') {
    if (!whiteList.includes(cbChatId)) {
      whiteList.push(cbChatId);
      await saveWhiteList(whiteList);
      await bot.sendMessage(cbChatId, `✅ Jy is nou op die intekenlys.`);
    } else {
      await bot.sendMessage(cbChatId, `ℹ️ Jy is alreeds op die intekenlys.`);
    }
  }

  if (action === 'unsubscribe') {
    if (whiteList.includes(cbChatId)) {
      whiteList = whiteList.filter(id => id !== cbChatId);
      await saveWhiteList(whiteList);
      await bot.sendMessage(cbChatId, `❎ Jy is nou afgehaal van die intekenlys.`);
    } else {
      await bot.sendMessage(cbChatId, `ℹ️ Jy is nie op die intekenlys nie.`);
    }
  }

  await bot.answerCallbackQuery(query.id);
  
});

app.get('/', (_, res) => {
  res.send('Telegram App is running!');
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

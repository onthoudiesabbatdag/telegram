


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
// console.log("jsonPath in server:", jsonPath)

import subscribeMessage from './components/subscribe_message.js';
import videoMessage from './components/video_message.js';
import shareMessage from './components/share_message.js';
import { loadWhiteList, saveWhiteList } from './lib/handleWhiteList.js';

import logger from './lib/logger.js';
if (['production', 'staging'].includes(process.env.NODE_ENV)) {
  console.log = (...args) => logger.info(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
}

import handleYouTubeVideos from './lib/handleYouTubeVideos.js';
import { videoList, shortsList, playList } from './loaders/youTubeVideoListLoader.js';


(async () => {

  // console.log("videoList:", videoList);
  // console.log("shortsList:", shortsList);
  // console.log("videoList:", JSON.stringify(videoList, null, 2)[0]);
  await handleYouTubeVideos();
  // await listVideos();
  // await listPlaylists();
  // await listShorts();
})();

const allowedOrigins = process.env.ALLOWED_ORIGENS.split(',');
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

let whiteList;

app.use('/webhook', (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    express.json()(req, res, next); // Telegram JSON
  } else {
    express.text({ type: '*/*' })(req, res, next); // WebSub XML
  }
});

app.post('/webhook', async (req, res, next) => {

  const signatureHeader = req.headers['x-hub-signature'];
  const HUB_SECRET = process.env.HUB_SECRET;


  if (signatureHeader && HUB_SECRET && typeof req.body === 'string') {
    try {
      const [algo, digest] = signatureHeader.split('=');
      if (algo === 'sha1') {
        const hmac = crypto.createHmac('sha1', HUB_SECRET);
        hmac.update(req.body);
        const expectedDigest = hmac.digest('hex');

        if (digest !== expectedDigest) {
          console.error("❌ X-Hub-Signature mismatch.");
          return res.status(403).send('Signature Mismatch');
        } else {
          console.log("✅ Signature verified.");
        }
      }
    } catch (e) {
      console.error("🛑 HMAC error:", e);
    }
  }

  if (typeof req.body === 'object' && req.body.update_id) {
    console.log("📬 Telegram update received");
    await bot.processUpdate(req.body);
    return res.sendStatus(200);
  }

  if (typeof req.body === 'string') {
    console.log("--- 📡 Received XML Notification ---");
    console.log(req.body);
    await bot.sendMessage('7017491148', req.body.slice(0, 4000));
    handleYouTubeVideos();
    return res.sendStatus(200);
  }

  console.warn("🟠 Unknown payload format.");
  res.sendStatus(400);
});

bot.on('message', async(msg) => {
    const chatId = msg.chat.id;
    // console.log("chatId in bot.on message:", chatId)

    try {
      whiteList = await loadWhiteList();

        if (msg.text.toLowerCase() === 'teken') {
            await subscribeMessage(bot, chatId);
            return;
        } 

        if (msg.text.toLowerCase() === 'deel') {
          if (whiteList.includes(chatId)) { 
            await shareMessage(bot, chatId);return
          } else {await subscribeMessage(bot, chatId); return}
        } 

        if (whiteList.includes(chatId)) {
          await bot.sendMessage(chatId, `ℹ️ Jy is alreeds op die intekenlys.`);
          await videoMessage(bot, chatId)
          await bot.sendMessage(chatId, `
            PS: Stuur die woordjie, deel, om dit met ander te deel.
          `);
          return;

        } 

        await bot.sendMessage(chatId, 
          `Baie welkom by ons Onthou die Sabbatdag Kanaal! Teken in vir die link om na die nuuste boodskap te luister.

      1.  Stuur die woordjie, teken
      `)

    } catch (error) {console.error("bot.on error:", e);}

    

  // const postText = videoList
  //   .map(([title, url], i) => `${i + 1}. ${title} - ${url}`)
  //   .join('\n');

  // await bot.sendMessage(chatId, postText);

});

bot.on('callback_query', async (query) => {
  const cbChatId = query.message.chat.id;
  const action = query.data;

  whiteList = await loadWhiteList();
  console.log("whiteList in callback_query:", whiteList);


  const postText = videoList
    .map(([title, url], i) => `${i + 1}. ${title} - ${url}`)
    .join('\n');

  const postShortsText = shortsList
    .map(([title, url], i) => `${i + 1}. ${title} - ${url}`)
    .join('\n');

  
  if (action === 'shorts') {
    if (whiteList.includes(cbChatId)) {
      await bot.sendMessage(cbChatId, `Hier is n lys van ons shorts.

        ${postShortsText}
        `);
    } 
  }

  if (action === 'deelWhatsApp') {
    if (whiteList.includes(cbChatId)) {
      await bot.sendMessage(cbChatId, `Kliek op die link om te deel.

        https://wa.me/?text=Check%20out%20these%20videos%20on%20Sabbatdag%3A%0Ahttps%3A%2F%2Ft.me%2FSabbatdagBot

      `);
    } 
  }

  if (action === 'deelTelegram') {
    if (whiteList.includes(cbChatId)) {
      await bot.sendMessage(cbChatId, `Kliek op die link om te deel.

        https://t.me/SabbatdagBot

      `);
    } 
  }

  if (action === 'videos') {
    if (whiteList.includes(cbChatId)) {
      await bot.sendMessage(cbChatId, `Hier is n lys van ons videos.

        ${postText}
        `);
    } 
  }


  if (action === 'subscribe') {
    if (!whiteList.includes(cbChatId)) {
      whiteList.push(cbChatId);
      await saveWhiteList(whiteList);
      await bot.sendMessage(cbChatId, `✅ Jy is nou op die intekenlys.
        
        Hier is n lys van ons videos.

        ${postText}

        PS: Stuur die woordjie, deel, om dit met ander te deel.
        `);
    } else {
      await bot.sendMessage(cbChatId, `ℹ️ Jy is alreeds op die intekenlys.

      PS: Stuur die woordjie, deel, om dit met ander te deel.  
      `);
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

app.get('/webhook', (req, res) => {

  const hubMode = req.query['hub.mode'];
  const hubChallenge = req.query['hub.challenge'];
  const hubTopic = req.query['hub.topic'];

  if (hubMode === 'subscribe' && hubChallenge) {
      console.log(`WebSub Challenge Detected:`);
      console.log(`  Mode: ${hubMode}`);
      console.log(`  Topic: ${hubTopic}`);
      console.log(`  Challenge: ${hubChallenge}`);

      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(hubChallenge);
      console.log("Responded to challenge.");
  } else { res.sendStatus(200); }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

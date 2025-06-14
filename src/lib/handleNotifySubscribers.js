

import loadWhiteList from '../lib/handleWhiteList.js';

export async function notifySubscribers(bot, message) {
  try {
    let whiteList = await loadWhiteList();

    if (!Array.isArray(whiteList) || whiteList.length === 0) {
      console.warn("No subscribers in whiteList.");
      return;
    }

    for (const chatId of whiteList) {
      try {
        await bot.sendMessage(chatId, message);
        console.log(`✅ Sent message to ${chatId}`);
      } catch (err) {
        console.error(`❌ Failed to send to ${chatId}:`, err.message);
      }
    }
  } catch (err) {
    console.error("❌ Failed to load whiteList:", err.message);
  }
}

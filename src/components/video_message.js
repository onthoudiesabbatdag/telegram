

async function videoMessage(bot, chatId) {
    try {
        const response = await bot.sendMessage(chatId, "Kies n Opsie:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Shorts", callback_data: "shorts" }],
                    [{ text: "Videos", callback_data: "videos" }],
                ],
            },
        });
        return response;
    } catch (error) {
        console.error("Error sending Telegram message:", error);
        return null;
    }
}

export default videoMessage
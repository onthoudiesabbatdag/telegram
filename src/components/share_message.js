

async function shareMessage(bot, chatId) {
    try {
        const response = await bot.sendMessage(chatId, "Kies n Opsie:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Deel in WhatsApp", callback_data: "deelWhatsApp" }],
                    [{ text: "Deel in Telegram", callback_data: "deelTelegram" }],
                ],
            },
        });
        return response;
    } catch (error) {
        console.error("Error sending Telegram message:", error);
        return null;
    }
}


export default shareMessage
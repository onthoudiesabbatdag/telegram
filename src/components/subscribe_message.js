

async function subscribeMessage(bot, chatId) {
    try {
        const response = await bot.sendMessage(chatId, "Kies n Opsie:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Teken Op", callback_data: "subscribe" }],
                    [{ text: "Teken Uit", callback_data: "unsubscribe" }],
                ],
            },
        });
        return response;
    } catch (error) {
        console.error("Error sending Telegram message:", error);
        return null;
    }
}

export default subscribeMessage
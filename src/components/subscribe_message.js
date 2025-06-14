

async function subscribeMessage(bot, chatId) {
    try {
        const response = await bot.sendMessage(chatId, "Choose an option:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Subscribe", callback_data: "subscribe" }],
                    [{ text: "Unsubscribe", callback_data: "unsubscribe" }],
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
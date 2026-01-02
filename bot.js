import https from 'https';

const TOKEN = '8444144289:AAGOMyoyOUfdZUUa1wILY58D4AMiCTQmabE';
const BOT_USERNAME = 'MrAiChef_bot';
const MINI_APP_URL = `https://t.me/${BOT_USERNAME}/app`; // Стандартная ссылка на Mini App

console.log('--- Telegram Bot for ChefAI Started ---');
console.log(`Bot: @${BOT_USERNAME}`);

let lastUpdateId = 0;

function botLoop() {
    const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.ok && json.result.length > 0) {
                    json.result.forEach(update => {
                        lastUpdateId = update.update_id;
                        handleUpdate(update);
                    });
                }
            } catch (e) {
                console.error('Error parsing updates:', e);
            }
            botLoop();
        });
    }).on('error', (err) => {
        console.error('Network error:', err);
        setTimeout(botLoop, 5000);
    });
}

function handleUpdate(update) {
    if (!update.message || !update.message.text) return;

    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text === '/start') {
        const welcomeMessage = `👋 Привет! Я твой персональный ИИ Шеф-повар.\n\nНажми на кнопку ниже или используй ссылку, чтобы открыть приложение и начать готовить шедевры из того, что есть в холодильнике! 👨‍🍳🍳\n\n🔗 [Открыть ChefAI](${MINI_APP_URL})`;

        sendMessage(chatId, welcomeMessage);
    }
}

function sendMessage(chatId, text) {
    const data = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🚀 Запустить ChefAI', url: MINI_APP_URL }
                ]
            ]
        }
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        res.on('data', () => { });
    });

    req.on('error', (e) => {
        console.error('Send message error:', e);
    });

    req.write(data);
    req.end();
}

botLoop();

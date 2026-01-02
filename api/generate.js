export default async function handler(req, res) {
    // CORS handling
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { messages, model, temperature, max_tokens } = req.body;

    // Use environment variable to prevent key leakage and blocking
    // Also sanitize it in case user added quotes in Vercel UI
    const rawKey = process.env.OPENROUTER_API_KEY || '';
    const apiKey = rawKey.trim().replace(/['";]/g, '');

    if (!apiKey) {
        console.error('OPENROUTER_API_KEY is not set');
        // Return 503 so client knows it's a config issue, not a crash
        return res.status(503).json({ error: 'CONFIG ERROR: API Key missing. Check Vercel Settings -> Env Vars.' });
    }

    // Use dynamic referer to prevent blocking
    const referer = req.headers.origin || req.headers.referer || 'https://chef-ai-app.vercel.app';

    // List of reliable free models to try sequentially
    const backupModels = [
        'google/gemini-2.0-flash-exp:free',   // Primary - Top quality
        'deepseek/deepseek-r1:free',          // Great reasoning & logic
        'meta-llama/llama-3.3-70b-instruct:free', // Very stable and smart
        'google/gemini-pro-1.5-exp:free',     // Reliable fallback
        'xiaomi/mimo-v2-flash:free',          // Good speed and context
    ];

    // Vision model - Gemma only
    const visionModels = [
        'google/gemma-3-4b-it:free'
    ];

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    let availableModels = hasImages ? visionModels : backupModels;

    // Try models sequentially until one works
    let lastError = null;
    const startTime = Date.now();

    try {
        for (let i = 0; i < availableModels.length; i++) {
            const currentModel = availableModels[i];

            // Respect Vercel's 10s limit
            const elapsed = Date.now() - startTime;
            if (elapsed > 9000) break;

            const controller = new AbortController();
            // Give each model more time for image processing (7.5s first, 5s others)
            const waitTime = i === 0 ? 7500 : 5000;
            const timeoutId = setTimeout(() => controller.abort(), waitTime);

            try {
                process.stdout.write(`Vercel Proxy: Calling ${currentModel}\n`);
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': referer,
                        'X-Title': 'ChefAI',
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages,
                        temperature: 0.1,
                        max_tokens: max_tokens || (hasImages ? 1000 : 4000),
                        route: 'fallback',
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json().catch(() => null);

                if (response.ok && data?.choices?.[0]?.message?.content) {
                    return res.status(200).json(data);
                }

                // If specialized error, record and try backup
                const errorMsg = data?.error?.message || '';
                lastError = { status: response.status, message: errorMsg || `Ошибка API (${currentModel})` };

                if (errorMsg.toLowerCase().includes('image input') || errorMsg.toLowerCase().includes('multimodal')) {
                    continue;
                }

            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Vercel Proxy Error (${currentModel}):`, error);
                lastError = { status: 504, message: `Модель ${currentModel} не ответила вовремя.` };
            }
        }

        // Return error in structured format for client
        const finalStatus = lastError?.status && lastError.status !== 200 ? lastError.status : 503;
        return res.status(finalStatus).json({
            error: { message: lastError?.message || 'Не удалось связаться с Шефом. Попробуйте снова через минуту.' }
        });
    } catch (e) {
        res.status(500).json({ error: { message: 'Критическая ошибка сервера. Проверьте соединение.' } });
    }
}

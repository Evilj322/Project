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

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    // Use separate API key for vision to avoid rate limits
    const rawKey = hasImages
        ? (process.env.VISION_API_KEY || process.env.OPENROUTER_API_KEY || '')
        : (process.env.OPENROUTER_API_KEY || '');
    const apiKey = rawKey.trim().replace(/['";]/g, '');

    if (!apiKey) {
        console.error('API Key is not set');
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

    // Vision models with fallbacks for rate limits
    const visionModels = [
        'google/gemma-3-4b-it:free',
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen2.5-vl-72b-instruct:free'
    ];

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
            // Give vision models more time (15s first, 8s others)
            const waitTime = hasImages ? (i === 0 ? 15000 : 8000) : (i === 0 ? 7500 : 5000);
            const timeoutId = setTimeout(() => controller.abort(), waitTime);

            try {
                console.log(`Vercel Proxy: Calling ${currentModel} (hasImages: ${hasImages})`);
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
                    console.log(`Vercel Proxy: Success with ${currentModel}`);
                    return res.status(200).json(data);
                }

                // Record error and try backup
                const errorMsg = data?.error?.message || '';
                console.log(`Vercel Proxy: ${currentModel} failed - ${errorMsg || response.status}`);
                lastError = { status: response.status, message: errorMsg || `Ошибка API (${currentModel})` };

            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Vercel Proxy Timeout (${currentModel}):`, error.name);
                lastError = { status: 504, message: `Модель ${currentModel} не ответила вовремя.` };
            }
        }

        // Return error in structured format for client
        console.log(`Vercel Proxy: All models failed. Last error:`, lastError);
        const finalStatus = lastError?.status && lastError.status !== 200 ? lastError.status : 503;
        return res.status(finalStatus).json({
            error: { message: lastError?.message || 'Не удалось связаться с Шефом. Попробуйте снова через минуту.' }
        });
    } catch (e) {
        console.error('Vercel Proxy Critical Error:', e);
        res.status(500).json({ error: { message: `Критическая ошибка: ${e.message}` } });
    }
}

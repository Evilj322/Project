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

    // Vision-capable models
    const visionModels = [
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen-2-vl-72b-instruct:free',   // Excellent vision performance
        'google/gemini-pro-1.5-exp:free',
        'nvidia/nemotron-nano-12b-v2-vl:free',
    ];

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    let availableModels = hasImages ? visionModels : backupModels;

    // Try models sequentially until one works
    let lastError = null;

    try {
        for (const currentModel of availableModels) {
            const controller = new AbortController();
            // Increased timeout for vision tasks
            const timeoutId = setTimeout(() => controller.abort(), 40000);

            try {
                process.stdout.write(`Trying model: ${currentModel}\n`);
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
                        temperature,
                        max_tokens: max_tokens || (hasImages ? 1000 : 4000),
                        route: 'fallback',
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();

                    // CRITICAL: Check if we actually got a message back
                    // Some free providers on OpenRouter return 200 OK with empty choices if overloaded
                    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
                        return res.status(200).json(data);
                    } else {
                        console.warn(`Model ${currentModel} returned empty successful response, trying next...`);
                        lastError = { status: 200, message: `Model ${currentModel} returned empty message` };
                        continue; // Try next model
                    }
                }

                const errorText = await response.text();
                console.warn(`Model ${currentModel} failed: ${response.status}`, errorText);
                lastError = { status: response.status, message: `Error (${currentModel}): ${errorText.substring(0, 100)}` };

            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Error with ${currentModel}:`, error);
                lastError = { status: 500, message: error.message };
            }
        }

        // If all failed
        return res.status(lastError?.status || 500).json({ error: lastError?.message || 'All models busy. Try later.' });
    } catch (e) {
        // Global catch for any unexpected errors outside the model loop
        res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
}

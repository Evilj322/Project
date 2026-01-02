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

    // Primary model: Google Gemini 2.0 Flash Experimental (free)
    const backupModels = [
        'google/gemini-2.0-flash-exp:free',
    ];

    // Vision-capable models
    const visionModels = [
        'google/gemini-2.0-flash-exp:free', // Gemini 2.0 has excellent vision capabilities
        'nvidia/nemotron-nano-12b-v2-vl:free',
    ];

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    let availableModels = hasImages ? visionModels : backupModels;

    // Try models sequentially until one works
    let lastError = null;

    try { // Outer try block for general server errors
        for (const currentModel of availableModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s for vision

            try {
                console.log(`Trying model: ${currentModel}`);
                console.log(`API Key prefix: ${apiKey.substring(0, 8)}...`);
                console.log(`Referer: ${referer}`);
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
                        max_tokens,
                        route: 'fallback', // Allow OpenRouter to use alternative providers
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    return res.status(200).json(data);
                }

                // If not OK, save error and try next model
                const errorText = await response.text();
                console.warn(`Model ${currentModel} failed: ${response.status}`, errorText);

                // Save detailed error for the last fallback
                const safeMsg = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
                lastError = { status: response.status, message: `Provider Error (${currentModel}): ${safeMsg}` };

            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Error with ${currentModel}:`, error);

                if (error.name === 'AbortError') {
                    lastError = { status: 408, message: `Timeout (25s) waiting for ${currentModel}` };
                } else {
                    lastError = { status: 500, message: error.message };
                }
            }
        }

        // If all failed
        return res.status(lastError?.status || 500).json({ error: lastError?.message || 'All models busy. Try later.' });
    } catch (e) {
        // Global catch for any unexpected errors outside the model loop
        res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
}

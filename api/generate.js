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

    const backupModels = [
        'google/gemini-2.0-flash-exp:free', // Primary - best for vision
        'google/gemma-3-4b-it:free', // fast Google model
        'deepseek/deepseek-r1-0528:free', // DeepSeek reasoning model
        'meta-llama/llama-4-maverick:free', // Meta Llama 4
        'microsoft/phi-4-reasoning-plus:free', // Microsoft reasoning
        'mistralai/devstral-small:free', // Mistral code model
    ];

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    let availableModels = backupModels;
    if (hasImages) {
        // Filter only vision-capable models if images are present
        // Currently only Gemini supports vision in our list
        availableModels = backupModels.filter(m =>
            m.toLowerCase().includes('gemini')
        );
        if (availableModels.length === 0) availableModels = ['google/gemini-2.0-flash-exp:free'];
    }

    // Try models sequentially until one works
    let lastError = null;

    try { // Outer try block for general server errors
        for (const currentModel of availableModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s for vision

            try {
                console.log(`Trying model: ${currentModel}`);
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

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

    const backupModels = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'microsoft/phi-3-medium-128k-instruct:free'
    ];

    // Check if the request involves images
    const hasImages = Array.isArray(messages) && messages.some(m =>
        Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
    );

    let availableModels = backupModels;
    if (hasImages) {
        // Filter only vision-capable models if images are present
        availableModels = backupModels.filter(m =>
            m.toLowerCase().includes('gemini') || m.toLowerCase().includes('vision')
        );
        if (availableModels.length === 0) availableModels = [backupModels[0]]; // Fallback to Gemini if nothing matches
    }

    // Try models sequentially until one works
    let lastError = null;

    try { // Outer try block for general server errors
        for (const currentModel of availableModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s hard timeout per model

            try {
                console.log(`Trying model: ${currentModel}`);
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://chef-ai-app.vercel.app',
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
                lastError = { status: response.status, message: errorText };

                // Retry on ANY error (429, 503, 500, or even 400 if model compatibility issue)
                // We want to be aggressive with fallback to ensure user gets a result
            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Error with ${currentModel}:`, error);

                if (error.name === 'AbortError') {
                    lastError = { status: 408, message: `Timeout (15s) waiting for ${currentModel}` };
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

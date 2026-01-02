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
        console.error('OPENROUTER_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error: Key missing in Vercel Env Vars.' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://chef-ai-app.vercel.app',
                'X-Title': 'ChefAI',
            },
            body: JSON.stringify({
                model: model || 'google/gemini-2.0-flash-exp:free',
                messages,
                temperature,
                max_tokens,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API Error:', response.status, errorData);
            return res.status(response.status).json({ error: errorData });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Server Function Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

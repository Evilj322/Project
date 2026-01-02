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
    const apiKey = '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';

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
                model: model || 'meta-llama/llama-3.3-70b-instruct:free',
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

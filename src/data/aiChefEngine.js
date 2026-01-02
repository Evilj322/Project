import { recipes } from './recipeData.js';

// Default API key config (removed for security, uses proxy in prod, .env in local)
const DEFAULT_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- AI ENGINE ---

export const generateChefGPTSuggestions = async (inputString, apiKey) => {
    // Use provided key or fall back to default
    const activeKey = apiKey || DEFAULT_API_KEY;

    const systemPrompt = `Ты профессиональный шеф-повар. Твоя задача — придумай РОВНО 7 РАЗНЫХ и вкусных рецептов.
Игнорируй несъедобные сочетания. Если ингредиентов мало, добавь логичные (масло, специи, вода).

ВАЖНО: Верни массив с РОВНО 7 рецептами. Не меньше! Только валидный JSON массив (без markdown, без пояснений):
[
  {
    "id": "recipe_1",
    "title": "Название рецепта",
    "category": "dinner",
    "description": "Аппетитное описание (1-2 предложения)",
    "time": "30 мин",
    "difficulty": "Легко",
    "calories": 400,
    "macros": { "protein": 25, "fats": 15, "carbs": 40 },
    "ingredients": [
      { "name": "Продукт", "amount": "100г" }
    ],
    "instructions": [
      "Шаг 1",
      "Шаг 2"
    ],
    "image": null
  }
]`;

    // Determine endpoint: use Vercel proxy in production, direct in localhost
    const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // On localhost we need the key directly. In prod, the server has it.
    // If user provided a custom key, always use direct.
    const useProxy = !isLocal && !apiKey;

    const endpoint = useProxy ? '/api/generate' : OPENROUTER_API_URL;
    const headers = {
        'Content-Type': 'application/json',
    };

    // Pass key only if NOT using proxy or if using custom proxy logic that requires it (our proxy has it hardcoded)
    if (!useProxy) {
        if (!activeKey) {
            throw new Error("Для работы локально требуется API ключ (в настройках или .env)");
        }
        headers['Authorization'] = `Bearer ${activeKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'ChefAI';
    }

    // LIST OF MODELS TO TRY LOCALLY (Client-side fallback)
    const modelsToTry = [
        'google/gemini-flash-1.5:free', // Stable
        'google/gemini-2.0-flash-exp:free', // Fast
        'meta-llama/llama-3.2-11b-vision-instruct:free',
    ];

    try {
        let response;
        let lastError;

        // Simple fallback loop for client-side
        for (const model of modelsToTry) {
            try {
                console.log(`Local AI: Trying model ${model}...`);
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Придумай РОВНО 7 разных рецептов из этих ингредиентов: ${inputString}. Верни JSON массив с 7 рецептами.` }
                        ],
                        temperature: 0.7,
                        max_tokens: 5000
                    })
                });

                if (res.ok) {
                    response = res;
                    break; // Success
                }

                lastError = await res.text();
                // If using proxy (/api/generate), one failing request means the BACKEND loop failed, so no need to retry here.
                if (useProxy) break;

            } catch (e) {
                lastError = e.message;
                if (useProxy) break;
            }
        }

        if (!response || !response.ok) {
            throw new Error(lastError || `API Error: ${response?.status || 404}`);
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        let textResponse = data.choices?.[0]?.message?.content;

        if (!textResponse) throw new Error("Empty response from AI");

        console.log("🤖 Raw AI response:", textResponse.substring(0, 500)); // Debug log

        // Clean thinking blocks if present (R1 models use <think></think>)
        textResponse = textResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // Clean markdown code blocks
        textResponse = textResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        // Remove any leading/trailing explanatory text, extract only the JSON array
        // Look for the first [ and last ] to extract the JSON array
        const firstBracket = textResponse.indexOf('[');
        const lastBracket = textResponse.lastIndexOf(']');

        if (firstBracket === -1 || lastBracket === -1 || firstBracket >= lastBracket) {
            console.error("❌ Could not find valid JSON array in response:", textResponse);
            throw new Error("AI returned invalid format (no JSON array found)");
        }

        const finalJson = textResponse.substring(firstBracket, lastBracket + 1);
        console.log("📝 Extracted JSON:", finalJson.substring(0, 200)); // Debug log

        let recipes;
        try {
            recipes = JSON.parse(finalJson);
        } catch (parseError) {
            console.error("❌ JSON Parse Error:", parseError.message);
            console.error("📄 Failed JSON:", finalJson);

            // Try to fix truncated JSON by closing it
            try {
                console.log("🔧 Attempting to repair truncated JSON...");
                let repairedJson = finalJson.trim();
                // Close any unclosed strings, objects, and arrays
                const openBrackets = (repairedJson.match(/\[/g) || []).length;
                const closeBrackets = (repairedJson.match(/\]/g) || []).length;
                const openBraces = (repairedJson.match(/\{/g) || []).length;
                const closeBraces = (repairedJson.match(/\}/g) || []).length;

                // Add missing closing characters
                if (openBraces > closeBraces) {
                    repairedJson += '}'.repeat(openBraces - closeBraces);
                }
                if (openBrackets > closeBrackets) {
                    repairedJson += ']'.repeat(openBrackets - closeBrackets);
                }

                recipes = JSON.parse(repairedJson);
                console.log("✅ JSON repaired successfully!");
            } catch (repairError) {
                console.error("❌ Failed to repair JSON:", repairError.message);
                throw new Error(`Invalid JSON from AI: ${parseError.message}`);
            }
        }

        // Ensure IDs are unique and image is null
        return recipes.map((r, i) => ({
            ...r,
            id: `ai-openrouter-${Date.now()}-${i}`,
            image: null
        }));

    } catch (error) {
        console.error("AI Generation failed:", error);
        throw error;
    }
};

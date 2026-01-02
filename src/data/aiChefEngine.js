import { recipes } from './recipeData.js';

// Default API key for seamless experience (OpenRouter)
const DEFAULT_API_KEY = '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';

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

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${activeKey}`,
                // Removed Referer and X-Title to avoid 'User not found' issues in some environments like Telegram WebApp
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Придумай РОВНО 7 разных рецептов из этих ингредиентов: ${inputString}. Верни JSON массив с 7 рецептами.` }
                ],
                temperature: 0.7,
                max_tokens: 5000
            })
        });

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

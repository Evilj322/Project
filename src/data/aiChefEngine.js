import { recipes as staticRecipes } from './recipeData.js';

// Default API key config (removed for security, uses proxy in prod, .env in local)
const DEFAULT_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- AI ENGINE ---

/**
 * System prompt definition to ensure consistency
 */
const SYSTEM_PROMPT = `Ты ЭКСТРЕМАЛЬНО ПОДРОБНЫЙ шеф-повар-наставник для полных новичков. Твоя цель — провести пользователя за руку через каждый грамм и каждую минуту процесса.

ПРАВИЛА ДЛЯ РЕЦЕПТОВ:
1. ТОЛЬКО РЕАЛЬНЫЕ БЛЮДА: Никаких выдуманных сочетаний или "странных" экспериментов. Предлагай только то, что существует в реальной кулинарии (классика русской, итальянской, французской и других кухонь).
2. ЕСЛИ ИНГРЕДИЕНТОВ МАЛО: Не пытайся смешать всё в одну кучу. Лучше предложи простое, но реальное блюдо (например, "Яичница с помидорами" вместо "Куриный суп с макаронами и яблоками").
3. ТОЧНОСТЬ НАЗВАНИЙ: Названия должны быть узнаваемыми (например, "Бефстроганов", "Карбонара", "Винегрет").

ПРАВИЛА ДЛЯ ИНСТРУКЦИЙ (ОЧЕНЬ ВАЖНО):
1. НИКАКИХ КРАТКИХ ПРЕДЛОЖЕНИЙ. Вместо "Обжарьте курицу" пиши: "Возьмите 250г нарезанной курицы, разогрейте сковороду на СРЕДНЕМ огне (уровень 6 из 10) в течение 3 минут, добавьте 15мл масла и выкладывайте мясо..."
2. ВСЕГДА УКАЗЫВАЙ ЦИФРЫ: Сколько минут, какая температура, сколько миллилитров или граммов ингредиента именно в этом шаге.
3. ПРИЗНАКИ ГОТОВНОСТИ: Описывай запах, цвет, звук (например, "до появления характерного орехового аромата" или "пока лук не станет прозрачным и мягким").
4. ОБЪЯСНЯЙ "ПОЧЕМУ": "Не накрывайте крышкой на этом этапе, чтобы овощи остались хрустящими, а не превратились в кашу".
5. КОЛИЧЕСТВО ШАГОВ: Минимум 8-12 очень подробных шагов. Все цифры из раздела ингредиентов должны дублироваться в тексте шагов.

Верни ТОЛЬКО валидный JSON объект (для одной версии) или массив (для нескольких):
{
    "id": "recipe_unique",
    "title": "Название",
    "category": "dinner",
    "description": "Эмоциональное описание (3 предложения) о вкусе и пользе.",
    "time": "45 мин",
    "difficulty": "Для новичков",
    "calories": 450,
    "servings": 4,
    "macros": { "protein": 20, "fats": 15, "carbs": 30 },
    "ingredients": [
      { "name": "Ингредиент", "amount": "100 г", "calories": 50 }
    ],
    "instructions": [
      "Шаг 1: Подготовка. Возьмите ровно [количество] [ингредиент] и промойте их под холодной водой...",
      "...и так далее минимум 8-12 шагов"
    ],
    "image": null
}
`;

/**
 * Helper to call AI with fallback logic
 */
async function callOpenRouter(messages, apiKey) {
    const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const activeKey = apiKey || DEFAULT_API_KEY;
    const useProxy = !isLocal && !apiKey;

    const endpoint = useProxy ? '/api/generate' : OPENROUTER_API_URL;
    const headers = { 'Content-Type': 'application/json' };

    if (!useProxy) {
        if (!activeKey) throw new Error("API Key missing");
        headers['Authorization'] = `Bearer ${activeKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'ChefAI';
    }

    const modelsToTry = [
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-r1:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-pro-1.5-exp:free',
        'xiaomi/mimo-v2-flash:free'
    ];

    let lastError;
    for (const model of modelsToTry) {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 4000
                })
            });

            if (res.ok) {
                const data = await res.json();
                let text = data.choices?.[0]?.message?.content;
                if (!text) continue;

                // Clean and Extract JSON
                text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                const startArr = text.indexOf('[');
                const endArr = text.lastIndexOf(']');

                let jsonStr;
                if (startArr !== -1 && (start === -1 || startArr < start)) {
                    jsonStr = text.substring(startArr, endArr + 1);
                } else {
                    jsonStr = text.substring(start, end + 1);
                }

                return JSON.parse(jsonStr);
            }
            lastError = await res.text();
            if (useProxy) break;
        } catch (e) {
            lastError = e.message;
            if (useProxy) break;
        }
    }
    throw new Error(lastError || "AI failed after trying all models");
}

/**
 * Generate a single unique recipe
 */
export const generateSingleAIRecipe = async (ingredients, excludedTitles = [], apiKey = null, index = 0) => {
    const prompt = `Придумай ОДИН уникальный и РЕАЛЬНЫЙ рецепт (Вариант №${index + 1}) из этих ингредиентов: ${ingredients}. 
Блюдо должно быть классическим и НЕ должно повторять идеи из этого списка: ${excludedTitles.join(', ')}.
ТРЕБОВАНИЕ: Минимум 10 подробных шагов с цифрами. Верни ТОЛЬКО JSON объект {}`;

    const result = await callOpenRouter([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
    ], apiKey);

    const recipeId = `ai-single-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
        ...result,
        id: recipeId,
        image: `https://loremflickr.com/800/600/food,${encodeURIComponent(result.title)}?lock=${recipeId.slice(-3)}`
    };
};

/**
 * Main function (for backward compatibility, but can be used for batch)
 */
export const generateChefGPTSuggestions = async (inputString, apiKey) => {
    // Generate 12 in parallel for variety
    const count = 12;
    const promises = Array.from({ length: count }).map((_, i) =>
        generateSingleAIRecipe(inputString, [], apiKey)
    );
    return Promise.all(promises);
};

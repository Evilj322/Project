// Vision API Service using OpenRouter
// Handles image analysis for ingredient detection

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Convert File to resized and compressed base64 string
 * Prevents 503/413 errors by reducing payload size
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Analyze image with OpenRouter Vision to detect ingredients
 * @param {string} base64Image - Base64 encoded image (with data URL prefix)
 * @param {string} apiKey - OpenRouter API key (optional)
 * @returns {Promise<string[]>} - Array of detected ingredient names
 */
export const analyzeImageForIngredients = async (base64Image, apiKey) => {
  const prompt = `Ты эксперт по распознаванию продуктов питания на фотографиях.

ЗАДАЧА: Внимательно проанализируй изображение и определи ВСЕ съедобные продукты.

ИНСТРУКЦИИ:
- Ищи: мясо, птицу, рыбу, молочные продукты, овощи, фрукты, крупы, специи, соусы, напитки, хлеб, консервы
- Определяй конкретные названия (не "мясо", а "говядина" или "курица")
- Если видишь упаковку — читай что на ней написано
- Включай ВСЁ что видишь, даже частично видимые продукты

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО JSON массив строк на русском языке, без markdown и пояснений.
Пример: ["куриная грудка", "помидоры", "сыр", "молоко", "яйца"]

Если продуктов нет или не видно, верни: []`;

  // Vision model
  const model = 'google/gemma-3-4b-it:free';

  try {
    // Use server proxy to avoid exposing API key
    const endpoint = '/api/generate';
    const headers = { 'Content-Type': 'application/json' };

    console.log(`Trying vision model via proxy: ${model}`);

    // Add 20 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    let textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      throw new Error('Empty response from AI');
    }

    // Clean up response - handle thinking tags from some models
    textResponse = textResponse
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON array
    const startArr = textResponse.indexOf('[');
    const endArr = textResponse.lastIndexOf(']');
    if (startArr !== -1 && endArr !== -1) {
      textResponse = textResponse.substring(startArr, endArr + 1);
    }

    const ingredients = JSON.parse(textResponse);

    if (!Array.isArray(ingredients)) {
      throw new Error('Response is not an array');
    }

    const validIngredients = ingredients.filter(item => typeof item === 'string' && item.trim().length > 0);

    console.log(`Success: found ${validIngredients.length} ingredients`);
    return validIngredients;

  } catch (error) {
    console.error(`Vision analysis error:`, error);
    throw new Error(error.message || 'Не удалось проанализировать изображение. Попробуйте другое фото.');
  }
};

/**
 * Get mime type from file
 */
export const getMimeType = (file) => {
  const type = file.type;
  if (type.startsWith('image/')) {
    return type;
  }
  return 'image/jpeg';
};

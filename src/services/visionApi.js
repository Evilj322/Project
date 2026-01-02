// Vision API Service using OpenRouter
// Handles image analysis for ingredient detection

// Separate API key for vision (to avoid rate limits)
const VISION_API_KEY = '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';

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
 * @param {string} apiKey - OpenRouter API key (optional, uses default if not provided)
 * @returns {Promise<string[]>} - Array of detected ingredient names
 */
export const analyzeImageForIngredients = async (base64Image, apiKey) => {
  const prompt = `Проанализируй это изображение холодильника или продуктов.
Определи ВСЕ съедобные продукты, которые видишь.
Называй продукты на русском языке простыми названиями.
Верни ТОЛЬКО JSON массив строк без markdown: ["продукт1", "продукт2"]
Если продуктов нет, верни: []`;

  // Vision model - Gemma only
  const visionModels = [
    'google/gemma-3-4b-it:free'
  ];

  // Always use dedicated vision API key directly (bypasses server proxy to avoid rate limits)
  const activeKey = apiKey || VISION_API_KEY;

  let lastError;

  for (const model of visionModels) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Chef Recipe App'
      };

      console.log(`Trying vision model: ${model}`);

      // Add 15 second timeout to prevent endless loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Direct call to OpenRouter API with dedicated vision key
      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

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
        lastError = errData.error?.message || `API Error: ${response.status}`;
        console.warn(`Model ${model} failed: ${lastError}`);
        continue; // Try next model
      }

      const data = await response.json();
      let textResponse = data.choices?.[0]?.message?.content;

      if (!textResponse) {
        lastError = 'Empty response from AI';
        console.warn(`Model ${model}: ${lastError}`);
        continue;
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
        lastError = 'Response is not an array';
        console.warn(`Model ${model}: ${lastError}`);
        continue;
      }

      const validIngredients = ingredients.filter(item => typeof item === 'string' && item.trim().length > 0);

      if (validIngredients.length > 0) {
        console.log(`Success with model ${model}: found ${validIngredients.length} ingredients`);
        return validIngredients;
      } else {
        // Empty array is valid - means no products found
        return [];
      }

    } catch (error) {
      lastError = error.message;
      console.error(`Model ${model} error:`, error);
      continue;
    }
  }

  // All models failed
  throw new Error(lastError || 'Не удалось проанализировать изображение. Попробуйте другое фото.');
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

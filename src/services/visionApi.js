// Vision API Service using OpenRouter
// Handles image analysis for ingredient detection

// Default API key for seamless experience (OpenRouter)
const DEFAULT_API_KEY = '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';

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
  // Determine if we are in production
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // If provided apiKey is empty, try to use environment variable in local dev
  let activeKey = apiKey;
  if (!activeKey && !isProduction) {
    activeKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  }

  const prompt = `Проанализируй это изображение холодильника или продуктов.
Определи ВСЕ съедобные продукты, которые видишь.
Называй продукты на русском языке простыми названиями.
Верни ТОЛЬКО JSON массив строк без markdown: ["продукт1", "продукт2"]
Если продуктов нет, верни: []`;

  // Vision-capable models to try (free tier)
  const visionModels = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-pro-1.5-exp:free',
    'meta-llama/llama-4-maverick:free',
    'qwen/qwen2.5-vl-72b-instruct:free'
  ];

  let lastError;

  for (const model of visionModels) {
    try {
      let endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      let headers = {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Chef Recipe App'
      };

      if (isProduction) {
        endpoint = '/api/generate';
        headers = { 'Content-Type': 'application/json' };
      } else if (activeKey) {
        headers['Authorization'] = `Bearer ${activeKey}`;
      }

      console.log(`Trying vision model: ${model}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
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

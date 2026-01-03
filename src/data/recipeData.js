// Recipe data loaded from JSON
import recipesData from './recipes.json';

export const categories = [
  { id: 'all', name: 'Все', icon: '🍴' },
  { id: 'breakfast', name: 'Завтрак', icon: '🍳' },
  { id: 'lunch', name: 'Обед', icon: '🍲' },
  { id: 'dinner', name: 'Ужин', icon: '🍽️' },
  { id: 'snacks', name: 'Закуски', icon: '🥪' },
  { id: 'desserts', name: 'Десерты', icon: '🍰' },
  { id: 'salads', name: 'Салаты', icon: '🥗' },
  { id: 'soups', name: 'Супы', icon: '🍜' },
  { id: 'main', name: 'Вторые блюда', icon: '🍖' },
  { id: 'baking', name: 'Выпечка', icon: '🥐' },
  { id: 'drinks', name: 'Напитки', icon: '🍹' }
];

// 30 authentic Russian recipes from JSON - auto-generate ID and macros if missing
export const recipes = recipesData.map((recipe, index) => {
  // Generate macros based on calories if missing
  let macros = recipe.macros;
  if (!macros || !macros.protein) {
    // Estimate macros from calories using typical distribution
    // Protein: ~25%, Fats: ~30%, Carbs: ~45%
    const totalCals = recipe.calories || 300;
    const proteinCals = totalCals * 0.25;
    const fatsCals = totalCals * 0.30;
    const carbsCals = totalCals * 0.45;

    macros = {
      protein: Math.round(proteinCals / 4), // 4 cal per gram of protein
      fats: Math.round(fatsCals / 9),        // 9 cal per gram of fat
      carbs: Math.round(carbsCals / 4)       // 4 cal per gram of carbs
    };
  }

  return {
    ...recipe,
    id: recipe.id || `recipe-${index + 1}`,
    image: `https://loremflickr.com/800/600/food,${encodeURIComponent(recipe.title)}?lock=${index + 1}`,
    macros
  };
});

// Helper function to adjust ingredients for serving count
export const adjustServings = (recipe, targetServings) => {
  const ratio = targetServings / recipe.servings;

  return {
    ...recipe,
    servings: targetServings,
    calories: Math.round(recipe.calories * ratio),
    macros: {
      protein: Math.round(recipe.macros.protein * ratio),
      fats: Math.round(recipe.macros.fats * ratio),
      carbs: Math.round(recipe.macros.carbs * ratio)
    },
    ingredients: recipe.ingredients.map(ing => {
      // Parse amount and multiply
      const match = ing.amount.match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        const newAmount = Math.round(parseFloat(match[1]) * ratio * 10) / 10;
        return {
          ...ing,
          amount: `${newAmount}${match[2]}`,
          calories: Math.round(ing.calories * ratio)
        };
      }
      return ing;
    })
  };
};

// Search recipes by title or ingredients
export const searchRecipes = (query, categoryFilter = 'all') => {
  const lowerQuery = query.toLowerCase().trim();

  return recipes.filter(recipe => {
    // Category filter
    if (categoryFilter !== 'all' && recipe.category !== categoryFilter) {
      return false;
    }

    // If no query, return all in category
    if (!lowerQuery) return true;

    // Search in title
    if (recipe.title.toLowerCase().includes(lowerQuery)) return true;

    // Search in ingredients
    if (recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });
};

// Get recipes by category
export const getRecipesByCategory = (categoryId) => {
  if (categoryId === 'all') return recipes;
  return recipes.filter(r => r.category === categoryId);
};

// Get related recipes
export const getRelatedRecipes = (recipe, count = 4) => {
  return recipes
    .filter(r => r.id !== recipe.id && r.category === recipe.category)
    .slice(0, count);
};

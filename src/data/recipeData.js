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

// 1000 recipes from JSON
export const recipes = recipesData;

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

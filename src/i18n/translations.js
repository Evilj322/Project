// Translations for ChefAI app
export const translations = {
    ru: {
          aiChef: '// Translations for ChefAI app
export const translations = {
  ru: {
    aiChef: 'ИИ Повар',
    catalog: 'Каталог',
    aiChefTab: 'ИИ Шеф',
    favorites: 'Избранное',
    all: 'Все',
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snacks: 'Закуски',
    desserts: 'Десерты',
    salads: 'Салаты',
    soups: 'Супы',
    main: 'Вторые блюда',
    baking: 'Выпечка',
    drinks: 'Напитки',
    dish: 'Блюдо',
    writeMode: 'Написать',
    uploadPhoto: 'Загрузить фото',
    enterIngredientsHint: 'Введите название блюда и/или ингредиенты — ИИ подберёт рецепты!',
    inputPlaceholder: 'Например: Плов из курицы или курица, рис, морковь...',
    createRecipes: 'Создать рецепты',
    magicInProgress: 'Магия в процессе...',
    photoHint: 'Сфотографируйте продукты или холодильник — ИИ определит ингредиенты.',
    chefSuggestions: 'Предложения от Шефа:',
    ingredients: 'Ингредиенты',
    instructions: 'Инструкция',
    startCooking: 'Начать готовить',
    step: 'Шаг',
    finish: 'Завершить',
    done: 'Готово!',
    protein: 'Белки',
    fats: 'Жиры',
    carbs: 'Углев.',
    kcal: 'ккал',
    favoritesTitle: 'Избранное',
    noFavorites: 'Вы еще не добавили ни одного рецепта в избранное.',
    searchPlaceholder: 'Что приготовим сегодня?',
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
    thinkingSteps: ["Шеф достает книгу...","Изучает ваши продукты...","Записывает идеи...","Нарезает продукты...","Разогревает соус...","Смешивает ингредиенты...","Проверяет вкус...","Добавляет специи...","Почти готово!"],
    noRecipesError: 'Не удалось получить рецепты. Попробуйте уточнить продукты.',
    connectionError: 'Ошибка связи с Шефом. Попробуйте позже.',
    min: 'мин',
    hour: 'ч'
  },
  en: {
    aiChef: 'AI Chef',
    catalog: 'Catalog',
    aiChefTab: 'AI Chef',
    favorites: 'Favorites',
    all: 'All',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    desserts: 'Desserts',
    salads: 'Salads',
    soups: 'Soups',
    main: 'Main Dishes',
    baking: 'Baking',
    drinks: 'Drinks',
    dish: 'Dish',
    writeMode: 'Write',
    uploadPhoto: 'Upload Photo',
    enterIngredientsHint: 'Enter dish name and/or ingredients — AI will find recipes!',
    inputPlaceholder: 'Example: Chicken pilaf or chicken, rice, carrots...',
    createRecipes: 'Create Recipes',
    magicInProgress: 'Magic in progress...',
    photoHint: 'Take a photo of your ingredients or fridge — AI will detect them.',
    chefSuggestions: "Chef's Suggestions:",
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    startCooking: 'Start Cooking',
    step: 'Step',
    finish: 'Finish',
    done: 'Done!',
    protein: 'Protein',
    fats: 'Fats',
    carbs: 'Carbs',
    kcal: 'kcal',
    favoritesTitle: 'Favorites',
    noFavorites: "You haven't added any recipes to favorites yet.",
    searchPlaceholder: 'What shall we cook today?',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    thinkingSteps: ["Chef is getting the cookbook...","Studying your ingredients...","Writing down ideas...","Chopping ingredients...","Heating the sauce...","Mixing ingredients...","Checking the taste...","Adding spices...","Almost ready!"],
    noRecipesError: 'Could not get recipes. Try specifying your ingredients.',
    connectionError: 'Connection error with Chef. Please try later.',
    min: 'min',
    hour: 'h'
  }
};

export const getSystemLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();
  if (langCode === 'ru') return 'ru';
  return 'en';
};

export const translateCategory = (categoryId, lang) => {
  const t = translations[lang] || translations.en;
  return t[categoryId] || categoryId;
};

export const translateDifficulty = (difficulty, lang) => {
  const t = translations[lang] || translations.en;
  const difficultyMap = { 'Легко': t.easy, 'Средне': t.medium, 'Сложно': t.hard };
  return difficultyMap[difficulty] || difficulty;
};

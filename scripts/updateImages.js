/**
 * Update recipe images with unique photos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Unique images for each recipe (30 completely different images)
const uniqueImages = [
    // Breakfast (1-5)
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800', // Сырники - cottage cheese pancakes
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', // Блины - pancakes
    'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=800', // Овсянка - oatmeal
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800', // Запеканка - casserole
    'https://images.unsplash.com/photo-1482049016gy1-48920e?w=800', // Омлет - omelet

    // Soups (6-10)
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', // Борщ - borscht
    'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=800', // Щи - shchi
    'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800', // Солянка - solyanka
    'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800', // Куриный суп - chicken soup
    'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800', // Грибной суп - mushroom soup

    // Main/Dinner (11-15)
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800', // Котлеты - cutlets
    'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800', // Пельмени - dumplings
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800', // Голубцы - cabbage rolls
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', // Плов - pilaf
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', // Бефстроганов - beef stroganoff

    // Salads (16-19)
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', // Оливье - olivier
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', // Шуба - herring salad
    'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=800', // Цезарь - caesar
    'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800', // Винегрет - vinaigrette

    // Desserts (20-23)
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', // Медовик - honey cake
    'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800', // Шарлотка - charlotte
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800', // Тирамису
    'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800', // Блины с творогом

    // Snacks (24-26)
    'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800', // Бутерброды с икрой
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800', // Тарталетки
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800', // Канапе

    // Baking (27-28)
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', // Пирожки
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', // Хачапури

    // Drinks (29-30)
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800', // Морс
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800'  // Компот
];

// Read recipes
const recipesPath = path.join(__dirname, '..', 'src', 'data', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

// Update each recipe with unique image
recipes.forEach((recipe, index) => {
    recipe.image = uniqueImages[index] || uniqueImages[0];
});

// Save updated recipes
fs.writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');
console.log(`Updated ${recipes.length} recipes with unique images`);

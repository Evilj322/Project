import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, ChefHat, Sparkles, Utensils,
  Clock, Flame, Heart, X,
  ArrowLeft, ArrowRight, CheckCircle2,
  Zap, BrainCircuit, Salad, Coffee,
  Settings, Brain, Camera, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, recipes } from './data/recipeData';
import { generateChefGPTSuggestions, generateSingleAIRecipe } from './data/aiChefEngine';
import ImageUploader from './components/ImageUploader';
import DetectedIngredients from './components/DetectedIngredients';

const RecipeCard = ({ recipe, onClick, isFavorite, onToggleFavorite, index }) => (
  <div
    className="recipe-card"
    // Valid HTML div doesn't support initial/animate/transition props from Framer Motion
    // Using CSS class for animation instead if needed, but for now focusing on click reliability
    onClick={() => onClick(recipe)}
  >
    <button
      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(recipe.id);
      }}
    >
      <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
    </button>
    {recipe.image && (
      <div className="recipe-image-container">
        <img src={recipe.image} alt={recipe.title} className="recipe-image" />
        <div className="recipe-image-overlay" />
      </div>
    )}
    <div className="recipe-content">
      <span className="recipe-tag">{categories.find(c => c.id === recipe.category)?.name || 'Блюдо'}</span>
      <h3 className="recipe-title">{recipe.title}</h3>
      <div className="recipe-info">
        <span><Clock size={14} /> {recipe.time}</span>
        <span><Zap size={14} /> {recipe.difficulty}</span>
        <span><Flame size={14} /> {recipe.calories} ккал</span>
      </div>
    </div>
  </div>
);

const RecipeDetail = ({ recipe, onClose, onStartCooking, isFavorite, onToggleFavorite }) => {
  const [servings, setServings] = useState(recipe.servings || 4);

  // Calculate ratio for adjusting ingredients
  const ratio = servings / (recipe.servings || 4);

  const adjustAmount = (amount) => {
    const match = amount.match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      const adjusted = Math.round(num * ratio * 10) / 10;
      return `${adjusted}${match[2]}`;
    }
    return amount;
  };

  const adjustedCalories = Math.round((recipe.calories || 0) * ratio);
  const adjustedMacros = {
    protein: Math.round((recipe.macros?.protein || 0) * ratio),
    fats: Math.round((recipe.macros?.fats || 0) * ratio),
    carbs: Math.round((recipe.macros?.carbs || 0) * ratio)
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <div className="modal-handle" />
        {recipe.image && (
          <img src={recipe.image} alt={recipe.title} className="modal-image" />
        )}
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="recipe-tag">{categories.find(c => c.id === recipe.category)?.name}</span>
              <h2 style={{ fontSize: 28, margin: '8px 0 0 0', fontWeight: 800 }}>{recipe.title}</h2>
            </div>
            <button className="close-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={24} />
            </button>
          </div>

          {/* Portion Counter */}
          <div className="portion-counter" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            margin: '20px 0',
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Порций:</span>
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary)', border: 'none',
                color: 'white', fontSize: 20, fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >−</button>
            <span style={{
              fontSize: 24, fontWeight: 700, minWidth: 40, textAlign: 'center',
              color: 'var(--primary)'
            }}>{servings}</span>
            <button
              onClick={() => setServings(servings + 1)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary)', border: 'none',
                color: 'white', fontSize: 20, fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >+</button>
          </div>

          <div className="macros-container">
            <div className="macro-item">
              <span className="macro-value">{adjustedMacros.protein}г</span>
              <span className="macro-label">Белки</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{adjustedMacros.fats}г</span>
              <span className="macro-label">Жиры</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{adjustedMacros.carbs}г</span>
              <span className="macro-label">Углев.</span>
            </div>
            <div className="macro-item">
              <span className="macro-value">{adjustedCalories}</span>
              <span className="macro-label">ккал</span>
            </div>
          </div>

          {recipe.description && (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 24, padding: '0 4px' }}>
              "{recipe.description}"
            </p>
          )}

          <div style={{ marginBottom: 32 }}>
            <h4 style={{ fontSize: 18, color: 'var(--primary)', marginBottom: 16 }}>Ингредиенты</h4>
            <div className="ingredients-detailed">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="ingredient-row">
                  <span style={{ fontWeight: 500 }}>{ing.name}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{adjustAmount(ing.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h4 style={{ fontSize: 18, color: 'var(--primary)', marginBottom: 16 }}>Инструкция</h4>
            <div className="instructions-stepper">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="step-row">
                  <div className="step-number">{i + 1}</div>
                  <div className="step-text">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="generate-btn" onClick={() => onStartCooking(recipe)}>
            Начать готовить
          </button>
        </div>
      </div>
    </div>
  );
};

const CookingMode = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100;

  return (
    <div className="cooking-mode-overlay">
      <div className="cooking-header">
        <button onClick={onClose} className="close-cooking-btn"><X size={24} /></button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="step-counter">{currentStep + 1} / {recipe.instructions.length}</span>
      </div>

      <div className="cooking-body">
        <h2 className="step-title">Шаг {currentStep + 1}</h2>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="step-instruction"
        >
          {recipe.instructions[currentStep]}
        </motion.div>
      </div>

      <div className="cooking-footer">
        <button
          className="nav-step-btn prev"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          <ArrowLeft size={24} />
        </button>

        <button className="nav-step-btn next" onClick={handleNext}>
          {currentStep === recipe.instructions.length - 1 ? (
            <>Завершить <CheckCircle2 size={24} /></>
          ) : (
            <>Готово! <ArrowRight size={24} /></>
          )}
        </button>
      </div>
    </div>
  );
};

const ThinkingProcess = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Изучаю ваши ингредиенты...",
    "Подбираю лучшие сочетания...",
    "Добавляю щепотку магии...",
    "Шеф готов представить меню!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="thinking-container">
      <div className="thinking-pulse" />
      <motion.p
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}
      >
        {steps[step]}
      </motion.p>
    </div>
  );
};

const App = () => {
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState(null);

  // Image recognition states
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'photo'
  const [detectedIngredients, setDetectedIngredients] = useState([]);

  // Persistence for favorites IDs
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('chef-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence for AI generated recipes content
  const [savedAiRecipes, setSavedAiRecipes] = useState(() => {
    const saved = localStorage.getItem('chef-saved-ai-recipes');
    return saved ? JSON.parse(saved) : [];
  });

  // New states for API key and settings visibility
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  // Keyboard detection for mobile to hide bottom nav
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // If height decreases significantly, keyboard is likely open
      if (window.innerHeight < 600) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('chef-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('chef-saved-ai-recipes', JSON.stringify(savedAiRecipes));
  }, [savedAiRecipes]);

  const toggleFavorite = (recipe) => {
    const id = recipe.id;
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(f => f !== id));
      // If it's an AI recipe, remove it from saved storage to keep it clean
      if (id.startsWith('ai-')) {
        setSavedAiRecipes(prev => prev.filter(r => r.id !== id));
      }
    } else {
      setFavorites(prev => [...prev, id]);
      // If it's an AI recipe, save the full content so we can restore it later
      if (id.startsWith('ai-')) {
        setSavedAiRecipes(prev => {
          if (!prev.find(r => r.id === id)) {
            return [...prev, recipe];
          }
          return prev;
        });
      }
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleGenerateRecipes = async (ingredientsOverride = null) => {
    const ingredients = ingredientsOverride || ingredientsInput;
    if (!ingredients.trim()) return;
    setIsGenerating(true);
    setAiRecipes([]);
    setError(null);

    const recipeCount = 5; // Предлагаем 5 вариантов для баланса скорости и выбора
    let foundAny = false;

    try {
      // Запускаем 5 запросов параллельно с небольшой задержкой, чтобы не перегружать API
      const promises = Array.from({ length: recipeCount }).map(async (_, i) => {
        try {
          // Выдерживаем паузу между запросами в 1 секунду
          if (i > 0) await new Promise(r => setTimeout(r, i * 1000));

          const recipe = await generateSingleAIRecipe(ingredients, [], apiKey || null);

          setAiRecipes(prev => {
            // Проверка на дубликаты (иногда ИИ выдает одно и то же)
            if (prev.some(r => r.title.toLowerCase() === recipe.title.toLowerCase())) return prev;
            return [...prev, recipe];
          });
          foundAny = true;
        } catch (err) {
          console.warn(`Ошибка генерации одного из рецептов:`, err);
        }
      });

      // Ждем завершения всех запросов
      await Promise.all(promises);

      if (!foundAny) {
        throw new Error("Не удалось сгенерировать ни одного рецепта. Попробуйте изменить список ингредиентов.");
      }
    } catch (e) {
      console.error("AI Generation failed", e);
      setError(`Ошибка нейросети: ${e.message}. Попробуйте позже.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle detected ingredients from image
  const handleIngredientsDetected = (ingredients) => {
    setDetectedIngredients(ingredients);
  };

  // Confirm detected ingredients and generate recipes
  const handleConfirmDetectedIngredients = () => {
    const ingredientsList = detectedIngredients.join(', ');
    setIngredientsInput(ingredientsList);
    handleGenerateRecipes(ingredientsList);
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Automatically clear error if key is entered
    if (key && error === "Для работы нейросети требуется API ключ. Пожалуйста, введите его в настройках.") {
      setError(null);
    }
  };

  // Combine static recipes and saved AI recipes for the Favorites tab
  const allKnownRecipes = useMemo(() => {
    // Current AI recipes + Saved AI recipes + Static recipes
    // Use Map to deduplicate by ID just in case
    const map = new Map();
    recipes.forEach(r => map.set(r.id, r));
    savedAiRecipes.forEach(r => map.set(r.id, r));
    aiRecipes.forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [savedAiRecipes, aiRecipes]);

  return (
    <div className="app-container" style={{ paddingTop: 120 }}>

      {activeTab === 'explore' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Что приготовим сегодня?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-scroll">
            <div
              className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Все
            </div>
            {categories.filter(cat => cat.id !== 'all').map(cat => (
              <div
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </div>
            ))}
          </div>

          <div className="recipe-grid">
            {filteredRecipes.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={i}
                onClick={setSelectedRecipe}
                isFavorite={favorites.includes(recipe.id)}
                onToggleFavorite={() => toggleFavorite(recipe)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card">
            <div className="ai-header-title">
              <h2 style={{ fontSize: 24, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Brain color="var(--primary)" size={32} /> ИИ Повар
              </h2>
            </div>

            {/* Input Mode Switcher */}
            <div className="input-mode-switcher">
              <button
                className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                <Type size={18} />
                Написать
              </button>
              <button
                className={`mode-btn ${inputMode === 'photo' ? 'active' : ''}`}
                onClick={() => setInputMode('photo')}
              >
                <Camera size={18} />
                Загрузить фото
              </button>
            </div>

            <AnimatePresence mode="wait">
              {inputMode === 'text' ? (
                <motion.div
                  key="text-mode"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 16 }}>
                    Перечислите продукты, которые у вас есть, и я предложу идеальные блюда.
                  </p>

                  <textarea
                    className="ingredients-input"
                    placeholder="Пример: курица, макароны, сливки, чеснок..."
                    value={ingredientsInput}
                    onChange={(e) => setIngredientsInput(e.target.value)}
                  />

                  <button
                    className="generate-btn"
                    onClick={() => handleGenerateRecipes()}
                    disabled={isGenerating || !ingredientsInput.trim()}
                  >
                    {isGenerating ? 'Магия в процессе...' : <><Sparkles size={20} /> Создать рецепты</>}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="photo-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 16 }}>
                    Сфотографируйте продукты или холодильник — ИИ определит ингредиенты.
                  </p>

                  <ImageUploader
                    apiKey={apiKey}
                    onIngredientsDetected={handleIngredientsDetected}
                    disabled={isGenerating}
                  />

                  {detectedIngredients.length > 0 && (
                    <DetectedIngredients
                      ingredients={detectedIngredients}
                      onUpdate={setDetectedIngredients}
                      onConfirm={handleConfirmDetectedIngredients}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 15, padding: 12, background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 14 }}
              >
                {error}
              </motion.div>
            )}
          </div>

          <div style={{ marginTop: 40 }}>
            {aiRecipes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 style={{ marginBottom: 20, fontSize: 20 }}>Предложения от Шефа:</h3>
                <div className="recipe-grid">
                  {aiRecipes.map((recipe, i) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      index={i}
                      onClick={setSelectedRecipe}
                      isFavorite={favorites.includes(recipe.id)}
                      onToggleFavorite={() => toggleFavorite(recipe)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <div style={{ marginTop: aiRecipes.length > 0 ? 40 : 0 }}>
                <ThinkingProcess />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'favorites' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>Избранное</h2>
          {favorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Heart size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p>Вы еще не добавили ни одного рецепта в избранное.</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {allKnownRecipes.filter(r => favorites.includes(r.id)).map((recipe, i) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={i}
                  onClick={setSelectedRecipe}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(recipe)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      <nav className={`bottom-nav ${isKeyboardVisible ? 'keyboard-hide' : ''}`}>
        <div
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          <Utensils size={24} />
          <span>Каталог</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles size={24} />
          <span>ИИ Шеф</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <ChefHat size={24} />
          <span>Избранное</span>
        </div>
      </nav>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onStartCooking={() => {
              setActiveCookingRecipe(selectedRecipe);
              setSelectedRecipe(null);
            }}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onToggleFavorite={() => toggleFavorite(selectedRecipe)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCookingRecipe && (
          <CookingMode
            recipe={activeCookingRecipe}
            onClose={() => setActiveCookingRecipe(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

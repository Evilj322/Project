import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat, Sparkles, Utensils,
  Clock, Flame, Heart, X,
  ArrowLeft, ArrowRight, CheckCircle2,
  Zap, BrainCircuit, Salad, Coffee,
  Brain, Camera, Type, UtensilsCrossed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, recipes } from './data/recipeData';
import { generateSingleAIRecipe } from './data/aiChefEngine';
import ImageUploader from './components/ImageUploader';
import DetectedIngredients from './components/DetectedIngredients';
import { getSystemLanguage, translations, translateCategory, translateDifficulty } from './i18n/translations';

const RecipeCard = ({ recipe, onClick, isFavorite, onToggleFavorite, lang }) => {
  const t = translations[lang] || translations.en;
  return (
    <div className="recipe-card" onClick={() => onClick(recipe)}>
      <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}>
        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <div className="recipe-content">
        <span className="recipe-tag">{translateCategory(recipe.category, lang) || t.dish}</span>
        <h3 className="recipe-title">{recipe.title}</h3>
        <div className="recipe-info">
          <span><Clock size={14} /> {recipe.time}</span>
          <span><Zap size={14} /> {translateDifficulty(recipe.difficulty, lang)}</span>
          <span><Flame size={14} /> {recipe.calories} {t.kcal}</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const lang = getSystemLanguage();
  const t = translations[lang] || translations.en;
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [favorites, setFavorites] = useState(() => { const saved = localStorage.getItem('chef-favorites'); return saved ? JSON.parse(saved) : []; });
  const [savedAiRecipes, setSavedAiRecipes] = useState(() => { const saved = localStorage.getItem('chef-saved-ai-recipes'); return saved ? JSON.parse(saved) : []; });
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => { localStorage.setItem('chef-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('chef-saved-ai-recipes', JSON.stringify(savedAiRecipes)); }, [savedAiRecipes]);

  const toggleFavorite = (recipe) => {
    const id = recipe.id;
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(f => f !== id));
      if (id.startsWith('ai-')) { setSavedAiRecipes(prev => prev.filter(r => r.id !== id)); }
    } else {
      setFavorites(prev => [...prev, id]);
      if (id.startsWith('ai-')) { setSavedAiRecipes(prev => { if (!prev.find(r => r.id === id)) { return [...prev, recipe]; } return prev; }); }
    }
  };

  const filteredRecipes = useMemo(() => recipes.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }), [selectedCategory, searchQuery]);

  const handleGenerateRecipes = async (inputOverride = null) => {
    const query = inputOverride || userInput;
    if (!query.trim()) return;
    setIsGenerating(true); setAiRecipes([]); setError(null);
    const targetCount = 12; const currentTitles = [];
    try {
      const indexes = Array.from({ length: targetCount }, (_, i) => i);
      const results = await Promise.all(indexes.map(async (i) => {
        try {
          await new Promise(r => setTimeout(r, i * 1200));
          const recipe = await generateSingleAIRecipe(query, currentTitles, apiKey || null, i);
          if (recipe && recipe.title) { setAiRecipes(prev => { if (prev.some(r => r.title.toLowerCase() === recipe.title.toLowerCase())) return prev; currentTitles.push(recipe.title); return [...prev, recipe]; }); return true; }
          return false;
        } catch (err) { console.error(`Request ${i} failed:`, err); return false; }
      }));
      if (results.filter(r => r === true).length === 0) { throw new Error(t.noRecipesError); }
    } catch (e) { console.error("Critical AI Error:", e); setError(e.message || t.connectionError); }
    finally { setIsGenerating(false); }
  };

  const handleIngredientsDetected = (ingredients) => { if (ingredients && Array.isArray(ingredients)) { setDetectedIngredients(ingredients); } else { setDetectedIngredients([]); } };
  const handleConfirmDetectedIngredients = () => { const ingredientsList = detectedIngredients.join(', '); setUserInput(ingredientsList); handleGenerateRecipes(ingredientsList); };

  const allKnownRecipes = useMemo(() => {
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
          <div className="search-container"><input type="text" className="search-input" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="category-scroll">
            <div className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>{t.all}</div>
            {categories.filter(cat => cat.id !== 'all').map(cat => (<div key={cat.id} className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.id)}>{cat.icon} {translateCategory(cat.id, lang)}</div>))}
          </div>
          <div className="recipe-grid">{filteredRecipes.map((recipe, i) => (<RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={setSelectedRecipe} isFavorite={favorites.includes(recipe.id)} onToggleFavorite={() => toggleFavorite(recipe)} lang={lang} />))}</div>
        </motion.div>
      )}
      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card">
            <div className="ai-header-title"><h2 style={{ fontSize: 24, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 12 }}><Brain color="var(--primary)" size={32} /> {t.aiChef}</h2></div>
            <div className="input-mode-switcher">
              <button className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}><Type size={18} />{t.writeMode}</button>
              <button className={`mode-btn ${inputMode === 'photo' ? 'active' : ''}`} onClick={() => setInputMode('photo')}><Camera size={18} />{t.uploadPhoto}</button>
            </div>
            <AnimatePresence mode="wait">
              {inputMode === 'text' ? (
                <motion.div key="text-mode" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 16 }}>{t.enterIngredientsHint}</p>
                  <textarea className="ingredients-input" placeholder={t.inputPlaceholder} value={userInput} onChange={(e) => setUserInput(e.target.value)} style={{ minHeight: '120px' }} />
                  <button className="generate-btn" onClick={() => handleGenerateRecipes()} disabled={isGenerating || !userInput.trim()}>{isGenerating ? t.magicInProgress : <><Sparkles size={20} /> {t.createRecipes}</>}</button>
                </motion.div>
              ) : (
                <motion.div key="photo-mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 16 }}>{t.photoHint}</p>
                  <ImageUploader apiKey={apiKey} onIngredientsDetected={handleIngredientsDetected} disabled={isGenerating} />
                  {detectedIngredients.length > 0 && (<DetectedIngredients ingredients={detectedIngredients} onUpdate={setDetectedIngredients} onConfirm={handleConfirmDetectedIngredients} disabled={isGenerating} />)}
                </motion.div>
              )}
            </AnimatePresence>
            {error && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 15, padding: 12, background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 14 }}>{error}</motion.div>)}
          </div>
          <div style={{ marginTop: 40 }}>
            {aiRecipes.length > 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><h3 style={{ marginBottom: 20, fontSize: 20 }}>{t.chefSuggestions}</h3><div className="recipe-grid">{aiRecipes.map((recipe, i) => (<RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={setSelectedRecipe} isFavorite={favorites.includes(recipe.id)} onToggleFavorite={() => toggleFavorite(recipe)} lang={lang} />))}</div></motion.div>)}
          </div>
        </motion.div>
      )}
      {activeTab === 'favorites' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>{t.favoritesTitle}</h2>
          {favorites.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}><Heart size={48} style={{ marginBottom: 16, opacity: 0.3 }} /><p>{t.noFavorites}</p></div>) : (<div className="recipe-grid">{allKnownRecipes.filter(r => favorites.includes(r.id)).map((recipe, i) => (<RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={setSelectedRecipe} isFavorite={true} onToggleFavorite={() => toggleFavorite(recipe)} lang={lang} />))}</div>)}
        </motion.div>
      )}
      <nav className={`bottom-nav ${isKeyboardVisible ? 'keyboard-hide' : ''}`}>
        <div className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}><Utensils size={24} /><span>{t.catalog}</span></div>
        <div className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}><Sparkles size={24} /><span>{t.aiChefTab}</span></div>
        <div className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}><ChefHat size={24} /><span>{t.favorites}</span></div>
      </nav>
    </div>
  );
};

export default App;

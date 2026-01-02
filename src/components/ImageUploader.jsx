import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fileToBase64, analyzeImageForIngredients } from '../services/visionApi';

// Simple spinning loader animation
const LoadingSpinner = () => {
    return (
        <div className="analyzing-overlay">
            <Loader2 size={48} className="spin-animation" style={{ color: 'var(--primary)' }} />
            <span style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>Анализирую продукты...</span>
        </div>
    );
};

const ImageUploader = ({ onIngredientsDetected, apiKey, disabled }) => {
    const [preview, setPreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Пожалуйста, выберите изображение');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Изображение слишком большое. Максимум 10MB');
            return;
        }

        setError(null);
        setIsAnalyzing(true);

        try {
            // Create preview first
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);

            // Small delay to ensure preview is set
            await new Promise(r => setTimeout(r, 100));

            // Analyze with AI
            const base64 = await fileToBase64(file);
            const ingredients = await analyzeImageForIngredients(base64, apiKey);

            if (ingredients && Array.isArray(ingredients)) {
                onIngredientsDetected(ingredients);
            } else {
                setError('Не удалось распознать продукты. Попробуйте другое фото.');
            }
        } catch (err) {
            console.error('Analysis failed:', err);
            const errorMessage = err?.message || 'Неизвестная ошибка';

            if (errorMessage.includes('Rate limit')) {
                setError('Превышен лимит запросов. Подождите минуту и попробуйте снова.');
            } else if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
                setError('Превышено время ожидания. Попробуйте снова.');
            } else {
                setError(`Ошибка: ${errorMessage}`);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearImage = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <div className="image-uploader">
            {/* Hidden file inputs */}
            <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                hidden
                disabled={disabled || isAnalyzing}
            />
            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                ref={cameraInputRef}
                hidden
                disabled={disabled || isAnalyzing}
            />

            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="upload-zone"
                    >
                        <div className="upload-icon">
                            <ImageIcon size={48} />
                        </div>
                        <p className="upload-title">Загрузите фото продуктов</p>
                        <p className="upload-subtitle">Я определю ингредиенты и предложу рецепты</p>

                        <div className="upload-buttons">
                            <button
                                className="upload-btn camera"
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={disabled || isAnalyzing}
                            >
                                <Camera size={20} />
                                Камера
                            </button>
                            <button
                                className="upload-btn gallery"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled || isAnalyzing}
                            >
                                <Upload size={20} />
                                Галерея
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="image-preview-container"
                    >
                        <img src={preview} alt="Preview" className="image-preview" />

                        {isAnalyzing && <LoadingSpinner />}

                        <button
                            className="clear-image-btn"
                            onClick={clearImage}
                            disabled={isAnalyzing}
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="upload-error"
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
};

export default ImageUploader;

import React, { useState, useRef } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DetectedIngredients = ({ ingredients, onUpdate, onConfirm, disabled }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [newIngredient, setNewIngredient] = useState('');
    const inputRef = useRef(null);

    const handleEdit = (index) => {
        setEditingIndex(index);
        setEditValue(ingredients[index]);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSaveEdit = () => {
        if (editValue.trim() && editingIndex !== null) {
            const updated = [...ingredients];
            updated[editingIndex] = editValue.trim();
            onUpdate(updated);
        }
        setEditingIndex(null);
        setEditValue('');
    };

    const handleDelete = (index) => {
        const updated = ingredients.filter((_, i) => i !== index);
        onUpdate(updated);
    };

    const handleAddNew = () => {
        if (newIngredient.trim()) {
            onUpdate([...ingredients, newIngredient.trim()]);
            setNewIngredient('');
        }
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="detected-ingredients"
        >
            <div className="detected-header">
                <h4>Найденные продукты ({ingredients.length})</h4>
                <span className="detected-hint">Нажмите для редактирования</span>
            </div>

            <div className="ingredients-chips">
                <AnimatePresence>
                    {ingredients.map((ingredient, index) => (
                        <motion.div
                            key={`${ingredient}-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.05 }}
                            className="ingredient-chip"
                            onClick={() => handleEdit(index)}
                        >
                            {editingIndex === index ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleSaveEdit}
                                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                                    className="chip-edit-input"
                                    autoFocus
                                />
                            ) : (
                                <>
                                    <span>{ingredient}</span>
                                    <button
                                        className="chip-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(index);
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add new ingredient input */}
                <div className="add-ingredient-wrapper">
                    <input
                        type="text"
                        placeholder="+ Добавить..."
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleAddNew)}
                        className="add-ingredient-input"
                    />
                    {newIngredient && (
                        <button className="add-ingredient-btn" onClick={handleAddNew}>
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>

            <button
                className="confirm-ingredients-btn"
                onClick={onConfirm}
                disabled={disabled}
                style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                <Check size={20} />
                {disabled ? 'Магия в процессе...' : 'Использовать эти продукты'}
            </button>
        </motion.div>
    );
};

export default DetectedIngredients;

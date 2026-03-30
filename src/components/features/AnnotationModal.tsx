'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, X } from 'lucide-react';
import { Trade, TradeAnnotation } from '../../lib/types';
import { formatUsd } from '../../lib/utils';
import { format } from 'date-fns';
import UnsavedChangesModal from './UnsavedChangesModal';

interface AnnotationModalProps {
    isOpen: boolean;
    trade: Trade | null;
    initialData: TradeAnnotation | null;
    onSave: (data: TradeAnnotation) => void;
    onClose: () => void;
}

const MAX_NOTE_CHARS = 1000;
const MAX_LESSON_CHARS = 280;

const PREDEFINED_TAGS = ['Good Setup', 'Revenge', 'FOMO', 'Patience', 'High Conviction', 'Mistake'];

export default function AnnotationModal({
    isOpen,
    trade,
    initialData,
    onSave,
    onClose
}: AnnotationModalProps) {
    const [note, setNote] = useState(initialData?.notes || '');
    const [lesson, setLesson] = useState(initialData?.lessonsLearned || '');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNote(initialData?.notes || '');
            setLesson(initialData?.lessonsLearned || '');
            setTags(initialData?.tags || []);
        }
    }, [initialData, isOpen]);

    const hasChanges = () => {
        const initialNotes = initialData?.notes || '';
        const initialLesson = initialData?.lessonsLearned || '';
        const initialTags = initialData?.tags || [];

        return note.trim() !== initialNotes.trim() ||
            lesson.trim() !== initialLesson.trim() ||
            JSON.stringify(tags.sort()) !== JSON.stringify(initialTags.sort());
    };

    const handleClose = () => {
        if (hasChanges()) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    const handleSave = () => {
        if (!trade) return;
        onSave({
            tradeId: trade.id,
            notes: note,
            tags: tags,
            lessonsLearned: lesson
        });
        setShowUnsavedWarning(false);
    };

    const handleDiscard = () => {
        setNote(initialData?.notes || '');
        setLesson(initialData?.lessonsLearned || '');
        setTags(initialData?.tags || []);
        setShowUnsavedWarning(false);
        onClose();
    };

    const toggleTag = (tagName: string) => {
        setTags(prev =>
            prev.includes(tagName)
                ? prev.filter(t => t !== tagName)
                : [...prev, tagName]
        );
    };

    const handleAddCustomTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            if (!tags.includes(newTag.trim())) {
                setTags(prev => [...prev, newTag.trim()]);
            }
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    if (!isOpen || !trade) return null;

    const remainingNoteChars = MAX_NOTE_CHARS - note.length;
    const remainingLessonChars = MAX_LESSON_CHARS - lesson.length;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 z-[60] bg-bs-bg/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
                            >
                                {/* Glassmorphism Container */}
                                <div className="relative overflow-hidden rounded-lg border border-bs-border bg-bs-bg/95 backdrop-blur-xl shadow-2xl">
                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-bs-brand-tertiary/40"></div>
                                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-bs-brand-tertiary/40"></div>
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-bs-brand-tertiary/40"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-bs-brand-tertiary/40"></div>

                                    {/* Header */}
                                    <div className="relative z-10 flex items-center justify-between border-b border-bs-border p-6">
                                        <h2 className="text-xl font-bold text-white">Trade Note</h2>
                                        <button
                                            onClick={handleClose}
                                            className="rounded-lg p-2 text-bs-text-tertiary transition-colors hover:bg-bs-card-fg hover:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Trade Summary */}
                                    <div className="relative z-10 border-b border-bs-border bg-bs-card p-6">
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div>
                                                <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-1">Symbol</p>
                                                <p className="text-white font-semibold">{trade.symbol}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-1">Side</p>
                                                <p className={`font-semibold ${trade.side === 'long' || trade.side === 'buy'
                                                    ? 'text-bs-success'
                                                    : 'text-bs-error'
                                                    }`}>
                                                    {trade.side.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-1">PnL</p>
                                                <p className={`font-semibold ${trade.pnl >= 0 ? 'text-bs-success' : 'text-bs-error'
                                                    }`}>
                                                    {trade.pnl >= 0 ? '+' : ''}{formatUsd(trade.pnl)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-1">Date</p>
                                                <p className="text-bs-text-secondary text-sm">
                                                    {format(trade.closedAt, 'MMM d, HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Additional Details */}
                                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                                            <div>
                                                <span className="text-bs-text-mute">Qty:</span>{' '}
                                                <span className="text-bs-text-secondary">{trade.quantity.toFixed(4)}</span>
                                            </div>
                                            <div>
                                                <span className="text-bs-text-mute">Price:</span>{' '}
                                                <span className="text-bs-text-secondary">{formatUsd(trade.price)}</span>
                                            </div>
                                            <div>
                                                <span className="text-bs-text-mute">Fee:</span>{' '}
                                                <span className="text-bs-text-secondary">{formatUsd(trade.fee)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Scroll Area */}
                                    <div className="relative z-10 p-6 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">

                                        {/* Tags Section */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-bs-text-secondary">
                                                <Tag className="h-4 w-4 text-bs-brand" />
                                                Tags
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {/* Predefined Tags */}
                                                {PREDEFINED_TAGS.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleTag(tag)}
                                                        className={`px-3 py-1 text-xs font-medium transition-all border ${tags.includes(tag)
                                                            ? 'bg-bs-brand-tertiary/20 border-bs-brand-tertiary text-bs-brand-secondary'
                                                            : 'bg-bs-card border-bs-border text-bs-text-mute hover:border-white/30 hover:text-bs-text-secondary'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}

                                                {/* Custom Tags */}
                                                {tags.filter(t => !PREDEFINED_TAGS.includes(t)).map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleTag(tag)}
                                                        className="px-3 py-1 text-xs font-medium bg-[#69a2f1]/20 border border-blue-400 text-blue-300 transition-all"
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}

                                                {/* Add Tag Button */}
                                                {isAddingTag ? (
                                                    <input
                                                        type="text"
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        onKeyDown={handleAddCustomTag}
                                                        onBlur={() => setIsAddingTag(false)}
                                                        placeholder="Press Enter..."
                                                        className="bg-bs-card-fg border border-bs-brand-tertiary/50 px-3 py-1 text-xs text-white focus:outline-none w-32"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setIsAddingTag(true)}
                                                        className="px-3 py-1 text-xs font-medium bg-bs-card border border-dashed border-white/20 text-bs-text-mute hover:border-white/40 hover:text-bs-text-tertiary flex items-center gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add Tag
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes Area */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-bs-text-secondary">
                                                Trade Notes
                                            </label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= MAX_NOTE_CHARS) {
                                                        setNote(e.target.value);
                                                    }
                                                }}
                                                placeholder="Add your thoughts, entry reasons, or emotional state..."
                                                className="w-full h-28 rounded-lg border border-bs-border bg-bs-card px-4 py-3 text-white placeholder:text-bs-text-mute focus:border-bs-brand-tertiary/40 focus:outline-none focus:ring-1 focus:ring-[#00b3b3]/20 resize-none text-sm"
                                            />
                                            <div className="flex justify-end text-[10px] font-mono">
                                                <span className={`transition-colors ${remainingNoteChars < 50 ? 'text-yellow-400' : 'text-bs-text-mute'}`}>
                                                    {remainingNoteChars} / {MAX_NOTE_CHARS}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Key Lesson Area */}
                                        <div className="bg-bs-brand-tertiary/5 border border-bs-brand-tertiary/10 p-3 space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-bs-brand">
                                                Key Lesson (280 Max)
                                            </label>
                                            <textarea
                                                value={lesson}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= MAX_LESSON_CHARS) {
                                                        setLesson(e.target.value);
                                                    }
                                                }}
                                                placeholder="What is the one thing you learned from this?"
                                                className="w-full h-16 rounded-lg border border-bs-brand-tertiary/20 bg-bs-bg/40 px-4 py-2 text-sm text-white placeholder:text-bs-brand/20 focus:border-bs-brand-tertiary/40 focus:outline-none transition-all resize-none italic"
                                            />
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-bs-brand/40 italic">
                                                    Distill your core insight
                                                </span>
                                                <span className={`font-mono ${remainingLessonChars < 20 ? 'text-bs-error' : 'text-bs-brand/40'}`}>
                                                    {remainingLessonChars}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex justify-end gap-3 border-t border-bs-border p-6 bg-bs-bg">
                                        <button
                                            onClick={handleClose}
                                            className="rounded-lg border border-bs-border bg-bs-card px-6 py-2.5 text-sm font-medium text-bs-text-secondary transition-colors hover:bg-bs-card-fg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="rounded-lg bg-bs-brand-tertiary px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-bs-brand-tertiary shadow-[0_0_20px_rgba(0,179,179,0.3)]"
                                        >
                                            Save Annotation
                                        </button>
                                    </div>

                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#00b3b3]/5 to-transparent pointer-events-none"></div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Unsaved Changes Warning */}
            <UnsavedChangesModal
                isOpen={showUnsavedWarning}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onCancel={() => setShowUnsavedWarning(false)}
            />
        </>
    );
}

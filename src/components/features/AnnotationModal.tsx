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
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
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
                                <div className="relative overflow-hidden rounded-none border border-white/10 bg-[#0D0D21]/95 backdrop-blur-xl shadow-2xl">
                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400/40"></div>
                                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400/40"></div>
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400/40"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400/40"></div>

                                    {/* Header */}
                                    <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-6">
                                        <h2 className="text-xl font-bold text-white">Trade Note</h2>
                                        <button
                                            onClick={handleClose}
                                            className="rounded-none p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Trade Summary */}
                                    <div className="relative z-10 border-b border-white/10 bg-white/5 p-6">
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div>
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Symbol</p>
                                                <p className="text-white font-semibold">{trade.symbol}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Side</p>
                                                <p className={`font-semibold ${trade.side === 'long' || trade.side === 'buy'
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                                    }`}>
                                                    {trade.side.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">PnL</p>
                                                <p className={`font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {trade.pnl >= 0 ? '+' : ''}{formatUsd(trade.pnl)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Date</p>
                                                <p className="text-white/80 text-sm">
                                                    {format(trade.closedAt, 'MMM d, HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Additional Details */}
                                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                                            <div>
                                                <span className="text-white/40">Qty:</span>{' '}
                                                <span className="text-white/80">{trade.quantity.toFixed(4)}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/40">Price:</span>{' '}
                                                <span className="text-white/80">{formatUsd(trade.price)}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/40">Fee:</span>{' '}
                                                <span className="text-white/80">{formatUsd(trade.fee)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Scroll Area */}
                                    <div className="relative z-10 p-6 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">

                                        {/* Tags Section */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                                                <Tag className="h-4 w-4 text-purple-400" />
                                                Tags
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {/* Predefined Tags */}
                                                {PREDEFINED_TAGS.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleTag(tag)}
                                                        className={`px-3 py-1 text-xs font-medium transition-all border ${tags.includes(tag)
                                                            ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                                                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
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
                                                        className="px-3 py-1 text-xs font-medium bg-blue-500/20 border border-blue-400 text-blue-300 transition-all"
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
                                                        className="bg-zinc-800 border border-purple-500/50 px-3 py-1 text-xs text-white focus:outline-none w-32"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setIsAddingTag(true)}
                                                        className="px-3 py-1 text-xs font-medium bg-white/5 border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60 flex items-center gap-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add Tag
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes Area */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-white/80">
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
                                                className="w-full h-28 rounded-none border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-400/40 focus:outline-none focus:ring-1 focus:ring-purple-400/20 resize-none text-sm"
                                            />
                                            <div className="flex justify-end text-[10px] font-mono">
                                                <span className={`transition-colors ${remainingNoteChars < 50 ? 'text-yellow-400' : 'text-white/20'}`}>
                                                    {remainingNoteChars} / {MAX_NOTE_CHARS}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Key Lesson Area */}
                                        <div className="bg-purple-500/5 border border-purple-500/10 p-3 space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-purple-400">
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
                                                className="w-full h-16 rounded-none border border-purple-500/20 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-purple-400/20 focus:border-purple-400/40 focus:outline-none transition-all resize-none italic"
                                            />
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-purple-400/40 italic">
                                                    Distill your core insight
                                                </span>
                                                <span className={`font-mono ${remainingLessonChars < 20 ? 'text-red-400' : 'text-purple-400/40'}`}>
                                                    {remainingLessonChars}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex justify-end gap-3 border-t border-white/10 p-6 bg-[#0D0D21]">
                                        <button
                                            onClick={handleClose}
                                            className="rounded-none border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="rounded-none bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                                        >
                                            Save Annotation
                                        </button>
                                    </div>

                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none"></div>
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

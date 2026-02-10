'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Trade } from '../../lib/types';
import { formatUsd } from '../../lib/utils';
import { format } from 'date-fns';
import UnsavedChangesModal from './UnsavedChangesModal';

interface AnnotationModalProps {
    isOpen: boolean;
    trade: Trade | null;
    initialNote: string;
    onSave: (note: string) => void;
    onClose: () => void;
}

const MAX_CHARS = 500;

export default function AnnotationModal({
    isOpen,
    trade,
    initialNote,
    onSave,
    onClose
}: AnnotationModalProps) {
    const [note, setNote] = useState(initialNote);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    useEffect(() => {
        setNote(initialNote);
    }, [initialNote, isOpen]);

    const handleClose = () => {
        if (note.trim() !== initialNote.trim() && note.trim() !== '') {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    const handleSave = () => {
        onSave(note);
        setShowUnsavedWarning(false);
    };

    const handleDiscard = () => {
        setNote(initialNote);
        setShowUnsavedWarning(false);
        onClose();
    };

    if (!isOpen || !trade) return null;

    const remainingChars = MAX_CHARS - note.length;

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
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                                            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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

                                    {/* Textarea */}
                                    <div className="relative z-10 p-6">
                                        <label className="mb-2 block text-sm font-medium text-white/80">
                                            Your Note
                                        </label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => {
                                                if (e.target.value.length <= MAX_CHARS) {
                                                    setNote(e.target.value);
                                                }
                                            }}
                                            placeholder="Add your thoughts, learnings, or observations about this trade..."
                                            className="w-full h-40 rounded-none border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
                                            autoFocus
                                        />
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className="text-white/40">
                                                Annotate your trade, it helps in growth
                                            </span>
                                            <span className={`font-mono ${remainingChars < 50 ? 'text-yellow-400' : 'text-white/40'
                                                }`}>
                                                {remainingChars} / {MAX_CHARS}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="relative z-10 flex justify-end gap-3 border-t border-white/10 p-6">
                                        <button
                                            onClick={handleClose}
                                            className="rounded-none border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="rounded-none bg-purple-500 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                                        >
                                            Save Note
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

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export default function UnsavedChangesModal({
    isOpen,
    onSave,
    onDiscard,
    onCancel
}: UnsavedChangesModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-md"
                        >
                            {/* Glassmorphism Container */}
                            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0D0D21]/95 backdrop-blur-xl shadow-2xl">
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400/40"></div>
                                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400/40"></div>
                                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400/40"></div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400/40"></div>

                                {/* Content */}
                                <div className="relative z-10 p-6">
                                    {/* Icon */}
                                    <div className="mb-4 flex justify-center">
                                        <div className="rounded-full bg-blue-500/10 p-3">
                                            <svg
                                                className="h-6 w-6 text-blue-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="mb-2 text-center text-lg font-semibold text-white">
                                        Unsaved Changes
                                    </h3>

                                    {/* Message */}
                                    <p className="mb-6 text-center text-sm text-white/60">
                                        Save the annotation or it will be lost
                                    </p>

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onDiscard}
                                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={onCancel}
                                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={onSave}
                                            className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none"></div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

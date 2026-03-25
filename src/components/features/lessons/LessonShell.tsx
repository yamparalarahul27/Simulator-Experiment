'use client';

import type { ReactNode } from 'react';

interface LessonShellProps {
    title: string;
    description?: string;
    onBack: () => void;
    children: ReactNode;
}

export default function LessonShell({ title, description, onBack, children }: LessonShellProps) {
    return (
        <div className="space-y-6">
            {/* Back button + title */}
            <div className="flex items-start gap-4">
                <button
                    onClick={onBack}
                    className="mt-1 flex items-center gap-1.5 text-sm font-mono text-white/40 hover:text-white/70 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <div>
                    <h1 className="text-2xl font-mono font-bold text-white tracking-wide">{title}</h1>
                    {description && (
                        <p className="text-sm font-mono text-white/50 mt-1">{description}</p>
                    )}
                </div>
            </div>

            {/* Lesson content */}
            {children}
        </div>
    );
}

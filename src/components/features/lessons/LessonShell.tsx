'use client';

import type { ReactNode } from 'react';
import { Undo2 } from 'lucide-react';

interface LessonShellProps {
    title: string;
    description?: string;
    onBack: () => void;
    children: ReactNode;
}

export default function LessonShell({ title, description, onBack, children }: LessonShellProps) {
    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-mono text-bs-text-mute hover:text-bs-text-secondary transition-colors"
            >
                <Undo2 className="w-4 h-4" />
                Back
            </button>

            {/* Title */}
            <div>
                <h1 className="text-2xl font-mono font-bold text-bs-text-primary tracking-wide">{title}</h1>
                {description && (
                    <p className="text-sm font-mono text-bs-text-tertiary mt-1">{description}</p>
                )}
            </div>

            {/* Lesson content */}
            {children}
        </div>
    );
}

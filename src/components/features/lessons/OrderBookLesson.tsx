'use client';

import dynamic from 'next/dynamic';
import type { LessonConfig } from '@/lib/types';
import LessonShell from './LessonShell';

const InteractiveOrderBook = dynamic(() => import('./InteractiveOrderBook'), { ssr: false });

// Lessons that should show the interactive order book
const INTERACTIVE_LESSONS = new Set([
    'limit-vs-market',
    'heatmap',
    'depth',
    'depth-overlay',
]);

interface OrderBookLessonProps {
    lesson: LessonConfig;
    details?: {
        emoji: string;
        sections: { heading: string; body: string }[];
    };
    onBack: () => void;
}

export default function OrderBookLesson({ lesson, details, onBack }: OrderBookLessonProps) {
    const showInteractive = INTERACTIVE_LESSONS.has(lesson.lessonSlug);

    return (
        <LessonShell
            title={lesson.title}
            description={lesson.description}
            onBack={onBack}
        >
            <div className="space-y-4">
                {/* Educational content sections */}
                {details && details.sections.length > 0 && (
                    details.sections.map((section, i) => (
                        <div key={i} className="border border-bs-border bg-white/[0.02] p-5">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-bs-brand/50 mb-2">
                                {section.heading}
                            </h3>
                            <p className="text-sm font-mono text-bs-text-tertiary leading-relaxed">
                                {section.body}
                            </p>
                        </div>
                    ))
                )}

                {/* Interactive Order Book */}
                {showInteractive && (
                    <div className="border border-bs-border">
                        <div className="px-4 py-3 border-b border-bs-border bg-bs-bg/60">
                            <p className="text-[10px] font-mono text-bs-brand/60 uppercase tracking-wider">
                                Interactive Order Book — explore the concepts above
                            </p>
                        </div>
                        <div className="p-4">
                            <InteractiveOrderBook
                                showDepthChart={lesson.lessonSlug === 'depth' || lesson.lessonSlug === 'depth-overlay'}
                            />
                        </div>
                    </div>
                )}
            </div>
        </LessonShell>
    );
}

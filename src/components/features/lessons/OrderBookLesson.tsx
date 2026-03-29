'use client';

import type { LessonConfig } from '@/lib/types';
import LessonShell from './LessonShell';

interface OrderBookLessonProps {
    lesson: LessonConfig;
    details?: {
        emoji: string;
        sections: { heading: string; body: string }[];
    };
    onBack: () => void;
}

export default function OrderBookLesson({ lesson, details, onBack }: OrderBookLessonProps) {
    return (
        <LessonShell
            title={lesson.title}
            description={lesson.description}
            onBack={onBack}
        >
            <div className="space-y-4">
                {details && details.sections.length > 0 && (
                    details.sections.map((section, i) => (
                        <div key={i} className="border border-[#1a1e26] bg-white/[0.02] p-5">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[#00ffff]/50 mb-2">
                                {section.heading}
                            </h3>
                            <p className="text-sm font-mono text-[#adb9d2] leading-relaxed">
                                {section.body}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </LessonShell>
    );
}

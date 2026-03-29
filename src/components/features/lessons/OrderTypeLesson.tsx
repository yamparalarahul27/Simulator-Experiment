'use client';

import dynamic from 'next/dynamic';
import type { LessonConfig } from '@/lib/types';
import LessonShell from './LessonShell';

// Lazy load the full simulator to avoid SSR issues
const DemoMarket = dynamic(() => import('../DemoMarket'), { ssr: false });

interface OrderTypeLessonProps {
    lesson: LessonConfig;
    details?: {
        emoji: string;
        whenToUse: string;
        risk: string;
        example: string;
    };
    onBack: () => void;
}

export default function OrderTypeLesson({ lesson, details, onBack }: OrderTypeLessonProps) {
    return (
        <LessonShell
            title={lesson.title}
            description={lesson.description}
            onBack={onBack}
        >
            <div className="space-y-6">
                {/* Educational content */}
                {details && details.whenToUse && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-[var(--bs-border)] bg-[var(--bs-card-fg)] p-5">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--bs-text-mute)] mb-2">When to use</h3>
                            <p className="text-sm font-mono text-[var(--bs-text-tertiary)] leading-relaxed">{details.whenToUse}</p>
                        </div>
                        <div className="border border-[var(--bs-border)] bg-[var(--bs-card-fg)] p-5">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400/50 mb-2">Risk</h3>
                            <p className="text-sm font-mono text-[var(--bs-text-tertiary)] leading-relaxed">{details.risk}</p>
                        </div>
                        <div className="border border-[var(--bs-border)] bg-[var(--bs-card-fg)] p-5">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--bs-brand)]/50 mb-2">Example</h3>
                            <p className="text-sm font-mono text-[var(--bs-text-tertiary)] leading-relaxed">{details.example}</p>
                        </div>
                    </div>
                )}

                {/* Hint banner */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bs-brand-tertiary)]/5 border border-[var(--bs-brand-tertiary)]/15">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-mono text-[var(--bs-brand-secondary)]/60">
                        Use the simulator below to practice. Select <strong className="text-[var(--bs-brand-secondary)]/80">{lesson.title}</strong> from
                        the order type selector, configure your parameters, and hit Play to watch the order lifecycle unfold.
                    </p>
                </div>

                {/* Full Simulator */}
                <div className="border border-[var(--bs-border)]">
                    <DemoMarket simulatorKind="spot" />
                </div>
            </div>
        </LessonShell>
    );
}

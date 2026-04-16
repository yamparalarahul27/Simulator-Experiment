'use client';

import { useState } from 'react';
import type { LearningModule, LessonConfig, OrderTypeDetail } from '@/lib/types';
import { useOrderTypeDetails } from '@/lib/hooks/useContent';
import LessonShell from './LessonShell';
import OrderTypeLesson from './OrderTypeLesson';

// ============================================
// Lesson Card
// ============================================

function LessonCard({
    lesson,
    index,
    details,
    onClick,
}: {
    lesson: LessonConfig;
    index: number;
    details?: OrderTypeDetail;
    onClick: () => void;
}) {
    const emoji = details?.emoji || '📖';

    return (
        <button
            onClick={onClick}
            className="w-full text-left stamp-card transition-all duration-200 group"
        >
            <div className="stamp-card-inner">
                <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-bs-card-fg border border-bs-border text-lg shrink-0">
                        {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-bs-text-mute">{String(index).padStart(2, '0')}</span>
                            <h3 className="text-sm font-mono font-semibold text-bs-text-primary">{lesson.title}</h3>
                        </div>
                        <p className="text-xs font-mono text-bs-text-secondary mt-1">{lesson.description}</p>
                        {details?.whenToUse && (
                            <p className="text-[11px] font-mono text-bs-text-mute mt-2 line-clamp-1">{details.whenToUse}</p>
                        )}
                    </div>
                    <span className="text-xs font-mono text-bs-brand/50 group-hover:text-bs-brand/80 transition-colors mt-1">
                        &rarr;
                    </span>
                </div>
            </div>
        </button>
    );
}

// ============================================
// Overview Content
// ============================================

function OverviewContent({
    module,
    detailsMap,
    onSelectLesson,
}: {
    module: LearningModule;
    detailsMap: Record<string, OrderTypeDetail>;
    onSelectLesson: (slug: string) => void;
}) {
    return (
        <div className="space-y-8">
            {/* Intro section */}
            <div className="border border-bs-border bg-white/[0.02] p-6 md:p-8">
                <h2 className="text-lg font-mono font-semibold text-bs-text-primary mb-4">What are Order Types?</h2>
                <div className="space-y-3 text-sm font-mono text-bs-text-tertiary leading-relaxed">
                    <p>
                        Order types are instructions you give to an exchange about how to execute your trade.
                        Each type serves a different purpose — speed, precision, risk management, or stealth.
                    </p>
                    <p>
                        Understanding order types is the foundation of DEX trading.
                        A market order executes instantly but gives you no price control.
                        A limit order gives you exact price control but may never fill.
                        Advanced types like TWAP, Iceberg, and OCO solve specific problems in real trading scenarios.
                    </p>
                    <p>
                        In this module, you will learn each of the 8 order types through
                        interactive simulators — place orders, adjust prices, and watch the order lifecycle
                        unfold on a live state diagram.
                    </p>
                </div>
            </div>

            {/* Quick reference table */}
            <div className="border border-bs-border bg-white/[0.02] p-6">
                <h3 className="text-sm font-mono font-semibold text-bs-text-secondary uppercase tracking-wider mb-4">Quick Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>⚡ Market</span> <span className="text-bs-text-primary/10">—</span> <span>Instant execution</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🎯 Limit</span> <span className="text-bs-text-primary/10">—</span> <span>Specific price</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🛑 Stop Market</span> <span className="text-bs-text-primary/10">—</span> <span>Loss protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🔒 Stop Limit</span> <span className="text-bs-text-primary/10">—</span> <span>Controlled stop</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🧊 Iceberg</span> <span className="text-bs-text-primary/10">—</span> <span>Hidden size</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>⏱️ TWAP</span> <span className="text-bs-text-primary/10">—</span> <span>Time-split</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>📈 Trailing Stop</span> <span className="text-bs-text-primary/10">—</span> <span>Follow trend</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>⚖️ OCO</span> <span className="text-bs-text-primary/10">—</span> <span>TP + SL pair</span>
                    </div>
                </div>
            </div>

            {/* Lessons list */}
            <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-bs-text-mute mb-4">
                    Lessons
                </h3>
                <div className="space-y-2">
                    {module.lessons.filter(l => l.lessonSlug !== 'overview').map((lesson, i) => (
                        <LessonCard
                            key={lesson.lessonSlug}
                            lesson={lesson}
                            index={i + 1}
                            details={detailsMap[lesson.lessonSlug]}
                            onClick={() => onSelectLesson(lesson.lessonSlug)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// OrderTypesOverview — Main Export
// ============================================

interface OrderTypesOverviewProps {
    module: LearningModule;
    onBack: () => void;
}

export default function OrderTypesOverview({ module, onBack }: OrderTypesOverviewProps) {
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const { data: orderTypeDetails = {} } = useOrderTypeDetails();

    // Individual lesson view
    if (activeLesson) {
        const lesson = module.lessons.find(l => l.lessonSlug === activeLesson);
        if (lesson) {
            const details = orderTypeDetails[lesson.lessonSlug];
            return (
                <OrderTypeLesson
                    lesson={lesson}
                    details={details}
                    onBack={() => setActiveLesson(null)}
                />
            );
        }
    }

    // Overview view
    return (
        <LessonShell
            title="Order Types"
            description="Learn all 8 order types with interactive simulators"
            onBack={onBack}
        >
            <OverviewContent module={module} detailsMap={orderTypeDetails} onSelectLesson={setActiveLesson} />
        </LessonShell>
    );
}

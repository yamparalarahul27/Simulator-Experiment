'use client';

import { useState } from 'react';
import type { LearningModule, LessonConfig } from '@/lib/types';
import LessonShell from './LessonShell';
import OrderTypeLesson from './OrderTypeLesson';

// ============================================
// Order Type educational content
// ============================================

const ORDER_TYPE_DETAILS: Record<string, {
    emoji: string;
    whenToUse: string;
    risk: string;
    example: string;
}> = {
    overview: {
        emoji: '📋',
        whenToUse: '',
        risk: '',
        example: '',
    },
    market: {
        emoji: '⚡',
        whenToUse: 'When you need immediate execution and price certainty is less important than speed.',
        risk: 'Slippage — you may get a worse price than expected in volatile markets.',
        example: 'SOL is crashing and you want to exit immediately. A market sell guarantees execution.',
    },
    limit: {
        emoji: '🎯',
        whenToUse: 'When you want to buy/sell at a specific price or better. You\'re willing to wait.',
        risk: 'Your order may never fill if the price doesn\'t reach your limit.',
        example: 'SOL is at $150. You set a limit buy at $140. If price drops to $140, your order fills.',
    },
    'stop-market': {
        emoji: '🛑',
        whenToUse: 'To protect against losses. Triggers a market order when price hits your stop.',
        risk: 'Slippage after trigger — fast-moving markets may fill at a worse price.',
        example: 'You\'re long SOL at $150. Set a stop-market at $140 to limit downside.',
    },
    'stop-limit': {
        emoji: '🔒',
        whenToUse: 'Like stop-market but with price control. Triggers a limit order instead.',
        risk: 'Order may not fill if price blows past your limit after triggering.',
        example: 'Stop at $140, limit at $139. Triggers at $140 but only fills at $139 or better.',
    },
    iceberg: {
        emoji: '🧊',
        whenToUse: 'For large orders — hides total size behind smaller visible portions.',
        risk: 'Slower execution. Other traders may detect the pattern.',
        example: 'Want to buy 1000 SOL but show only 100 at a time to avoid moving the market.',
    },
    twap: {
        emoji: '⏱️',
        whenToUse: 'To execute large orders over time, reducing market impact.',
        risk: 'Price may move against you during the execution window.',
        example: 'Split a 1000 SOL buy into 10 orders over 10 minutes — 100 SOL each.',
    },
    'trailing-stop': {
        emoji: '📈',
        whenToUse: 'To lock in profits as price moves in your favor. Stop follows the price.',
        risk: 'Whipsaws — a brief pullback can trigger your stop before the trend continues.',
        example: 'SOL at $150, trailing offset $10. Price rises to $170, stop moves to $160.',
    },
    oco: {
        emoji: '⚖️',
        whenToUse: 'To set both a take-profit and stop-loss simultaneously. One cancels the other.',
        risk: 'Complexity — misunderstanding the mechanics can lead to unexpected fills.',
        example: 'Long SOL at $150. TP limit at $170, SL stop at $140. Whichever hits first, the other cancels.',
    },
};

// ============================================
// Lesson Card
// ============================================

function LessonCard({
    lesson,
    index,
    onClick,
}: {
    lesson: LessonConfig;
    index: number;
    onClick: () => void;
}) {
    const details = ORDER_TYPE_DETAILS[lesson.lessonSlug];
    const emoji = details?.emoji || '📖';

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-[var(--bs-bg)] border border-[var(--bs-border)] hover:border-[var(--bs-border)] hover:bg-[var(--bs-card-fg)] transition-all duration-200 p-5 group"
        >
            <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[var(--bs-card)] border border-[var(--bs-border)] text-lg shrink-0">
                    {emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[var(--bs-text-mute)]">{String(index).padStart(2, '0')}</span>
                        <h3 className="text-sm font-mono font-semibold text-[var(--bs-text-primary)]">{lesson.title}</h3>
                    </div>
                    <p className="text-xs font-mono text-[var(--bs-text-mute)] mt-1">{lesson.description}</p>
                    {details?.whenToUse && (
                        <p className="text-[11px] font-mono text-[var(--bs-text-mute)] mt-2 line-clamp-1">{details.whenToUse}</p>
                    )}
                </div>
                <span className="text-xs font-mono text-[var(--bs-brand)]/50 group-hover:text-[var(--bs-brand)]/80 transition-colors mt-1">
                    &rarr;
                </span>
            </div>
        </button>
    );
}

// ============================================
// Overview Content
// ============================================

function OverviewContent({
    module,
    onSelectLesson,
}: {
    module: LearningModule;
    onSelectLesson: (slug: string) => void;
}) {
    return (
        <div className="space-y-8">
            {/* Intro section */}
            <div className="border border-[var(--bs-border)] bg-[var(--bs-card-fg)] p-6 md:p-8">
                <h2 className="text-lg font-mono font-semibold text-[var(--bs-text-primary)] mb-4">What are Order Types?</h2>
                <div className="space-y-3 text-sm font-mono text-[var(--bs-text-tertiary)] leading-relaxed">
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
            <div className="border border-[var(--bs-border)] bg-[var(--bs-card-fg)] p-6">
                <h3 className="text-sm font-mono font-semibold text-[var(--bs-text-secondary)] uppercase tracking-wider mb-4">Quick Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>⚡ Market</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Instant execution</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>🎯 Limit</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Specific price</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>🛑 Stop Market</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Loss protection</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>🔒 Stop Limit</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Controlled stop</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>🧊 Iceberg</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Hidden size</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>⏱️ TWAP</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Time-split</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>📈 Trailing Stop</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>Follow trend</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--bs-text-mute)]">
                        <span>⚖️ OCO</span> <span className="text-[var(--bs-text-primary)]/10">—</span> <span>TP + SL pair</span>
                    </div>
                </div>
            </div>

            {/* Lessons list */}
            <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--bs-text-mute)] mb-4">
                    Lessons
                </h3>
                <div className="space-y-2">
                    {module.lessons.filter(l => l.lessonSlug !== 'overview').map((lesson, i) => (
                        <LessonCard
                            key={lesson.lessonSlug}
                            lesson={lesson}
                            index={i + 1}
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

    // Individual lesson view
    if (activeLesson) {
        const lesson = module.lessons.find(l => l.lessonSlug === activeLesson);
        if (lesson) {
            const details = ORDER_TYPE_DETAILS[lesson.lessonSlug];
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
            <OverviewContent module={module} onSelectLesson={setActiveLesson} />
        </LessonShell>
    );
}

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { LearningModule, LessonConfig, OrderBookDetail } from '@/lib/types';
import { useOrderBookDetails } from '@/lib/hooks/useContent';
import LessonShell from './LessonShell';
import OrderBookLesson from './OrderBookLesson';

const InteractiveOrderBook = dynamic(() => import('./InteractiveOrderBook'), { ssr: false });

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
    details?: OrderBookDetail;
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
                        <p className="text-xs font-mono text-bs-text-mute mt-1">{lesson.description}</p>
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
    detailsMap: Record<string, OrderBookDetail>;
    onSelectLesson: (slug: string) => void;
}) {
    return (
        <div className="space-y-8">
            {/* Intro section */}
            <div className="border border-bs-border bg-white/[0.02] p-6 md:p-8">
                <h2 className="text-lg font-mono font-semibold text-bs-text-primary mb-4">What is an Order Book?</h2>
                <div className="space-y-3 text-sm font-mono text-bs-text-tertiary leading-relaxed">
                    <p>
                        An order book is a real-time list of all open buy and sell limit orders for a specific
                        trading pair (e.g., BTC/USDT) on an exchange. It shows two sides:
                    </p>
                    <ul className="list-none space-y-1 pl-2">
                        <li><span className="text-bs-success">Bids (buy orders)</span> — people willing to buy at certain prices or lower</li>
                        <li><span className="text-bs-error">Asks (sell orders)</span> — people willing to sell at certain prices or higher</li>
                    </ul>
                    <p>
                        Key elements you see in an order book:
                    </p>
                    <ul className="list-none space-y-1 pl-2">
                        <li><span className="text-bs-text-primary">Price</span> — the level someone is willing to buy or sell at</li>
                        <li><span className="text-bs-text-primary">Amount / Size</span> — how much they want to trade at that price</li>
                        <li><span className="text-bs-text-primary">Total (cumulative)</span> — running sum of how much volume is available up to that price</li>
                    </ul>
                    <p>
                        The order book is the purest form of supply and demand. By combining Depth, Heatmap,
                        and Overlay, you gain a 3D view of the market and can spot where real money is positioned.
                    </p>
                </div>
            </div>

            {/* Quick reference table */}
            <div className="border border-bs-border bg-white/[0.02] p-6">
                <h3 className="text-sm font-mono font-semibold text-bs-text-secondary uppercase tracking-wider mb-4">Quick Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>⚔️ Limit vs Market</span> <span className="text-bs-text-primary/10">—</span> <span>Passive vs aggressive</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🗺️ Heatmap</span> <span className="text-bs-text-primary/10">—</span> <span>Order book on chart over time</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>📉 Depth</span> <span className="text-bs-text-primary/10">—</span> <span>Liquidity at each level</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>🎨 Overlay</span> <span className="text-bs-text-primary/10">—</span> <span>Bid/ask bands on candles</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-bs-text-mute">
                        <span>💡 Pro Tips</span> <span className="text-bs-text-primary/10">—</span> <span>Spot vs Perps, spoofing</span>
                    </div>
                </div>
            </div>

            {/* Key concepts */}
            <div className="border border-bs-border bg-white/[0.02] p-6">
                <h3 className="text-sm font-mono font-semibold text-bs-text-secondary uppercase tracking-wider mb-4">Key Concepts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-mono text-bs-brand/70 uppercase tracking-wider">Thick Book</h4>
                        <p className="text-xs font-mono text-bs-text-mute">Many orders = high liquidity = harder to move price</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-mono text-bs-brand/70 uppercase tracking-wider">Thin Book</h4>
                        <p className="text-xs font-mono text-bs-text-mute">Fewer orders = low liquidity = easier to move price</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-mono text-bs-brand/70 uppercase tracking-wider">Depth Delta</h4>
                        <p className="text-xs font-mono text-bs-text-mute">Bids − Asks = imbalance. Green = more bids, Red = more asks</p>
                    </div>
                </div>
            </div>

            {/* Depth delta example */}
            <div className="border border-bs-border bg-white/[0.02] p-6">
                <h3 className="text-sm font-mono font-semibold text-bs-text-secondary uppercase tracking-wider mb-4">Depth Delta — Worked Example</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                    <div className="space-y-2">
                        <h4 className="text-bs-error/80 uppercase tracking-wider">Ask Side</h4>
                        <p className="text-bs-text-mute">0–5% ask depth → 100 asks</p>
                        <p className="text-bs-text-mute">5–10% ask depth → 250 asks</p>
                        <p className="text-bs-text-tertiary">Total 0–10%: <span className="text-bs-error">350 asks</span></p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-bs-success/80 uppercase tracking-wider">Bid Side</h4>
                        <p className="text-bs-text-mute">0–5% bid depth → 150 bids</p>
                        <p className="text-bs-text-mute">5–10% bid depth → 400 bids</p>
                        <p className="text-bs-text-tertiary">Total 0–10%: <span className="text-bs-success">550 bids</span></p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-bs-border">
                    <p className="text-sm font-mono text-bs-text-primary">
                        Depth Delta = 550 − 350 = <span className="text-bs-success">+200</span>
                    </p>
                    <p className="text-xs font-mono text-bs-text-mute mt-1">
                        200 more bids than asks within the 0–10% range — bullish liquidity imbalance
                    </p>
                </div>
            </div>

            {/* Interactive Order Book */}
            <div className="border border-bs-border">
                <div className="px-4 py-3 border-b border-bs-border bg-bs-bg/60">
                    <p className="text-[10px] font-mono text-bs-brand/60 uppercase tracking-wider">
                        Try it — Interactive Order Book
                    </p>
                </div>
                <div className="p-4">
                    <InteractiveOrderBook showDepthChart showAnnotations />
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
// OrderBookOverview — Main Export
// ============================================

interface OrderBookOverviewProps {
    module: LearningModule;
    onBack: () => void;
}

export default function OrderBookOverview({ module, onBack }: OrderBookOverviewProps) {
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const { data: orderBookDetails = {} } = useOrderBookDetails();

    // Individual lesson view
    if (activeLesson) {
        const lesson = module.lessons.find(l => l.lessonSlug === activeLesson);
        if (lesson) {
            const details = orderBookDetails[lesson.lessonSlug];
            return (
                <OrderBookLesson
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
            title="Order Book"
            description="Heatmap, Depth & Overlay — read real supply and demand"
            onBack={onBack}
        >
            <OverviewContent module={module} detailsMap={orderBookDetails} onSelectLesson={setActiveLesson} />
        </LessonShell>
    );
}

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { LearningModule, LessonConfig } from '@/lib/types';
import LessonShell from './LessonShell';
import OrderBookLesson from './OrderBookLesson';

const InteractiveOrderBook = dynamic(() => import('./InteractiveOrderBook'), { ssr: false });

// ============================================
// Order Book educational content
// ============================================

export const ORDER_BOOK_DETAILS: Record<string, {
    emoji: string;
    sections: { heading: string; body: string }[];
}> = {
    overview: {
        emoji: '📋',
        sections: [],
    },
    'limit-vs-market': {
        emoji: '⚔️',
        sections: [
            {
                heading: 'The Battle',
                body: 'The Order Book is essentially a battle between Limit Orders and Market Orders. Limit Orders are passive — they wait on the board, establishing the liquidity and depth (the "walls" you see). Market Orders are aggressive — they immediately cross the spread and consume the waiting Limit Orders, causing the price to move.',
            },
            {
                heading: 'How Price Moves',
                body: 'A large market order will "eat through" multiple layers of passive limit liquidity. The more limit orders stacked at a price, the harder it is for a market order to push through it.',
            },
            {
                heading: 'Supply & Demand',
                body: 'Order books provide valuable insight into where real supply and demand are positioned. While most traders rely on technical analysis to mark support and resistance, the order book helps confirm whether actual orders are sitting at those levels. In some cases, major levels can be identified directly from the order book itself.',
            },
            {
                heading: 'Best Sources',
                body: 'For best results, focus on Binance Spot and Coinbase order books, as they hold the deepest and most reliable liquidity.',
            },
        ],
    },
    heatmap: {
        emoji: '🗺️',
        sections: [
            {
                heading: 'What is a Heatmap?',
                body: 'A heatmap visualizes the order book on the chart over time. Red lines represent large resting sell orders (sell walls), and green lines represent large resting buy orders (buy walls). It shows where big players might be trying to buy, sell, or trap price.',
            },
            {
                heading: 'How to Read It',
                body: 'Asks are always above price, bids are always below price — regardless of color scheme. Most platforms allow you to filter liquidity using a slider, helping you hide smaller market maker orders and focus only on large, meaningful levels. You can hover on lines to see exact order sizes.',
            },
            {
                heading: 'Real-World Example',
                body: 'On a heatmap you might see a massive bid at a key level on Binance Spot. Price repeatedly tests this zone but doesn\'t touch the wall — it bounces off wicks. This tells you the liquidity is strong: buyers are defending aggressively, absorbing selling pressure before price can reach the wall. Eventually, the pressure becomes too much for shorts. They start closing positions and price moves up.',
            },
            {
                heading: 'Spotting Reversals & Fakeouts',
                body: 'Heatmaps help spot potential reversals, fakeouts, or areas of high interest on the chart. When large limit orders suddenly appear very close to the current price — almost chasing it — this can be your signal to trade accordingly.',
            },
        ],
    },
    depth: {
        emoji: '📉',
        sections: [
            {
                heading: 'What is Depth?',
                body: 'Depth equals the liquidity visible in the order book. It shows you how many resting buy/sell orders are stacked at various price levels. Thick book = many orders = high liquidity = harder to move price. Thin book = fewer orders = low liquidity = easier to move price.',
            },
            {
                heading: 'Depth Delta Calculation',
                body: 'Depth shows how much passive supply (asks) and passive demand (bids) exists within a percentage range from the current price. For example: if within 0–10% range there are 550 bids and 350 asks, the depth delta is 550 − 350 = 200. This means 200 more bids than asks within the selected range.',
            },
            {
                heading: 'The Indicator',
                body: 'The Order Book Depth indicator compares passive demand (bids) vs passive supply (asks) and displays the difference as delta bars. Green bars = more bids than asks (positive delta). Red bars = more asks than bids (negative delta). You can choose the depth range in settings.',
            },
            {
                heading: 'Recommended Settings',
                body: 'Use 2.5% and 5% depth for smaller ranges (intraday), 10% for larger ranges (intra-week), and 25% depth as a strong signal for spotting major reversals in the BTC market. Keep in mind that order book depth is a lagging indicator — the market often needs time to react.',
            },
            {
                heading: 'Important Caveat',
                body: 'Order book depth delta doesn\'t predict direction — it shows liquidity imbalance. When analyzing wider ranges (e.g. 25% depth), price may consolidate for weeks or even a month while large positive or negative depth delta develops.',
            },
        ],
    },
    'depth-overlay': {
        emoji: '🎨',
        sections: [
            {
                heading: 'What is Depth Overlay?',
                body: 'The Order Book Depth Overlay is a chart indicator that takes the total volume of waiting limit orders (liquidity) and displays it directly around the current price candles. It measures the imbalance (Delta) between buy orders (Bids) and sell orders (Asks) within a specified percentage range.',
            },
            {
                heading: 'How to Read It',
                body: 'The result is plotted as dynamic colored bands. Green bands show heavy buy liquidity (potential support). Red bands show heavy sell liquidity (potential resistance). It gives you a real-time, visual confirmation of where the big liquidity walls are.',
            },
            {
                heading: 'Pairing with Depth Delta',
                body: 'You can pair the depth overlay with the order book depth delta indicator to spot reversals. When both indicators align — for example, green bands forming below price while depth delta turns positive — it provides stronger confirmation of a potential bottom.',
            },
        ],
    },
    'pro-tips': {
        emoji: '💡',
        sections: [
            {
                heading: 'Use Spot Order Books',
                body: 'Focus on Spot order books. They reflect real money and offer a cleaner view of genuine supply and demand. Binance Spot and Coinbase hold the deepest and most reliable liquidity.',
            },
            {
                heading: 'Avoid Perps for Heatmaps',
                body: 'The Binance Perpetuals (Perps) order book heatmap is often a mess. Massive orders with quantity above 1000 BTC are frequently placed and immediately canceled (spoofing) to manipulate the price. Do not rely on them.',
            },
            {
                heading: 'Spotting Chasing Orders',
                body: 'When actively monitoring an order book heatmap, you\'ll often spot tight consolidation followed by large limit orders suddenly appearing very close to the current price — almost as if they\'re chasing it. This can be your signal. For example, aggressive ask orders stacking up on Coinbase right above price can suppress upward movement, pressuring algos and retail traders to sell or short, pushing price lower.',
            },
            {
                heading: 'The 3D View',
                body: 'By combining the three tools — Depth, Heatmap, and Overlay — you gain a 3D view of the market. The order book is the purest form of supply and demand.',
            },
            {
                heading: 'Useful Tools',
                body: 'Recommended platforms for order book analysis: TRDR (trdr.io), Market Monkey Terminal (marketmonkeyterminal.com), Kiyotaka (kiyotaka.ai), TapeSurf (tapesurf.com).',
            },
        ],
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
    const details = ORDER_BOOK_DETAILS[lesson.lessonSlug];
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
    onSelectLesson,
}: {
    module: LearningModule;
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

    // Individual lesson view
    if (activeLesson) {
        const lesson = module.lessons.find(l => l.lessonSlug === activeLesson);
        if (lesson) {
            const details = ORDER_BOOK_DETAILS[lesson.lessonSlug];
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
            <OverviewContent module={module} onSelectLesson={setActiveLesson} />
        </LessonShell>
    );
}

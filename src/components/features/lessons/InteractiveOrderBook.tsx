'use client';

import React, { useState, useMemo, useCallback } from 'react';

// ============================================
// Standalone order book data generator
// (no external dependencies — self-contained for lessons)
// ============================================

interface OrderBookLevel {
    price: number;
    size: number;
    total: number;
}

interface OrderBookData {
    asks: OrderBookLevel[];
    bids: OrderBookLevel[];
    spread: number;
    spreadPercent: number;
}

class SimpleRNG {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

function generateOrderBook(midPrice: number, seed: number, levels: number = 15): OrderBookData {
    if (!midPrice || midPrice <= 0) {
        return { asks: [], bids: [], spread: 0, spreadPercent: 0 };
    }

    const rng = new SimpleRNG(seed + Math.floor(midPrice * 100));
    const spreadPct = 0.001 + rng.next() * 0.002;

    const bestAsk = midPrice * (1 + spreadPct / 2);
    const bestBid = midPrice * (1 - spreadPct / 2);

    const asks: OrderBookLevel[] = [];
    const bids: OrderBookLevel[] = [];

    let askTotal = 0;
    for (let i = 0; i < levels; i++) {
        const step = midPrice * (0.0005 + rng.next() * 0.001);
        const price = bestAsk + step * i;
        const size = 0.5 + rng.next() * 10;
        askTotal += size;
        asks.push({ price, size, total: askTotal });
    }

    let bidTotal = 0;
    for (let i = 0; i < levels; i++) {
        const step = midPrice * (0.0005 + rng.next() * 0.001);
        const price = bestBid - step * i;
        const size = 0.5 + rng.next() * 10;
        bidTotal += size;
        bids.push({ price, size, total: bidTotal });
    }

    return {
        asks,
        bids,
        spread: bestAsk - bestBid,
        spreadPercent: ((bestAsk - bestBid) / midPrice) * 100,
    };
}

// ============================================
// Depth chart visualisation
// ============================================

function DepthChart({ orderBook }: { orderBook: OrderBookData }) {
    const { asks, bids } = orderBook;
    if (asks.length === 0 || bids.length === 0) return null;

    const allPrices = [...bids.map(l => l.price), ...asks.map(l => l.price)];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const maxTotal = Math.max(
        bids.length > 0 ? bids[bids.length - 1].total : 0,
        asks.length > 0 ? asks[asks.length - 1].total : 0,
        1
    );

    const w = 400;
    const h = 120;
    const px = (price: number) => ((price - minPrice) / (maxPrice - minPrice)) * w;
    const py = (total: number) => h - (total / maxTotal) * (h - 10);

    // Bid curve (right to left, descending price)
    const bidPoints = [...bids].reverse().map(l => `${px(l.price)},${py(l.total)}`);
    const bidPath = `M${px(bids[bids.length - 1].price)},${h} L${bidPoints.join(' L')} L${px(bids[0].price)},${h} Z`;

    // Ask curve (left to right, ascending price)
    const askPoints = asks.map(l => `${px(l.price)},${py(l.total)}`);
    const askPath = `M${px(asks[0].price)},${h} L${askPoints.join(' L')} L${px(asks[asks.length - 1].price)},${h} Z`;

    return (
        <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
            <p className="text-[10px] font-mono text-[#585e6c] uppercase tracking-wider mb-2">Depth Chart</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
                <path d={bidPath} fill="rgba(0,230,107,0.15)" stroke="#00e66b" strokeWidth="1.5" />
                <path d={askPath} fill="rgba(255,40,90,0.15)" stroke="#ff285a" strokeWidth="1.5" />
                {/* Mid line */}
                <line
                    x1={px((bids[0].price + asks[0].price) / 2)}
                    y1={0}
                    x2={px((bids[0].price + asks[0].price) / 2)}
                    y2={h}
                    stroke="#585e6c"
                    strokeWidth="0.5"
                    strokeDasharray="4 2"
                />
            </svg>
            <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-[#00e66b]">Bids (Buy Side)</span>
                <span className="text-[9px] font-mono text-[#ff285a]">Asks (Sell Side)</span>
            </div>
        </div>
    );
}

// ============================================
// Interactive Order Book Component
// ============================================

const PAIRS: { label: string; midPrice: number }[] = [
    { label: 'BTC/USDT', midPrice: 97500 },
    { label: 'ETH/USDT', midPrice: 3450 },
    { label: 'SOL/USDT', midPrice: 178 },
];

interface InteractiveOrderBookProps {
    /** Show the depth chart below the order book */
    showDepthChart?: boolean;
    /** Show educational annotations */
    showAnnotations?: boolean;
}

export default function InteractiveOrderBook({
    showDepthChart = true,
    showAnnotations = true,
}: InteractiveOrderBookProps) {
    const [pairIdx, setPairIdx] = useState(0);
    const [seed, setSeed] = useState(42);
    const [clickedPrice, setClickedPrice] = useState<number | null>(null);

    const pair = PAIRS[pairIdx];
    const orderBook = useMemo(
        () => generateOrderBook(pair.midPrice, seed),
        [pair.midPrice, seed]
    );

    const handleRefresh = useCallback(() => setSeed(s => s + 1), []);
    const handlePriceClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const price = Number(e.currentTarget.dataset.price);
        if (price > 0) setClickedPrice(price);
    }, []);

    const maxTotal = Math.max(
        orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 0,
        orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0,
        1
    );

    const formatPrice = (price: number) => {
        if (price > 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (price < 0.001) return price.toFixed(7);
        if (price < 1) return price.toFixed(4);
        return price.toFixed(2);
    };

    const formatSize = (size: number) => {
        if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
        if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
        return size.toFixed(2);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between border border-[#1a1e26] bg-[#0b0e14] px-4 py-3">
                <div className="flex items-center gap-2">
                    {PAIRS.map((p, i) => (
                        <button
                            key={p.label}
                            onClick={() => setPairIdx(i)}
                            className={`px-3 py-1.5 text-xs font-mono border transition-all ${
                                i === pairIdx
                                    ? 'bg-[#00b3b3]/20 text-[#00e6e6] border-[#00b3b3]/30'
                                    : 'text-[#585e6c] border-[#1a1e26] hover:text-[#adb9d2] hover:border-white/10'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 text-xs font-mono text-[#585e6c] border border-[#1a1e26] hover:text-[#adb9d2] hover:border-white/10 transition-all"
                >
                    Refresh
                </button>
            </div>

            {/* Annotations: what you're looking at */}
            {showAnnotations && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#00b3b3]/5 border border-[#00b3b3]/15">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-mono text-[#00e6e6]/60">
                        Click any price level to select it. The <span className="text-[#ff285a]">red rows</span> are asks (sell orders) and <span className="text-[#00e66b]">green rows</span> are bids (buy orders). The colored bars show cumulative depth — wider bars mean more liquidity stacked at that level.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Book */}
                <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#adb9d2] uppercase tracking-wider">Order Book</span>
                        <span className="text-[10px] font-mono text-white">{pair.label}</span>
                    </div>

                    {/* Column Headers */}
                    <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-[#585e6c] uppercase tracking-wider mb-1 px-1">
                        <span>Price</span>
                        <span className="text-right">Size</span>
                        <span className="text-right">Total</span>
                    </div>

                    {/* Asks (reversed — lowest closest to spread) */}
                    <div className="flex flex-col justify-end">
                        {[...orderBook.asks].reverse().map((level, i) => (
                            <button
                                key={`ask-${i}`}
                                data-price={level.price}
                                onClick={handlePriceClick}
                                className={`relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 transition-colors cursor-pointer ${
                                    clickedPrice === level.price ? 'bg-[#ff285a]/10' : 'hover:bg-[#11141a]'
                                }`}
                            >
                                <div
                                    className="absolute right-0 top-0 bottom-0 bg-[#ff285a]/8 transition-all"
                                    style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                />
                                <span className="text-[#ff285a] relative z-10">{formatPrice(level.price)}</span>
                                <span className="text-[#adb9d2] text-right relative z-10">{formatSize(level.size)}</span>
                                <span className="text-[#585e6c] text-right relative z-10">{formatSize(level.total)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Spread */}
                    <div className="py-1.5 px-1 border-y border-[#1a1e26] my-0.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#adb9d2]">
                            {formatPrice(orderBook.spread)}
                        </span>
                        <span className="text-[9px] font-mono text-[#585e6c]">
                            Spread {orderBook.spreadPercent.toFixed(3)}%
                        </span>
                    </div>

                    {/* Bids */}
                    <div>
                        {orderBook.bids.map((level, i) => (
                            <button
                                key={`bid-${i}`}
                                data-price={level.price}
                                onClick={handlePriceClick}
                                className={`relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 transition-colors cursor-pointer w-full ${
                                    clickedPrice === level.price ? 'bg-[#00e66b]/10' : 'hover:bg-[#11141a]'
                                }`}
                            >
                                <div
                                    className="absolute right-0 top-0 bottom-0 bg-[#00e66b]/8 transition-all"
                                    style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                />
                                <span className="text-[#00e66b] relative z-10">{formatPrice(level.price)}</span>
                                <span className="text-[#adb9d2] text-right relative z-10">{formatSize(level.size)}</span>
                                <span className="text-[#585e6c] text-right relative z-10">{formatSize(level.total)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right side: Info panel */}
                <div className="space-y-4">
                    {/* Selected price */}
                    <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
                        <p className="text-[10px] font-mono text-[#585e6c] uppercase tracking-wider mb-2">Selected Level</p>
                        {clickedPrice ? (
                            <div className="space-y-2">
                                <p className="text-lg font-mono text-white">{formatPrice(clickedPrice)}</p>
                                {(() => {
                                    const askLevel = orderBook.asks.find(l => l.price === clickedPrice);
                                    const bidLevel = orderBook.bids.find(l => l.price === clickedPrice);
                                    const level = askLevel || bidLevel;
                                    const side = askLevel ? 'Ask' : 'Bid';
                                    const color = askLevel ? 'text-[#ff285a]' : 'text-[#00e66b]';
                                    if (!level) return null;
                                    return (
                                        <>
                                            <p className={`text-xs font-mono ${color}`}>{side} Side</p>
                                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                                <div>
                                                    <span className="text-[#585e6c]">Size: </span>
                                                    <span className="text-[#adb9d2]">{formatSize(level.size)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#585e6c]">Cumulative: </span>
                                                    <span className="text-[#adb9d2]">{formatSize(level.total)}</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <p className="text-xs font-mono text-[#585e6c]">Click a price level in the order book</p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
                        <p className="text-[10px] font-mono text-[#585e6c] uppercase tracking-wider mb-3">Book Stats</p>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between">
                                <span className="text-[#585e6c]">Best Ask</span>
                                <span className="text-[#ff285a]">{orderBook.asks.length > 0 ? formatPrice(orderBook.asks[0].price) : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#585e6c]">Best Bid</span>
                                <span className="text-[#00e66b]">{orderBook.bids.length > 0 ? formatPrice(orderBook.bids[0].price) : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#585e6c]">Spread</span>
                                <span className="text-[#adb9d2]">{formatPrice(orderBook.spread)} ({orderBook.spreadPercent.toFixed(3)}%)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#585e6c]">Total Ask Depth</span>
                                <span className="text-[#ff285a]">{orderBook.asks.length > 0 ? formatSize(orderBook.asks[orderBook.asks.length - 1].total) : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#585e6c]">Total Bid Depth</span>
                                <span className="text-[#00e66b]">{orderBook.bids.length > 0 ? formatSize(orderBook.bids[orderBook.bids.length - 1].total) : '—'}</span>
                            </div>
                            {(() => {
                                const totalBid = orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0;
                                const totalAsk = orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 0;
                                const delta = totalBid - totalAsk;
                                const isPositive = delta >= 0;
                                return (
                                    <div className="flex justify-between pt-2 border-t border-[#1a1e26]">
                                        <span className="text-[#585e6c]">Depth Delta</span>
                                        <span className={isPositive ? 'text-[#00e66b]' : 'text-[#ff285a]'}>
                                            {isPositive ? '+' : ''}{formatSize(delta)} ({isPositive ? 'Bid heavy' : 'Ask heavy'})
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Depth Chart */}
            {showDepthChart && <DepthChart orderBook={orderBook} />}
        </div>
    );
}

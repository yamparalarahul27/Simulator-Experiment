'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

// ============================================
// Types
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

// ============================================
// AnimatedCell — flashes on value change
// ============================================

const AnimatedCell = memo(function AnimatedCell({
    value,
    className,
}: {
    value: string;
    className: string;
}) {
    const prevRef = useRef(value);
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        if (prevRef.current !== value) {
            const prevNum = parseFloat(prevRef.current.replace(/,/g, ''));
            const currNum = parseFloat(value.replace(/,/g, ''));
            if (!isNaN(prevNum) && !isNaN(currNum) && prevNum !== currNum) {
                setFlash(currNum > prevNum ? 'up' : 'down');
                const timer = setTimeout(() => setFlash(null), 300);
                prevRef.current = value;
                return () => clearTimeout(timer);
            }
            prevRef.current = value;
        }
    }, [value]);

    return (
        <span
            className={`${className} transition-colors duration-300`}
            style={{
                backgroundColor: flash === 'up'
                    ? 'rgba(26, 122, 58, 0.15)'
                    : flash === 'down'
                    ? 'rgba(196, 43, 58, 0.15)'
                    : 'transparent',
            }}
        >
            {value}
        </span>
    );
});

const EMPTY_BOOK: OrderBookData = { asks: [], bids: [], spread: 0, spreadPercent: 0 };

// ============================================
// Binance depth stream
// ============================================

const PAIRS = [
    { label: 'BTC/USDT', symbol: 'BTCUSDT' },
    { label: 'ETH/USDT', symbol: 'ETHUSDT' },
    { label: 'SOL/USDT', symbol: 'SOLUSDT' },
] as const;

const DEPTH_LEVELS = 20;

/**
 * Parse Binance depth snapshot into our OrderBookData format.
 * Binance returns: { asks: [["price","qty"], ...], bids: [["price","qty"], ...] }
 */
function parseBinanceDepth(data: { asks: string[][]; bids: string[][] }): OrderBookData {
    const asks: OrderBookLevel[] = [];
    const bids: OrderBookLevel[] = [];

    let askTotal = 0;
    for (const [p, q] of data.asks) {
        const price = parseFloat(p);
        const size = parseFloat(q);
        if (size === 0) continue;
        askTotal += size;
        asks.push({ price, size, total: askTotal });
    }

    let bidTotal = 0;
    for (const [p, q] of data.bids) {
        const price = parseFloat(p);
        const size = parseFloat(q);
        if (size === 0) continue;
        bidTotal += size;
        bids.push({ price, size, total: bidTotal });
    }

    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const mid = (bestAsk + bestBid) / 2 || 1;

    return {
        asks,
        bids,
        spread: bestAsk - bestBid,
        spreadPercent: mid > 0 ? ((bestAsk - bestBid) / mid) * 100 : 0,
    };
}

/**
 * Hook that streams live order book data from Binance.
 * Uses the partial book depth WebSocket stream (depth20@1000ms)
 * with REST snapshot fallback.
 */
function useBinanceOrderBook(symbol: string) {
    const [orderBook, setOrderBook] = useState<OrderBookData>(EMPTY_BOOK);
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let cancelled = false;

        // First fetch a REST snapshot for immediate display
        const fetchSnapshot = async () => {
            try {
                const res = await fetch(
                    `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${DEPTH_LEVELS}`
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (!cancelled) {
                    setOrderBook(parseBinanceDepth(data));
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) setError('Failed to fetch order book');
            }
        };
        fetchSnapshot();

        // Then open WebSocket for live updates
        const stream = `${symbol.toLowerCase()}@depth${DEPTH_LEVELS}@1000ms`;
        const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!cancelled) {
                setIsLive(true);
                setError(null);
            }
        };

        ws.onmessage = (event) => {
            if (cancelled) return;
            try {
                const data = JSON.parse(event.data);
                // Partial depth stream returns { asks, bids } directly
                if (data.asks && data.bids) {
                    setOrderBook(parseBinanceDepth(data));
                }
            } catch { /* ignore parse errors */ }
        };

        ws.onerror = () => {
            if (!cancelled) {
                setIsLive(false);
                setError('WebSocket failed — using snapshot');
            }
        };

        ws.onclose = () => {
            if (!cancelled) setIsLive(false);
        };

        return () => {
            cancelled = true;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            wsRef.current = null;
        };
    }, [symbol]);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(
                `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${DEPTH_LEVELS}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setOrderBook(parseBinanceDepth(data));
            setError(null);
        } catch {
            setError('Failed to refresh');
        }
    }, [symbol]);

    return { orderBook, isLive, error, refresh };
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
        bids[bids.length - 1].total,
        asks[asks.length - 1].total,
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
        <div className="border border-bs-border bg-bs-bg p-4">
            <p className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-2">Depth Chart</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
                <path d={bidPath} fill="rgba(26,122,58,0.15)" stroke="var(--bs-success)" strokeWidth="1.5" />
                <path d={askPath} fill="rgba(196,43,58,0.15)" stroke="var(--bs-error)" strokeWidth="1.5" />
                <line
                    x1={px((bids[0].price + asks[0].price) / 2)}
                    y1={0}
                    x2={px((bids[0].price + asks[0].price) / 2)}
                    y2={h}
                    stroke="var(--bs-text-mute)"
                    strokeWidth="0.5"
                    strokeDasharray="4 2"
                />
            </svg>
            <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-bs-success">Bids (Buy Side)</span>
                <span className="text-[9px] font-mono text-bs-error">Asks (Sell Side)</span>
            </div>
        </div>
    );
}

// ============================================
// Interactive Order Book Component
// ============================================

interface InteractiveOrderBookProps {
    showDepthChart?: boolean;
    showAnnotations?: boolean;
}

export default function InteractiveOrderBook({
    showDepthChart = true,
    showAnnotations = true,
}: InteractiveOrderBookProps) {
    const [pairIdx, setPairIdx] = useState(0);
    const [clickedPrice, setClickedPrice] = useState<number | null>(null);

    const pair = PAIRS[pairIdx];
    const { orderBook, isLive, error, refresh } = useBinanceOrderBook(pair.symbol);

    const handlePriceClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const price = Number(e.currentTarget.dataset.price);
        if (price > 0) setClickedPrice(price);
    }, []);

    // Reset selection when switching pairs
    useEffect(() => setClickedPrice(null), [pairIdx]);

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
        return size.toFixed(4);
    };

    const isEmpty = orderBook.asks.length === 0 && orderBook.bids.length === 0;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between border border-bs-border bg-bs-bg px-4 py-3">
                <div className="flex items-center gap-2">
                    {PAIRS.map((p, i) => (
                        <button
                            key={p.label}
                            onClick={() => setPairIdx(i)}
                            className={`px-3 py-1.5 text-xs font-mono border transition-all ${
                                i === pairIdx
                                    ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border-bs-brand-tertiary/30'
                                    : 'text-bs-text-mute border-bs-border hover:text-bs-text-tertiary hover:border-bs-border'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-bs-success animate-pulse' : error ? 'bg-bs-error' : 'bg-bs-text-mute'}`} />
                        <span className={`text-[9px] font-mono ${isLive ? 'text-bs-success' : error ? 'text-bs-error' : 'text-bs-text-mute'}`}>
                            {isLive ? 'LIVE' : error ? 'REST' : 'CONNECTING'}
                        </span>
                    </div>
                    <button
                        onClick={refresh}
                        className="px-3 py-1.5 text-xs font-mono text-bs-text-mute border border-bs-border hover:text-bs-text-tertiary hover:border-bs-border transition-all"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Annotations */}
            {showAnnotations && (
                <div className="flex items-center gap-3 px-4 py-3 bg-bs-brand-tertiary/5 border border-bs-brand-tertiary/15">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-mono text-bs-brand-secondary/60">
                        This is <strong className="text-bs-brand-secondary/80">live data from Binance</strong> — updating every second. Click any price level to inspect it. The <span className="text-bs-error">red rows</span> are asks (sell orders) and <span className="text-bs-success">green rows</span> are bids (buy orders). The colored bars show cumulative depth.
                    </p>
                </div>
            )}

            {/* Loading state */}
            {isEmpty && !error && (
                <div className="flex items-center justify-center py-12 border border-bs-border bg-bs-bg">
                    <p className="text-xs font-mono text-bs-text-mute">Loading order book from Binance...</p>
                </div>
            )}

            {/* Error state */}
            {isEmpty && error && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 border border-bs-border bg-bs-bg">
                    <p className="text-xs font-mono text-bs-error">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 text-xs font-mono text-bs-brand-secondary border border-bs-brand-tertiary/30 hover:bg-bs-brand-tertiary/10 transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Main content */}
            {!isEmpty && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Book */}
                    <div className="border border-bs-border bg-bs-bg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-bs-text-tertiary uppercase tracking-wider">Order Book</span>
                            <span className="text-[10px] font-mono text-bs-text-primary">{pair.label}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-bs-text-mute uppercase tracking-wider mb-1 px-1">
                            <span>Price</span>
                            <span className="text-right">Size</span>
                            <span className="text-right">Total</span>
                        </div>

                        {/* Asks (reversed — lowest closest to spread) */}
                        <div className="flex flex-col justify-end">
                            {[...orderBook.asks].reverse().map((level) => (
                                <button
                                    key={`ask-${level.price}`}
                                    data-price={level.price}
                                    onClick={handlePriceClick}
                                    className={`relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 transition-colors cursor-pointer ${
                                        clickedPrice === level.price ? 'bg-bs-error/10' : 'hover:bg-bs-card'
                                    }`}
                                >
                                    <div
                                        className="absolute right-0 top-0 bottom-0 bg-bs-error/8 transition-all duration-500"
                                        style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                    />
                                    <AnimatedCell value={formatPrice(level.price)} className="text-bs-error relative z-10" />
                                    <AnimatedCell value={formatSize(level.size)} className="text-bs-text-tertiary text-right relative z-10" />
                                    <AnimatedCell value={formatSize(level.total)} className="text-bs-text-mute text-right relative z-10" />
                                </button>
                            ))}
                        </div>

                        {/* Spread */}
                        <div className="py-1.5 px-1 border-y border-bs-border my-0.5 flex items-center justify-between">
                            <AnimatedCell value={formatPrice(orderBook.spread)} className="text-[10px] font-mono text-bs-text-tertiary" />
                            <AnimatedCell value={`Spread ${orderBook.spreadPercent.toFixed(3)}%`} className="text-[9px] font-mono text-bs-text-mute" />
                        </div>

                        {/* Bids */}
                        <div>
                            {orderBook.bids.map((level) => (
                                <button
                                    key={`bid-${level.price}`}
                                    data-price={level.price}
                                    onClick={handlePriceClick}
                                    className={`relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 transition-colors cursor-pointer w-full ${
                                        clickedPrice === level.price ? 'bg-bs-success/10' : 'hover:bg-bs-card'
                                    }`}
                                >
                                    <div
                                        className="absolute right-0 top-0 bottom-0 bg-bs-success/8 transition-all duration-500"
                                        style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                    />
                                    <AnimatedCell value={formatPrice(level.price)} className="text-bs-success relative z-10" />
                                    <AnimatedCell value={formatSize(level.size)} className="text-bs-text-tertiary text-right relative z-10" />
                                    <AnimatedCell value={formatSize(level.total)} className="text-bs-text-mute text-right relative z-10" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Info panel */}
                    <div className="space-y-4">
                        {/* Selected price */}
                        <div className="border border-bs-border bg-bs-bg p-4">
                            <p className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-2">Selected Level</p>
                            {clickedPrice ? (
                                <div className="space-y-2">
                                    <p className="text-lg font-mono text-bs-text-primary">{formatPrice(clickedPrice)}</p>
                                    {(() => {
                                        const askLevel = orderBook.asks.find(l => l.price === clickedPrice);
                                        const bidLevel = orderBook.bids.find(l => l.price === clickedPrice);
                                        const level = askLevel || bidLevel;
                                        const side = askLevel ? 'Ask' : 'Bid';
                                        const color = askLevel ? 'text-bs-error' : 'text-bs-success';
                                        if (!level) return <p className="text-xs font-mono text-bs-text-mute">Level no longer in book (price moved)</p>;
                                        return (
                                            <>
                                                <p className={`text-xs font-mono ${color}`}>{side} Side</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                                    <div>
                                                        <span className="text-bs-text-mute">Size: </span>
                                                        <span className="text-bs-text-tertiary">{formatSize(level.size)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-bs-text-mute">Cumulative: </span>
                                                        <span className="text-bs-text-tertiary">{formatSize(level.total)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <p className="text-xs font-mono text-bs-text-mute">Click a price level in the order book</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="border border-bs-border bg-bs-bg p-4">
                            <p className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-3">Book Stats</p>
                            <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-bs-text-mute">Best Ask</span>
                                    <span className="text-bs-error">{orderBook.asks.length > 0 ? formatPrice(orderBook.asks[0].price) : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-bs-text-mute">Best Bid</span>
                                    <span className="text-bs-success">{orderBook.bids.length > 0 ? formatPrice(orderBook.bids[0].price) : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-bs-text-mute">Spread</span>
                                    <span className="text-bs-text-tertiary">{formatPrice(orderBook.spread)} ({orderBook.spreadPercent.toFixed(3)}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-bs-text-mute">Total Ask Depth</span>
                                    <span className="text-bs-error">{orderBook.asks.length > 0 ? formatSize(orderBook.asks[orderBook.asks.length - 1].total) : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-bs-text-mute">Total Bid Depth</span>
                                    <span className="text-bs-success">{orderBook.bids.length > 0 ? formatSize(orderBook.bids[orderBook.bids.length - 1].total) : '—'}</span>
                                </div>
                                {(() => {
                                    const totalBid = orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0;
                                    const totalAsk = orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 0;
                                    const delta = totalBid - totalAsk;
                                    const isPositive = delta >= 0;
                                    return (
                                        <div className="flex justify-between pt-2 border-t border-bs-border">
                                            <span className="text-bs-text-mute">Depth Delta</span>
                                            <span className={isPositive ? 'text-bs-success' : 'text-bs-error'}>
                                                {isPositive ? '+' : ''}{formatSize(delta)} ({isPositive ? 'Bid heavy' : 'Ask heavy'})
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Depth Chart */}
            {showDepthChart && !isEmpty && <DepthChart orderBook={orderBook} />}
        </div>
    );
}

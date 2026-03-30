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
                    ? 'rgba(0, 230, 107, 0.15)'
                    : flash === 'down'
                    ? 'rgba(255, 40, 90, 0.15)'
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
        <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
            <p className="text-[10px] font-mono text-[#585e6c] uppercase tracking-wider mb-2">Depth Chart</p>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
                <path d={bidPath} fill="rgba(0,230,107,0.15)" stroke="#00e66b" strokeWidth="1.5" />
                <path d={askPath} fill="rgba(255,40,90,0.15)" stroke="#ff285a" strokeWidth="1.5" />
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
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#00e66b] animate-pulse' : error ? 'bg-[#ff285a]' : 'bg-[#585e6c]'}`} />
                        <span className={`text-[9px] font-mono ${isLive ? 'text-[#00e66b]' : error ? 'text-[#ff285a]' : 'text-[#585e6c]'}`}>
                            {isLive ? 'LIVE' : error ? 'REST' : 'CONNECTING'}
                        </span>
                    </div>
                    <button
                        onClick={refresh}
                        className="px-3 py-1.5 text-xs font-mono text-[#585e6c] border border-[#1a1e26] hover:text-[#adb9d2] hover:border-white/10 transition-all"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Annotations */}
            {showAnnotations && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#00b3b3]/5 border border-[#00b3b3]/15">
                    <span className="text-sm">💡</span>
                    <p className="text-xs font-mono text-[#00e6e6]/60">
                        This is <strong className="text-[#00e6e6]/80">live data from Binance</strong> — updating every second. Click any price level to inspect it. The <span className="text-[#ff285a]">red rows</span> are asks (sell orders) and <span className="text-[#00e66b]">green rows</span> are bids (buy orders). The colored bars show cumulative depth.
                    </p>
                </div>
            )}

            {/* Loading state */}
            {isEmpty && !error && (
                <div className="flex items-center justify-center py-12 border border-[#1a1e26] bg-[#0b0e14]">
                    <p className="text-xs font-mono text-[#585e6c]">Loading order book from Binance...</p>
                </div>
            )}

            {/* Error state */}
            {isEmpty && error && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 border border-[#1a1e26] bg-[#0b0e14]">
                    <p className="text-xs font-mono text-[#ff285a]">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 text-xs font-mono text-[#00e6e6] border border-[#00b3b3]/30 hover:bg-[#00b3b3]/10 transition-all"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Main content */}
            {!isEmpty && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Book */}
                    <div className="border border-[#1a1e26] bg-[#0b0e14] p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-[#adb9d2] uppercase tracking-wider">Order Book</span>
                            <span className="text-[10px] font-mono text-white">{pair.label}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-[#585e6c] uppercase tracking-wider mb-1 px-1">
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
                                        clickedPrice === level.price ? 'bg-[#ff285a]/10' : 'hover:bg-[#11141a]'
                                    }`}
                                >
                                    <div
                                        className="absolute right-0 top-0 bottom-0 bg-[#ff285a]/8 transition-all duration-500"
                                        style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                    />
                                    <AnimatedCell value={formatPrice(level.price)} className="text-[#ff285a] relative z-10" />
                                    <AnimatedCell value={formatSize(level.size)} className="text-[#adb9d2] text-right relative z-10" />
                                    <AnimatedCell value={formatSize(level.total)} className="text-[#585e6c] text-right relative z-10" />
                                </button>
                            ))}
                        </div>

                        {/* Spread */}
                        <div className="py-1.5 px-1 border-y border-[#1a1e26] my-0.5 flex items-center justify-between">
                            <AnimatedCell value={formatPrice(orderBook.spread)} className="text-[10px] font-mono text-[#adb9d2]" />
                            <AnimatedCell value={`Spread ${orderBook.spreadPercent.toFixed(3)}%`} className="text-[9px] font-mono text-[#585e6c]" />
                        </div>

                        {/* Bids */}
                        <div>
                            {orderBook.bids.map((level) => (
                                <button
                                    key={`bid-${level.price}`}
                                    data-price={level.price}
                                    onClick={handlePriceClick}
                                    className={`relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 transition-colors cursor-pointer w-full ${
                                        clickedPrice === level.price ? 'bg-[#00e66b]/10' : 'hover:bg-[#11141a]'
                                    }`}
                                >
                                    <div
                                        className="absolute right-0 top-0 bottom-0 bg-[#00e66b]/8 transition-all duration-500"
                                        style={{ width: `${(level.total / maxTotal) * 100}%` }}
                                    />
                                    <AnimatedCell value={formatPrice(level.price)} className="text-[#00e66b] relative z-10" />
                                    <AnimatedCell value={formatSize(level.size)} className="text-[#adb9d2] text-right relative z-10" />
                                    <AnimatedCell value={formatSize(level.total)} className="text-[#585e6c] text-right relative z-10" />
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
                                        if (!level) return <p className="text-xs font-mono text-[#585e6c]">Level no longer in book (price moved)</p>;
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
            )}

            {/* Depth Chart */}
            {showDepthChart && !isEmpty && <DepthChart orderBook={orderBook} />}
        </div>
    );
}

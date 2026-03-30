'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
    symbol: string;
    targetSymbol: string;
    price: string;
    change: number;
}

// 1. Define the Tokens & Map them to their EXACT Binance pairs
const SUPPORTED_TOKENS = [
    { display: 'BTC', binance: 'BTCUSDT' },
    { display: 'ETH', binance: 'ETHUSDT' },
    { display: 'SOL', binance: 'SOLUSDT' },
    { display: 'JUP', binance: 'JUPUSDT' },
    { display: 'PYTH', binance: 'PYTHUSDT' },
    { display: 'BONK', binance: 'BONKUSDT' },
    { display: 'JTO', binance: 'JTOUSDT' },
    { display: 'WIF', binance: 'WIFUSDT' },
    { display: 'RAY', binance: 'RAYUSDT' }
];

// Shared price formatter (used by both WS and REST paths)
const formatPrice = (priceNum: number): string => {
    if (priceNum > 1000) {
        return priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (priceNum < 0.01) {
        return priceNum.toFixed(7);
    }
    return priceNum.toFixed(4);
};

export const MarketTicker: React.FC = () => {
    // Dictionary state for O(1) performance updates
    const [tickerMap, setTickerMap] = useState<Record<string, TickerItem>>({});
    const [isConnecting, setIsConnecting] = useState(true);
    const [dataSource, setDataSource] = useState<'ws' | 'rest' | null>(null);

    // Use a ref to store the latest incoming data without triggering constant re-renders
    const latestDataRef = useRef<Record<string, TickerItem>>({});
    const isConnectingRef = useRef(true);
    const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ─── REST fallback fetcher ───
        const fetchRestPrices = async () => {
            try {
                const res = await fetch('/api/prices');
                if (!res.ok) return;
                const data: Record<string, { price: number; change: number }> = await res.json();

                for (const tokenConfig of SUPPORTED_TOKENS) {
                    const restData = data[tokenConfig.display];
                    if (restData) {
                        latestDataRef.current[tokenConfig.binance] = {
                            symbol: `${tokenConfig.display}/USDT`,
                            targetSymbol: tokenConfig.binance,
                            price: formatPrice(restData.price),
                            change: Number(restData.change.toFixed(2)),
                        };
                    }
                }

                if (isConnectingRef.current && Object.keys(latestDataRef.current).length >= SUPPORTED_TOKENS.length / 2) {
                    isConnectingRef.current = false;
                    setIsConnecting(false);
                }
            } catch (e) {
                console.warn('[MarketTicker] REST fetch failed:', e);
            }
        };

        // ─── Binance WebSocket ───
        const streams = SUPPORTED_TOKENS.map(t => `${t.binance.toLowerCase()}@ticker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.data) {
                    const d = message.data;
                    const binanceSymbol = d.s;
                    const token = SUPPORTED_TOKENS.find(t => t.binance === binanceSymbol);

                    if (token) {
                        const priceNum = parseFloat(d.c);
                        latestDataRef.current[binanceSymbol] = {
                            symbol: `${token.display}/USDT`,
                            targetSymbol: binanceSymbol,
                            price: formatPrice(priceNum),
                            change: Number(parseFloat(d.P).toFixed(2)),
                        };

                        if (isConnectingRef.current && Object.keys(latestDataRef.current).length >= SUPPORTED_TOKENS.length / 2) {
                            isConnectingRef.current = false;
                            setIsConnecting(false);
                        }
                    }
                }
            } catch (err) {
                console.error('[MarketTicker] WS parse error', err);
            }
        };

        ws.onopen = () => {
            setDataSource('ws');
            if (restIntervalRef.current) {
                clearInterval(restIntervalRef.current);
                restIntervalRef.current = null;
            }
        };

        ws.onerror = (error: any) => {
            console.warn('[MarketTicker] WS failed, switching to CoinGecko REST:',
                error?.message || error?.type || 'Unknown');
            setDataSource('rest');

            if (!restIntervalRef.current) {
                fetchRestPrices();
                restIntervalRef.current = setInterval(fetchRestPrices, 5000);
            }
        };

        // Throttle React state updates to ~2 times a second
        const intervalId = setInterval(() => {
            setTickerMap({ ...latestDataRef.current });
        }, 500);

        return () => {
            clearInterval(intervalId);
            if (restIntervalRef.current) {
                clearInterval(restIntervalRef.current);
                restIntervalRef.current = null;
            }
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                ws.close();
            }
        };
    }, []);

    // 2. Convert map back to ordered array
    const orderedTickers = useMemo(() => {
        return SUPPORTED_TOKENS.map(t => tickerMap[t.binance]).filter(Boolean);
    }, [tickerMap]);

    // 3. Duplicate items 3x for smooth infinite CSS scrolling
    const items = useMemo(() => {
        if (orderedTickers.length === 0) return [];
        return [...orderedTickers, ...orderedTickers, ...orderedTickers];
    }, [orderedTickers]);

    const isLoading = isConnecting && orderedTickers.length === 0;

    return (
        <div className="w-full bg-bs-bg border-b border-bs-border overflow-hidden h-10 flex items-center justify-center fixed top-0 left-0 right-0 z-[60]">
            {/* Edge Fade Gradients */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {isLoading ? (
                <div className="flex items-center justify-center w-full z-20">
                    <span className="text-[10px] font-mono font-bold text-bs-text-mute uppercase tracking-widest animate-pulse">
                        {dataSource === 'rest'
                            ? 'Fetching prices from CoinGecko...'
                            : 'Connecting to Binance Live Stream...'}
                    </span>
                </div>
            ) : (
                <div className="flex animate-marquee whitespace-nowrap w-full justify-start">
                    {items.map((item, i) => (
                        <div
                            key={`${item.targetSymbol}-${i}`}
                            className="flex items-center gap-6 px-12 border-r border-bs-border last:border-none"
                        >
                            <span className="text-[10px] font-mono font-bold text-bs-text-mute uppercase tracking-widest">
                                {item.symbol}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-pixel text-bs-text-primary tracking-widest w-[80px]">
                                    ${item.price}
                                </span>
                                <div className={`flex items-center gap-1 text-[9px] font-mono font-bold w-[45px] ${item.change >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                    {item.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {Math.abs(item.change)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
            `}</style>
        </div>
    );
};

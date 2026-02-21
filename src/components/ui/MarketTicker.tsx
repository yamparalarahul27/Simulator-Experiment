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

export const MarketTicker: React.FC = () => {
    // Dictionary state for O(1) performance updates
    const [tickerMap, setTickerMap] = useState<Record<string, TickerItem>>({});
    const [isConnecting, setIsConnecting] = useState(true);

    // Use a ref to store the latest incoming data without triggering constant re-renders
    const latestDataRef = useRef<Record<string, TickerItem>>({});
    const isConnectingRef = useRef(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Construct the combined stream URL for all tokens
        const streams = SUPPORTED_TOKENS.map(t => `${t.binance.toLowerCase()}@ticker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.data) {
                    const data = message.data;
                    const binanceSymbol = data.s; // 's' is the symbol in Binance payloads
                    const token = SUPPORTED_TOKENS.find(t => t.binance === binanceSymbol);

                    if (token) {
                        const priceNum = parseFloat(data.c); // 'c' is current price
                        let formattedPrice = data.c;

                        // Dynamic formatting logic based on asset value
                        if (priceNum > 1000) {
                            formattedPrice = priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        } else if (priceNum < 0.01) {
                            formattedPrice = priceNum.toFixed(7);
                        } else {
                            formattedPrice = priceNum.toFixed(4);
                        }

                        // Update ref (synchronous, no re-render)
                        latestDataRef.current[binanceSymbol] = {
                            symbol: `${token.display}/USDT`,
                            targetSymbol: binanceSymbol,
                            price: formattedPrice,
                            change: Number(parseFloat(data.P).toFixed(2)) // 'P' is price change %
                        };

                        // Check connection logic
                        if (isConnectingRef.current && Object.keys(latestDataRef.current).length >= SUPPORTED_TOKENS.length / 2) {
                            isConnectingRef.current = false;
                            setIsConnecting(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Error parsing Binance websocket message", err);
            }
        };

        ws.onerror = (error) => {
            console.error("Binance WebSocket Error:", error);
            console.dir(error);
            setIsConnecting(false);
        };

        // Throttle React state updates to ~2 times a second to prevent excessive re-renders
        // Vercel Best Practice: rerender-use-ref-transient-values
        const intervalId = setInterval(() => {
            setTickerMap({ ...latestDataRef.current });
        }, 500);

        // Important: Teardown connection & interval on unmount
        return () => {
            clearInterval(intervalId);
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
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
        <div className="w-full bg-black border-b border-white/10 overflow-hidden h-10 flex items-center justify-center fixed top-0 left-0 right-0 z-[60]">
            {/* Edge Fade Gradients */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {isLoading ? (
                <div className="flex items-center justify-center w-full z-20">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest animate-pulse">
                        Connecting to Binance Live Stream...
                    </span>
                </div>
            ) : (
                <div className="flex animate-marquee whitespace-nowrap w-full justify-start">
                    {items.map((item, i) => (
                        <div
                            key={`${item.targetSymbol}-${i}`}
                            className="flex items-center gap-6 px-12 border-r border-white/5 last:border-none"
                        >
                            <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                                {item.symbol}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-pixel text-white tracking-widest w-[80px]">
                                    ${item.price}
                                </span>
                                <div className={`flex items-center gap-1 text-[9px] font-mono font-bold w-[45px] ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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

# Market Ticker Implementation Guide

This document outlines the architecture, data source, and code implementation for a real-time cryptocurrency market ticker designed for React/Next.js and Tailwind CSS applications.

## Overview

The `MarketTicker` is a live, infinitely scrolling marquee that displays real-time pricing and 24-hour percentage changes for a curated list of supported cryptocurrencies.

## Data Source: Binance Public WebSocket API

Unlike REST APIs that require 60-second polling and often impose rate limits or require API keys (like FMP or CoinGecko), this implementation leverages the **Binance Public WebSocket API**. 
- **Endpoint Used**: `wss://stream.binance.com:9443/stream?streams=<stream1>/<stream2>/...`
- **Stream Type**: Individual Symbol Ticker (`<symbol>@ticker`)
- **Cost**: 100% Free
- **Authentication**: None required (No API Keys)

By passing multiple streams in the connection URL (e.g., `btcusdt@ticker/ethusdt@ticker`), the UI receives instant, low-latency push updates within milliseconds whenever live trades occur on the exchange.

## Key Engineering Decisions

1. **State Management Dictionary**:
   Incoming WebSocket messages fire dozens of times per second. Instead of updating an Array (which requires expensive `findIndex` operations on every tick), the state (`tickerMap`) uses a dictionary (`Record<string, TickerItem>`). This allows **O(1)** fast updates where only the specific token's data is overwritten.
   
2. **Consistent Ordering**:
   A dictionary does not guarantee display order. A `useMemo` hook (`orderedTickers`) maps over the immutable `SUPPORTED_TOKENS` array to extract items from the `tickerMap`, ensuring the ticker always renders tokens in the exact same sequence (e.g., BTC, then ETH, then SOL).

3. **WebSocket Lifecycle**:
   The WebSocket connection is initialized safely inside a `useEffect`. A cleanup function `return () => ws.close()` ensures the socket is cleanly disconnected if the routing changes or the component unmounts, preventing massive memory leaks and zombie network connections.

4. **Infinite CSS Marquee**:
   The CSS scrolling uses a native `@keyframes` hardware-accelerated text translation. By duplicating the `orderedTickers` array three times into the `items` array, the container seamlessly wraps around without the user ever seeing blank space at the end of the scroll.

5. **Loading State Check**:
   On initial mount, WebSocket sockets take a second to connect and await the first packets. A centered loading indicator (`Connecting to Binance Live Stream...`) is shown until data for at least 50% of the tokens has been successfully received, ensuring the UI doesn't look instantly broken.

---

## Full Source Code

**Dependencies:**
- `lucide-react` (for the up/down trend arrows)
- Tailwind CSS (for layout and styling)

```tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

    useEffect(() => {
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

                        setTickerMap(prev => {
                            const newMap = {
                                ...prev,
                                [binanceSymbol]: {
                                    symbol: `${token.display}/USDT`,
                                    targetSymbol: binanceSymbol,
                                    price: formattedPrice,
                                    change: Number(parseFloat(data.P).toFixed(2)) // 'P' is price change %
                                }
                            };
                            
                            // Dismiss loader once 50% of streams are initialized
                            if (Object.keys(newMap).length >= SUPPORTED_TOKENS.length / 2) {
                                setIsConnecting(false);
                            }
                            
                            return newMap;
                        });
                    }
                }
            } catch (err) {
                console.error("Error parsing Binance websocket message", err);
            }
        };

        ws.onerror = (error) => {
            console.error("Binance WebSocket Error:", error);
            setIsConnecting(false); 
        };

        // Important: Teardown connection on unmount
        return () => {
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
```

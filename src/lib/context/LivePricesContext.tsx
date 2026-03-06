'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// Duplicated from useSpotTrade to avoid circular import
type DemoToken = 'SOL' | 'BTC' | 'ETH' | 'JUP' | 'BONK' | 'XRP';

interface PriceData {
    price: number;
    change: number;
    isOverridden: boolean;
}

const DEMO_PAIRS: { token: DemoToken; binance: string }[] = [
    { token: 'SOL', binance: 'SOLUSDT' },
    { token: 'BTC', binance: 'BTCUSDT' },
    { token: 'ETH', binance: 'ETHUSDT' },
    { token: 'JUP', binance: 'JUPUSDT' },
    { token: 'BONK', binance: 'BONKUSDT' },
    { token: 'XRP', binance: 'XRPUSDT' },
];

const BINANCE_TO_TOKEN: Record<string, DemoToken> = {};
DEMO_PAIRS.forEach(p => { BINANCE_TO_TOKEN[p.binance] = p.token; });

interface LivePricesValue {
    livePrices: Record<string, PriceData>;
    wsSource: 'ws' | 'rest' | null;
}

const LivePricesContext = createContext<LivePricesValue>({
    livePrices: {},
    wsSource: null,
});

export function LivePricesProvider({ children }: { children: React.ReactNode }) {
    const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
    const [wsSource, setWsSource] = useState<'ws' | 'rest' | null>(null);
    const livePricesRef = useRef<Record<string, { price: number; change: number }>>({});
    const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const streams = DEMO_PAIRS.map(p => `${p.binance.toLowerCase()}@ticker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.data) {
                    const d = message.data;
                    const token = BINANCE_TO_TOKEN[d.s];
                    if (token) {
                        livePricesRef.current[token] = {
                            price: parseFloat(d.c),
                            change: parseFloat(d.P),
                        };
                    }
                }
            } catch (err) {
                console.error('[LivePrices] WS parse error', err);
            }
        };

        ws.onopen = () => {
            setWsSource('ws');
            if (restIntervalRef.current) {
                clearInterval(restIntervalRef.current);
                restIntervalRef.current = null;
            }
        };

        ws.onerror = (err: any) => {
            console.warn('[LivePrices] WS failed, switching to CoinGecko REST:', err?.message || err?.type || 'Unknown');
            setWsSource('rest');

            if (!restIntervalRef.current) {
                const fetchRestPrices = async () => {
                    try {
                        const res = await fetch('/api/prices');
                        if (!res.ok) return;
                        const data: Record<string, { price: number; change: number }> = await res.json();
                        for (const [token, pd] of Object.entries(data)) {
                            livePricesRef.current[token] = pd;
                        }
                    } catch (e) {
                        console.warn('[LivePrices] REST fetch failed:', e);
                    }
                };
                fetchRestPrices();
                restIntervalRef.current = setInterval(fetchRestPrices, 4000);
            }
        };

        // Flush buffered prices to state ~2/sec
        const flushInterval = setInterval(() => {
            const newPrices: Record<string, PriceData> = {};
            DEMO_PAIRS.forEach(p => {
                const live = livePricesRef.current[p.token];
                if (live) {
                    newPrices[p.token] = {
                        price: live.price,
                        change: live.change,
                        isOverridden: false,
                    };
                }
            });
            setLivePrices(prev => {
                const keys = Object.keys(newPrices);
                if (keys.length === Object.keys(prev).length &&
                    keys.every(k => prev[k]?.price === newPrices[k]?.price)) {
                    return prev;
                }
                return newPrices;
            });
        }, 500);

        return () => {
            clearInterval(flushInterval);
            if (restIntervalRef.current) {
                clearInterval(restIntervalRef.current);
                restIntervalRef.current = null;
            }
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, []);

    return (
        <LivePricesContext.Provider value={{ livePrices, wsSource }}>
            {children}
        </LivePricesContext.Provider>
    );
}

export function useLivePrices() {
    return useContext(LivePricesContext);
}

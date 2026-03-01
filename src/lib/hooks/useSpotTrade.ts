'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    SupabaseDemoService,
    DemoOrder,
    DemoBalance,
    DemoSettings,
    CreateOrderParams,
    DemoOrderStatus,
    DEFAULT_BALANCES,
} from '@/services/SupabaseDemoService';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface OrderBookLevel {
    price: number;
    size: number;
    total: number;
}

export interface OrderBookData {
    asks: OrderBookLevel[]; // sorted price ascending (lowest first)
    bids: OrderBookLevel[]; // sorted price descending (highest first)
    spread: number;
    spreadPercent: number;
}

export interface PriceData {
    price: number;
    change: number; // 24h change %
    isOverridden: boolean;
}

export type DemoToken = 'SOL' | 'BTC' | 'ETH' | 'JUP' | 'BONK' | 'XRP';

export const DEMO_PAIRS: { token: DemoToken; pair: string; binance: string }[] = [
    { token: 'SOL', pair: 'SOL/USDC', binance: 'SOLUSDT' },
    { token: 'BTC', pair: 'BTC/USDC', binance: 'BTCUSDT' },
    { token: 'ETH', pair: 'ETH/USDC', binance: 'ETHUSDT' },
    { token: 'JUP', pair: 'JUP/USDC', binance: 'JUPUSDT' },
    { token: 'BONK', pair: 'BONK/USDC', binance: 'BONKUSDT' },
    { token: 'XRP', pair: 'XRP/USDC', binance: 'XRPUSDT' },
];

const BINANCE_TO_TOKEN: Record<string, DemoToken> = {};
DEMO_PAIRS.forEach(p => { BINANCE_TO_TOKEN[p.binance] = p.token; });

const FEE_RATE = 0.001; // 0.1% trading fee

// ============================================
// Seeded Random for deterministic order book
// ============================================
class SimpleRNG {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}

// ============================================
// Order Book Generator
// ============================================
function generateOrderBook(midPrice: number, seed: number = 42): OrderBookData {
    if (!midPrice || midPrice <= 0) {
        return { asks: [], bids: [], spread: 0, spreadPercent: 0 };
    }

    const rng = new SimpleRNG(seed + Math.floor(midPrice * 100));
    const levels = 15;
    const spreadPct = 0.001 + rng.next() * 0.002; // 0.1% - 0.3% spread

    const bestAsk = midPrice * (1 + spreadPct / 2);
    const bestBid = midPrice * (1 - spreadPct / 2);

    const asks: OrderBookLevel[] = [];
    const bids: OrderBookLevel[] = [];
    let askTotal = 0;
    let bidTotal = 0;

    for (let i = 0; i < levels; i++) {
        // Asks go up from bestAsk
        const askPrice = bestAsk * (1 + i * 0.0015 + rng.next() * 0.0005);
        const askSize = (10 + rng.next() * 50) * (1 + i * 0.3); // increasing depth
        askTotal += askSize;
        asks.push({ price: askPrice, size: askSize, total: askTotal });

        // Bids go down from bestBid
        const bidPrice = bestBid * (1 - i * 0.0015 - rng.next() * 0.0005);
        const bidSize = (10 + rng.next() * 50) * (1 + i * 0.3);
        bidTotal += bidSize;
        bids.push({ price: bidPrice, size: bidSize, total: bidTotal });
    }

    return {
        asks,
        bids,
        spread: bestAsk - bestBid,
        spreadPercent: ((bestAsk - bestBid) / midPrice) * 100,
    };
}

// ============================================
// Hook
// ============================================

export function useSpotTrade(walletAddress: string | null) {
    const service = useMemo(() => new SupabaseDemoService(), []);

    // ─── State ──────────────────────────────
    const [selectedPair, setSelectedPair] = useState<string>('SOL/USDC');
    const [balances, setBalances] = useState<DemoBalance[]>([]);
    const [openOrders, setOpenOrders] = useState<DemoOrder[]>([]);
    const [filledOrders, setFilledOrders] = useState<DemoOrder[]>([]);
    const [settings, setSettings] = useState<DemoSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Live prices from Binance WS (token → price data)
    const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
    const livePricesRef = useRef<Record<string, { price: number; change: number }>>({});

    // Track which tokens have WS disabled (overridden by Control Panel)
    const [wsDisabled, setWsDisabled] = useState<Record<string, boolean>>({});
    const wsRef = useRef<WebSocket | null>(null);

    // Order book seed changes to animate
    const [obSeed, setObSeed] = useState(42);

    // ─── Current pair info ──────────────────
    const currentPairInfo = useMemo(
        () => DEMO_PAIRS.find(p => p.pair === selectedPair) || DEMO_PAIRS[0],
        [selectedPair]
    );

    const currentPrice = useMemo(() => {
        const token = currentPairInfo.token;
        return livePrices[token] || { price: 0, change: 0, isOverridden: false };
    }, [currentPairInfo, livePrices]);

    const orderBook = useMemo(
        () => generateOrderBook(currentPrice.price, obSeed),
        [currentPrice.price, obSeed]
    );

    // ─── Currency helper ────────────────────
    const formatPrice = useCallback((amount: number, decimals?: number): string => {
        if (!settings) return `$${amount.toFixed(decimals ?? 2)}`;

        const value = settings.currency === 'INR'
            ? amount * settings.usdInrRate
            : amount;

        const symbol = settings.currency === 'INR' ? '₹' : '$';
        const d = decimals ?? (value > 1000 ? 2 : value < 0.01 ? 7 : 4);
        return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
    }, [settings]);

    // ─── Binance WebSocket ──────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const streams = DEMO_PAIRS.map(p => `${p.binance.toLowerCase()}@ticker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

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
                console.error('[useSpotTrade] WS parse error', err);
            }
        };

        ws.onerror = (err: any) => {
            console.warn('[useSpotTrade] WS connection failed (expected in demo mode):', err?.message || err?.type || 'Unknown');
        };

        // Throttle state updates to ~2/sec
        const interval = setInterval(() => {
            const newPrices: Record<string, PriceData> = {};
            DEMO_PAIRS.forEach(p => {
                const live = livePricesRef.current[p.token];
                const overridePrice = settings?.priceOverrides?.[p.token];
                const isOverridden = overridePrice != null && overridePrice > 0;

                if (isOverridden) {
                    newPrices[p.token] = {
                        price: overridePrice!,
                        change: 0,
                        isOverridden: true,
                    };
                } else if (live) {
                    newPrices[p.token] = {
                        price: live.price,
                        change: live.change,
                        isOverridden: false,
                    };
                }
            });
            setLivePrices(prev => {
                // Simple shallow equality check to avoid unnecessary renders
                const keys = Object.keys(newPrices);
                if (keys.length === Object.keys(prev).length &&
                    keys.every(k => prev[k]?.price === newPrices[k]?.price)) {
                    return prev;
                }
                return newPrices;
            });
        }, 500);

        return () => {
            clearInterval(interval);
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update order book seed when price changes
    useEffect(() => {
        if (currentPrice.price > 0) {
            setObSeed(Math.floor(currentPrice.price * 1000) % 10000);
        }
    }, [currentPrice.price]);

    // ─── Load data on wallet connect ────────
    useEffect(() => {
        if (!walletAddress) {
            setBalances([]);
            setOpenOrders([]);
            setFilledOrders([]);
            setSettings(null);
            setIsLoading(false);
            return;
        }

        let mounted = true;
        setIsLoading(true);

        (async () => {
            try {
                const [bals, opens, filled, sett] = await Promise.all([
                    service.initializeBalances(walletAddress),
                    service.getOrders(walletAddress, ['pending', 'partial', 'triggered']),
                    service.getOrders(walletAddress, ['filled', 'cancelled']),
                    service.getSettings(walletAddress),
                ]);

                if (!mounted) return;
                setBalances(bals);
                setOpenOrders(opens);
                setFilledOrders(filled);
                setSettings(sett);

                // Apply price overrides from settings
                if (sett.priceOverrides && Object.keys(sett.priceOverrides).length > 0) {
                    const disabled: Record<string, boolean> = {};
                    Object.entries(sett.priceOverrides).forEach(([token, price]) => {
                        if (price != null && price > 0) disabled[token] = true;
                    });
                    setWsDisabled(disabled);
                }
            } catch (err) {
                console.error('[useSpotTrade] load error:', err);
                toast.error('Failed to load demo data');
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, [walletAddress, service]);

    // ─── Price matching engine (2s interval) ─
    useEffect(() => {
        if (!walletAddress || openOrders.length === 0) return;

        const interval = setInterval(async () => {
            let changed = false;

            for (const order of openOrders) {
                if (order.status === 'cancelled' || order.status === 'filled') continue;

                const token = order.pair.split('/')[0] as DemoToken;
                const price = livePrices[token]?.price;
                if (!price || price <= 0) continue;

                try {
                    // Limit orders
                    if (order.orderType === 'limit' && order.status === 'pending' && order.price) {
                        const shouldFill = order.side === 'buy'
                            ? price <= order.price
                            : price >= order.price;

                        if (shouldFill) {
                            await fillOrder(order, price);
                            changed = true;
                        }
                    }

                    // Stop Market
                    if (order.orderType === 'stop_market' && order.status === 'pending' && order.stopPrice) {
                        const triggered = order.side === 'buy'
                            ? price >= order.stopPrice
                            : price <= order.stopPrice;

                        if (triggered) {
                            await fillOrder(order, price);
                            changed = true;
                        }
                    }

                    // Stop Limit
                    if (order.orderType === 'stop_limit' && order.status === 'pending' && order.stopPrice) {
                        const triggered = order.side === 'buy'
                            ? price >= order.stopPrice
                            : price <= order.stopPrice;

                        if (triggered) {
                            // Convert to limit order (triggered status)
                            await service.updateOrder(order.id, { status: 'triggered' });
                            changed = true;
                        }
                    }

                    // Triggered stop-limit → check limit price
                    if (order.orderType === 'stop_limit' && order.status === 'triggered' && order.limitPrice) {
                        const shouldFill = order.side === 'buy'
                            ? price <= order.limitPrice
                            : price >= order.limitPrice;

                        if (shouldFill) {
                            await fillOrder(order, price);
                            changed = true;
                        }
                    }

                    // Iceberg
                    if (order.orderType === 'iceberg' && (order.status === 'pending' || order.status === 'partial')) {
                        const checkPrice = order.price || price;
                        const shouldFill = order.side === 'buy'
                            ? price <= checkPrice
                            : price >= checkPrice;

                        if (shouldFill && order.visibleQty) {
                            const remaining = order.quantity - order.filledQuantity;
                            const sliceQty = Math.min(order.visibleQty, remaining);
                            const newFilled = order.filledQuantity + sliceQty;
                            const isDone = newFilled >= order.quantity;

                            await service.updateOrder(order.id, {
                                status: isDone ? 'filled' : 'partial',
                                filledQuantity: newFilled,
                                fillPrice: price,
                                filledAt: isDone ? new Date().toISOString() : undefined,
                            });

                            // Update balance for this slice
                            await applyFill(order, sliceQty, price);
                            if (isDone) await createTpSlOrders(order, price);
                            changed = true;
                        }
                    }

                    // TWAP
                    if (order.orderType === 'twap' && (order.status === 'pending' || order.status === 'partial')) {
                        const now = new Date();
                        const nextSlice = order.twapNextSliceAt ? new Date(order.twapNextSliceAt) : new Date(order.createdAt);

                        if (now >= nextSlice && order.twapIntervals && order.twapDuration) {
                            const sliceQty = order.quantity / order.twapIntervals;
                            const remaining = order.quantity - order.filledQuantity;
                            const actualSlice = Math.min(sliceQty, remaining);
                            const newFilled = order.filledQuantity + actualSlice;
                            const isDone = newFilled >= order.quantity * 0.999; // floating point tolerance

                            const sliceIntervalMs = (order.twapDuration * 1000) / order.twapIntervals;
                            const nextSliceAt = new Date(now.getTime() + sliceIntervalMs);

                            await service.updateOrder(order.id, {
                                status: isDone ? 'filled' : 'partial',
                                filledQuantity: newFilled,
                                fillPrice: price,
                                filledAt: isDone ? now.toISOString() : undefined,
                                twapNextSliceAt: isDone ? undefined : nextSliceAt.toISOString(),
                            });

                            await applyFill(order, actualSlice, price);
                            if (isDone) await createTpSlOrders(order, price);
                            changed = true;
                        }
                    }
                } catch (err) {
                    console.error('[useSpotTrade] matching error for order', order.id, err);
                }
            }

            if (changed) {
                await refreshOrders();
            }
        }, 2000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletAddress, openOrders, livePrices]);

    // ─── Helpers ────────────────────────────

    const refreshOrders = useCallback(async () => {
        if (!walletAddress) return;
        const [opens, filled, bals] = await Promise.all([
            service.getOrders(walletAddress, ['pending', 'partial', 'triggered']),
            service.getOrders(walletAddress, ['filled', 'cancelled']),
            service.getBalances(walletAddress),
        ]);
        setOpenOrders(opens);
        setFilledOrders(filled);
        setBalances(bals);
    }, [walletAddress, service]);

    const applyFill = useCallback(async (order: DemoOrder, qty: number, fillPrice: number) => {
        if (!walletAddress) return;
        const token = order.pair.split('/')[0];
        const notional = qty * fillPrice;
        const fee = notional * FEE_RATE;

        const currentBals = await service.getBalances(walletAddress);
        const tokenBal = currentBals.find(b => b.token === token);
        const usdcBal = currentBals.find(b => b.token === 'USDC');

        if (order.side === 'buy') {
            // Spend USDC, receive token
            if (usdcBal) {
                await service.updateBalance(walletAddress, 'USDC',
                    usdcBal.available, // already deducted on order creation
                    Math.max(0, usdcBal.inOrder - notional - fee)
                );
            }
            if (tokenBal) {
                await service.updateBalance(walletAddress, token,
                    tokenBal.available + qty,
                    tokenBal.inOrder
                );
            } else {
                await service.updateBalance(walletAddress, token, qty, 0);
            }
        } else {
            // Spend token, receive USDC
            if (tokenBal) {
                await service.updateBalance(walletAddress, token,
                    tokenBal.available,
                    Math.max(0, tokenBal.inOrder - qty)
                );
            }
            if (usdcBal) {
                await service.updateBalance(walletAddress, 'USDC',
                    usdcBal.available + notional - fee,
                    usdcBal.inOrder
                );
            }
        }
    }, [walletAddress, service]);

    const fillOrder = useCallback(async (order: DemoOrder, fillPrice: number) => {
        await service.updateOrder(order.id, {
            status: 'filled',
            filledQuantity: order.quantity,
            fillPrice,
            filledAt: new Date().toISOString(),
        });

        await applyFill(order, order.quantity, fillPrice);
        await createTpSlOrders(order, fillPrice);

        toast.success(`Order Filled: ${order.side.toUpperCase()} ${order.quantity} ${order.pair} @ ${formatPrice(fillPrice)}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [service, applyFill, formatPrice]);

    const createTpSlOrders = useCallback(async (parentOrder: DemoOrder, fillPrice: number) => {
        if (!walletAddress) return;
        const oppositeSide = parentOrder.side === 'buy' ? 'sell' : 'buy';

        // Take Profit → limit order
        if (parentOrder.tpPrice && parentOrder.tpPrice > 0) {
            await service.createOrder(walletAddress, {
                pair: parentOrder.pair,
                side: oppositeSide as 'buy' | 'sell',
                orderType: 'limit',
                price: parentOrder.tpPrice,
                quantity: parentOrder.quantity,
                parentOrderId: parentOrder.id,
                fee: parentOrder.quantity * parentOrder.tpPrice * FEE_RATE,
            });
        }

        // Stop Loss → stop market
        if (parentOrder.slPrice && parentOrder.slPrice > 0) {
            await service.createOrder(walletAddress, {
                pair: parentOrder.pair,
                side: oppositeSide as 'buy' | 'sell',
                orderType: 'stop_market',
                stopPrice: parentOrder.slPrice,
                quantity: parentOrder.quantity,
                parentOrderId: parentOrder.id,
                fee: 0, // fee calculated on fill
            });
        }
    }, [walletAddress, service]);

    // ─── Public API ─────────────────────────

    const executeTrade = useCallback(async (params: CreateOrderParams) => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first');
            return null;
        }

        const token = params.pair.split('/')[0];
        const currentBals = await service.getBalances(walletAddress);
        const usdcBal = currentBals.find(b => b.token === 'USDC');
        const tokenBal = currentBals.find(b => b.token === token);

        const price = params.price || livePrices[token as DemoToken]?.price || 0;
        const notional = params.quantity * price;
        const fee = notional * FEE_RATE;

        // Validate balance
        if (params.side === 'buy') {
            const available = usdcBal?.available ?? 0;
            if (available < notional + fee) {
                toast.error(`Insufficient USDC. Need ${formatPrice(notional + fee)}, have ${formatPrice(available)}`);
                return null;
            }
        } else {
            const available = tokenBal?.available ?? 0;
            if (available < params.quantity) {
                toast.error(`Insufficient ${token}. Need ${params.quantity}, have ${available}`);
                return null;
            }
        }

        try {
            // Reserve balance
            if (params.side === 'buy' && usdcBal) {
                if (params.orderType === 'market') {
                    // Market: deduct immediately
                    await service.updateBalance(walletAddress, 'USDC', usdcBal.available - notional - fee, usdcBal.inOrder);
                    // Add token
                    const tBal = tokenBal?.available ?? 0;
                    await service.updateBalance(walletAddress, token, tBal + params.quantity, tokenBal?.inOrder ?? 0);
                } else {
                    // Pending: move to in_order
                    await service.updateBalance(walletAddress, 'USDC', usdcBal.available - notional - fee, usdcBal.inOrder + notional + fee);
                }
            } else if (params.side === 'sell' && tokenBal) {
                if (params.orderType === 'market') {
                    await service.updateBalance(walletAddress, token, tokenBal.available - params.quantity, tokenBal.inOrder);
                    const uBal = usdcBal?.available ?? 0;
                    await service.updateBalance(walletAddress, 'USDC', uBal + notional - fee, usdcBal?.inOrder ?? 0);
                } else {
                    await service.updateBalance(walletAddress, token, tokenBal.available - params.quantity, tokenBal.inOrder + params.quantity);
                }
            }

            // Set TWAP next slice time
            let adjustedParams = { ...params };
            if (params.orderType === 'twap' && params.twapDuration && params.twapIntervals) {
                const sliceIntervalMs = (params.twapDuration * 1000) / params.twapIntervals;
                const firstSlice = new Date(Date.now() + sliceIntervalMs);
                // We'll handle via the matching engine
            }

            const order = await service.createOrder(walletAddress, {
                ...adjustedParams,
                price: adjustedParams.price || price,
                fee,
            });

            // Market orders create TP/SL immediately
            if (params.orderType === 'market') {
                await createTpSlOrders({ ...order, tpPrice: params.tpPrice ?? null, slPrice: params.slPrice ?? null }, price);
            }

            await refreshOrders();

            const typeLabel = params.orderType.replace('_', ' ').toUpperCase();
            if (params.orderType === 'market') {
                toast.success(`${typeLabel} ${params.side.toUpperCase()} filled: ${params.quantity} ${token} @ ${formatPrice(price)}`);
            } else {
                toast.success(`${typeLabel} order placed: ${params.side.toUpperCase()} ${params.quantity} ${token}`);
            }

            return order;
        } catch (err) {
            console.error('[useSpotTrade] executeTrade error:', err);
            toast.error('Failed to execute trade');
            return null;
        }
    }, [walletAddress, service, livePrices, formatPrice, refreshOrders, createTpSlOrders]);

    const cancelOrder = useCallback(async (orderId: string) => {
        if (!walletAddress) return;

        try {
            const order = openOrders.find(o => o.id === orderId);
            if (!order) return;

            await service.cancelOrder(orderId);

            // Return reserved balance
            const token = order.pair.split('/')[0];
            const price = order.price || order.limitPrice || order.stopPrice || 0;
            const remaining = order.quantity - order.filledQuantity;
            const notional = remaining * price;
            const fee = notional * FEE_RATE;

            const currentBals = await service.getBalances(walletAddress);

            if (order.side === 'buy') {
                const usdcBal = currentBals.find(b => b.token === 'USDC');
                if (usdcBal) {
                    await service.updateBalance(walletAddress, 'USDC',
                        usdcBal.available + notional + fee,
                        Math.max(0, usdcBal.inOrder - notional - fee)
                    );
                }
            } else {
                const tokenBal = currentBals.find(b => b.token === token);
                if (tokenBal) {
                    await service.updateBalance(walletAddress, token,
                        tokenBal.available + remaining,
                        Math.max(0, tokenBal.inOrder - remaining)
                    );
                }
            }

            await refreshOrders();
            toast.success('Order cancelled');
        } catch (err) {
            console.error('[useSpotTrade] cancel error:', err);
            toast.error('Failed to cancel order');
        }
    }, [walletAddress, service, openOrders, refreshOrders]);

    // ─── Control Panel methods ──────────────

    const setPriceOverride = useCallback(async (token: string, price: number | null) => {
        if (!walletAddress || !settings) return;

        const newOverrides = { ...settings.priceOverrides };
        if (price === null || price <= 0) {
            delete newOverrides[token];
        } else {
            newOverrides[token] = price;
        }

        const updated = await service.updateSettings(walletAddress, { priceOverrides: newOverrides });
        setSettings(updated);
        setWsDisabled(prev => {
            const next = { ...prev };
            if (price === null || price <= 0) {
                delete next[token];
            } else {
                next[token] = true;
            }
            return next;
        });
    }, [walletAddress, settings, service]);

    const resetAllOverrides = useCallback(async () => {
        if (!walletAddress || !settings) return;

        const updated = await service.updateSettings(walletAddress, { priceOverrides: {} });
        setSettings(updated);
        setWsDisabled({});
        toast.success('Price overrides reset — live WebSocket re-enabled');
    }, [walletAddress, settings, service]);

    const updateCurrency = useCallback(async (currency: 'USD' | 'INR') => {
        if (!walletAddress || !settings) return;
        const updated = await service.updateSettings(walletAddress, { currency });
        setSettings(updated);
    }, [walletAddress, settings, service]);

    const updateUsdInrRate = useCallback(async (rate: number) => {
        if (!walletAddress || !settings) return;
        const updated = await service.updateSettings(walletAddress, { usdInrRate: rate });
        setSettings(updated);
    }, [walletAddress, settings, service]);

    const resetBalancesToDefault = useCallback(async () => {
        if (!walletAddress) return;
        const bals = await service.resetBalances(walletAddress);
        setBalances(bals);
        toast.success('Balances reset to defaults');
    }, [walletAddress, service]);

    // ─── Return ─────────────────────────────

    return {
        // State
        selectedPair,
        setSelectedPair,
        balances,
        openOrders,
        filledOrders,
        settings,
        isLoading,
        livePrices,
        currentPrice,
        orderBook,
        wsDisabled,

        // Helpers
        formatPrice,

        // Actions
        executeTrade,
        cancelOrder,
        refreshOrders,

        // Control Panel
        setPriceOverride,
        resetAllOverrides,
        updateCurrency,
        updateUsdInrRate,
        resetBalancesToDefault,
    };
}

'use client';

import React from 'react';
import SpotOrderForm from './SpotOrderForm';
import OrderFlowVisualiser, { getSliderRange, computeKnobColor } from './OrderFlowVisualiser';
import type { SimConfig } from './OrderFlowVisualiser';
import TradeSummaryPanel from './TradeSummaryPanel';
import { DEMO_PAIRS } from '@/lib/hooks/useSpotTrade';
import { useLivePrices } from '@/lib/context/LivePricesContext';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import { ChevronDown, Wifi, WifiOff, Activity, RotateCcw, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppSound } from '@/lib/context/SoundContext';

const SLIDER_TICK_INTERVAL_MS = 70;
const SLIDER_TICK_MIN_PCT_DELTA = 3;

interface SpotConceptsProps {
    trade: ReturnType<typeof import('@/lib/hooks/useSpotTrade').useSpotTrade>;
    currency: 'USD' | 'INR';
    usdInrRate: number;
    controlPanelOpen: boolean;
    onToggleControlPanel: () => void;
}

export default function SpotConcepts({ trade, currency, usdInrRate, controlPanelOpen, onToggleControlPanel }: SpotConceptsProps) {
    const {
        selectedPair, setSelectedPair, currentPrice,
    } = trade;
    const { livePrices, wsSource } = useLivePrices();
    const { playClick, playOpen, playSuccess, playTick } = useAppSound();

    // Currency-aware formatter — converts USD → INR using the resolved
    // currency/rate from the parent (works with or without a connected wallet).
    const formatPrice = React.useCallback((amount: number, decimals?: number): string => {
        const value = currency === 'INR' ? amount * usdInrRate : amount;
        const symbol = currency === 'INR' ? '₹' : '$';
        const d = decimals ?? (value > 1000 ? 2 : value < 0.01 ? 7 : 4);
        return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
    }, [currency, usdInrRate]);

    const [pairDropdownOpen, setPairDropdownOpen] = React.useState(false);
    const [orderType, setOrderType] = React.useState<DemoOrderType>('market');
    const [side, setSide] = React.useState<'buy' | 'sell'>('buy');
    const [simSnapshot, setSimSnapshot] = React.useState<SimConfig | null>(null);
    const [lastSimSnapshot, setLastSimSnapshot] = React.useState<SimConfig | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // ─── Price Scale slider state ────────────────────────────────────────────────
    const [simPrice, setSimPrice] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const lastSliderTickAtRef = React.useRef(0);
    const lastSliderTickPctRef = React.useRef<number | null>(null);
    const rerunFrameRef = React.useRef<number | null>(null);

    // Reset simPrice when new snapshot is set
    React.useEffect(() => {
        if (simSnapshot) setSimPrice(simSnapshot.entryPrice);
    }, [simSnapshot]);

    const sliderRange = React.useMemo(
        () => getSliderRange(simSnapshot, currentPrice.price),
        [simSnapshot, currentPrice.price]
    );

    const priceToPercent = React.useCallback((price: number) => {
        const { min, max } = sliderRange;
        if (max === min) return 50;
        return ((price - min) / (max - min)) * 100;
    }, [sliderRange]);

    const percentToPrice = React.useCallback((pct: number) => {
        const { min, max } = sliderRange;
        return min + (pct / 100) * (max - min);
    }, [sliderRange]);

    const handleSliderInteraction = React.useCallback((clientX: number) => {
        if (!sliderRef.current || !simSnapshot) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        setSimPrice(percentToPrice(pct));

        const now = performance.now();
        const previousPct = lastSliderTickPctRef.current;
        const movedEnough = previousPct == null || Math.abs(pct - previousPct) >= SLIDER_TICK_MIN_PCT_DELTA;
        const waitedEnough = now - lastSliderTickAtRef.current >= SLIDER_TICK_INTERVAL_MS;

        if (movedEnough && waitedEnough) {
            playTick();
            lastSliderTickAtRef.current = now;
            lastSliderTickPctRef.current = pct;
        }
    }, [percentToPrice, playTick, simSnapshot]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        lastSliderTickAtRef.current = 0;
        lastSliderTickPctRef.current = null;
        setIsDragging(true);
        handleSliderInteraction(e.clientX);
    }, [handleSliderInteraction]);

    React.useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => handleSliderInteraction(e.clientX);
        const onUp = () => {
            lastSliderTickPctRef.current = null;
            setIsDragging(false);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [isDragging, handleSliderInteraction]);

    // For the global knob color, we can just pass simPrice as maxExtremum and session min/max
    // since the track itself handles its own extremum in OrderFlowVisualiser internally
    const knobColor = React.useMemo(
        () => computeKnobColor(simSnapshot, simPrice, simPrice, simPrice, simPrice, simPrice, simPrice),
        [simSnapshot, simPrice]
    );

    const simPriceChange = simSnapshot && simSnapshot.entryPrice > 0
        ? ((simPrice - simSnapshot.entryPrice) / simSnapshot.entryPrice) * 100
        : 0;

    // ─── Other effects ───────────────────────────────────────────────────────────

    // Clear simulation when order type or side changes (stale snapshot)
    React.useEffect(() => {
        setSimSnapshot(null);
        setLastSimSnapshot(null);
    }, [orderType, selectedPair, side]);

    React.useEffect(() => {
        return () => {
            if (rerunFrameRef.current != null) {
                window.cancelAnimationFrame(rerunFrameRef.current);
            }
        };
    }, []);

    // Close dropdown on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setPairDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const togglePairDropdown = React.useCallback(() => {
        if (pairDropdownOpen) {
            playClick();
        } else {
            playOpen();
        }
        setPairDropdownOpen(prev => !prev);
    }, [pairDropdownOpen, playClick, playOpen]);

    const selectPair = React.useCallback((pair: string) => {
        playClick();
        setSelectedPair(pair);
        setPairDropdownOpen(false);
    }, [playClick, setSelectedPair]);

    const runSimulation = React.useCallback((config: SimConfig) => {
        setLastSimSnapshot(config);
        setSimSnapshot(config);
    }, []);

    const rerunSimulation = React.useCallback(() => {
        if (!lastSimSnapshot) return;
        playSuccess();
        setSimSnapshot(null);
        setSimPrice(lastSimSnapshot.entryPrice);

        if (rerunFrameRef.current != null) {
            window.cancelAnimationFrame(rerunFrameRef.current);
        }

        rerunFrameRef.current = window.requestAnimationFrame(() => {
            setSimSnapshot({ ...lastSimSnapshot });
            rerunFrameRef.current = null;
        });
    }, [lastSimSnapshot, playSuccess]);

    if (trade.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="spinner mb-4 text-bs-brand"></div>
                    <p className="text-xs font-mono text-bs-text-mute">Loading demo market...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-2.5">
            {/* ─── Token Selector Bar ──────────── */}
            <div className="z-10 flex shrink-0 flex-col gap-2 rounded-xl border border-bs-border bg-bs-card px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                    {/* Pair selector */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={togglePairDropdown}
                            className="flex min-h-8 items-center gap-2 rounded-lg px-2 py-1 text-bs-text-primary hover:bg-bs-card-fg"
                        >
                            <span className="text-sm font-semibold">{selectedPair}</span>
                            <ChevronDown size={14} className={`transition-transform ${pairDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {pairDropdownOpen && (
                            <div className="absolute left-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-bs-border bg-bs-card shadow-lg">
                                {DEMO_PAIRS.map(({ token, pair }) => {
                                    const pd = livePrices[token];
                                    return (
                                        <button
                                            key={pair}
                                            onClick={() => selectPair(pair)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedPair === pair ? 'bg-bs-card-fg text-bs-text-primary' : 'text-bs-text-tertiary hover:bg-bs-card hover:text-bs-text-primary'
                                                }`}
                                        >
                                            <span className="font-mono">{pair}</span>
                                            <span className="text-xs font-mono text-bs-text-mute">
                                                {pd ? `$${pd.price > 1000 ? pd.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : pd.price < 0.01 ? pd.price.toFixed(7) : pd.price.toFixed(4)}` : '—'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Live Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-lg font-semibold text-bs-text-primary">
                            {currentPrice.price > 0 ? formatPrice(currentPrice.price) : '—'}
                        </span>
                        {currentPrice.price > 0 && (
                            <span className={`text-xs font-mono font-bold ${currentPrice.change >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)}%
                            </span>
                        )}
                    </div>

                    {/* WS Status */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    {currentPrice.isOverridden ? (
                                        <>
                                            <WifiOff size={10} className="text-bs-warning" />
                                            <span className="text-[9px] font-mono text-bs-warning">MANUAL</span>
                                        </>
                                    ) : wsSource === 'rest' ? (
                                        <>
                                            <Activity size={10} className="text-bs-brand-ts" />
                                            <span className="text-[9px] font-mono text-bs-brand-ts">REST</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wifi size={10} className="text-bs-success" />
                                            <span className="text-[9px] font-mono text-bs-success">LIVE</span>
                                        </>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {currentPrice.isOverridden
                                    ? 'Prices manually overridden via Set Manual Prices panel.'
                                    : wsSource === 'rest'
                                        ? 'WebSocket unavailable. Using CoinGecko REST API (updates every 4s).'
                                        : 'Connected to Binance WebSocket. Prices update in real-time.'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Control button */}
                <div className="flex items-center gap-3">
                    {lastSimSnapshot && (
                        <button
                            type="button"
                            onClick={rerunSimulation}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-bs-buy/25 bg-bs-success/8 px-3 text-xs font-semibold text-bs-success transition-colors hover:bg-bs-success/12 hover:text-bs-success"
                        >
                            <RotateCcw size={14} />
                            <span>Rerun</span>
                        </button>
                    )}
                    <button
                        onClick={onToggleControlPanel}
                        className={cn(
                            'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs',
                            controlPanelOpen
                                ? 'border-bs-border-active bg-bs-card-fg text-bs-text-primary'
                                : 'border-bs-border bg-bs-card-fg text-bs-text-tertiary hover:text-bs-text-primary'
                        )}
                    >
                        <Settings size={14} />
                        <span className="hidden sm:inline">Manual prices</span>
                        <span className="sm:hidden">Prices</span>
                    </button>
                </div>
            </div>

            {/* ─── Panel Content ──────────────────────────────── */}
            <div className="flex min-h-0 flex-1 flex-col gap-2.5">
                    {/* ── Main row: Order Form + Order Flow + Trade Summary ── */}
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
                        <div className="flex min-h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-bs-border bg-bs-card p-3 xl:min-h-0">
                            <p className="mb-2.5 text-xs font-mono font-semibold uppercase tracking-wide text-bs-text-secondary">Order Form</p>
                            <SpotOrderForm
                                pair={selectedPair}
                                currentPrice={currentPrice.price}
                                formatPrice={formatPrice}
                                currency={currency}
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                side={side}
                                onSideChange={setSide}
                                onRunSimulation={runSimulation}
                            />
                        </div>

                        <div className="flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-2xl border border-bs-border bg-[var(--color-surface-dim)] p-3 xl:min-h-0">
                            <OrderFlowVisualiser
                                orderType={orderType}
                                side={side}
                                tpEnabled={simSnapshot?.tpEnabled ?? false}
                                slEnabled={simSnapshot?.slEnabled ?? false}
                                simSnapshot={simSnapshot}
                                simPrice={simPrice}
                                currentPrice={currentPrice.price}
                                formatPrice={formatPrice}
                            />
                        </div>

                        <div className="flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-2xl border border-bs-border bg-bs-card p-3 xl:min-h-0">
                            <div className="mb-2.5 flex items-center justify-between gap-2">
                                <p className="text-xs font-mono font-semibold uppercase tracking-wide text-bs-text-secondary">Trade Summary</p>
                                {simSnapshot && (
                                    <span className="rounded border border-bs-border bg-bs-card-fg px-1.5 py-0.5 text-[9px] font-semibold uppercase text-bs-text-mute">
                                        {side} {orderType.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                                <TradeSummaryPanel
                                    simSnapshot={simSnapshot}
                                    simPrice={simPrice}
                                    formatPrice={formatPrice}
                                />
                                {!simSnapshot && (
                                    <div className="flex h-full min-h-[160px] items-center justify-center">
                                        <div className="text-center text-[9px] font-mono leading-relaxed text-bs-text-primary/15">
                                            Run Simulation to see summary
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom row: Horizontal Price Scale ── */}
                    <div className="shrink-0 overflow-hidden rounded-2xl border border-bs-border bg-bs-card px-3 py-2">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-mono font-semibold uppercase tracking-wide text-bs-text-secondary">Market Price Scale</p>
                            {simSnapshot && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-mono font-bold text-bs-text-primary">{formatPrice(simPrice)}</span>
                                    <span className={cn(
                                        'text-[10px] font-mono font-semibold',
                                        simPriceChange >= 0 ? 'text-bs-success' : 'text-bs-error'
                                    )}>
                                        {simPriceChange >= 0 ? '▲' : '▼'} {Math.abs(simPriceChange).toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {!simSnapshot && (
                            <div className="flex h-12 items-center justify-center">
                                <div className="text-center text-[9px] font-mono leading-relaxed text-bs-text-primary/15">
                                    Run Simulation to start price scale
                                </div>
                            </div>
                        )}

                        {simSnapshot && (
                            <div className="space-y-0.5">
                                <div
                                    ref={sliderRef}
                                    onMouseDown={handleMouseDown}
                                    className="relative h-10 cursor-pointer select-none"
                                >
                                    <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-bs-card-fg" />

                                    <div
                                        className="absolute top-1 h-8 w-px -translate-x-1/2 bg-white/30"
                                        style={{ left: `${priceToPercent(simSnapshot.entryPrice)}%` }}
                                    >
                                        <span className="absolute left-1 top-0 text-[8px] font-mono text-bs-text-mute">entry</span>
                                    </div>

                                    {simSnapshot.stopPrice != null && simSnapshot.orderType !== 'trailing_stop' && (
                                        <div
                                            className="absolute top-2 h-6 w-px -translate-x-1/2 bg-orange-500/60"
                                            style={{ left: `${priceToPercent(simSnapshot.stopPrice)}%` }}
                                        >
                                            <span className="absolute left-1 top-3 text-[8px] font-mono text-orange-400/80">stop</span>
                                        </div>
                                    )}

                                    {simSnapshot.orderType === 'trailing_stop' && simSnapshot.stopPrice != null && (
                                        <span className="absolute right-0 top-0 text-[8px] font-mono text-orange-400/80">
                                            trail {simSnapshot.stopPrice}%
                                        </span>
                                    )}

                                    {(simSnapshot.price != null || simSnapshot.limitPrice != null) && (
                                        <div
                                            className="absolute top-2 h-6 w-px -translate-x-1/2 bg-bs-info/65"
                                            style={{ left: `${priceToPercent(simSnapshot.price ?? simSnapshot.limitPrice!)}%` }}
                                        >
                                            <span className="absolute left-1 top-3 text-[8px] font-mono text-bs-brand-ts/80">limit</span>
                                        </div>
                                    )}

                                    {simSnapshot.tpPrice != null && (
                                        <div
                                            className="absolute top-2 h-6 w-px -translate-x-1/2 bg-bs-success/65"
                                            style={{ left: `${priceToPercent(simSnapshot.tpPrice)}%` }}
                                        >
                                            <span className="absolute left-1 -top-3 text-[8px] font-mono text-bs-success/80">TP</span>
                                        </div>
                                    )}

                                    {simSnapshot.slPrice != null && (
                                        <div
                                            className="absolute top-2 h-6 w-px -translate-x-1/2 bg-bs-error/65"
                                            style={{ left: `${priceToPercent(simSnapshot.slPrice)}%` }}
                                        >
                                            <span className="absolute left-1 -top-3 text-[8px] font-mono text-bs-error/80">SL</span>
                                        </div>
                                    )}

                                    <div
                                        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: `${priceToPercent(simPrice)}%` }}
                                    >
                                        <div className={`h-4 w-4 cursor-grab border-2 shadow-lg ring-2 ring-black/50 active:cursor-grabbing ${knobColor}`} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 text-[9px] font-mono text-bs-text-tertiary">
                                    <span>{formatPrice(sliderRange.min)}</span>
                                    <span className="text-bs-text-mute">Drag left/right to simulate</span>
                                    <span>{formatPrice(sliderRange.max)}</span>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import SpotOrderBook from './SpotOrderBook';
import SpotOrderForm from './SpotOrderForm';
import OrderFlowVisualiser, { getSliderRange, computeKnobColor } from './OrderFlowVisualiser';
import type { SimConfig } from './OrderFlowVisualiser';
import TradeSummaryPanel from './TradeSummaryPanel';
import { DEMO_PAIRS } from '@/lib/hooks/useSpotTrade';
import { useLivePrices } from '@/lib/context/LivePricesContext';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import { ChevronDown, Wifi, WifiOff, Activity, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Static style constant (avoids creating a new object on every render)
const SLIDER_MARGIN_STYLE = { marginTop: '16px', marginBottom: '16px' } as const;
const NOOP_PRICE_CLICK = () => {};

interface SpotConceptsProps {
    trade: ReturnType<typeof import('@/lib/hooks/useSpotTrade').useSpotTrade>;
    controlPanelOpen: boolean;
    onToggleControlPanel: () => void;
}

export default function SpotConcepts({ trade, controlPanelOpen, onToggleControlPanel }: SpotConceptsProps) {
    const {
        selectedPair, setSelectedPair, currentPrice,
        orderBook, formatPrice, settings,
    } = trade;
    const { livePrices, wsSource } = useLivePrices();

    const [pairDropdownOpen, setPairDropdownOpen] = React.useState(false);
    const [activePanel, setActivePanel] = React.useState<'orderbook' | 'orderform'>('orderform');
    const [orderType, setOrderType] = React.useState<DemoOrderType>('market');
    const [side, setSide] = React.useState<'buy' | 'sell'>('buy');
    const [simSnapshot, setSimSnapshot] = React.useState<SimConfig | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // ─── Price Scale slider state ────────────────────────────────────────────────
    const [simPrice, setSimPrice] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);

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
        return ((max - price) / (max - min)) * 100;
    }, [sliderRange]);

    const percentToPrice = React.useCallback((pct: number) => {
        const { min, max } = sliderRange;
        return max - (pct / 100) * (max - min);
    }, [sliderRange]);

    const handleSliderInteraction = React.useCallback((clientY: number) => {
        if (!sliderRef.current || !simSnapshot) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
        setSimPrice(percentToPrice(pct));
    }, [percentToPrice, simSnapshot]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        handleSliderInteraction(e.clientY);
    }, [handleSliderInteraction]);

    React.useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => handleSliderInteraction(e.clientY);
        const onUp = () => setIsDragging(false);
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
    React.useEffect(() => { setSimSnapshot(null); }, [orderType, side]);

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
        <div className="space-y-4">
            {/* ─── Token Selector Bar ──────────── */}
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-bs-bg/60 backdrop-blur-xl border border-bs-border px-3 sm:px-4 py-3">
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                    {/* Pair selector */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setPairDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 text-bs-text-primary hover:text-bs-text-secondary transition-colors"
                        >
                            <span className="text-heading-16">{selectedPair}</span>
                            <ChevronDown size={14} className={`transition-transform ${pairDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {pairDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-bs-bg/95 backdrop-blur-xl border border-bs-border shadow-2xl z-50">
                                {DEMO_PAIRS.map(({ token, pair }) => {
                                    const pd = livePrices[token];
                                    return (
                                        <button
                                            key={pair}
                                            onClick={() => { setSelectedPair(pair); setPairDropdownOpen(false); }}
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
                    <div className="flex items-center gap-3">
                        <span className="text-heading-20 text-bs-text-primary font-mono">
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
                                            <WifiOff size={10} className="text-yellow-400" />
                                            <span className="text-[9px] font-mono text-yellow-400">MANUAL</span>
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

                {/* Currency indicator + Control button */}
                <div className="flex items-center gap-3">
                    {settings?.currency === 'INR' && (
                        <div className="text-[9px] font-mono text-orange-400/70 bg-orange-500/10 px-2 py-1 border border-orange-500/10">
                            INR rates not available for Spot
                        </div>
                    )}
                    <button
                        onClick={onToggleControlPanel}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border transition-all ${controlPanelOpen
                            ? 'bg-bs-brand-tertiary/20 border-bs-brand-tertiary/40 text-bs-brand-secondary'
                            : 'bg-bs-card border-bs-border text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                            }`}
                    >
                        <Settings size={14} />
                        <span className="hidden sm:inline">Set Manual Prices</span>
                        <span className="sm:hidden">Prices</span>
                    </button>
                </div>
            </div>

            {/* ─── Sub-tab strip ──────────────────────────────── */}
            <div className="flex items-center gap-1 bg-bs-bg/40 backdrop-blur-xl border border-bs-border p-1">
                {([
                    { id: 'orderform', label: 'Order Simulator' },
                    { id: 'orderbook', label: 'Order Book' },
                ] as const).map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActivePanel(id)}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all ${activePanel === id
                            ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border border-bs-brand-tertiary/30'
                            : 'text-bs-text-tertiary hover:text-bs-text-secondary hover:bg-bs-card border border-transparent'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ─── Panel Content ──────────────────────────────── */}
            {activePanel === 'orderbook' ? (
                <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 min-h-[500px]">
                    <SpotOrderBook
                        orderBook={orderBook}
                        formatPrice={formatPrice}
                        onPriceClick={NOOP_PRICE_CLICK}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* ── Top row: Order Form + Order Flow + Price Scale ── */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:min-h-[500px]">

                        {/* ── Box 1: Order Form ── */}
                        <div className="bg-bs-bg border border-bs-border p-4 w-full md:w-[300px] md:flex-shrink-0 flex flex-col">
                            <p className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-3">Order Form</p>
                            <SpotOrderForm
                                pair={selectedPair}
                                currentPrice={currentPrice.price}
                                formatPrice={formatPrice}
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                side={side}
                                onSideChange={setSide}
                                onRunSimulation={setSimSnapshot}
                            />
                        </div>

                        {/* ── Box 2: Order Flow ── */}
                        <div className="bg-bs-bg border border-bs-border p-4 flex-1 min-w-0 flex flex-col min-h-[300px] md:min-h-0">
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

                        {/* ── Box 3: Price Scale ── */}
                        <div className="bg-bs-bg border border-bs-border p-4 w-full md:w-[120px] md:flex-shrink-0 flex flex-col">
                            <p className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-3">Price Scale</p>
                            {!simSnapshot ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-bs-text-primary/15 text-[9px] font-mono text-center leading-relaxed">
                                        Run<br />Simulation<br />to start
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    {/* Current simPrice */}
                                    <div className="text-center mb-2 flex-shrink-0">
                                        <div className="text-xs font-mono text-bs-text-primary font-bold">{formatPrice(simPrice)}</div>
                                        <div className={`text-[10px] font-mono ${simPriceChange >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                            {simPriceChange >= 0 ? '▲' : '▼'} {Math.abs(simPriceChange).toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* Slider track */}
                                    <div
                                        ref={sliderRef}
                                        onMouseDown={handleMouseDown}
                                        className="relative flex-1 min-h-[200px] cursor-pointer select-none"
                                        style={SLIDER_MARGIN_STYLE}
                                    >
                                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-bs-card-fg" />

                                        <div className="absolute -top-5 left-0 right-0 text-center">
                                            <span className="text-[8px] font-mono text-bs-text-tertiary">{formatPrice(sliderRange.max)}</span>
                                        </div>

                                        {/* Entry price line */}
                                        <div className="absolute left-0 right-0 flex items-center gap-1"
                                            style={{ top: `${priceToPercent(simSnapshot.entryPrice)}%` }}>
                                            <div className="flex-1 border-t border-dashed border-white/30" />
                                            <span className="text-[8px] font-mono text-bs-text-mute whitespace-nowrap">entry</span>
                                        </div>

                                        {/* Don't show stop line for trailing_stop — stopPrice is a % value, not a real price */}
                                        {simSnapshot.stopPrice != null && simSnapshot.orderType !== 'trailing_stop' && (
                                            <div className="absolute left-0 right-0 flex items-center gap-1"
                                                style={{ top: `${priceToPercent(simSnapshot.stopPrice)}%` }}>
                                                <div className="flex-1 h-px bg-orange-500/55" />
                                                <span className="text-[8px] font-mono text-orange-400/70 whitespace-nowrap">stop</span>
                                            </div>
                                        )}
                                        {/* For trailing stop, show trailing delta label instead */}
                                        {simSnapshot.orderType === 'trailing_stop' && simSnapshot.stopPrice != null && (
                                            <div className="absolute bottom-0 left-0 right-0 text-center">
                                                <span className="text-[8px] font-mono text-orange-400/70">trail {simSnapshot.stopPrice}%</span>
                                            </div>
                                        )}

                                        {(simSnapshot.price != null || simSnapshot.limitPrice != null) && (
                                            <div className="absolute left-0 right-0 flex items-center gap-1"
                                                style={{ top: `${priceToPercent(simSnapshot.price ?? simSnapshot.limitPrice!)}%` }}>
                                                <div className="flex-1 h-px bg-blue-500/55" />
                                                <span className="text-[8px] font-mono text-bs-brand-ts/70 whitespace-nowrap">limit</span>
                                            </div>
                                        )}

                                        {simSnapshot.tpPrice != null && (
                                            <div className="absolute left-0 right-0 flex items-center gap-1"
                                                style={{ top: `${priceToPercent(simSnapshot.tpPrice)}%` }}>
                                                <div className="flex-1 h-px bg-bs-success/55" />
                                                <span className="text-[8px] font-mono text-bs-success/70 whitespace-nowrap">TP</span>
                                            </div>
                                        )}

                                        {simSnapshot.slPrice != null && (
                                            <div className="absolute left-0 right-0 flex items-center gap-1"
                                                style={{ top: `${priceToPercent(simSnapshot.slPrice)}%` }}>
                                                <div className="flex-1 h-px bg-bs-error/55" />
                                                <span className="text-[8px] font-mono text-bs-error/70 whitespace-nowrap">SL</span>
                                            </div>
                                        )}

                                        {/* Draggable knob */}
                                        <div
                                            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                                            style={{ top: `${priceToPercent(simPrice)}%` }}
                                        >
                                            <div className={`w-4 h-4 border-2 ring-2 ring-black/50 cursor-grab active:cursor-grabbing shadow-lg ${knobColor}`} />
                                        </div>

                                        <div className="absolute -bottom-5 left-0 right-0 text-center">
                                            <span className="text-[8px] font-mono text-bs-text-tertiary">{formatPrice(sliderRange.min)}</span>
                                        </div>
                                    </div>

                                    <div className="text-center mt-1 flex-shrink-0">
                                        <span className="text-[9px] font-mono text-bs-text-tertiary">Drag to simulate</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Bottom row: Trade Summary (full width) ── */}
                    <div className="bg-bs-bg border border-bs-border p-4 overflow-y-auto custom-scrollbar">
                        <TradeSummaryPanel
                            simSnapshot={simSnapshot}
                            formatPrice={formatPrice}
                        />
                        {!simSnapshot && (
                            <div className="flex items-center justify-center py-4">
                                <div className="text-bs-text-primary/15 text-[9px] font-mono text-center leading-relaxed">
                                    Run Simulation to see summary
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

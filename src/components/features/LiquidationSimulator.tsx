'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lock, Info, Play } from 'lucide-react';
import type { PriceData } from '@/lib/hooks/useSpotTrade';

/**
 * LiquidationSimulator — Interactive educational component
 * Allows users to simulate perpetual futures positions and visualize
 * how market price movements affect margin and liquidation.
 *
 * See /Documents/liquidation-sim.md for full design and math.
 */

interface LiquidationSimulatorProps {
    livePrices: Record<string, PriceData>;
    currency: 'USD' | 'INR';
    usdInrRate: number;
}

type PositionSide = 'long' | 'short';

interface SimulationResult {
    entryPrice: number;
    liquidationPrice: number;
    initialMargin: number;
    quantity: number;
    side: PositionSide;
    leverage: number;
    mmr: number;
}

type LiqStatus = 'safe' | 'ok' | 'warning' | 'negative' | 'liquidated';

const STATUS_CONFIG: Record<LiqStatus, { color: string; bg: string; border: string; label: string; sublabel: string }> = {
    safe: { color: 'text-bs-success', bg: 'bg-bs-success', border: 'border-[#00e66b]/30', label: 'Safe', sublabel: 'Position Open' },
    ok: { color: 'text-bs-brand-ts', bg: 'bg-blue-500', border: 'border-[#69a2f1]/30', label: 'OK', sublabel: 'Position Open' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30', label: 'Warning', sublabel: 'Near Liquidation' },
    negative: { color: 'text-bs-error', bg: 'bg-bs-error', border: 'border-[#ff285a]/30', label: 'Negative', sublabel: 'About to Liquidate' },
    liquidated: { color: 'text-bs-text-tertiary', bg: 'bg-white/30', border: 'border-white/20', label: 'Liquidated', sublabel: 'Liquidated' },
};

// ─── Helpers ──────────────────────────────────

function calcLiquidationPrice(entry: number, leverage: number, mmr: number, side: PositionSide): number {
    if (side === 'long') {
        return entry * (1 - 1 / leverage + mmr);
    }
    return entry * (1 + 1 / leverage - mmr);
}

function calcDistanceConsumed(entry: number, sim: number, liq: number, side: PositionSide): number {
    const totalDist = Math.abs(entry - liq);
    if (totalDist === 0) return 100;

    let consumed: number;
    if (side === 'long') {
        consumed = Math.max(0, entry - sim);
    } else {
        consumed = Math.max(0, sim - entry);
    }
    return (consumed / totalDist) * 100;
}

function getStatus(consumed: number): LiqStatus {
    if (consumed >= 100) return 'liquidated';
    if (consumed >= 75) return 'negative';
    if (consumed >= 50) return 'warning';
    if (consumed >= 25) return 'ok';
    return 'safe';
}

// ─── Component ────────────────────────────────

export default function LiquidationSimulator({ livePrices, currency, usdInrRate }: LiquidationSimulatorProps) {
    // Inputs
    const xrpPrice = livePrices['XRP']?.price ?? 0;
    const [quantity, setQuantity] = useState<number>(100);
    const [leverage, setLeverage] = useState<number>(10);
    const [mmr, setMmr] = useState<number>(0.5);
    const [side, setSide] = useState<PositionSide>('long');

    // Simulation state
    const [simResult, setSimResult] = useState<SimulationResult | null>(null);
    const [simPrice, setSimPrice] = useState<number>(0);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Accordion
    const [accordionOpen, setAccordionOpen] = useState(false);

    // Derived: margin required (updates live as inputs change)
    const marginRequired = useMemo(() => {
        if (!xrpPrice || xrpPrice <= 0) return 0;
        return (quantity * xrpPrice) / leverage;
    }, [quantity, xrpPrice, leverage]);

    // Run simulation
    const runSimulation = useCallback(() => {
        if (!xrpPrice || xrpPrice <= 0) return;

        const liqPrice = calcLiquidationPrice(xrpPrice, leverage, mmr / 100, side);
        const margin = (quantity * xrpPrice) / leverage;

        setSimResult({
            entryPrice: xrpPrice,
            liquidationPrice: liqPrice,
            initialMargin: margin,
            quantity,
            side,
            leverage,
            mmr: mmr / 100,
        });
        setSimPrice(xrpPrice);
    }, [xrpPrice, quantity, leverage, mmr, side]);

    // ─── Derived results from sim price ───────
    const results = useMemo(() => {
        if (!simResult) return null;

        const { entryPrice, liquidationPrice, initialMargin, quantity: q, side: s } = simResult;

        const xrpChange = simPrice - entryPrice;
        const xrpChangePct = entryPrice > 0 ? (xrpChange / entryPrice) * 100 : 0;

        const positionValue = q * simPrice;
        const entryValue = q * entryPrice;

        const pnl = s === 'long' ? q * (simPrice - entryPrice) : q * (entryPrice - simPrice);
        const effectiveMargin = initialMargin + pnl;
        const marginChangePct = initialMargin > 0 ? ((effectiveMargin - initialMargin) / initialMargin) * 100 : 0;

        const consumed = calcDistanceConsumed(entryPrice, simPrice, liquidationPrice, s);
        const status = getStatus(consumed);

        const roe = initialMargin > 0 ? (pnl / initialMargin) * 100 : 0;

        return {
            xrpChange,
            xrpChangePct,
            positionValue,
            entryValue,
            pnl,
            roe,
            effectiveMargin,
            marginChangePct,
            consumed: Math.min(consumed, 100),
            status,
        };
    }, [simResult, simPrice]);

    // ─── Vertical slider drag logic ───────────
    const sliderRange = useMemo(() => {
        if (!simResult) return { min: 0, max: 0 };
        const entry = simResult.entryPrice;
        const liq = simResult.liquidationPrice;
        // Expand the scale to always include the liquidation price (with 5% padding)
        return {
            min: Math.min(entry * 0.8, liq * 0.95),
            max: Math.max(entry * 1.2, liq * 1.05),
        };
    }, [simResult]);

    const priceToPercent = useCallback((price: number) => {
        const { min, max } = sliderRange;
        if (max === min) return 50;
        return ((max - price) / (max - min)) * 100; // inverted: top = max
    }, [sliderRange]);

    const percentToPrice = useCallback((pct: number) => {
        const { min, max } = sliderRange;
        return max - (pct / 100) * (max - min);
    }, [sliderRange]);

    const handleSliderInteraction = useCallback((clientY: number) => {
        if (!sliderRef.current || !simResult) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
        setSimPrice(percentToPrice(pct));
    }, [percentToPrice, simResult]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        handleSliderInteraction(e.clientY);
    }, [handleSliderInteraction]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        handleSliderInteraction(e.touches[0].clientY);
    }, [handleSliderInteraction]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleSliderInteraction(e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            handleSliderInteraction(e.touches[0].clientY);
        };
        const handleEnd = () => setIsDragging(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, handleSliderInteraction]);

    // ─── Format helpers ───────────────────────
    const isINR = currency === 'INR';
    const symbol = isINR ? '₹' : '$';
    const convert = (n: number) => isINR ? n * usdInrRate : n;
    const fmt = (n: number, d = 2) => `${symbol}${convert(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    // ─── Render ───────────────────────────────

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 mb-3 md:mb-5">
                <h2 className="text-heading-16 text-white">Liquidation Simulator</h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-bs-brand-tertiary/15 text-bs-brand border border-bs-brand-tertiary/20 self-start">
                    Market Order Simulation
                </span>
            </div>

            {/* 3-Column Layout: Inputs | Results | Price Slider */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* ═══ LEFT: Inputs ═══ */}
                <div className="md:col-span-4 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 space-y-4">
                    <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Simulator Inputs</span>

                    {/* Token */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Token</label>
                        <div className="px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-white">
                            XRP / USDC
                        </div>
                    </div>

                    {/* Entry Price */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Entry Price</label>
                        <div className="px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-white flex items-center justify-between">
                            <span>{xrpPrice > 0 ? fmt(xrpPrice, 4) : 'Loading...'}</span>
                            <span className="flex items-center gap-1 text-[9px] text-bs-success">
                                <Lock size={10} />
                                LIVE
                            </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <Info size={10} className="text-bs-text-mute" />
                            <span className="text-[9px] font-mono text-bs-text-mute">Market Order — Binance live feed</span>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Quantity (XRP)</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-white focus:border-bs-brand-tertiary/50 focus:outline-none transition-colors"
                            min={1}
                            step={10}
                        />
                    </div>

                    {/* Leverage Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider">Leverage</label>
                            <span className="text-xs font-mono font-bold text-bs-brand-secondary">{leverage}x</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={leverage}
                            onChange={e => setLeverage(parseInt(e.target.value))}
                            className="w-full h-1.5 appearance-none bg-bs-card-fg rounded-lg cursor-pointer accent-[#00b3b3]
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00e6e6] [&::-webkit-slider-thumb]:rounded-lg [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#00e6e6] [&::-moz-range-thumb]:rounded-lg [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-bs-text-mute mt-0.5">
                            <span>1x</span>
                            <span>25x</span>
                            <span>50x</span>
                            <span>75x</span>
                            <span>100x</span>
                        </div>
                    </div>

                    {/* Maintenance Margin Rate */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Maint. Margin Rate (%)</label>
                        <input
                            type="number"
                            value={mmr}
                            onChange={e => setMmr(Math.max(0.01, Math.min(10, parseFloat(e.target.value) || 0.5)))}
                            className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-white focus:border-bs-brand-tertiary/50 focus:outline-none transition-colors"
                            min={0.01}
                            max={10}
                            step={0.1}
                        />
                    </div>

                    {/* Margin Required */}
                    <div className="p-3 bg-bs-brand-tertiary/10 border border-bs-brand-tertiary/20">
                        <div className="text-[10px] font-mono text-bs-brand-secondary/60 uppercase tracking-wider mb-1">Margin Required</div>
                        <div className="text-sm font-mono text-bs-brand-secondary font-bold">
                            💰 {fmt(marginRequired)} {isINR ? 'INR' : 'USDC'}
                        </div>
                        <div className="text-[9px] font-mono text-bs-text-mute mt-0.5">Qty × Price ÷ Leverage</div>
                    </div>

                    {/* Position Side */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Position Side</label>
                        <div className="grid grid-cols-2 gap-0 border border-bs-border">
                            <button
                                onClick={() => setSide('long')}
                                className={`py-2 text-xs font-mono font-bold transition-all ${side === 'long'
                                    ? 'bg-bs-success/20 text-bs-success border-r border-[#00e66b]/30'
                                    : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg border-r border-bs-border'
                                    }`}
                            >
                                Long
                            </button>
                            <button
                                onClick={() => setSide('short')}
                                className={`py-2 text-xs font-mono font-bold transition-all ${side === 'short'
                                    ? 'bg-bs-error/20 text-bs-error'
                                    : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg'
                                    }`}
                            >
                                Short
                            </button>
                        </div>
                    </div>

                    {/* Run Simulation Button */}
                    <button
                        onClick={runSimulation}
                        disabled={!xrpPrice || xrpPrice <= 0}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-mono font-bold
                            bg-gradient-to-r from-[#00b3b3] to-[#00ffff] text-white
                            hover:from-[#00e6e6] hover:to-[#00ffff]
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all active:scale-[0.98]"
                    >
                        <Play size={14} fill="currentColor" />
                        RUN SIMULATION
                    </button>
                </div>

                {/* ═══ MIDDLE: Results ═══ */}
                <div className={`md:col-span-5 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 ${!simResult ? 'flex items-center justify-center' : ''}`}>
                    {!simResult ? (
                        <div className="text-center">
                            <div className="text-white/15 text-xs font-mono mb-2">No simulation running</div>
                            <div className="text-white/10 text-[10px] font-mono">Configure inputs and press "Run Simulation"</div>
                        </div>
                    ) : results && (
                        <div className="space-y-4">
                            <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Simulation Results</span>

                            {/* XRP Change */}
                            <div className="p-3 bg-bs-card border border-bs-border">
                                <div className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1">XRP Price Change</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-mono text-bs-text-tertiary">{fmt(simResult.entryPrice, 4)}</span>
                                    <span className="text-bs-text-mute">→</span>
                                    <span className="text-sm font-mono text-white font-bold">{fmt(simPrice, 4)}</span>
                                </div>
                                <div className={`text-xs font-mono font-bold mt-1 ${results.xrpChange >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                    {results.xrpChange >= 0 ? '+' : ''}{fmt(results.xrpChange, 4)} ({fmtPct(results.xrpChangePct)})
                                </div>
                            </div>

                            {/* Position Value */}
                            <div className="p-3 bg-bs-card border border-bs-border">
                                <div className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1">Position Value</div>
                                <div className="text-lg font-mono text-white font-bold">{fmt(results.positionValue)}</div>
                                <div className="text-[10px] font-mono text-bs-text-mute mt-0.5">
                                    was {fmt(results.entryValue)} at entry
                                </div>
                            </div>

                            {/* Margin Change */}
                            <div className="p-3 bg-bs-card border border-bs-border">
                                <div className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1">Margin Change</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-mono text-bs-text-tertiary">{fmt(simResult.initialMargin)}</span>
                                    <span className="text-bs-text-mute">→</span>
                                    <span className={`text-sm font-mono font-bold ${results.effectiveMargin >= simResult.initialMargin ? 'text-bs-success' : 'text-bs-error'}`}>
                                        {fmt(results.effectiveMargin)}
                                    </span>
                                </div>
                                <div className={`text-xs font-mono font-bold mt-1 ${results.pnl >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                    {results.pnl >= 0 ? '+' : ''}{fmt(results.pnl)} ({fmtPct(results.marginChangePct)})
                                </div>
                            </div>

                            {/* Unrealized PnL */}
                            <div className={`p-3 border ${results.pnl >= 0 ? 'border-[#00e66b]/20 bg-bs-success/5' : 'border-[#ff285a]/20 bg-bs-error/5'}`}>
                                <div className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1">Unrealized PnL</div>
                                <div className={`text-lg font-mono font-bold ${results.pnl >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                                    {results.pnl >= 0 ? '+' : ''}{fmt(results.pnl)}
                                </div>
                                <div className={`text-xs font-mono mt-0.5 ${results.roe >= 0 ? 'text-bs-success/60' : 'text-bs-error/60'}`}>
                                    Return on Margin: {fmtPct(results.roe)}
                                </div>
                            </div>

                            {/* Liquidation Status Bar */}
                            <div className={`p-3 border ${STATUS_CONFIG[results.status].border} bg-bs-bg/40`}>
                                <div className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-2">Liquidation Status</div>

                                {/* Bar */}
                                <div className="relative h-3 bg-bs-card overflow-hidden mb-2">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-300 ${STATUS_CONFIG[results.status].bg}`}
                                        style={{ width: `${Math.max(2, 100 - results.consumed)}%`, opacity: results.status === 'liquidated' ? 0.3 : 0.6 }}
                                    />
                                    {/* Marker */}
                                    <div
                                        className="absolute top-0 h-full w-0.5 bg-white/80 transition-all duration-300"
                                        style={{ left: `${Math.max(2, 100 - results.consumed)}%` }}
                                    />
                                </div>

                                {/* Status label */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 ${STATUS_CONFIG[results.status].bg} ${results.status === 'liquidated' ? 'opacity-60' : ''}`} />
                                        <span className={`text-xs font-mono font-bold ${STATUS_CONFIG[results.status].color}`}>
                                            {STATUS_CONFIG[results.status].label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-bs-text-mute">
                                        {STATUS_CONFIG[results.status].sublabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ RIGHT: Vertical Price Slider ═══ */}
                <div className="md:col-span-3 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                    {!simResult ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-white/10 text-[10px] font-mono text-center">
                                Price slider<br />appears after<br />simulation
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider mb-3">Market Price</span>

                            {/* Current sim price display */}
                            <div className="text-center mb-3">
                                <div className="text-lg font-mono text-white font-bold">{fmt(simPrice, 4)}</div>
                                <div className={`text-[10px] font-mono ${simPrice >= simResult.entryPrice ? 'text-bs-success' : 'text-bs-error'}`}>
                                    {simPrice >= simResult.entryPrice ? '▲' : '▼'} {fmtPct(((simPrice - simResult.entryPrice) / simResult.entryPrice) * 100)}
                                </div>
                            </div>

                            {/* Vertical slider track */}
                            <div
                                ref={sliderRef}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                                className="relative flex-1 min-h-[200px] md:min-h-[280px] cursor-pointer select-none mx-auto touch-none"
                                style={{ width: '100%' }}
                            >
                                {/* Track background */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-bs-card-fg" />

                                {/* Entry price line */}
                                <div
                                    className="absolute left-0 right-0 flex items-center gap-2"
                                    style={{ top: `${priceToPercent(simResult.entryPrice)}%` }}
                                >
                                    <div className="flex-1 h-px bg-white/30 border-dashed" />
                                    <span className="text-[9px] font-mono text-bs-text-tertiary whitespace-nowrap">
                                        {fmt(simResult.entryPrice, 4)} Entry
                                    </span>
                                </div>

                                {/* Liquidation price line — always visible; scale auto-expands to fit */}
                                <div
                                    className="absolute left-0 right-0 flex items-center gap-2"
                                    style={{ top: `${priceToPercent(simResult.liquidationPrice)}%` }}
                                >
                                    <div className="flex-1 h-px bg-bs-error/60" />
                                    <span className="text-[9px] font-mono text-bs-error whitespace-nowrap">
                                        {fmt(simResult.liquidationPrice, 4)} Liq 🔴
                                    </span>
                                </div>

                                {/* Draggable knob */}
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-2"
                                    style={{ top: `${priceToPercent(simPrice)}%` }}
                                >
                                    <div className={`w-5 h-5 border-2 ring-2 ring-black/50 ${results?.status === 'liquidated' ? 'bg-white/30 border-white/40' :
                                        results?.status === 'negative' ? 'bg-bs-error border-red-400' :
                                            results?.status === 'warning' ? 'bg-yellow-500 border-yellow-400' :
                                                results?.status === 'ok' ? 'bg-blue-500 border-blue-400' :
                                                    'bg-bs-success border-green-400'
                                        } cursor-grab active:cursor-grabbing shadow-lg`} />
                                </div>

                                {/* Top/Bottom range labels */}
                                <div className="absolute -top-5 left-0 right-0 text-center">
                                    <span className="text-[8px] font-mono text-bs-text-mute">{fmt(sliderRange.max, 4)}</span>
                                </div>
                                <div className="absolute -bottom-5 left-0 right-0 text-center">
                                    <span className="text-[8px] font-mono text-bs-text-mute">{fmt(sliderRange.min, 4)}</span>
                                </div>
                            </div>

                            <div className="text-center mt-2">
                                <span className="text-[9px] font-mono text-bs-text-mute">Drag to simulate price</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Accordion: Educational Info ═══ */}
            <div className="bg-bs-bg/40 backdrop-blur-xl border border-bs-border">
                <button
                    onClick={() => setAccordionOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-bs-card transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-bs-brand" />
                        <span className="text-xs font-mono text-bs-text-tertiary">What is Liquidation?</span>
                    </div>
                    {accordionOpen ? (
                        <ChevronUp size={14} className="text-bs-text-mute" />
                    ) : (
                        <ChevronDown size={14} className="text-bs-text-mute" />
                    )}
                </button>

                {accordionOpen && (
                    <div className="px-4 pb-4 border-t border-bs-border">
                        <div className="pt-3 space-y-3 text-xs font-mono text-bs-text-mute leading-relaxed">
                            <p>
                                In perpetual futures trading, <span className="text-bs-text-secondary">liquidation</span> occurs when your
                                position's unrealized loss consumes your initial margin (collateral). The exchange automatically
                                closes your position to prevent further losses.
                            </p>
                            <div className="space-y-1.5">
                                <p className="text-bs-text-tertiary font-bold">Key Takeaways:</p>
                                <ul className="space-y-1 text-white/35">
                                    <li className="flex items-start gap-2">
                                        <span className="text-bs-brand mt-0.5">•</span>
                                        <span>Higher leverage moves the liquidation price closer to your entry — more risk.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-bs-success mt-0.5">•</span>
                                        <span>Long positions are liquidated when price drops below the liquidation price.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-bs-error mt-0.5">•</span>
                                        <span>Short positions are liquidated when price rises above the liquidation price.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-400 mt-0.5">•</span>
                                        <span>Maintenance margin rate determines the minimum margin to keep a position open.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-2 bg-bs-card border border-bs-border text-[10px] text-bs-text-mute">
                                <span className="text-bs-text-mute">Formula:</span><br />
                                Long Liq Price = Entry × (1 − 1/Leverage + MMR)<br />
                                Short Liq Price = Entry × (1 + 1/Leverage − MMR)
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

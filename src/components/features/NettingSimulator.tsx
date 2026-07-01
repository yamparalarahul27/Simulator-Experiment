'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X, RotateCcw, TrendingUp, Info, ChevronDown, ChevronUp, ArrowRightLeft, Layers } from 'lucide-react';
import type { PriceData } from '@/lib/hooks/useSpotTrade';
import {
    computeOneWay,
    computeHedge,
    unrealizedPnl,
    type NetOrder,
    type Side,
    type NettingMode,
    type TargetStatus,
} from '@/lib/positionNetting';
import { cn } from '@/lib/utils';

/**
 * NettingSimulator — place multiple Long/Short orders on one market and see
 * how they net (one-way) or coexist (hedge), and what happens to each order's
 * TP/SL. Math lives in /lib/positionNetting.ts.
 */

interface Props {
    livePrices: Record<string, PriceData>;
    currency: 'USD' | 'INR';
    usdInrRate: number;
}

const TOKENS = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'XRP'] as const;
type Token = typeof TOKENS[number];

const STATUS_STYLE: Record<TargetStatus, string> = {
    active: 'text-bs-success',
    superseded: 'text-bs-warning',
    cancelled: 'text-bs-error',
    none: 'text-bs-text-mute',
};

export default function NettingSimulator({ livePrices, currency, usdInrRate }: Props) {
    const [token, setToken] = useState<Token>('XRP');
    const [mode, setMode] = useState<NettingMode>('oneway');
    const [orders, setOrders] = useState<NetOrder[]>([]);
    const [simPrice, setSimPrice] = useState<number | null>(null);
    const [accordionOpen, setAccordionOpen] = useState(false);
    const idRef = React.useRef(0);

    // Form
    const [fSide, setFSide] = useState<Side>('long');
    const [fQty, setFQty] = useState<number>(20);
    const [customEntry, setCustomEntry] = useState<number | null>(null);
    const [tpOn, setTpOn] = useState(false);
    const [slOn, setSlOn] = useState(false);
    const [tpVal, setTpVal] = useState<number>(0);
    const [slVal, setSlVal] = useState<number>(0);

    const live = livePrices[token]?.price ?? 0;
    const entry = customEntry ?? live;
    const mark = simPrice ?? live;

    const oneWay = useMemo(() => computeOneWay(orders), [orders]);
    const hedge = useMemo(() => computeHedge(orders), [orders]);

    // ─── Formatting ───────────────────────────────────────────
    const isINR = currency === 'INR';
    const sym = isINR ? '₹' : '$';
    const conv = (n: number) => (isINR ? n * usdInrRate : n);
    const fmt = (n: number, d = 2) => `${n < 0 ? '-' : ''}${sym}${Math.abs(conv(n)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
    const fmtPx = (n: number) => fmt(n, n < 1 ? 4 : 2);
    const signed = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n)}`;

    // ─── Handlers ─────────────────────────────────────────────
    const switchToken = (t: Token) => { setToken(t); setCustomEntry(null); setSimPrice(null); setTpOn(false); setSlOn(false); };

    const toggleTp = () => {
        setTpOn(prev => {
            const next = !prev;
            if (next && tpVal <= 0 && live > 0) setTpVal(fSide === 'long' ? +(live * 1.1).toFixed(4) : +(live * 0.9).toFixed(4));
            return next;
        });
    };
    const toggleSl = () => {
        setSlOn(prev => {
            const next = !prev;
            if (next && slVal <= 0 && live > 0) setSlVal(fSide === 'long' ? +(live * 0.95).toFixed(4) : +(live * 1.05).toFixed(4));
            return next;
        });
    };

    const addOrder = () => {
        if (entry <= 0 || fQty <= 0) return;
        idRef.current += 1;
        setOrders(prev => [...prev, {
            id: `o${idRef.current}`,
            side: fSide,
            quantity: fQty,
            entryPrice: entry,
            tp: tpOn ? tpVal : null,
            sl: slOn ? slVal : null,
        }]);
    };

    const removeOrder = (id: string) => setOrders(prev => prev.filter(o => o.id !== id));
    const reset = () => { setOrders([]); setSimPrice(null); };

    // ─── Market scale range + markers ─────────────────────────
    const range = useMemo(() => {
        const pts: number[] = [];
        if (live > 0) pts.push(live);
        for (const o of orders) {
            pts.push(o.entryPrice);
            if (o.tp != null) pts.push(o.tp);
            if (o.sl != null) pts.push(o.sl);
        }
        if (pts.length === 0) return { min: 0, max: 1 };
        const lo = Math.min(...pts), hi = Math.max(...pts);
        const pad = (hi - lo) * 0.15 || hi * 0.1 || 1;
        return { min: Math.max(0, lo - pad), max: hi + pad };
    }, [orders, live]);

    const pct = (p: number) => {
        const span = range.max - range.min || 1;
        return Math.max(0, Math.min(100, ((p - range.min) / span) * 100));
    };

    // ─── Net PnL at mark (one-way) ────────────────────────────
    const netUpnl = oneWay.netSide !== 'flat'
        ? unrealizedPnl(oneWay.netSide, oneWay.netQty, oneWay.avgEntry, mark)
        : 0;

    const oneWayTrigger = (() => {
        if (oneWay.netSide === 'flat') return null;
        const long = oneWay.netSide === 'long';
        if (oneWay.positionTp != null && ((long && mark >= oneWay.positionTp) || (!long && mark <= oneWay.positionTp))) return 'tp';
        if (oneWay.positionSl != null && ((long && mark <= oneWay.positionSl) || (!long && mark >= oneWay.positionSl))) return 'sl';
        return null;
    })();

    const changePct = live > 0 ? ((mark - live) / live) * 100 : 0;

    // ─── Render ───────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Title + mode toggle */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <h2 className="text-heading-16 text-bs-text-primary">Netting &amp; TP/SL</h2>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-bs-brand-tertiary/15 text-bs-brand border border-bs-brand-tertiary/20 self-start">
                        Long / Short Interaction
                    </span>
                </div>
                <div className="flex border border-bs-border">
                    <button
                        onClick={() => setMode('oneway')}
                        className={cn('px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1 border-r border-bs-border',
                            mode === 'oneway' ? 'bg-bs-brand-tertiary/15 text-bs-brand' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                    >
                        <ArrowRightLeft size={11} /> One-way (Netting)
                    </button>
                    <button
                        onClick={() => setMode('hedge')}
                        className={cn('px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1',
                            mode === 'hedge' ? 'bg-bs-info/15 text-bs-info' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                    >
                        <Layers size={11} /> Hedge
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* ═══ Add Order ═══ */}
                <div className="lg:col-span-4 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 space-y-3">
                    <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider flex items-center gap-2">
                        <Plus size={12} /> Add Order
                    </span>

                    {/* Token */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Token</label>
                        <div className="grid grid-cols-3 gap-1">
                            {TOKENS.map(t => (
                                <button key={t} onClick={() => switchToken(t)}
                                    className={cn('py-1.5 text-[11px] font-mono font-bold border transition-all',
                                        token === t ? 'bg-bs-brand-tertiary/15 text-bs-brand border-bs-brand-tertiary/40' : 'bg-bs-card text-bs-text-mute border-bs-border hover:text-bs-text-secondary')}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="text-[9px] font-mono text-bs-text-mute mt-1">Live: {live > 0 ? fmtPx(live) : 'Loading…'}</div>
                    </div>

                    {/* Side */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Side</label>
                        <div className="grid grid-cols-2 gap-0 border border-bs-border">
                            <button onClick={() => setFSide('long')}
                                className={cn('py-2 text-xs font-mono font-bold border-r border-bs-border',
                                    fSide === 'long' ? 'bg-bs-success/20 text-bs-success' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}>Long</button>
                            <button onClick={() => setFSide('short')}
                                className={cn('py-2 text-xs font-mono font-bold',
                                    fSide === 'short' ? 'bg-bs-error/20 text-bs-error' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}>Short</button>
                        </div>
                    </div>

                    {/* Qty + Entry */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Quantity</label>
                            <input type="number" value={fQty} min={0} step={1}
                                onChange={e => setFQty(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1 flex items-center justify-between">
                                Entry
                                {customEntry != null && (
                                    <button onClick={() => setCustomEntry(null)} className="text-[8px] text-bs-text-mute hover:text-bs-text-primary flex items-center gap-0.5"><RotateCcw size={8} />live</button>
                                )}
                            </label>
                            <input type="number" value={+entry.toFixed(4)} min={0} step={0.0001}
                                onChange={e => setCustomEntry(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none" />
                        </div>
                    </div>

                    {/* TP */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1 cursor-pointer">
                            <input type="checkbox" checked={tpOn} onChange={toggleTp} className="accent-bs-success" />
                            Take Profit
                        </label>
                        {tpOn && (
                            <input type="number" value={tpVal} min={0} step={0.0001}
                                onChange={e => setTpVal(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full px-3 py-2 bg-bs-card border border-bs-success/30 text-sm font-mono text-bs-success focus:outline-none" />
                        )}
                    </div>

                    {/* SL */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-mono text-bs-text-mute uppercase tracking-wider mb-1 cursor-pointer">
                            <input type="checkbox" checked={slOn} onChange={toggleSl} className="accent-bs-error" />
                            Stop Loss
                        </label>
                        {slOn && (
                            <input type="number" value={slVal} min={0} step={0.0001}
                                onChange={e => setSlVal(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full px-3 py-2 bg-bs-card border border-bs-error/30 text-sm font-mono text-bs-error focus:outline-none" />
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={addOrder} disabled={entry <= 0 || fQty <= 0}
                            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-mono font-bold bg-bs-accent-cyan text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                            <Plus size={14} /> ADD ORDER
                        </button>
                        <button onClick={reset} className="px-3 text-[10px] font-mono text-bs-text-mute hover:text-bs-text-primary border border-bs-border">Reset</button>
                    </div>

                    {/* Quick presets */}
                    <div className="pt-1">
                        <div className="text-[9px] font-mono text-bs-text-mute uppercase mb-1">Quick scenarios</div>
                        <div className="grid grid-cols-1 gap-1">
                            <PresetButton label="Long 20 + Short 10 (reduce)" onClick={() => loadPreset(setOrders, idRef, live, [['long', 20, true], ['short', 10, false]])} />
                            <PresetButton label="Long 30 + Short 40 (flip)" onClick={() => loadPreset(setOrders, idRef, live, [['long', 30, true], ['short', 40, true]])} />
                            <PresetButton label="Long 20 (TP/SL) + Short 10" onClick={() => loadPreset(setOrders, idRef, live, [['long', 20, true], ['short', 10, false]])} />
                        </div>
                    </div>
                </div>

                {/* ═══ Ledger / Positions ═══ */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Orders list */}
                    <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                        <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Orders ({orders.length})</span>
                        {orders.length === 0 ? (
                            <div className="h-24 flex items-center justify-center text-center">
                                <div className="text-bs-text-primary/15 text-xs font-mono">Add orders or pick a quick scenario →</div>
                            </div>
                        ) : (
                            <div className="mt-2 space-y-1">
                                {orders.map(o => (
                                    <div key={o.id} className="flex items-center justify-between bg-bs-card border border-bs-border px-3 py-2 text-[11px] font-mono">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn('px-1.5 py-0.5 text-[9px] font-bold uppercase', o.side === 'long' ? 'bg-bs-success/15 text-bs-success' : 'bg-bs-error/15 text-bs-error')}>{o.side}</span>
                                            <span className="text-bs-text-primary">{o.quantity} @ {fmtPx(o.entryPrice)}</span>
                                            {o.tp != null && <span className="text-bs-success">TP {fmtPx(o.tp)}</span>}
                                            {o.sl != null && <span className="text-bs-error">SL {fmtPx(o.sl)}</span>}
                                        </div>
                                        <button onClick={() => removeOrder(o.id)} className="text-bs-text-mute hover:text-bs-error"><X size={13} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Result: one-way ledger OR hedge legs */}
                    {orders.length > 0 && (mode === 'oneway' ? (
                        <OneWayResultCard result={oneWay} fmtPx={fmtPx} signed={signed} netUpnl={netUpnl} trigger={oneWayTrigger} mark={mark} />
                    ) : (
                        <HedgeResultCard result={hedge} fmtPx={fmtPx} signed={signed} mark={mark} />
                    ))}
                </div>
            </div>

            {/* ═══ Market Scale ═══ */}
            {orders.length > 0 && (
                <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-bs-brand" />
                            <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Market Scale</span>
                            <span className="text-sm font-mono text-bs-text-primary">{fmtPx(mark)}</span>
                            <span className={cn('text-[10px] font-mono', changePct >= 0 ? 'text-bs-success' : 'text-bs-error')}>
                                {changePct >= 0 ? '▲' : '▼'} {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}% vs live
                            </span>
                        </div>
                        <button onClick={() => setSimPrice(null)} className="flex items-center gap-1 text-[9px] font-mono text-bs-text-mute hover:text-bs-text-primary border border-bs-border px-2 py-1"><RotateCcw size={9} /> Live</button>
                    </div>

                    {/* Marker track */}
                    <div className="relative h-6 mb-1">
                        {orders.map(o => (
                            <React.Fragment key={o.id}>
                                <div className="absolute top-1 h-3 w-px bg-white/40" style={{ left: `${pct(o.entryPrice)}%` }} title={`Entry ${fmtPx(o.entryPrice)}`} />
                                {o.tp != null && <div className="absolute top-0 h-5 w-0.5 bg-bs-success" style={{ left: `${pct(o.tp)}%` }} title={`TP ${fmtPx(o.tp)}`} />}
                                {o.sl != null && <div className="absolute top-0 h-5 w-0.5 bg-bs-error" style={{ left: `${pct(o.sl)}%` }} title={`SL ${fmtPx(o.sl)}`} />}
                            </React.Fragment>
                        ))}
                        {live > 0 && <div className="absolute bottom-0 h-2 w-px bg-bs-brand" style={{ left: `${pct(live)}%` }} title={`Live ${fmtPx(live)}`} />}
                    </div>

                    <input type="range" min={range.min} max={range.max} step={(range.max - range.min) / 1000 || 0.0001} value={mark}
                        onChange={e => setSimPrice(parseFloat(e.target.value))}
                        className="w-full h-1.5 appearance-none bg-bs-card-fg rounded-lg cursor-pointer accent-bs-accent-cyan
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-bs-accent-cyan [&::-webkit-slider-thumb]:rounded-lg
                            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-bs-accent-cyan [&::-moz-range-thumb]:rounded-lg [&::-moz-range-thumb]:border-0" />
                    <div className="flex justify-between text-[8px] font-mono text-bs-text-mute mt-0.5">
                        <span>{fmtPx(range.min)}</span>
                        <span className="text-bs-brand">● live {live > 0 ? fmtPx(live) : '—'}</span>
                        <span>{fmtPx(range.max)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[8px] font-mono text-bs-text-mute">
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-px bg-white/40" /> entry</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-px h-2 bg-bs-success" /> TP</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-px h-2 bg-bs-error" /> SL</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-px h-2 bg-bs-brand" /> live</span>
                    </div>
                </div>
            )}

            {/* ═══ Explainer ═══ */}
            <div className="bg-bs-bg/40 backdrop-blur-xl border border-bs-border">
                <button onClick={() => setAccordionOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-bs-card transition-colors">
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-bs-brand" />
                        <span className="text-xs font-mono text-bs-text-tertiary">Netting vs Hedge — what happens to TP/SL</span>
                    </div>
                    {accordionOpen ? <ChevronUp size={14} className="text-bs-text-mute" /> : <ChevronDown size={14} className="text-bs-text-mute" />}
                </button>
                {accordionOpen && (
                    <div className="px-4 pb-4 border-t border-bs-border pt-3 space-y-3 text-xs font-mono text-bs-text-mute leading-relaxed">
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 bg-bs-card border border-bs-brand-tertiary/20">
                                <div className="text-bs-brand font-bold mb-1 flex items-center gap-1"><ArrowRightLeft size={11} /> One-way (Netting)</div>
                                <ul className="space-y-1 text-bs-text-primary/40">
                                    <li>• One position per market. Opposite orders reduce it.</li>
                                    <li>• If an opposite order exceeds the position, it flips the side.</li>
                                    <li>• TP/SL is position-level — one TP, one SL for the net.</li>
                                    <li>• A reduce drops the closing order&apos;s TP/SL; a flip cancels the old TP/SL.</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-bs-card border border-bs-info/20">
                                <div className="text-bs-info font-bold mb-1 flex items-center gap-1"><Layers size={11} /> Hedge</div>
                                <ul className="space-y-1 text-bs-text-primary/40">
                                    <li>• Long and Short are separate positions — no netting.</li>
                                    <li>• Each side keeps its own TP/SL and can trigger alone.</li>
                                    <li>• Net exposure (long − short) is informational only.</li>
                                </ul>
                            </div>
                        </div>
                        <p>Toggle the mode above with the same orders to compare. Try <span className="text-bs-text-secondary">Long 30 + Short 40</span>: one-way flips to a net Short 10 and cancels the long&apos;s TP/SL; hedge keeps both a Long 30 and Short 40 with their own TP/SL.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Result cards ─────────────────────────────────────────────
type Fmt = (n: number, d?: number) => string;

function StatusPill({ status }: { status: TargetStatus }) {
    if (status === 'none') return <span className="text-bs-text-mute">—</span>;
    return <span className={cn('font-bold uppercase', STATUS_STYLE[status])}>{status}</span>;
}

function OneWayResultCard({ result, fmtPx, signed, netUpnl, trigger, mark }: {
    result: ReturnType<typeof computeOneWay>; fmtPx: Fmt; signed: (n: number) => string; netUpnl: number; trigger: 'tp' | 'sl' | null; mark: number;
}) {
    const net = result.netSide;
    return (
        <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 space-y-3">
            <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Netting Ledger</span>

            {/* Ledger steps */}
            <div className="space-y-1 text-[11px] font-mono">
                {result.steps.map(s => (
                    <div key={s.index} className="flex items-center justify-between bg-bs-card border border-bs-border px-3 py-1.5">
                        <span className="text-bs-text-tertiary">#{s.index + 1}</span>
                        <span className={cn('px-1.5 py-0.5 text-[9px] font-bold uppercase', s.order.side === 'long' ? 'text-bs-success' : 'text-bs-error')}>{s.order.side} {s.order.quantity}</span>
                        <span className="text-bs-text-primary flex-1 text-center">{s.effect}</span>
                        <span className={cn(s.realizedPnl > 0 ? 'text-bs-success' : s.realizedPnl < 0 ? 'text-bs-error' : 'text-bs-text-mute')}>
                            {s.realizedPnl !== 0 ? signed(s.realizedPnl) : '—'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Net position */}
            <div className={cn('p-3 border', net === 'flat' ? 'border-bs-border bg-bs-card' : net === 'long' ? 'border-bs-buy/30 bg-bs-success/5' : 'border-bs-sell/30 bg-bs-error/5')}>
                <div className="flex items-center justify-between">
                    <div className="text-sm font-mono font-bold text-bs-text-primary">
                        NET: {net === 'flat' ? <span className="text-bs-text-mute">FLAT (no position)</span> : (
                            <span className={net === 'long' ? 'text-bs-success' : 'text-bs-error'}>{net.toUpperCase()} {result.netQty} @ {fmtPx(result.avgEntry)}</span>
                        )}
                    </div>
                    <div className="text-right text-[10px] font-mono">
                        <span className="text-bs-text-mute">Realized </span>
                        <span className={result.realizedPnl >= 0 ? 'text-bs-success' : 'text-bs-error'}>{signed(result.realizedPnl)}</span>
                    </div>
                </div>
                {net !== 'flat' && (
                    <div className="mt-1 text-[10px] font-mono">
                        <span className="text-bs-text-mute">uPnL @ {fmtPx(mark)}: </span>
                        <span className={netUpnl >= 0 ? 'text-bs-success' : 'text-bs-error'}>{signed(netUpnl)}</span>
                    </div>
                )}
            </div>

            {/* TP/SL resolution */}
            {net !== 'flat' && (
                <div className="grid grid-cols-2 gap-2">
                    <div className={cn('p-2 border', trigger === 'tp' ? 'border-bs-success bg-bs-success/10' : 'border-bs-border bg-bs-card')}>
                        <div className="text-[9px] font-mono text-bs-text-mute uppercase">Position TP {trigger === 'tp' && <span className="text-bs-success">• HIT</span>}</div>
                        <div className="text-sm font-mono text-bs-success font-bold">{result.positionTp != null ? fmtPx(result.positionTp) : '—'}</div>
                    </div>
                    <div className={cn('p-2 border', trigger === 'sl' ? 'border-bs-error bg-bs-error/10' : 'border-bs-border bg-bs-card')}>
                        <div className="text-[9px] font-mono text-bs-text-mute uppercase">Position SL {trigger === 'sl' && <span className="text-bs-error">• HIT</span>}</div>
                        <div className="text-sm font-mono text-bs-error font-bold">{result.positionSl != null ? fmtPx(result.positionSl) : '—'}</div>
                    </div>
                </div>
            )}

            {/* Per-order TP/SL status */}
            <div className="space-y-1">
                <div className="text-[9px] font-mono text-bs-text-mute uppercase tracking-wider">Each order&apos;s TP/SL</div>
                {result.statuses.map((st, i) => {
                    const o = result.steps[i].order;
                    return (
                        <div key={st.orderId} className="flex items-center justify-between bg-bs-card border border-bs-border px-3 py-1.5 text-[10px] font-mono">
                            <span className={cn('font-bold uppercase', o.side === 'long' ? 'text-bs-success' : 'text-bs-error')}>#{i + 1} {o.side} {o.quantity}</span>
                            <span className="flex items-center gap-3">
                                <span>TP <StatusPill status={st.tp} /></span>
                                <span>SL <StatusPill status={st.sl} /></span>
                            </span>
                            <span className="text-bs-text-mute flex-1 text-right truncate ml-2">{st.note}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function HedgeResultCard({ result, fmtPx, signed, mark }: {
    result: ReturnType<typeof computeHedge>; fmtPx: Fmt; signed: (n: number) => string; mark: number;
}) {
    const legs = [result.long, result.short].filter(Boolean) as NonNullable<typeof result.long>[];
    return (
        <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Hedge Positions</span>
                <span className="text-[10px] font-mono text-bs-text-mute">Net exposure: <span className="text-bs-text-primary">{result.netExposure >= 0 ? '+' : ''}{result.netExposure}</span></span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
                {legs.map(leg => {
                    const upnl = unrealizedPnl(leg.side, leg.qty, leg.avgEntry, mark);
                    const long = leg.side === 'long';
                    const tpHit = leg.tp != null && ((long && mark >= leg.tp) || (!long && mark <= leg.tp));
                    const slHit = leg.sl != null && ((long && mark <= leg.sl) || (!long && mark >= leg.sl));
                    return (
                        <div key={leg.side} className={cn('p-3 border', long ? 'border-bs-buy/30 bg-bs-success/5' : 'border-bs-sell/30 bg-bs-error/5')}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn('text-sm font-mono font-bold', long ? 'text-bs-success' : 'text-bs-error')}>{leg.side.toUpperCase()} {leg.qty}</span>
                                <span className="text-[10px] font-mono text-bs-text-mute">@ {fmtPx(leg.avgEntry)}</span>
                            </div>
                            <div className="text-[10px] font-mono mb-1">
                                <span className="text-bs-text-mute">uPnL: </span>
                                <span className={upnl >= 0 ? 'text-bs-success' : 'text-bs-error'}>{signed(upnl)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                                <div className={cn(tpHit && 'font-bold')}>
                                    <span className="text-bs-text-mute">TP </span>
                                    <span className="text-bs-success">{leg.tp != null ? fmtPx(leg.tp) : '—'}</span>
                                    {tpHit && <span className="text-bs-success"> • HIT</span>}
                                </div>
                                <div className={cn(slHit && 'font-bold')}>
                                    <span className="text-bs-text-mute">SL </span>
                                    <span className="text-bs-error">{leg.sl != null ? fmtPx(leg.sl) : '—'}</span>
                                    {slHit && <span className="text-bs-error"> • HIT</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[9px] font-mono text-bs-text-mute">Both positions are live at once — each triggers its own TP/SL independently. No netting.</p>
        </div>
    );
}

// ─── Small helpers ────────────────────────────────────────────
function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="text-left px-2 py-1.5 text-[10px] font-mono text-bs-text-tertiary border border-bs-border hover:border-bs-brand-tertiary/40 hover:text-bs-text-primary bg-bs-card transition-colors">
            {label}
        </button>
    );
}

function loadPreset(
    setOrders: React.Dispatch<React.SetStateAction<NetOrder[]>>,
    idRef: React.MutableRefObject<number>,
    live: number,
    specs: [Side, number, boolean][], // [side, qty, withTpSl]
) {
    if (live <= 0) return;
    const built: NetOrder[] = specs.map(([side, qty, withTpSl]) => {
        idRef.current += 1;
        return {
            id: `o${idRef.current}`,
            side,
            quantity: qty,
            entryPrice: live,
            tp: withTpSl ? +(side === 'long' ? live * 1.1 : live * 0.9).toFixed(4) : null,
            sl: withTpSl ? +(side === 'long' ? live * 0.95 : live * 1.05).toFixed(4) : null,
        };
    });
    setOrders(built);
}

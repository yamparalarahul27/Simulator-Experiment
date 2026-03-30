'use client';

import React, { useState, useCallback } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import type { SimConfig } from './OrderFlowVisualiser';

interface SpotOrderFormProps {
    pair: string;
    currentPrice: number;
    formatPrice: (amount: number, decimals?: number) => string;
    orderType: DemoOrderType;
    onOrderTypeChange: (v: DemoOrderType) => void;
    side: 'buy' | 'sell';
    onSideChange: (v: 'buy' | 'sell') => void;
    onRunSimulation: (config: SimConfig) => void;
}

const ORDER_TYPES: { value: DemoOrderType; label: string }[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'stop_market', label: 'Stop Mkt' },
    { value: 'stop_limit', label: 'Stop Lmt' },
    { value: 'iceberg', label: 'Iceberg' },
    { value: 'twap', label: 'TWAP' },
    { value: 'trailing_stop', label: 'Trailing' },
    { value: 'oco', label: 'OCO' },
];

// Consolidated form state (avoids 13 separate useState calls)
interface FormState {
    price: string;
    stopPrice: string;
    limitPrice: string;
    amount: string;
    visibleQty: string;
    tpEnabled: boolean;
    slEnabled: boolean;
    tpPrice: string;
    slPrice: string;
    activationPrice: string;
    trailingPercent: string;
    twapDuration: string;
    twapIntervals: string;
}

const INITIAL_FORM: FormState = {
    price: '', stopPrice: '', limitPrice: '', amount: '', visibleQty: '',
    tpEnabled: false, slEnabled: false, tpPrice: '', slPrice: '',
    activationPrice: '', trailingPercent: '',
    twapDuration: '60', twapIntervals: '6',
};

const SpotOrderForm = React.memo(function SpotOrderForm({
    pair, currentPrice, formatPrice,
    orderType, onOrderTypeChange,
    side, onSideChange,
    onRunSimulation,
}: SpotOrderFormProps) {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    const handleField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const token = pair.split('/')[0];
    const amountNum = parseFloat(form.amount) || 0;

    // TP/SL is only supported for Limit orders in Spot
    const handleOrderTypeChange = (v: DemoOrderType) => {
        if (v !== 'limit') {
            setForm(prev => ({ ...prev, tpEnabled: false, slEnabled: false, tpPrice: '', slPrice: '' }));
        }
        onOrderTypeChange(v);
    };

    // Parsed values for validation
    const pPrice = parseFloat(form.price) || 0;
    const pStop = parseFloat(form.stopPrice) || 0;
    const pLimit = parseFloat(form.limitPrice) || 0;
    const pTp = parseFloat(form.tpPrice) || 0;
    const pSl = parseFloat(form.slPrice) || 0;
    const pAct = parseFloat(form.activationPrice) || 0;
    const pPct = parseFloat(form.trailingPercent) || 0;
    const pVis = parseFloat(form.visibleQty) || 0;

    // --- Validation Logic ---
    let warning: string | null = null;
    let isInvalid = false;

    if (currentPrice > 0) {
        if (orderType === 'limit') {
            if (side === 'buy' && pPrice > currentPrice) {
                warning = "Limit price is greater than market price. Order will fill instantly as Market Buy.";
            } else if (side === 'sell' && pPrice > 0 && pPrice < currentPrice) {
                warning = "Limit price is less than market price. Order will fill instantly as Market Sell.";
            }
        }

        if (orderType === 'stop_market' || orderType === 'stop_limit') {
            if (side === 'buy' && pStop > 0 && pStop < currentPrice) {
                warning = "Stop price is less than market price. Order will trigger instantly.";
                isInvalid = true; // Hard block standard Spot logic
            } else if (side === 'sell' && pStop > currentPrice) {
                warning = "Stop price is greater than market price. Order will trigger instantly.";
                isInvalid = true;
            }
            if (orderType === 'stop_limit' && side === 'buy' && pLimit > 0 && pLimit < pStop) {
                warning = "Buy Stop-Limit: Limit price should be greater than or equal to Stop price.";
            } else if (orderType === 'stop_limit' && side === 'sell' && pLimit > pStop) {
                warning = "Sell Stop-Limit: Limit price should be less than or equal to Stop price.";
            }
        }

        if (orderType === 'trailing_stop') {
            // BUY: activation must be BELOW market — price needs to dip first before trailing begins
            if (side === 'buy' && pAct > 0 && pAct >= currentPrice) {
                warning = "Buy Trailing Stop: Activation price must be below Market Price.";
                isInvalid = true;
            }
            // SELL: activation must be ABOVE market — price needs to rise first before trailing begins
            if (side === 'sell' && pAct > 0 && pAct <= currentPrice) {
                warning = "Sell Trailing Stop: Activation price must be above Market Price.";
                isInvalid = true;
            }
            if (pPct <= 0 || pPct > 20) {
                warning = "Trailing percent must be between 0.1% and 20.0%";
                isInvalid = true;
            }
        }

        if (orderType === 'oco') {
            if (side === 'buy' && pPrice > 0 && pPrice >= currentPrice) {
                warning = "Buy OCO: Limit Price must be less than Market Price.";
                isInvalid = true;
            }
            if (side === 'buy' && pStop > 0 && pStop <= currentPrice) {
                warning = "Buy OCO: Stop Price must be greater than Market Price.";
                isInvalid = true;
            }
            if (side === 'sell' && pPrice > 0 && pPrice <= currentPrice) {
                warning = "Sell OCO: Limit Price must be greater than Market Price.";
                isInvalid = true;
            }
            if (side === 'sell' && pStop > 0 && pStop >= currentPrice) {
                warning = "Sell OCO: Stop Price must be less than Market Price.";
                isInvalid = true;
            }
        }

        if (orderType === 'iceberg' || orderType === 'stop_limit') {
            if (pVis > 0 && pVis >= amountNum && amountNum > 0) {
                warning = "Visible Quantity must be less than Total Amount.";
                isInvalid = true;
            }
        }

        // Attached TP/SL Validation (if enabled)
        if (form.tpEnabled && (!pTp || pTp <= 0)) {
            warning = "Take Profit is enabled but no price has been set.";
            isInvalid = true;
        }
        if (form.slEnabled && (!pSl || pSl <= 0)) {
            warning = "Stop Loss is enabled but no price has been set.";
            isInvalid = true;
        }
        const entryRef = orderType === 'limit' ? pPrice : currentPrice;
        // For limit orders, use "Limit Price" in messages since that is the actual fill price, not the current market price
        const entryLabel = orderType === 'limit' ? 'Limit Price' : 'Entry Price';
        if (entryRef > 0) {
            if (form.tpEnabled && pTp > 0) {
                if (side === 'buy' && pTp <= entryRef) {
                    warning = `Take Profit price must be greater than ${entryLabel}.`;
                    isInvalid = true;
                } else if (side === 'sell' && pTp >= entryRef) {
                    warning = `Take Profit price must be less than ${entryLabel}.`;
                    isInvalid = true;
                }
            }
            if (form.slEnabled && pSl > 0) {
                if (side === 'buy' && pSl >= entryRef) {
                    warning = `Stop Loss price must be less than ${entryLabel}.`;
                    isInvalid = true;
                } else if (side === 'sell' && pSl <= entryRef) {
                    warning = `Stop Loss price must be greater than ${entryLabel}.`;
                    isInvalid = true;
                }
            }
        }
    }


    const handleRunSimulation = () => {
        if (!amountNum || amountNum <= 0 || currentPrice <= 0 || isInvalid) return;

        // Construct standard simulation payload based on type
        // The simulator handles node traversal based on these values
        onRunSimulation({
            orderType,
            side,
            pair,
            entryPrice: currentPrice,
            price: ['limit', 'iceberg', 'oco'].includes(orderType) ? (pPrice || null) : null,
            stopPrice: ['stop_market', 'stop_limit', 'oco'].includes(orderType) ? (pStop || null) : null,
            limitPrice: (orderType === 'stop_limit' || orderType === 'oco') ? (pLimit || null) : null,
            // Trailing Stop overloads: price = Activation, stopPrice = active trailing line tracker
            ...(orderType === 'trailing_stop' && {
                price: pAct || null,
                stopPrice: pPct || null, // We overload stopPrice with the percentage for the simulator
            }),
            amount: amountNum,
            tpPrice: form.tpEnabled ? (pTp || null) : null,
            slPrice: form.slEnabled ? (pSl || null) : null,
            tpEnabled: form.tpEnabled,
            slEnabled: form.slEnabled,
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-0 mb-4">
                <button
                    onClick={() => onSideChange('buy')}
                    className={`py-2.5 text-sm font-mono font-bold transition-all ${side === 'buy'
                        ? 'bg-bs-success/20 text-bs-success border border-[#00e66b]/30'
                        : 'bg-bs-card text-bs-text-mute border border-bs-border hover:text-bs-text-tertiary'
                        }`}
                >
                    BUY
                </button>
                <button
                    onClick={() => onSideChange('sell')}
                    className={`py-2.5 text-sm font-mono font-bold transition-all ${side === 'sell'
                        ? 'bg-bs-error/20 text-bs-error border border-[#ff285a]/30'
                        : 'bg-bs-card text-bs-text-mute border border-bs-border hover:text-bs-text-tertiary'
                        }`}
                >
                    SELL
                </button>
            </div>

            {/* Order Type Tabs */}
            <div className="flex flex-wrap gap-1 mb-4">
                {ORDER_TYPES.map(ot => (
                    <button
                        key={ot.value}
                        onClick={() => handleOrderTypeChange(ot.value)}
                        className={`px-2 py-1 text-[10px] font-mono font-medium transition-all border ${orderType === ot.value
                            ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border-bs-brand-tertiary/30'
                            : 'text-bs-text-mute border-bs-border hover:text-bs-text-tertiary hover:border-bs-border'
                            }`}
                    >
                        {ot.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">

                {warning && (
                    <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 text-[10px] font-mono leading-tight">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>{warning}</span>
                    </div>
                )}

                {/* Entry Price (read-only, shows live price) */}
                <div>
                    <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Entry (Market) Price</label>
                    <div className="w-full bg-bs-card border border-bs-border text-white text-xs font-mono px-3 py-2 flex items-center justify-between">
                        <span>{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
                        <span className="text-[9px] text-bs-success font-mono">LIVE</span>
                    </div>
                </div>

                {/* Price (Limit, Iceberg, OCO) */}
                {(orderType === 'limit' || orderType === 'iceberg' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Limit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => handleField('price', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Stop Price (Stop Market, Stop Limit, OCO) */}
                {(orderType === 'stop_market' || orderType === 'stop_limit' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Stop Price (Trigger)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Trigger price..."
                            value={form.stopPrice}
                            onChange={(e) => handleField('stopPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                        />
                        {orderType !== 'oco' && (
                            <p className="text-[9px] font-mono text-bs-text-mute mt-1">
                                {side === 'buy'
                                    ? 'Buy Stop triggers on upward breakout — stop price must be above market.'
                                    : 'Sell Stop triggers on downward move — stop price must be below market.'}
                            </p>
                        )}
                    </div>
                )}

                {/* Limit Price leg of Stop Limit / OCO */}
                {(orderType === 'stop_limit' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1">
                            {orderType === 'oco' ? 'Stop-Limit Price' : 'Limit Price'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Max execution price..."
                            value={form.limitPrice}
                            onChange={(e) => handleField('limitPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Trailing Stop Fields */}
                {orderType === 'trailing_stop' && (
                    <>
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Activation Price</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={side === 'buy' ? 'Must be > Market' : 'Must be < Market'}
                                value={form.activationPrice}
                                onChange={(e) => handleField('activationPrice', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Trailing Delta (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.1 - 20.0"
                                value={form.trailingPercent}
                                onChange={(e) => handleField('trailingPercent', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                            />
                        </div>
                    </>
                )}

                {/* TP/SL Checkboxes (Limit only) */}
                {orderType === 'limit' && (
                    <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={form.tpEnabled} onChange={e => handleField('tpEnabled', e.target.checked)} className="accent-[#00b3b3] cursor-pointer" />
                            <span className="text-[10px] font-mono text-bs-text-tertiary group-hover:text-bs-text-secondary transition-colors">TP</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={form.slEnabled} onChange={e => handleField('slEnabled', e.target.checked)} className="accent-[#00b3b3] cursor-pointer" />
                            <span className="text-[10px] font-mono text-bs-text-tertiary group-hover:text-bs-text-secondary transition-colors">SL</span>
                        </label>
                    </div>
                )}

                {/* TP/SL Specific Inputs */}
                {form.tpEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1 text-bs-success/80">Take Profit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Target profit price..."
                            value={form.tpPrice}
                            onChange={(e) => handleField('tpPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-[#00e66b]/20 text-white text-xs font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-[#00e66b]/50 placeholder:text-white/15"
                        />
                    </div>
                )}
                {form.slEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1 text-bs-error/80">Stop Loss Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Stop loss trigger..."
                            value={form.slPrice}
                            onChange={(e) => handleField('slPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-[#ff285a]/20 text-white text-xs font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-[#ff285a]/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Live R:R Badge — shown when both TP and SL are entered for Limit orders */}
                {form.tpEnabled && form.slEnabled && orderType === 'limit' && pTp > 0 && pSl > 0 && pPrice > 0 && (() => {
                    const gain = Math.abs(pTp - pPrice);
                    const risk = Math.abs(pSl - pPrice);
                    if (risk === 0) return null;
                    const rr = (gain / risk).toFixed(2);
                    const rrNum = parseFloat(rr);
                    const color = rrNum >= 1.5 ? 'text-bs-success border-[#00e66b]/20 bg-bs-success/8'
                        : rrNum >= 1.0 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/8'
                            : 'text-bs-error border-[#ff285a]/20 bg-bs-error/8';
                    const label = rrNum >= 1.5 ? '✓ Favourable' : rrNum >= 1.0 ? '~ Neutral' : '✗ Poor — risk exceeds reward';
                    return (
                        <div className={`flex items-center justify-between px-2 py-1.5 border text-[10px] font-mono ${color}`}>
                            <span className="text-bs-text-mute">Risk / Reward</span>
                            <span className="font-bold">1 : {rr} <span className="font-normal">{label}</span></span>
                        </div>
                    );
                })()}

                {/* Amount */}
                <div className="pt-2">
                    <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Amount ({token})</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => handleField('amount', e.target.value)}
                        className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                    />
                </div>

                {/* Visible Qty (Iceberg, Stop Limit) */}
                {(orderType === 'iceberg' || orderType === 'stop_limit') && (
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Visible Quantity (Iceberg Slice)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Publicly visible chunk..."
                            value={form.visibleQty}
                            onChange={(e) => handleField('visibleQty', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* TWAP fields */}
                {orderType === 'twap' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Duration (sec)</label>
                            <input
                                type="number"
                                value={form.twapDuration}
                                onChange={(e) => handleField('twapDuration', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-bs-text-mute block mb-1">Intervals</label>
                            <input
                                type="number"
                                value={form.twapIntervals}
                                onChange={(e) => handleField('twapIntervals', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* RUN SIMULATION Button */}
            <button
                onClick={handleRunSimulation}
                disabled={amountNum <= 0 || currentPrice <= 0 || isInvalid}
                className={`w-full py-3 text-sm font-mono font-bold transition-all mt-4 flex items-center justify-center gap-2 text-white
                    ${isInvalid || amountNum <= 0 || currentPrice <= 0
                        ? 'bg-bs-card-fg text-bs-text-mute cursor-not-allowed border border-bs-border'
                        : 'bg-gradient-to-r from-[#00b3b3] to-[#00ffff] hover:from-[#00e6e6] hover:to-[#00ffff] border border-transparent shadow-[0_0_15px_rgba(0,179,179,0.4)]'
                    }`}
            >
                <Play size={13} fill="currentColor" />
                RUN SIMULATION
            </button>
        </div>
    );
});

export default SpotOrderForm;

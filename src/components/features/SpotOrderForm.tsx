'use client';

import React, { useState, useCallback } from 'react';
import { Calculator, Play, AlertTriangle, Sparkles } from 'lucide-react';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import type { SimConfig } from './OrderFlowVisualiser';
import OrderInfoPanel from './OrderInfoPanel';
import { useAppSound } from '@/lib/context/SoundContext';

interface SpotOrderFormProps {
    pair: string;
    currentPrice: number;
    formatPrice: (amount: number, decimals?: number) => string;
    orderType: DemoOrderType;
    onOrderTypeChange: (v: DemoOrderType) => void;
    side: 'buy' | 'sell';
    onSideChange: (v: 'buy' | 'sell') => void;
    onRunSimulation: (config: SimConfig) => void;
    currency: 'USD' | 'INR';
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

function asInput(n: number, decimals = 6) {
    return Number(n.toFixed(decimals)).toString();
}

function demoAmountFor(price: number) {
    if (price >= 10000) return 0.01;
    if (price >= 1000) return 0.05;
    if (price >= 100) return 0.25;
    if (price >= 10) return 1;
    if (price >= 1) return 100;
    return 1000;
}

const SpotOrderForm = React.memo(function SpotOrderForm({
    pair, currentPrice, formatPrice,
    orderType, onOrderTypeChange,
    side, onSideChange,
    onRunSimulation,
    currency,
}: SpotOrderFormProps) {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const { playClick, playOpen, playSuccess } = useAppSound();

    const handleField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const token = pair.split('/')[0];
    const amountNum = parseFloat(form.amount) || 0;

    // TP/SL is only supported for Limit orders in Spot
    const handleOrderTypeChange = (v: DemoOrderType) => {
        if (v !== orderType) playClick();
        if (v !== 'limit') {
            setForm(prev => ({ ...prev, tpEnabled: false, slEnabled: false, tpPrice: '', slPrice: '' }));
        }
        onOrderTypeChange(v);
    };

    const handleSideChange = (nextSide: 'buy' | 'sell') => {
        if (nextSide !== side) playClick();
        onSideChange(nextSide);
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

    const orderPriceReference =
        orderType === 'market' || orderType === 'stop_market' || orderType === 'twap' || orderType === 'trailing_stop'
            ? currentPrice
            : orderType === 'stop_limit'
                ? (pLimit || pStop || currentPrice)
                : (pPrice || currentPrice);
    const estimatedNotional = amountNum > 0 && orderPriceReference > 0 ? amountNum * orderPriceReference : 0;
    const estimatedFee = estimatedNotional * 0.001;
    const executionLabel =
        orderType === 'market' ? 'Fills immediately'
            : orderType === 'limit' ? 'Waits at your limit'
                : orderType === 'stop_market' ? 'Triggers, then market fills'
                    : orderType === 'stop_limit' ? 'Triggers, then limit waits'
                        : orderType === 'iceberg' ? 'Reveals slices'
                            : orderType === 'twap' ? 'Splits over time'
                                : orderType === 'trailing_stop' ? 'Trails, then triggers'
                                    : 'Two linked orders';
    const triggerLabel =
        orderType === 'market' ? 'Current market price'
            : orderType === 'limit' || orderType === 'iceberg' ? (pPrice > 0 ? formatPrice(pPrice) : 'Set limit price')
                : orderType === 'stop_market' || orderType === 'stop_limit' || orderType === 'oco' ? (pStop > 0 ? formatPrice(pStop) : 'Set stop trigger')
                    : orderType === 'trailing_stop' ? (pAct > 0 ? `${formatPrice(pAct)} activation` : 'Set activation')
                        : `${form.twapIntervals || '0'} slices`;

    const guidedCaseSummary =
        orderType === 'market' ? 'Amount only; fills immediately.'
            : orderType === 'limit' ? 'Limit entry with TP/SL protection.'
                : orderType === 'stop_market' ? 'Stop trigger, then market fill.'
                    : orderType === 'stop_limit' ? 'Stop trigger with a limit cap.'
                        : orderType === 'iceberg' ? 'Large limit order split into slices.'
                            : orderType === 'twap' ? 'Timed slices over one minute.'
                                : orderType === 'trailing_stop' ? 'Activation plus trailing delta.'
                                    : 'Target leg and protection leg together.';

    const loadGuidedCase = () => {
        if (currentPrice <= 0) return;
        playOpen();

        const amount = demoAmountFor(currentPrice);
        const amountText = asInput(amount, 4);
        const sliceText = asInput(Math.max(amount / 4, 0.0001), 4);
        const buyLimit = currentPrice * 0.98;
        const sellLimit = currentPrice * 1.02;
        const entry = side === 'buy' ? buyLimit : sellLimit;
        const base: FormState = {
            ...INITIAL_FORM,
            amount: amountText,
        };

        switch (orderType) {
            case 'market':
                setForm(base);
                break;
            case 'limit':
                setForm({
                    ...base,
                    price: asInput(entry),
                    tpEnabled: true,
                    slEnabled: true,
                    tpPrice: asInput(side === 'buy' ? entry * 1.04 : entry * 0.96),
                    slPrice: asInput(side === 'buy' ? entry * 0.97 : entry * 1.03),
                });
                break;
            case 'stop_market':
                setForm({
                    ...base,
                    stopPrice: asInput(side === 'buy' ? currentPrice * 1.02 : currentPrice * 0.98),
                });
                break;
            case 'stop_limit': {
                const stop = side === 'buy' ? currentPrice * 1.02 : currentPrice * 0.98;
                setForm({
                    ...base,
                    stopPrice: asInput(stop),
                    limitPrice: asInput(side === 'buy' ? stop * 1.005 : stop * 0.995),
                    visibleQty: sliceText,
                });
                break;
            }
            case 'iceberg':
                setForm({
                    ...base,
                    price: asInput(side === 'buy' ? currentPrice * 0.99 : currentPrice * 1.01),
                    visibleQty: sliceText,
                });
                break;
            case 'twap':
                setForm({
                    ...base,
                    twapDuration: '60',
                    twapIntervals: '6',
                });
                break;
            case 'trailing_stop':
                setForm({
                    ...base,
                    activationPrice: asInput(side === 'buy' ? currentPrice * 0.98 : currentPrice * 1.02),
                    trailingPercent: '1.2',
                });
                break;
            case 'oco': {
                const limit = side === 'buy' ? currentPrice * 0.98 : currentPrice * 1.02;
                const stop = side === 'buy' ? currentPrice * 1.02 : currentPrice * 0.98;
                setForm({
                    ...base,
                    price: asInput(limit),
                    stopPrice: asInput(stop),
                    limitPrice: asInput(side === 'buy' ? stop * 1.005 : stop * 0.995),
                });
                break;
            }
        }
    };


    const handleRunSimulation = () => {
        if (!amountNum || amountNum <= 0 || currentPrice <= 0 || isInvalid) return;
        playSuccess();

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
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {/* Buy/Sell Toggle */}
                <div className="mb-3 grid grid-cols-2 gap-0">
                <button
                    onClick={() => handleSideChange('buy')}
                    className={`py-2 text-xs font-mono font-bold transition-all ${side === 'buy'
                        ? 'bg-bs-buy/10 text-bs-buy border border-bs-buy/30'
                        : 'bg-bs-card text-bs-text-mute border border-bs-border hover:text-bs-text-tertiary'
                        }`}
                >
                    BUY
                </button>
                <button
                    onClick={() => handleSideChange('sell')}
                    className={`py-2 text-xs font-mono font-bold transition-all ${side === 'sell'
                        ? 'bg-bs-sell/10 text-bs-sell border border-bs-sell/30'
                        : 'bg-bs-card text-bs-text-mute border border-bs-border hover:text-bs-text-tertiary'
                        }`}
                >
                    SELL
                </button>
            </div>

                {/* Order Type Tabs */}
                <div className="mb-3 flex flex-wrap gap-1">
                {ORDER_TYPES.map(ot => (
                    <button
                        key={ot.value}
                        onClick={() => handleOrderTypeChange(ot.value)}
                        className={`px-2 py-1 text-xs font-mono font-medium transition-all border ${orderType === ot.value
                            ? 'bg-bs-card-fg text-bs-text-primary border-bs-border-active'
                            : 'text-bs-text-mute border-bs-border hover:text-bs-text-tertiary hover:border-bs-border'
                            }`}
                    >
                        {ot.label}
                    </button>
                ))}
            </div>

                <div className="mb-2.5">
                <OrderInfoPanel key={orderType} orderType={orderType} side={side} currency={currency} />
            </div>

                <div className="mb-3 rounded-lg border border-bs-brand-tertiary/20 bg-bs-brand-tertiary/8 px-3 py-2">
                <div className="flex items-start gap-2">
                    <Sparkles size={13} className="mt-0.5 shrink-0 text-bs-brand" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-bs-text-primary">Guided case</span>
                            <span className="rounded border border-bs-border bg-bs-card/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bs-text-mute">
                                {side} {orderType.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-bs-text-secondary">{guidedCaseSummary}</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadGuidedCase}
                        disabled={currentPrice <= 0}
                        className="shrink-0 rounded-md border border-bs-border bg-bs-card px-2.5 py-1.5 text-xs font-semibold text-bs-text-primary transition-colors hover:bg-bs-card-fg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Load
                    </button>
                </div>
            </div>

                {/* Dynamic Fields */}
                <div className="space-y-2.5">

                {warning && (
                    <div className="flex items-start gap-2 p-2 bg-bs-warning/10 border border-bs-warning/20 text-bs-warning text-sm font-mono leading-tight">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>{warning}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* Entry Price (read-only, shows live price) */}
                    <div>
                        <label className="mb-1 block font-mono text-xs text-bs-text-mute">Entry Price</label>
                        <div className="flex w-full items-center justify-between border border-bs-border bg-bs-card px-2.5 py-2 font-mono text-xs text-bs-text-primary">
                            <span>{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
                            <span className="font-mono text-[8px] text-bs-success">LIVE</span>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="mb-1 block font-mono text-xs text-bs-text-mute">Amount ({token})</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            placeholder="0.00"
                            value={form.amount}
                            onChange={(e) => handleField('amount', e.target.value)}
                            className="w-full border border-bs-border bg-bs-bg/50 px-2.5 py-2 font-mono text-xs text-bs-text-primary placeholder:text-bs-text-primary/15 focus:border-bs-brand-tertiary/50 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Price (Limit, Iceberg, OCO) */}
                {(orderType === 'limit' || orderType === 'iceberg' || orderType === 'oco') && (
                    <div>
                        <label className="text-sm font-mono text-bs-text-mute block mb-1">Limit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => handleField('price', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
                        />
                    </div>
                )}

                {/* Stop Price (Stop Market, Stop Limit, OCO) */}
                {(orderType === 'stop_market' || orderType === 'stop_limit' || orderType === 'oco') && (
                    <div>
                        <label className="text-sm font-mono text-bs-text-mute block mb-1">Stop Price (Trigger)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Trigger price..."
                            value={form.stopPrice}
                            onChange={(e) => handleField('stopPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
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
                        <label className="text-sm font-mono text-bs-text-mute block mb-1">
                            {orderType === 'oco' ? 'Stop-Limit Price' : 'Limit Price'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Max execution price..."
                            value={form.limitPrice}
                            onChange={(e) => handleField('limitPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
                        />
                    </div>
                )}

                {/* Trailing Stop Fields */}
                {orderType === 'trailing_stop' && (
                    <>
                        <div>
                            <label className="text-sm font-mono text-bs-text-mute block mb-1">Activation Price</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={side === 'buy' ? 'Must be < Market' : 'Must be > Market'}
                                value={form.activationPrice}
                                onChange={(e) => handleField('activationPrice', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-mono text-bs-text-mute block mb-1">Trailing Delta (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.1 - 20.0"
                                value={form.trailingPercent}
                                onChange={(e) => handleField('trailingPercent', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
                            />
                        </div>
                    </>
                )}

                {/* TP/SL Checkboxes (Limit only) */}
                {orderType === 'limit' && (
                    <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={form.tpEnabled} onChange={e => { playClick(); handleField('tpEnabled', e.target.checked); }} className="accent-bs-accent-cyan cursor-pointer" />
                            <span className="text-sm font-mono text-bs-text-tertiary group-hover:text-bs-text-secondary transition-colors">TP</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={form.slEnabled} onChange={e => { playClick(); handleField('slEnabled', e.target.checked); }} className="accent-bs-accent-cyan cursor-pointer" />
                            <span className="text-sm font-mono text-bs-text-tertiary group-hover:text-bs-text-secondary transition-colors">SL</span>
                        </label>
                    </div>
                )}

                {/* TP/SL Specific Inputs */}
                {form.tpEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-sm font-mono text-bs-text-mute block mb-1 text-bs-success/80">Take Profit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Target profit price..."
                            value={form.tpPrice}
                            onChange={(e) => handleField('tpPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-buy/20 text-bs-text-primary text-sm font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-bs-buy/50 placeholder:text-bs-text-primary/15"
                        />
                    </div>
                )}
                {form.slEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-sm font-mono text-bs-text-mute block mb-1 text-bs-error/80">Stop Loss Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Stop loss trigger..."
                            value={form.slPrice}
                            onChange={(e) => handleField('slPrice', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-sell/20 text-bs-text-primary text-sm font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-bs-sell/50 placeholder:text-bs-text-primary/15"
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
                    const color = rrNum >= 1.5 ? 'text-bs-success border-bs-buy/20 bg-bs-success/8'
                        : rrNum >= 1.0 ? 'text-bs-warning border-bs-warning/20 bg-bs-warning/8'
                            : 'text-bs-error border-bs-sell/20 bg-bs-error/8';
                    const label = rrNum >= 1.5 ? '✓ Favourable' : rrNum >= 1.0 ? '~ Neutral' : '✗ Poor — risk exceeds reward';
                    return (
                        <div className={`flex items-center justify-between px-2 py-1.5 border text-sm font-mono ${color}`}>
                            <span className="text-bs-text-mute">Risk / Reward</span>
                            <span className="font-bold">1 : {rr} <span className="font-normal">{label}</span></span>
                        </div>
                    );
                })()}

                {/* Visible Qty (Iceberg, Stop Limit) */}
                {(orderType === 'iceberg' || orderType === 'stop_limit') && (
                    <div>
                        <label className="text-sm font-mono text-bs-text-mute block mb-1">Visible Quantity (Iceberg Slice)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Publicly visible chunk..."
                            value={form.visibleQty}
                            onChange={(e) => handleField('visibleQty', e.target.value)}
                            className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-primary/15"
                        />
                    </div>
                )}

                {/* TWAP fields */}
                {orderType === 'twap' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-mono text-bs-text-mute block mb-1">Duration (sec)</label>
                            <input
                                type="number"
                                value={form.twapDuration}
                                onChange={(e) => handleField('twapDuration', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-mono text-bs-text-mute block mb-1">Intervals</label>
                            <input
                                type="number"
                                value={form.twapIntervals}
                                onChange={(e) => handleField('twapIntervals', e.target.value)}
                                className="w-full bg-bs-bg/50 border border-bs-border text-bs-text-primary text-sm font-mono px-3 py-2 focus:outline-none focus:border-bs-brand-tertiary/50"
                            />
                        </div>
                    </div>
                )}

                {amountNum > 0 && (
                    <div className="rounded-lg border border-bs-border bg-bs-bg/45 p-3">
                        <div className="mb-3 flex items-center gap-2">
                            <Calculator size={14} className="text-bs-brand" />
                            <span className="text-xs font-semibold text-bs-text-primary">Order impact</span>
                            <span className="ml-auto text-[10px] text-bs-text-mute">before simulation</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Behavior</div>
                                <div className="mt-1 font-semibold text-bs-text-primary">{executionLabel}</div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Trigger / price</div>
                                <div className="mt-1 font-semibold text-bs-text-primary">{triggerLabel}</div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Notional</div>
                                <div className="mt-1 font-semibold text-bs-text-primary">
                                    {estimatedNotional > 0 ? formatPrice(estimatedNotional) : 'Enter amount'}
                                </div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Fee estimate</div>
                                <div className="mt-1 font-semibold text-bs-text-primary">
                                    {estimatedFee > 0 ? formatPrice(estimatedFee) : '-'}
                                </div>
                            </div>
                        </div>
                        {(form.tpEnabled || form.slEnabled) && (
                            <p className="mt-2 text-xs leading-relaxed text-bs-text-secondary">
                                TP/SL becomes an exit plan after the main order fills. In the flow, the filled state should branch into the active protection orders.
                            </p>
                        )}
                    </div>
                )}
            </div>
            </div>

            {/* RUN SIMULATION Button */}
            <button
                onClick={handleRunSimulation}
                disabled={amountNum <= 0 || currentPrice <= 0 || isInvalid}
                className={`mt-3 flex w-full shrink-0 items-center justify-center gap-2 py-2.5 text-xs font-mono font-bold text-bs-text-primary transition-all
                    ${isInvalid || amountNum <= 0 || currentPrice <= 0
                        ? 'bg-bs-card-fg text-bs-text-mute cursor-not-allowed border border-bs-border'
                        : 'bg-bs-accent-cyan text-white hover:opacity-90 border border-transparent shadow-[0_0_15px_rgba(9,117,117,0.3)]'
                    }`}
            >
                <Play size={13} fill="currentColor" />
                SIMULATE ORDER FLOW
            </button>
        </div>
    );
});

export default SpotOrderForm;

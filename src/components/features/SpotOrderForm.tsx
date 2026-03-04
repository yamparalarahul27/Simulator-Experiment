'use client';

import { useState } from 'react';
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

export default function SpotOrderForm({
    pair, currentPrice, formatPrice,
    orderType, onOrderTypeChange,
    side, onSideChange,
    onRunSimulation,
}: SpotOrderFormProps) {
    // Fields
    const [price, setPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [visibleQty, setVisibleQty] = useState('');

    // TP/SL
    const [tpEnabled, setTpEnabled] = useState(false);
    const [slEnabled, setSlEnabled] = useState(false);
    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');

    // Trailing Stop specific
    const [activationPrice, setActivationPrice] = useState('');
    const [trailingPercent, setTrailingPercent] = useState('');

    // TWAP
    const [twapDuration, setTwapDuration] = useState('60');
    const [twapIntervals, setTwapIntervals] = useState('6');

    const token = pair.split('/')[0];
    const amountNum = parseFloat(amount) || 0;

    // TP/SL is only supported for Limit orders in Spot
    const handleOrderTypeChange = (v: DemoOrderType) => {
        if (v !== 'limit') {
            setTpEnabled(false);
            setSlEnabled(false);
            setTpPrice('');
            setSlPrice('');
        }
        onOrderTypeChange(v);
    };

    // Parsed values for validation
    const pPrice = parseFloat(price) || 0;
    const pStop = parseFloat(stopPrice) || 0;
    const pLimit = parseFloat(limitPrice) || 0;
    const pTp = parseFloat(tpPrice) || 0;
    const pSl = parseFloat(slPrice) || 0;
    const pAct = parseFloat(activationPrice) || 0;
    const pPct = parseFloat(trailingPercent) || 0;
    const pVis = parseFloat(visibleQty) || 0;

    // --- Validation Logic ---
    let warning: string | null = null;
    let isInvalid = false;

    if (currentPrice > 0) {
        if (orderType === 'limit') {
            if (side === 'buy' && pPrice > currentPrice) {
                warning = "Limit price > market price. Order will fill instantly as Market Buy.";
            } else if (side === 'sell' && pPrice > 0 && pPrice < currentPrice) {
                warning = "Limit price < market price. Order will fill instantly as Market Sell.";
            }
        }

        if (orderType === 'stop_market' || orderType === 'stop_limit') {
            if (side === 'buy' && pStop > 0 && pStop < currentPrice) {
                warning = "Stop price < market price. Order will trigger instantly.";
                isInvalid = true; // Hard block standard Spot logic
            } else if (side === 'sell' && pStop > currentPrice) {
                warning = "Stop price > market price. Order will trigger instantly.";
                isInvalid = true;
            }
            if (orderType === 'stop_limit' && side === 'buy' && pLimit > 0 && pLimit < pStop) {
                warning = "Buy Stop-Limit: Limit price should be >= Stop price.";
            } else if (orderType === 'stop_limit' && side === 'sell' && pLimit > pStop) {
                warning = "Sell Stop-Limit: Limit price should be <= Stop price.";
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
                warning = "Buy OCO: Limit Price must be < Market Price.";
                isInvalid = true;
            }
            if (side === 'buy' && pStop > 0 && pStop <= currentPrice) {
                warning = "Buy OCO: Stop Price must be > Market Price.";
                isInvalid = true;
            }
            if (side === 'sell' && pPrice > 0 && pPrice <= currentPrice) {
                warning = "Sell OCO: Limit Price must be > Market Price.";
                isInvalid = true;
            }
            if (side === 'sell' && pStop > 0 && pStop >= currentPrice) {
                warning = "Sell OCO: Stop Price must be < Market Price.";
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
        if (tpEnabled && (!pTp || pTp <= 0)) {
            warning = "Take Profit is enabled but no price has been set.";
            isInvalid = true;
        }
        if (slEnabled && (!pSl || pSl <= 0)) {
            warning = "Stop Loss is enabled but no price has been set.";
            isInvalid = true;
        }
        const entryRef = orderType === 'limit' ? pPrice : currentPrice;
        // For limit orders, use "Limit Price" in messages since that is the actual fill price, not the current market price
        const entryLabel = orderType === 'limit' ? 'Limit Price' : 'Entry Price';
        if (entryRef > 0) {
            if (tpEnabled && pTp > 0) {
                if (side === 'buy' && pTp <= entryRef) {
                    warning = `Take Profit price must be > ${entryLabel}.`;
                    isInvalid = true;
                } else if (side === 'sell' && pTp >= entryRef) {
                    warning = `Take Profit price must be < ${entryLabel}.`;
                    isInvalid = true;
                }
            }
            if (slEnabled && pSl > 0) {
                if (side === 'buy' && pSl >= entryRef) {
                    warning = `Stop Loss price must be < ${entryLabel}.`;
                    isInvalid = true;
                } else if (side === 'sell' && pSl <= entryRef) {
                    warning = `Stop Loss price must be > ${entryLabel}.`;
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
            tpPrice: tpEnabled ? (pTp || null) : null,
            slPrice: slEnabled ? (pSl || null) : null,
            tpEnabled,
            slEnabled,
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-0 mb-4">
                <button
                    onClick={() => onSideChange('buy')}
                    className={`py-2.5 text-sm font-mono font-bold transition-all ${side === 'buy'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
                        }`}
                >
                    BUY
                </button>
                <button
                    onClick={() => onSideChange('sell')}
                    className={`py-2.5 text-sm font-mono font-bold transition-all ${side === 'sell'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
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
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'text-white/30 border-white/5 hover:text-white/60 hover:border-white/10'
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
                    <label className="text-[10px] font-mono text-white/40 block mb-1">Entry (Market) Price</label>
                    <div className="w-full bg-white/5 border border-white/10 text-white text-xs font-mono px-3 py-2 flex items-center justify-between">
                        <span>{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
                        <span className="text-[9px] text-green-400 font-mono">LIVE</span>
                    </div>
                </div>

                {/* Price (Limit, Iceberg, OCO) */}
                {(orderType === 'limit' || orderType === 'iceberg' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Limit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Stop Price (Stop Market, Stop Limit, OCO) */}
                {(orderType === 'stop_market' || orderType === 'stop_limit' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Stop Price (Trigger)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Trigger price..."
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Limit Price leg of Stop Limit / OCO */}
                {(orderType === 'stop_limit' || orderType === 'oco') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">
                            {orderType === 'oco' ? 'Stop-Limit Price' : 'Limit Price'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Max execution price..."
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Trailing Stop Fields */}
                {orderType === 'trailing_stop' && (
                    <>
                        <div>
                            <label className="text-[10px] font-mono text-white/40 block mb-1">Activation Price</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={side === 'buy' ? 'Must be > Market' : 'Must be < Market'}
                                value={activationPrice}
                                onChange={(e) => setActivationPrice(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-white/40 block mb-1">Trailing Delta (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.1 - 20.0"
                                value={trailingPercent}
                                onChange={(e) => setTrailingPercent(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                            />
                        </div>
                    </>
                )}

                {/* TP/SL Checkboxes (Limit only) */}
                {orderType === 'limit' && (
                    <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={tpEnabled} onChange={e => setTpEnabled(e.target.checked)} className="accent-purple-500 cursor-pointer" />
                            <span className="text-[10px] font-mono text-white/60 group-hover:text-white/80 transition-colors">TP</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={slEnabled} onChange={e => setSlEnabled(e.target.checked)} className="accent-purple-500 cursor-pointer" />
                            <span className="text-[10px] font-mono text-white/60 group-hover:text-white/80 transition-colors">SL</span>
                        </label>
                    </div>
                )}

                {/* TP/SL Specific Inputs */}
                {tpEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1 text-green-400/80">Take Profit Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Target profit price..."
                            value={tpPrice}
                            onChange={(e) => setTpPrice(e.target.value)}
                            className="w-full bg-black/50 border border-green-500/20 text-white text-xs font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-green-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}
                {slEnabled && orderType === 'limit' && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1 text-red-400/80">Stop Loss Price</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Stop loss trigger..."
                            value={slPrice}
                            onChange={(e) => setSlPrice(e.target.value)}
                            className="w-full bg-black/50 border border-red-500/20 text-white text-xs font-mono px-3 py-2 flex items-center justify-between focus:outline-none focus:border-red-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Live R:R Badge — shown when both TP and SL are entered for Limit orders */}
                {tpEnabled && slEnabled && orderType === 'limit' && pTp > 0 && pSl > 0 && pPrice > 0 && (() => {
                    const gain = Math.abs(pTp - pPrice);
                    const risk = Math.abs(pSl - pPrice);
                    if (risk === 0) return null;
                    const rr = (gain / risk).toFixed(2);
                    const rrNum = parseFloat(rr);
                    const color = rrNum >= 1.5 ? 'text-green-400 border-green-500/20 bg-green-500/8'
                        : rrNum >= 1.0 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/8'
                            : 'text-red-400 border-red-500/20 bg-red-500/8';
                    const label = rrNum >= 1.5 ? '✓ Favourable' : rrNum >= 1.0 ? '~ Neutral' : '✗ Poor — risk exceeds reward';
                    return (
                        <div className={`flex items-center justify-between px-2 py-1.5 border text-[10px] font-mono ${color}`}>
                            <span className="text-white/40">Risk / Reward</span>
                            <span className="font-bold">1 : {rr} <span className="font-normal">{label}</span></span>
                        </div>
                    );
                })()}

                {/* Amount */}
                <div className="pt-2">
                    <label className="text-[10px] font-mono text-white/40 block mb-1">Amount ({token})</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                    />
                </div>

                {/* Visible Qty (Iceberg, Stop Limit) */}
                {(orderType === 'iceberg' || orderType === 'stop_limit') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Visible Quantity (Iceberg Slice)</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Publicly visible chunk..."
                            value={visibleQty}
                            onChange={(e) => setVisibleQty(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* TWAP fields */}
                {orderType === 'twap' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-mono text-white/40 block mb-1">Duration (sec)</label>
                            <input
                                type="number"
                                value={twapDuration}
                                onChange={(e) => setTwapDuration(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-mono text-white/40 block mb-1">Intervals</label>
                            <input
                                type="number"
                                value={twapIntervals}
                                onChange={(e) => setTwapIntervals(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50"
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
                        ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    }`}
            >
                <Play size={13} fill="currentColor" />
                RUN SIMULATION
            </button>
        </div>
    );
}


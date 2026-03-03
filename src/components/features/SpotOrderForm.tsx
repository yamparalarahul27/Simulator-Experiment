'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
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
    tpEnabled: boolean;
    onTpEnabledChange: (v: boolean) => void;
    slEnabled: boolean;
    onSlEnabledChange: (v: boolean) => void;
    onRunSimulation: (config: SimConfig) => void;
}

const ORDER_TYPES: { value: DemoOrderType; label: string }[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'stop_market', label: 'Stop Mkt' },
    { value: 'stop_limit', label: 'Stop Lmt' },
    { value: 'iceberg', label: 'Iceberg' },
    { value: 'twap', label: 'TWAP' },
];

export default function SpotOrderForm({
    pair, currentPrice, formatPrice,
    orderType, onOrderTypeChange,
    side, onSideChange,
    tpEnabled, onTpEnabledChange,
    slEnabled, onSlEnabledChange,
    onRunSimulation,
}: SpotOrderFormProps) {
    const [price, setPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [limitPrice, setLimitPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [visibleQty, setVisibleQty] = useState('');
    const [twapDuration, setTwapDuration] = useState('60');
    const [twapIntervals, setTwapIntervals] = useState('6');
    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');

    const token = pair.split('/')[0];

    const effectivePrice = orderType === 'market' ? currentPrice : (parseFloat(price) || currentPrice);
    const amountNum = parseFloat(amount) || 0;

    // TP/SL PnL preview
    const tpPnl = tpEnabled && tpPrice ? (() => {
        const tp = parseFloat(tpPrice);
        if (!tp || !amountNum) return null;
        const diff = side === 'buy' ? (tp - effectivePrice) * amountNum : (effectivePrice - tp) * amountNum;
        const pct = ((tp - effectivePrice) / effectivePrice * 100) * (side === 'buy' ? 1 : -1);
        return { amount: diff, percent: pct };
    })() : null;

    const slPnl = slEnabled && slPrice ? (() => {
        const sl = parseFloat(slPrice);
        if (!sl || !amountNum) return null;
        const diff = side === 'buy' ? (sl - effectivePrice) * amountNum : (effectivePrice - sl) * amountNum;
        const pct = ((sl - effectivePrice) / effectivePrice * 100) * (side === 'buy' ? 1 : -1);
        return { amount: diff, percent: pct };
    })() : null;

    const handleRunSimulation = () => {
        if (!amountNum || amountNum <= 0 || currentPrice <= 0) return;

        onRunSimulation({
            orderType,
            side,
            pair,
            entryPrice: currentPrice,
            price: ['limit', 'iceberg'].includes(orderType) ? (parseFloat(price) || null) : null,
            stopPrice: ['stop_market', 'stop_limit'].includes(orderType) ? (parseFloat(stopPrice) || null) : null,
            limitPrice: orderType === 'stop_limit' ? (parseFloat(limitPrice) || null) : null,
            amount: amountNum,
            tpPrice: tpEnabled ? (parseFloat(tpPrice) || null) : null,
            slPrice: slEnabled ? (parseFloat(slPrice) || null) : null,
            tpEnabled,
            slEnabled,
        });

        // Reset form
        setAmount('');
        setPrice('');
        setStopPrice('');
        setLimitPrice('');
        setVisibleQty('');
        setTpPrice('');
        setSlPrice('');
        onTpEnabledChange(false);
        onSlEnabledChange(false);
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
                        onClick={() => onOrderTypeChange(ot.value)}
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
            <div className="space-y-3 flex-1">
                {/* Entry Price (read-only, shows live price) */}
                <div>
                    <label className="text-[10px] font-mono text-white/40 block mb-1">Entry Price</label>
                    <div className="w-full bg-white/5 border border-white/10 text-white text-xs font-mono px-3 py-2 flex items-center justify-between">
                        <span>{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
                        <span className="text-[9px] text-green-400 font-mono">LIVE</span>
                    </div>
                </div>

                {/* Price (Limit, Iceberg) */}
                {(orderType === 'limit' || orderType === 'iceberg') && (
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

                {/* Stop Price (Stop Market, Stop Limit) */}
                {(orderType === 'stop_market' || orderType === 'stop_limit') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Stop Price</label>
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

                {/* Limit Price leg of Stop Limit */}
                {orderType === 'stop_limit' && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Limit Price</label>
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

                {/* Amount */}
                <div>
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

                {/* Visible Qty (Iceberg) */}
                {orderType === 'iceberg' && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">Visible Quantity</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="Chunk size..."
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

                {/* TP/SL Section */}
                <div className="border border-white/5 p-2">
                    <div className="flex items-center gap-3 mb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tpEnabled}
                                onChange={(e) => onTpEnabledChange(e.target.checked)}
                                className="accent-green-500 w-3 h-3"
                            />
                            <span className="text-[10px] font-mono text-green-400">TP</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={slEnabled}
                                onChange={(e) => onSlEnabledChange(e.target.checked)}
                                className="accent-red-500 w-3 h-3"
                            />
                            <span className="text-[10px] font-mono text-red-400">SL</span>
                        </label>
                    </div>

                    {tpEnabled && (
                        <div className="mb-2">
                            <input
                                type="number"
                                step="any"
                                placeholder="Take Profit price..."
                                value={tpPrice}
                                onChange={(e) => setTpPrice(e.target.value)}
                                className="w-full bg-black/50 border border-green-500/20 text-white text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-green-500/50 placeholder:text-white/15"
                            />
                            {tpPnl && (
                                <div className={`text-[9px] font-mono mt-1 ${tpPnl.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    TP: {tpPnl.amount >= 0 ? '+' : ''}{formatPrice(tpPnl.amount)} ({tpPnl.percent >= 0 ? '+' : ''}{tpPnl.percent.toFixed(2)}%)
                                </div>
                            )}
                        </div>
                    )}

                    {slEnabled && (
                        <div>
                            <input
                                type="number"
                                step="any"
                                placeholder="Stop Loss price..."
                                value={slPrice}
                                onChange={(e) => setSlPrice(e.target.value)}
                                className="w-full bg-black/50 border border-red-500/20 text-white text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-red-500/50 placeholder:text-white/15"
                            />
                            {slPnl && (
                                <div className={`text-[9px] font-mono mt-1 ${slPnl.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    SL: {slPnl.amount >= 0 ? '+' : ''}{formatPrice(slPnl.amount)} ({slPnl.percent >= 0 ? '+' : ''}{slPnl.percent.toFixed(2)}%)
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RUN SIMULATION Button */}
            <button
                onClick={handleRunSimulation}
                disabled={amountNum <= 0 || currentPrice <= 0}
                className="w-full py-3 text-sm font-mono font-bold transition-all mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Play size={13} fill="currentColor" />
                RUN SIMULATION
            </button>
        </div>
    );
}

'use client';

import React, { useState, useMemo } from 'react';
import type { DemoBalance } from '@/services/SupabaseDemoService';
import type { CreateOrderParams, DemoOrderType } from '@/services/SupabaseDemoService';

interface SpotOrderFormProps {
    pair: string;
    currentPrice: number;
    balances: DemoBalance[];
    executeTrade: (params: CreateOrderParams) => Promise<any>;
    formatPrice: (amount: number, decimals?: number) => string;
    orderType: DemoOrderType;
    onOrderTypeChange: (v: DemoOrderType) => void;
    side: 'buy' | 'sell';
    onSideChange: (v: 'buy' | 'sell') => void;
    tpEnabled: boolean;
    onTpEnabledChange: (v: boolean) => void;
    slEnabled: boolean;
    onSlEnabledChange: (v: boolean) => void;
    // Lifted form values for Order Flow Visualiser
    price: string;
    onPriceChange: (v: string) => void;
    stopPrice: string;
    onStopPriceChange: (v: string) => void;
    limitPrice: string;
    onLimitPriceChange: (v: string) => void;
    amount: string;
    onAmountChange: (v: string) => void;
    tpPrice: string;
    onTpPriceChange: (v: string) => void;
    slPrice: string;
    onSlPriceChange: (v: string) => void;
}

const ORDER_TYPES: { value: DemoOrderType; label: string }[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'stop_market', label: 'Stop Mkt' },
    { value: 'stop_limit', label: 'Stop Lmt' },
    { value: 'iceberg', label: 'Iceberg' },
    { value: 'twap', label: 'TWAP' },
];

export default function SpotOrderForm({ pair, currentPrice, balances, executeTrade, formatPrice, orderType, onOrderTypeChange, side, onSideChange, tpEnabled, onTpEnabledChange, slEnabled, onSlEnabledChange, price, onPriceChange, stopPrice, onStopPriceChange, limitPrice, onLimitPriceChange, amount, onAmountChange, tpPrice, onTpPriceChange, slPrice, onSlPriceChange }: SpotOrderFormProps) {
    const [visibleQty, setVisibleQty] = useState('');
    const [twapDuration, setTwapDuration] = useState('60');
    const [twapIntervals, setTwapIntervals] = useState('6');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = pair.split('/')[0];
    const quoteToken = pair.split('/')[1] || 'USDC';

    const tokenBalance = useMemo(
        () => balances.find(b => b.token === token)?.available ?? 0,
        [balances, token]
    );
    const usdcBalance = useMemo(
        () => balances.find(b => b.token === 'USDC')?.available ?? 0,
        [balances]
    );

    const effectivePrice = orderType === 'market' ? currentPrice : (parseFloat(price) || currentPrice);
    const amountNum = parseFloat(amount) || 0;
    const total = amountNum * effectivePrice;
    const fee = total * 0.001;

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

    const quickFill = (pct: number) => {
        if (side === 'buy') {
            const maxAmount = (usdcBalance * pct / 100) / effectivePrice;
            onAmountChange(maxAmount.toFixed(6));
        } else {
            const maxAmount = tokenBalance * pct / 100;
            onAmountChange(maxAmount.toFixed(6));
        }
    };

    const handleSubmit = async () => {
        if (!amountNum || amountNum <= 0) return;
        setIsSubmitting(true);

        try {
            await executeTrade({
                pair,
                side,
                orderType,
                price: orderType === 'market' ? currentPrice : (parseFloat(price) || null),
                stopPrice: parseFloat(stopPrice) || null,
                limitPrice: parseFloat(limitPrice) || null,
                quantity: amountNum,
                tpPrice: tpEnabled ? (parseFloat(tpPrice) || null) : null,
                slPrice: slEnabled ? (parseFloat(slPrice) || null) : null,
                visibleQty: orderType === 'iceberg' ? (parseFloat(visibleQty) || null) : null,
                twapDuration: orderType === 'twap' ? (parseInt(twapDuration) || null) : null,
                twapIntervals: orderType === 'twap' ? (parseInt(twapIntervals) || null) : null,
            });

            // Reset form
            onAmountChange('');
            onPriceChange('');
            onStopPriceChange('');
            onLimitPriceChange('');
            setVisibleQty('');
            onTpPriceChange('');
            onSlPriceChange('');
            onTpEnabledChange(false);
            onSlEnabledChange(false);
        } finally {
            setIsSubmitting(false);
        }
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
                {/* Price (Limit, Stop Limit, Iceberg) */}
                {(orderType === 'limit' || orderType === 'stop_limit' || orderType === 'iceberg') && (
                    <div>
                        <label className="text-[10px] font-mono text-white/40 block mb-1">
                            {orderType === 'stop_limit' ? 'Limit Price' : 'Price'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={orderType === 'stop_limit' ? limitPrice : price}
                            onChange={(e) => orderType === 'stop_limit' ? onLimitPriceChange(e.target.value) : onPriceChange(e.target.value)}
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
                            onChange={(e) => onStopPriceChange(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                        />
                    </div>
                )}

                {/* Amount */}
                <div>
                    <label className="text-[10px] font-mono text-white/40 block mb-1">
                        Amount ({token})
                    </label>
                    <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-purple-500/50 placeholder:text-white/15"
                    />
                    {/* Quick fill buttons */}
                    <div className="flex gap-1 mt-1.5">
                        {[25, 50, 75, 100].map(pct => (
                            <button
                                key={pct}
                                onClick={() => quickFill(pct)}
                                className="flex-1 py-1 text-[9px] font-mono text-white/30 bg-white/5 border border-white/5 hover:text-white/60 hover:bg-white/10 transition-colors"
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
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
                                onChange={(e) => onTpPriceChange(e.target.value)}
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
                                onChange={(e) => onSlPriceChange(e.target.value)}
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

                {/* Total */}
                <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">Total</span>
                    <span className="text-white">{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white/30">Fee (0.1%)</span>
                    <span className="text-white/40">{formatPrice(fee)}</span>
                </div>

                {/* Available Balance */}
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/5">
                    <span className="text-white/30">Available</span>
                    <span className="text-white/50">
                        {side === 'buy'
                            ? `${formatPrice(usdcBalance)} USDC`
                            : `${tokenBalance.toFixed(6)} ${token}`
                        }
                    </span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || amountNum <= 0}
                className={`w-full py-3 text-sm font-mono font-bold transition-all mt-4 disabled:opacity-30 disabled:cursor-not-allowed ${side === 'buy'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
            >
                {isSubmitting ? 'Processing...' : `${side.toUpperCase()} ${token}`}
            </button>
        </div>
    );
}

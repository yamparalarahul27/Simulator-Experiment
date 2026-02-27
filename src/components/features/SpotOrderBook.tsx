'use client';

import React from 'react';
import type { OrderBookData } from '@/lib/hooks/useSpotTrade';

interface SpotOrderBookProps {
    orderBook: OrderBookData;
    formatPrice: (amount: number, decimals?: number) => string;
    onPriceClick: (price: number) => void;
}

export default function SpotOrderBook({ orderBook, formatPrice, onPriceClick }: SpotOrderBookProps) {
    const { asks, bids, spread, spreadPercent } = orderBook;

    // Max total for depth bar width calculation
    const maxTotal = Math.max(
        asks.length > 0 ? asks[asks.length - 1].total : 0,
        bids.length > 0 ? bids[bids.length - 1].total : 0,
        1
    );

    const formatSize = (size: number) => {
        if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)}M`;
        if (size >= 1_000) return `${(size / 1_000).toFixed(1)}K`;
        return size.toFixed(2);
    };

    const formatBookPrice = (price: number) => {
        if (price > 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (price < 0.001) return price.toFixed(7);
        if (price < 1) return price.toFixed(4);
        return price.toFixed(2);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-label-12 text-white/50 uppercase tracking-wider">Order Book</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-white/30 uppercase tracking-wider mb-1 px-1">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            {/* Asks (reversed so lowest is at bottom, closest to spread) */}
            <div className="flex-1 overflow-hidden flex flex-col justify-end">
                {[...asks].reverse().map((level, i) => (
                    <button
                        key={`ask-${i}`}
                        onClick={() => onPriceClick(level.price)}
                        className="relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        {/* Depth bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-red-500/8 transition-all"
                            style={{ width: `${(level.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-red-400 relative z-10">{formatBookPrice(level.price)}</span>
                        <span className="text-white/50 text-right relative z-10">{formatSize(level.size)}</span>
                        <span className="text-white/30 text-right relative z-10">{formatSize(level.total)}</span>
                    </button>
                ))}
            </div>

            {/* Spread */}
            <div className="py-1.5 px-1 border-y border-white/5 my-0.5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/60">
                    {spread > 0 ? formatBookPrice(spread) : '—'}
                </span>
                <span className="text-[9px] font-mono text-white/30">
                    {spreadPercent > 0 ? `${spreadPercent.toFixed(3)}%` : ''}
                </span>
            </div>

            {/* Bids */}
            <div className="flex-1 overflow-hidden">
                {bids.map((level, i) => (
                    <button
                        key={`bid-${i}`}
                        onClick={() => onPriceClick(level.price)}
                        className="relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 hover:bg-white/5 transition-colors cursor-pointer w-full group"
                    >
                        {/* Depth bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-green-500/8 transition-all"
                            style={{ width: `${(level.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-green-400 relative z-10">{formatBookPrice(level.price)}</span>
                        <span className="text-white/50 text-right relative z-10">{formatSize(level.size)}</span>
                        <span className="text-white/30 text-right relative z-10">{formatSize(level.total)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

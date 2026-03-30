'use client';

import React from 'react';
import type { OrderBookData } from '@/lib/hooks/useSpotTrade';

interface SpotOrderBookProps {
    orderBook: OrderBookData;
    formatPrice: (amount: number, decimals?: number) => string;
    onPriceClick: (price: number) => void;
}

const SpotOrderBook = React.memo(function SpotOrderBook({ orderBook, formatPrice, onPriceClick }: SpotOrderBookProps) {
    const { asks, bids, spread, spreadPercent } = orderBook;

    // Single handler reads price from data attribute (avoids N inline closures)
    const handlePriceClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const price = Number(e.currentTarget.dataset.price);
        if (price > 0) onPriceClick(price);
    }, [onPriceClick]);

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
                <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Order Book</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-bs-text-mute uppercase tracking-wider mb-1 px-1">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            {/* Asks (reversed so lowest is at bottom, closest to spread) */}
            <div className="flex-1 overflow-hidden flex flex-col justify-end">
                {[...asks].reverse().map((level, i) => (
                    <button
                        key={`ask-${i}`}
                        data-price={level.price}
                        onClick={handlePriceClick}
                        className="relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 hover:bg-bs-card transition-colors cursor-pointer group"
                    >
                        {/* Depth bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-bs-error/8 transition-all"
                            style={{ width: `${(level.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-bs-error relative z-10">{formatBookPrice(level.price)}</span>
                        <span className="text-bs-text-tertiary text-right relative z-10">{formatSize(level.size)}</span>
                        <span className="text-bs-text-mute text-right relative z-10">{formatSize(level.total)}</span>
                    </button>
                ))}
            </div>

            {/* Spread */}
            <div className="py-1.5 px-1 border-y border-bs-border my-0.5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-bs-text-tertiary">
                    {spread > 0 ? formatBookPrice(spread) : '—'}
                </span>
                <span className="text-[9px] font-mono text-bs-text-mute">
                    {spreadPercent > 0 ? `${spreadPercent.toFixed(3)}%` : ''}
                </span>
            </div>

            {/* Bids */}
            <div className="flex-1 overflow-hidden">
                {bids.map((level, i) => (
                    <button
                        key={`bid-${i}`}
                        data-price={level.price}
                        onClick={handlePriceClick}
                        className="relative grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 px-1 hover:bg-bs-card transition-colors cursor-pointer w-full group"
                    >
                        {/* Depth bar */}
                        <div
                            className="absolute right-0 top-0 bottom-0 bg-bs-success/8 transition-all"
                            style={{ width: `${(level.total / maxTotal) * 100}%` }}
                        />
                        <span className="text-bs-success relative z-10">{formatBookPrice(level.price)}</span>
                        <span className="text-bs-text-tertiary text-right relative z-10">{formatSize(level.size)}</span>
                        <span className="text-bs-text-mute text-right relative z-10">{formatSize(level.total)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});
export default SpotOrderBook;

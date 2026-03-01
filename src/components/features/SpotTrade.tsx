'use client';

import React from 'react';
import SpotTradeChart from './SpotTradeChart';
import SpotOrderBook from './SpotOrderBook';
import SpotOrderForm from './SpotOrderForm';
import SpotTradeHistory from './SpotTradeHistory';
import { DEMO_PAIRS } from '@/lib/hooks/useSpotTrade';
import { ChevronDown, Wifi, WifiOff, Settings } from 'lucide-react';

interface SpotTradeProps {
    trade: ReturnType<typeof import('@/lib/hooks/useSpotTrade').useSpotTrade>;
    controlPanelOpen: boolean;
    onToggleControlPanel: () => void;
}

/**
 * SpotTrade — Main trading terminal layout
 */
export default function SpotTrade({ trade, controlPanelOpen, onToggleControlPanel }: SpotTradeProps) {
    const {
        selectedPair, setSelectedPair, currentPrice, livePrices,
        orderBook, balances, openOrders, filledOrders,
        formatPrice, executeTrade, cancelOrder, settings, wsDisabled,
    } = trade;

    const [pairDropdownOpen, setPairDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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

    const currentToken = selectedPair.split('/')[0];

    if (trade.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="spinner mb-4 text-purple-400"></div>
                    <p className="text-xs font-mono text-white/40">Loading demo market...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ─── Token Selector Bar ──────────── */}
            <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3">
                <div className="flex items-center gap-6">
                    {/* Pair selector */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setPairDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                        >
                            <span className="text-heading-16">{selectedPair}</span>
                            <ChevronDown size={14} className={`transition-transform ${pairDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {pairDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50">
                                {DEMO_PAIRS.map(({ token, pair }) => {
                                    const pd = livePrices[token];
                                    return (
                                        <button
                                            key={pair}
                                            onClick={() => { setSelectedPair(pair); setPairDropdownOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedPair === pair ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <span className="font-mono">{pair}</span>
                                            <span className="text-xs font-mono text-white/40">
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
                        <span className="text-heading-20 text-white font-mono">
                            {currentPrice.price > 0 ? formatPrice(currentPrice.price) : '—'}
                        </span>
                        {currentPrice.price > 0 && (
                            <span className={`text-xs font-mono font-bold ${currentPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(2)}%
                            </span>
                        )}
                    </div>

                    {/* WS Status */}
                    <div className="flex items-center gap-1.5">
                        {currentPrice.isOverridden ? (
                            <>
                                <WifiOff size={10} className="text-yellow-400" />
                                <span className="text-[9px] font-mono text-yellow-400">MANUAL</span>
                            </>
                        ) : (
                            <>
                                <Wifi size={10} className="text-green-400" />
                                <span className="text-[9px] font-mono text-green-400">LIVE</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Currency indicator + Control button */}
                <div className="flex items-center gap-3">
                    {settings && (
                        <div className="text-[10px] font-mono text-white/30">
                            {settings.currency === 'INR' ? `1 USD = ₹${settings.usdInrRate.toFixed(2)}` : 'USD'}
                        </div>
                    )}
                    <button
                        onClick={onToggleControlPanel}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition-all ${controlPanelOpen
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Settings size={14} />
                        Control
                    </button>
                </div>
            </div>

            {/* ─── Main Grid: Chart | OrderBook | OrderForm ──── */}
            <div className="grid grid-cols-12 gap-4">
                {/* Chart */}
                <div className="col-span-5 bg-black/60 backdrop-blur-xl border border-white/10 p-4 min-h-[400px]">
                    <SpotTradeChart
                        currentPrice={currentPrice.price}
                        pair={selectedPair}
                        formatPrice={formatPrice}
                    />
                </div>

                {/* Order Book */}
                <div className="col-span-3 bg-black/60 backdrop-blur-xl border border-white/10 p-3 min-h-[400px]">
                    <SpotOrderBook
                        orderBook={orderBook}
                        formatPrice={formatPrice}
                        onPriceClick={() => { }}
                    />
                </div>

                {/* Order Form */}
                <div className="col-span-4 bg-black/60 backdrop-blur-xl border border-white/10 p-4 min-h-[400px]">
                    <SpotOrderForm
                        pair={selectedPair}
                        currentPrice={currentPrice.price}
                        balances={balances}
                        executeTrade={executeTrade}
                        formatPrice={formatPrice}
                    />
                </div>
            </div>

            {/* ─── Bottom Panel: Orders / History / Balances ── */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10">
                <SpotTradeHistory
                    openOrders={openOrders}
                    filledOrders={filledOrders}
                    balances={balances}
                    cancelOrder={cancelOrder}
                    formatPrice={formatPrice}
                    livePrices={livePrices}
                />
            </div>
        </div>
    );
}

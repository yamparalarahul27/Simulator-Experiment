'use client';

import React from 'react';
import SpotOrderBook from './SpotOrderBook';
import SpotOrderForm from './SpotOrderForm';
import OrderFlowVisualiser from './OrderFlowVisualiser';
import type { SimConfig } from './OrderFlowVisualiser';
import { DEMO_PAIRS } from '@/lib/hooks/useSpotTrade';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import { ChevronDown, Wifi, WifiOff, Settings } from 'lucide-react';

interface SpotConceptsProps {
    trade: ReturnType<typeof import('@/lib/hooks/useSpotTrade').useSpotTrade>;
    controlPanelOpen: boolean;
    onToggleControlPanel: () => void;
}

export default function SpotConcepts({ trade, controlPanelOpen, onToggleControlPanel }: SpotConceptsProps) {
    const {
        selectedPair, setSelectedPair, currentPrice, livePrices,
        orderBook, formatPrice, settings,
    } = trade;

    const [pairDropdownOpen, setPairDropdownOpen] = React.useState(false);
    const [activePanel, setActivePanel] = React.useState<'orderbook' | 'orderform'>('orderform');
    const [orderType, setOrderType] = React.useState<DemoOrderType>('market');
    const [side, setSide] = React.useState<'buy' | 'sell'>('buy');
    const [tpEnabled, setTpEnabled] = React.useState(false);
    const [slEnabled, setSlEnabled] = React.useState(false);
    const [simSnapshot, setSimSnapshot] = React.useState<SimConfig | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Clear simulation when order type or side changes (stale snapshot)
    React.useEffect(() => { setSimSnapshot(null); }, [orderType, side]);

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
            <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3">
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
                    {settings?.currency === 'INR' && (
                        <div className="text-[9px] font-mono text-orange-400/70 bg-orange-500/10 px-2 py-1 border border-orange-500/10">
                            INR rates not available for Spot
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

            {/* ─── Sub-tab strip ──────────────────────────────── */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1">
                {([
                    { id: 'orderform', label: 'Order Simulator' },
                    { id: 'orderbook', label: 'Order Book' },
                ] as const).map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActivePanel(id)}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all ${activePanel === id
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ─── Panel Content ──────────────────────────────── */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 min-h-[500px]">
                {activePanel === 'orderbook' ? (
                    <SpotOrderBook
                        orderBook={orderBook}
                        formatPrice={formatPrice}
                        onPriceClick={() => { }}
                    />
                ) : (
                    <div className="flex gap-0 h-full min-h-[460px]">
                        {/* Order Form */}
                        <div className="w-[320px] flex-shrink-0 border-r border-white/10 pr-4">
                            <SpotOrderForm
                                pair={selectedPair}
                                currentPrice={currentPrice.price}
                                formatPrice={formatPrice}
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                side={side}
                                onSideChange={setSide}
                                tpEnabled={tpEnabled}
                                onTpEnabledChange={setTpEnabled}
                                slEnabled={slEnabled}
                                onSlEnabledChange={setSlEnabled}
                                onRunSimulation={setSimSnapshot}
                            />
                        </div>

                        {/* Order Flow Visualiser */}
                        <div className="flex-1 pl-4 min-w-0">
                            <OrderFlowVisualiser
                                orderType={orderType}
                                side={side}
                                tpEnabled={tpEnabled}
                                slEnabled={slEnabled}
                                simSnapshot={simSnapshot}
                                currentPrice={currentPrice.price}
                                formatPrice={formatPrice}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

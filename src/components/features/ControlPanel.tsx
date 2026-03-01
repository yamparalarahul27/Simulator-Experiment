'use client';

import React from 'react';
import { DEMO_PAIRS, type DemoToken } from '@/lib/hooks/useSpotTrade';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ControlPanelProps {
    isOpen: boolean;
    onClose: () => void;
    trade: ReturnType<typeof import('@/lib/hooks/useSpotTrade').useSpotTrade>;
}

/**
 * ControlPanel — Side drawer for market manipulation, currency settings, and balance reset
 */
export default function ControlPanel({ isOpen, onClose, trade }: ControlPanelProps) {
    if (!isOpen) return null;

    const { settings, livePrices, wsDisabled, setPriceOverride, resetAllOverrides, updateCurrency, updateUsdInrRate, resetBalancesToDefault } = trade;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 z-[70] overflow-y-auto shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-heading-14 text-white">Control Panel</h3>
                <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white text-lg transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* ─── Price Control ──────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-label-12 text-white/50 uppercase tracking-wider">Price Control</h4>
                        <button
                            onClick={resetAllOverrides}
                            className="flex items-center gap-1 text-[10px] font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                            <RefreshCw size={10} />
                            Reset All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {DEMO_PAIRS.map(({ token, pair }) => {
                            const priceData = livePrices[token];
                            const isOverridden = priceData?.isOverridden || false;
                            const currentPrice = priceData?.price || 0;
                            const overrideValue = settings?.priceOverrides?.[token];

                            return (
                                <div key={token} className="bg-white/5 border border-white/5 p-3">
                                    {/* Token header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-white">{token}</span>
                                            {isOverridden ? (
                                                <WifiOff size={10} className="text-red-400" />
                                            ) : (
                                                <Wifi size={10} className="text-green-400" />
                                            )}
                                        </div>
                                        <span className={`text-xs font-mono ${isOverridden ? 'text-yellow-400' : 'text-white/60'}`}>
                                            ${currentPrice > 1000
                                                ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : currentPrice < 0.01
                                                    ? currentPrice.toFixed(7)
                                                    : currentPrice.toFixed(4)
                                            }
                                        </span>
                                    </div>

                                    {/* Override input */}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Override price..."
                                            value={overrideValue ?? ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                                setPriceOverride(token, val);
                                            }}
                                            className="flex-1 bg-black/50 border border-white/10 text-white text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
                                        />
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 1.05)}
                                            className="px-1.5 py-1.5 text-[9px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                                        >
                                            ↑5%
                                        </button>
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 0.95)}
                                            className="px-1.5 py-1.5 text-[9px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                        >
                                            ↓5%
                                        </button>
                                        {isOverridden && (
                                            <button
                                                onClick={() => setPriceOverride(token, null)}
                                                className="px-1.5 py-1.5 text-[9px] font-mono text-white/40 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {isOverridden && (
                                        <div className="mt-1.5 text-[9px] font-mono text-yellow-400/70">
                                            ⚡ WebSocket disabled — using manual price
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Currency settings moved to dedicated modal (⚙️ icon in header) */}

                {/* ─── Balance Reset ────────────────── */}
                <section>
                    <h4 className="text-label-12 text-white/50 uppercase tracking-wider mb-3">Danger Zone</h4>
                    <div className="bg-red-500/5 border border-red-500/10 p-3">
                        <p className="text-[10px] font-mono text-white/40 mb-3">
                            Reset all token balances to their default starting values. This will not affect open orders.
                        </p>
                        <button
                            onClick={resetBalancesToDefault}
                            className="w-full py-2 text-xs font-mono font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                            Reset Balances to Default
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

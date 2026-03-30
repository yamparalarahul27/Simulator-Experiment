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
        <div className="fixed inset-x-0 bottom-0 max-h-[80vh] md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:max-h-none md:h-full w-full md:w-80 bg-bs-bg/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-bs-border z-[70] overflow-y-auto shadow-2xl shadow-black/50 rounded-t-2xl md:rounded-lg">
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-2 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-bs-border" />
            </div>
            {/* Header */}
            <div className="sticky top-0 bg-bs-bg/95 backdrop-blur-xl border-b border-bs-border px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-heading-14 text-bs-text-primary">Control Panel</h3>
                <button
                    onClick={onClose}
                    className="text-bs-text-mute hover:text-bs-text-primary text-lg transition-colors p-1"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* ─── Price Control ──────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Price Control</h4>
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
                                <div key={token} className="bg-bs-card border border-bs-border p-3">
                                    {/* Token header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-bs-text-primary">{token}</span>
                                            {isOverridden ? (
                                                <WifiOff size={10} className="text-bs-error" />
                                            ) : (
                                                <Wifi size={10} className="text-bs-success" />
                                            )}
                                        </div>
                                        <span className={`text-xs font-mono ${isOverridden ? 'text-yellow-400' : 'text-bs-text-tertiary'}`}>
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
                                            className="flex-1 bg-bs-bg/50 border border-bs-border text-bs-text-primary text-xs font-mono px-2 py-1.5 focus:outline-none focus:border-bs-brand-tertiary/50 placeholder:text-bs-text-mute"
                                        />
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 1.05)}
                                            className="px-1.5 py-1.5 text-[9px] font-mono font-bold text-bs-success bg-bs-success/10 border border-[#00e66b]/20 hover:bg-bs-success/20 transition-colors"
                                        >
                                            ↑5%
                                        </button>
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 0.95)}
                                            className="px-1.5 py-1.5 text-[9px] font-mono font-bold text-bs-error bg-bs-error/10 border border-[#ff285a]/20 hover:bg-bs-error/20 transition-colors"
                                        >
                                            ↓5%
                                        </button>
                                        {isOverridden && (
                                            <button
                                                onClick={() => setPriceOverride(token, null)}
                                                className="px-1.5 py-1.5 text-[9px] font-mono text-bs-text-mute bg-bs-card border border-bs-border hover:text-bs-text-primary hover:bg-bs-card-fg transition-colors"
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
                    <h4 className="text-label-12 text-bs-text-tertiary uppercase tracking-wider mb-3">Danger Zone</h4>
                    <div className="bg-bs-error/5 border border-[#ff285a]/10 p-3">
                        <p className="text-[10px] font-mono text-bs-text-mute mb-3">
                            Reset all token balances to their default starting values. This will not affect open orders.
                        </p>
                        <button
                            onClick={resetBalancesToDefault}
                            className="w-full py-2 text-xs font-mono font-medium text-bs-error bg-bs-error/10 border border-[#ff285a]/20 hover:bg-bs-error/20 transition-all"
                        >
                            Reset Balances to Default
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

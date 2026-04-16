'use client';

import React from 'react';
import { DEMO_PAIRS } from '@/lib/hooks/useSpotTrade';
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

    const { settings, livePrices, setPriceOverride, resetAllOverrides, resetBalancesToDefault } = trade;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border border-bs-border bg-bs-card shadow-xl md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-80 md:rounded-none md:border-l">
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-2 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-bs-border" />
            </div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bs-border bg-bs-card px-4 py-3">
                <h3 className="text-heading-14 text-bs-text-primary">Control Panel</h3>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-lg text-bs-text-mute transition-colors hover:bg-bs-card-fg hover:text-bs-text-primary"
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
                            className="flex items-center gap-1 text-[10px] font-mono text-bs-warning hover:text-bs-warning/80 transition-colors"
                        >
                            <RefreshCw size={10} />
                            Reset All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {DEMO_PAIRS.map(({ token }) => {
                            const priceData = livePrices[token];
                            const isOverridden = priceData?.isOverridden || false;
                            const currentPrice = priceData?.price || 0;
                            const overrideValue = settings?.priceOverrides?.[token];

                            return (
                                <div key={token} className="rounded-xl border border-bs-border bg-bs-card-fg p-3">
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
                                        <span className={`text-xs font-mono ${isOverridden ? 'text-bs-warning' : 'text-bs-text-tertiary'}`}>
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
                                            className="flex-1 rounded-md border border-bs-border bg-bs-card px-2 py-1.5 text-xs font-mono text-bs-text-primary placeholder:text-bs-text-mute focus:outline-none focus:border-bs-border-active"
                                        />
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 1.05)}
                                            className="rounded-md border border-bs-success/30 bg-bs-success/10 px-1.5 py-1.5 text-[9px] font-mono font-bold text-bs-success transition-colors hover:bg-bs-success/20"
                                        >
                                            ↑5%
                                        </button>
                                        <button
                                            onClick={() => setPriceOverride(token, currentPrice * 0.95)}
                                            className="rounded-md border border-bs-error/30 bg-bs-error/10 px-1.5 py-1.5 text-[9px] font-mono font-bold text-bs-error transition-colors hover:bg-bs-error/20"
                                        >
                                            ↓5%
                                        </button>
                                        {isOverridden && (
                                            <button
                                                onClick={() => setPriceOverride(token, null)}
                                                className="rounded-md border border-bs-border bg-bs-card px-1.5 py-1.5 text-[9px] font-mono text-bs-text-mute transition-colors hover:text-bs-text-primary"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {isOverridden && (
                                        <div className="mt-1.5 text-[9px] font-mono text-bs-warning/70">
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
                    <div className="rounded-xl border border-bs-error/20 bg-bs-error/5 p-3">
                        <p className="text-[10px] font-mono text-bs-text-mute mb-3">
                            Reset all token balances to their default starting values. This will not affect open orders.
                        </p>
                        <button
                            onClick={resetBalancesToDefault}
                            className="w-full rounded-md border border-bs-error/30 bg-bs-error/10 py-2 text-xs font-mono font-medium text-bs-error transition-colors hover:bg-bs-error/20"
                        >
                            Reset Balances to Default
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

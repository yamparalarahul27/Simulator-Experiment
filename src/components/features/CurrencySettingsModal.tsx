'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Info, Check } from 'lucide-react';

/**
 * CurrencySettingsModal — Modal for changing the USD/INR exchange rate.
 * Includes manual input, quick presets, and a "Reset to Live Rate" button
 * that fetches from the Frankfurter API.
 *
 * Note: INR conversion only applies to the Future Concepts tab.
 * Spot trading always uses USD.
 */

interface CurrencySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRate: number;
    onApply: (rate: number) => void;
}

const PRESETS = [83, 85, 88, 90, 95];

export default function CurrencySettingsModal({ isOpen, onClose, currentRate, onApply }: CurrencySettingsModalProps) {
    const [rate, setRate] = useState(currentRate);
    const [fetching, setFetching] = useState(false);
    const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const fetchLiveRate = async () => {
        setFetching(true);
        setFetchStatus('idle');
        try {
            const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
            const data = await res.json();
            const liveRate = data.rates?.INR;
            if (liveRate && typeof liveRate === 'number') {
                setRate(parseFloat(liveRate.toFixed(2)));
                setFetchStatus('success');
            } else {
                setFetchStatus('error');
            }
        } catch {
            setFetchStatus('error');
        } finally {
            setFetching(false);
        }
    };

    const handleApply = () => {
        onApply(rate);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-bs-bg/60 backdrop-blur-sm z-[80]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[420px] bg-bs-card border border-bs-border shadow-2xl shadow-black/10">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-bs-border">
                    <h3 className="text-sm font-mono font-bold text-bs-text-primary">Currency Settings</h3>
                    <button
                        onClick={onClose}
                        className="text-bs-text-mute hover:text-bs-text-primary transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-5">
                    {/* Exchange Rate Input */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-2">
                            Exchange Rate
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-bs-text-tertiary">1 USD =</span>
                            <input
                                type="number"
                                step="0.01"
                                value={rate}
                                onChange={e => setRate(parseFloat(e.target.value) || 0)}
                                className="flex-1 px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none transition-colors"
                            />
                            <span className="text-xs font-mono text-bs-text-tertiary">INR</span>
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-2">
                            Quick Presets
                        </label>
                        <div className="flex items-center gap-2">
                            {PRESETS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setRate(p); setFetchStatus('idle'); }}
                                    className={`flex-1 py-1.5 text-xs font-mono transition-all border ${rate === p
                                            ? 'bg-bs-brand-tertiary/20 border-bs-brand-tertiary/30 text-bs-brand-secondary'
                                            : 'bg-bs-card border-bs-border text-bs-text-mute hover:text-bs-text-tertiary hover:bg-bs-card-fg'
                                        }`}
                                >
                                    ₹{p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset to Live Rate */}
                    <div>
                        <button
                            onClick={fetchLiveRate}
                            disabled={fetching}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-medium
                                bg-bs-card border border-bs-border text-bs-text-tertiary
                                hover:bg-bs-card-fg hover:text-bs-text-primary
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all"
                        >
                            <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} />
                            {fetching ? 'Fetching live rate...' : 'Reset to Live Rate'}
                        </button>
                        {fetchStatus === 'success' && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-bs-success">
                                <Check size={10} />
                                Live rate fetched: ₹{rate.toFixed(2)} (via Frankfurter API)
                            </div>
                        )}
                        {fetchStatus === 'error' && (
                            <div className="mt-1.5 text-[10px] font-mono text-bs-error">
                                Failed to fetch live rate. Try again or set manually.
                            </div>
                        )}
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 p-3 bg-bs-card border border-bs-border">
                        <Info size={12} className="text-bs-brand mt-0.5 shrink-0" />
                        <p className="text-[10px] font-mono text-bs-text-mute leading-relaxed">
                            This rate applies only to the <span className="text-bs-text-tertiary">Future Concepts</span> tab.
                            Spot trading always uses USD.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-bs-border">
                    <button
                        onClick={handleApply}
                        className="w-full py-2.5 text-sm font-mono font-bold
                            bg-bs-accent-cyan text-white
                            hover:opacity-90
                            transition-all active:scale-[0.98]"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </>
    );
}

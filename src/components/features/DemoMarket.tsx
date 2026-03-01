'use client';

import React, { useState } from 'react';
import SpotTrade from './SpotTrade';
import ControlPanel from './ControlPanel';
import { useSpotTrade } from '@/lib/hooks/useSpotTrade';
import { Settings } from 'lucide-react';

/**
 * DemoMarket — Page shell with Spot/Future tabs and Control Panel drawer
 */
export default function DemoMarket({ walletAddress }: { walletAddress?: string | null }) {
    const [activeTab, setActiveTab] = useState<'spot' | 'future'>('spot');
    const [controlPanelOpen, setControlPanelOpen] = useState(false);

    const spotTrade = useSpotTrade(walletAddress ?? null);

    // Fallback defaults when wallet is not connected (settings is null)
    const currency = spotTrade.settings?.currency ?? 'USD';
    const usdInrRate = spotTrade.settings?.usdInrRate ?? 90.98;

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-heading-24 text-white">Demo Market Simulator</h1>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-none">
                            Demo Mode
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {/* Currency Toggle */}
                    <button
                        onClick={() => spotTrade.settings && spotTrade.updateCurrency(currency === 'USD' ? 'INR' : 'USD')}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white"
                    >
                        <span className={currency === 'USD' ? 'text-green-400' : 'text-white/40'}>USD</span>
                        <span className="text-white/20">⇄</span>
                        <span className={currency === 'INR' ? 'text-orange-400' : 'text-white/40'}>INR</span>
                    </button>
                    <span className="text-[10px] font-mono text-white">
                        1 USD = ₹{usdInrRate.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Spot / Future Tabs */}
            <div className="flex border-b border-white/10 mb-6">
                <button
                    onClick={() => setActiveTab('spot')}
                    className={`px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'spot'
                        ? 'text-white border-purple-500'
                        : 'text-white/40 border-transparent hover:text-white/70'
                        }`}
                >
                    Spot
                </button>
                <button
                    onClick={() => setActiveTab('future')}
                    className={`px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'future'
                        ? 'text-white border-purple-500'
                        : 'text-white/40 border-transparent hover:text-white/70'
                        }`}
                >
                    Future Concepts
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex gap-0">
                {/* Main Content */}
                <div className="flex-1">
                    {activeTab === 'spot' ? (
                        <SpotTrade
                            trade={spotTrade}
                            controlPanelOpen={controlPanelOpen}
                            onToggleControlPanel={() => setControlPanelOpen(prev => !prev)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                            <div className="p-8 bg-black/40 backdrop-blur-xl border border-white/10">
                                <h2 className="text-heading-20 text-white/80 mb-3">Futures Trading</h2>
                                <p className="text-copy-14 text-white/40 max-w-md">
                                    Perpetual futures with leverage are coming soon. Stay tuned for leveraged demo trading.
                                </p>
                                <div className="mt-6 inline-block px-4 py-2 text-xs font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20">
                                    COMING SOON
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Panel (side drawer) */}
                <ControlPanel
                    isOpen={controlPanelOpen}
                    onClose={() => setControlPanelOpen(false)}
                    trade={spotTrade}
                />
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import SpotConcepts from './SpotConcepts';
import FutureConcepts from './FutureConcepts';
import ControlPanel from './ControlPanel';
import CurrencySettingsModal from './CurrencySettingsModal';
import { useSpotTrade } from '@/lib/hooks/useSpotTrade';
import { Settings } from 'lucide-react';

/**
 * DemoMarket — Page shell with Spot/Future tabs and Control Panel drawer
 */
export default function DemoMarket({ walletAddress }: { walletAddress?: string | null }) {
    const [activeTab, setActiveTab] = useState<'spot' | 'future'>('future');
    const [controlPanelOpen, setControlPanelOpen] = useState(false);
    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

    const spotTrade = useSpotTrade(walletAddress ?? null);

    // Fallback defaults when wallet is not connected (settings is null)
    const [localCurrency, setLocalCurrency] = useState<'USD' | 'INR'>('USD');
    const [localUsdInrRate, setLocalUsdInrRate] = useState(90.98);
    const currency = spotTrade.settings?.currency ?? localCurrency;
    const usdInrRate = spotTrade.settings?.usdInrRate ?? localUsdInrRate;

    const toggleCurrency = () => {
        const next = currency === 'USD' ? 'INR' : 'USD';
        setLocalCurrency(next);
        if (spotTrade.settings) {
            spotTrade.updateCurrency(next);
        }
    };

    const handleRateApply = (newRate: number) => {
        setLocalUsdInrRate(newRate);
        if (spotTrade.settings) {
            spotTrade.updateUsdInrRate(newRate);
        }
    };

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-heading-24 text-white">Demo Market Simulator</h1>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-none">
                            Experiment
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {/* Currency Toggle + Settings Icon */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleCurrency}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white"
                        >
                            <span className={currency === 'USD' ? 'text-green-400' : 'text-white/40'}>USD</span>
                            <span className="text-white/20">⇄</span>
                            <span className={currency === 'INR' ? 'text-orange-400' : 'text-white/40'}>INR</span>
                        </button>
                        <button
                            onClick={() => setCurrencyModalOpen(true)}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white"
                            title="Currency Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                    <span className="text-[10px] font-mono text-white">
                        1 USD = ₹{usdInrRate.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Spot / Future Tabs */}
            <div className="flex border-b border-white/10 mb-6">
                <button
                    onClick={() => setActiveTab('future')}
                    className={`px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'future'
                        ? 'text-white border-purple-500'
                        : 'text-white/40 border-transparent hover:text-white/70'
                        }`}
                >
                    Future Concepts
                </button>
                <button
                    onClick={() => setActiveTab('spot')}
                    className={`px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'spot'
                        ? 'text-white border-purple-500'
                        : 'text-white/40 border-transparent hover:text-white/70'
                        }`}
                >
                    Spot Concepts
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex gap-0">
                {/* Main Content */}
                <div className="flex-1">
                    {activeTab === 'spot' ? (
                        <SpotConcepts
                            trade={spotTrade}
                            controlPanelOpen={controlPanelOpen}
                            onToggleControlPanel={() => setControlPanelOpen(prev => !prev)}
                        />
                    ) : (
                        <FutureConcepts livePrices={spotTrade.livePrices} currency={currency} usdInrRate={usdInrRate} />
                    )}
                </div>

                {/* Control Panel (side drawer) */}
                <ControlPanel
                    isOpen={controlPanelOpen}
                    onClose={() => setControlPanelOpen(false)}
                    trade={spotTrade}
                />
            </div>
            {/* Currency Settings Modal */}
            <CurrencySettingsModal
                isOpen={currencyModalOpen}
                onClose={() => setCurrencyModalOpen(false)}
                currentRate={usdInrRate}
                onApply={handleRateApply}
            />
        </div>
    );
}

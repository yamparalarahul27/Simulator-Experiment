'use client';

import React, { useState, useCallback } from 'react';
import NumberFlow from '@number-flow/react';
import SpotConcepts from './SpotConcepts';
import FutureConcepts from './FutureConcepts';
import ControlPanel from './ControlPanel';
import CurrencySettingsModal from './CurrencySettingsModal';
import { useSpotTrade } from '@/lib/hooks/useSpotTrade';
import { LivePricesProvider } from '@/lib/context/LivePricesContext';
import { Settings } from 'lucide-react';

/**
 * DemoMarket — Page shell with Spot/Future tabs and Control Panel drawer.
 * LivePricesProvider wraps the tree so useSpotTrade (and any child) can
 * consume live prices from context without prop-drilling.
 *
 * @param simulatorKind - Controls which tabs are visible:
 *   'spot'    → only Spot Concepts tab
 *   'futures' → only Future Concepts tab
 *   undefined → both tabs (standalone /simulator page)
 */
export default function DemoMarket({ walletAddress, simulatorKind }: { walletAddress?: string | null; simulatorKind?: 'spot' | 'futures' }) {
    return (
        <LivePricesProvider>
            <DemoMarketInner walletAddress={walletAddress} simulatorKind={simulatorKind} />
        </LivePricesProvider>
    );
}

function DemoMarketInner({ walletAddress, simulatorKind }: { walletAddress?: string | null; simulatorKind?: 'spot' | 'futures' }) {
    const showSpot = !simulatorKind || simulatorKind === 'spot';
    const showFuture = !simulatorKind || simulatorKind === 'futures';
    const showTabs = showSpot && showFuture;

    const [activeTab, setActiveTab] = useState<'spot' | 'future'>(showSpot ? 'spot' : 'future');
    const [controlPanelOpen, setControlPanelOpen] = useState(false);
    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

    const spotTrade = useSpotTrade(walletAddress ?? null);

    // Fallback defaults when wallet is not connected (settings is null)
    const [localCurrency, setLocalCurrency] = useState<'USD' | 'INR'>('USD');
    const [localUsdInrRate, setLocalUsdInrRate] = useState(90.98);
    const currency = spotTrade.settings?.currency ?? localCurrency;
    const usdInrRate = spotTrade.settings?.usdInrRate ?? localUsdInrRate;

    const toggleCurrency = useCallback(() => {
        const next = currency === 'USD' ? 'INR' : 'USD';
        setLocalCurrency(next);
        if (spotTrade.settings) {
            spotTrade.updateCurrency(next);
        }
    }, [currency, spotTrade]);

    const handleRateApply = useCallback((newRate: number) => {
        setLocalUsdInrRate(newRate);
        if (spotTrade.settings) {
            spotTrade.updateUsdInrRate(newRate);
        }
    }, [spotTrade]);

    const toggleControlPanel = useCallback(() => setControlPanelOpen(prev => !prev), []);
    const closeControlPanel = useCallback(() => setControlPanelOpen(false), []);
    const closeCurrencyModal = useCallback(() => setCurrencyModalOpen(false), []);

    return (
        <div className="relative p-1">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-4 md:mb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <h1 className="text-lg md:text-heading-24 text-[var(--bs-text-primary)] truncate">Demo Market Simulator</h1>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[var(--bs-info)]/20 text-[var(--bs-info)] border border-[var(--bs-info)]/30 rounded-lg shrink-0">
                        Experiment
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 md:flex-col md:items-end md:gap-1">
                    {/* Currency Toggle + Settings Icon */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleCurrency}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-mono bg-[var(--bs-card)] border border-[var(--bs-border)] hover:bg-[var(--bs-card-fg)] transition-all text-[var(--bs-text-secondary)] hover:text-[var(--bs-text-primary)]"
                        >
                            <span className={currency === 'USD' ? 'text-[var(--bs-success)]' : 'text-[var(--bs-text-mute)]'}>USD</span>
                            <span className="text-[var(--bs-text-mute)]">⇄</span>
                            <span className={currency === 'INR' ? 'text-orange-400' : 'text-[var(--bs-text-mute)]'}>INR</span>
                        </button>
                        <button
                            onClick={() => setCurrencyModalOpen(true)}
                            className="p-2 bg-[var(--bs-card)] border border-[var(--bs-border)] hover:bg-[var(--bs-card-fg)] transition-all text-[var(--bs-text-mute)] hover:text-[var(--bs-text-primary)]"
                            title="Currency Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--bs-text-primary)]">
                        1 USD = ₹<NumberFlow value={usdInrRate} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 400, easing: 'ease-out' }} />
                    </span>
                </div>
            </div>

            {/* Spot / Future Tabs — only shown when both are available */}
            {showTabs && (
                <div className="flex border-b border-[var(--bs-border)] mb-4 md:mb-6">
                    <button
                        onClick={() => setActiveTab('spot')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'spot'
                            ? 'text-[var(--bs-text-primary)] border-[var(--bs-brand-tertiary)]'
                            : 'text-[var(--bs-text-mute)] border-transparent hover:text-[var(--bs-text-secondary)]'
                            }`}
                    >
                        Spot Concepts
                    </button>
                    <button
                        onClick={() => setActiveTab('future')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-3 text-sm font-mono font-medium transition-all border-b-2 ${activeTab === 'future'
                            ? 'text-[var(--bs-text-primary)] border-[var(--bs-brand-tertiary)]'
                            : 'text-[var(--bs-text-mute)] border-transparent hover:text-[var(--bs-text-secondary)]'
                            }`}
                    >
                        Future Concepts
                    </button>
                </div>
            )}

            {/* Tab Content */}
            <div className="flex gap-0">
                {/* Main Content */}
                <div className="flex-1">
                    {activeTab === 'spot' ? (
                        <SpotConcepts
                            trade={spotTrade}
                            controlPanelOpen={controlPanelOpen}
                            onToggleControlPanel={toggleControlPanel}
                        />
                    ) : (
                        <FutureConcepts currency={currency} usdInrRate={usdInrRate} />
                    )}
                </div>

                {/* Control Panel (side drawer) */}
                <ControlPanel
                    isOpen={controlPanelOpen}
                    onClose={closeControlPanel}
                    trade={spotTrade}
                />
            </div>
            {/* Currency Settings Modal */}
            <CurrencySettingsModal
                isOpen={currencyModalOpen}
                onClose={closeCurrencyModal}
                currentRate={usdInrRate}
                onApply={handleRateApply}
            />
        </div>
    );
}

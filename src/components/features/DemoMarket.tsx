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
import { cn } from '@/lib/utils';

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
        <div className="relative space-y-4 p-1">
            <header className="flex flex-col gap-4 rounded-2xl border border-bs-border bg-bs-card px-4 py-4 md:flex-row md:items-start md:justify-between md:px-5">
                <div>
                    <p className="text-sm text-bs-text-tertiary">Trading Sandbox</p>
                    <h2 className="mt-1 text-2xl font-semibold text-bs-text-primary text-balance md:text-3xl">
                        Demo market simulator
                    </h2>
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleCurrency}
                            className="flex items-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-xs text-bs-text-secondary"
                        >
                            <span className={cn(currency === 'USD' ? 'text-bs-success' : 'text-bs-text-mute')}>USD</span>
                            <span className="text-bs-text-mute">⇄</span>
                            <span className={cn(currency === 'INR' ? 'text-bs-brand-rust' : 'text-bs-text-mute')}>INR</span>
                        </button>
                        <button
                            onClick={() => setCurrencyModalOpen(true)}
                            className="rounded-lg border border-bs-border bg-bs-card-fg p-2 text-bs-text-mute hover:text-bs-text-primary"
                            title="Currency Settings"
                            aria-label="Currency Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                    <span className="text-xs tabular-nums text-bs-text-secondary">
                        1 USD = ₹
                        <NumberFlow
                            value={usdInrRate}
                            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                            transformTiming={{ duration: 400, easing: 'ease-out' }}
                        />
                    </span>
                </div>
            </header>

            {showTabs && (
                <div className="flex rounded-xl border border-bs-border bg-bs-card-fg p-1">
                    <button
                        onClick={() => setActiveTab('spot')}
                        className={cn(
                            'flex-1 rounded-lg px-4 py-2 text-sm font-medium',
                            activeTab === 'spot'
                                ? 'bg-bs-card text-bs-text-primary'
                                : 'text-bs-text-tertiary hover:text-bs-text-secondary'
                        )}
                    >
                        Spot Concepts
                    </button>
                    <button
                        onClick={() => setActiveTab('future')}
                        className={cn(
                            'flex-1 rounded-lg px-4 py-2 text-sm font-medium',
                            activeTab === 'future'
                                ? 'bg-bs-card text-bs-text-primary'
                                : 'text-bs-text-tertiary hover:text-bs-text-secondary'
                        )}
                    >
                        Future Concepts
                    </button>
                </div>
            )}

            <div className="flex gap-0">
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

                <ControlPanel
                    isOpen={controlPanelOpen}
                    onClose={closeControlPanel}
                    trade={spotTrade}
                />
            </div>

            <CurrencySettingsModal
                isOpen={currencyModalOpen}
                onClose={closeCurrencyModal}
                currentRate={usdInrRate}
                onApply={handleRateApply}
            />
        </div>
    );
}

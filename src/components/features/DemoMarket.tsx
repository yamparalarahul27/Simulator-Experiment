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
import ThemeToggle from '@/components/ui/ThemeToggle';
import SoundToggle from '@/components/ui/SoundToggle';
import { useAppSound } from '@/lib/context/SoundContext';

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
    const { playClick, playOpen } = useAppSound();

    // Fallback defaults when wallet is not connected (settings is null)
    const [localCurrency, setLocalCurrency] = useState<'USD' | 'INR'>('USD');
    const [localUsdInrRate, setLocalUsdInrRate] = useState(90.98);
    const currency = spotTrade.settings?.currency ?? localCurrency;
    const usdInrRate = spotTrade.settings?.usdInrRate ?? localUsdInrRate;

    const toggleCurrency = useCallback(() => {
        playClick();
        const next = currency === 'USD' ? 'INR' : 'USD';
        setLocalCurrency(next);
        if (spotTrade.settings) {
            spotTrade.updateCurrency(next);
        }
    }, [currency, playClick, spotTrade]);

    const handleRateApply = useCallback((newRate: number) => {
        setLocalUsdInrRate(newRate);
        if (spotTrade.settings) {
            spotTrade.updateUsdInrRate(newRate);
        }
    }, [spotTrade]);

    const selectTab = useCallback((tab: 'spot' | 'future') => {
        if (tab !== activeTab) playClick();
        setActiveTab(tab);
    }, [activeTab, playClick]);

    const openCurrencyModal = useCallback(() => {
        playOpen();
        setCurrencyModalOpen(true);
    }, [playOpen]);

    const toggleControlPanel = useCallback(() => {
        if (controlPanelOpen) {
            playClick();
        } else {
            playOpen();
        }
        setControlPanelOpen(prev => !prev);
    }, [controlPanelOpen, playClick, playOpen]);
    const closeControlPanel = useCallback(() => {
        playClick();
        setControlPanelOpen(false);
    }, [playClick]);
    const closeCurrencyModal = useCallback(() => setCurrencyModalOpen(false), []);

    return (
        <div className="relative flex min-h-0 w-full flex-1 flex-col gap-2.5">
            <header className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-bs-border bg-bs-card px-3 py-2">
                <h2 className="mr-1 whitespace-nowrap text-lg font-semibold text-bs-text-primary">
                    Trading Case Simulator
                </h2>

                {showTabs && (
                    <div className="flex min-w-[260px] flex-1 rounded-lg border border-bs-border bg-bs-card-fg p-1 sm:max-w-md">
                        <button
                            onClick={() => selectTab('spot')}
                            className={cn(
                                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium',
                                activeTab === 'spot'
                                    ? 'bg-bs-card text-bs-text-primary'
                                    : 'text-bs-text-tertiary hover:text-bs-text-secondary'
                            )}
                        >
                            Spot - Order Types
                        </button>
                        <button
                            onClick={() => selectTab('future')}
                            className={cn(
                                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium',
                                activeTab === 'future'
                                    ? 'bg-bs-card text-bs-text-primary'
                                    : 'text-bs-text-tertiary hover:text-bs-text-secondary'
                            )}
                        >
                            Futures - Liquidation
                        </button>
                    </div>
                )}

                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <ThemeToggle showLabel className="h-8" />
                    <SoundToggle showLabel className="h-8" />
                    <button
                        onClick={toggleCurrency}
                        className="flex h-8 items-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-3 text-xs text-bs-text-secondary transition-colors hover:text-bs-text-primary"
                    >
                        <span className={cn(currency === 'USD' ? 'text-bs-success' : 'text-bs-text-mute')}>USD</span>
                        <span className="text-bs-text-mute">⇄</span>
                        <span className={cn(currency === 'INR' ? 'text-bs-brand-rust' : 'text-bs-text-mute')}>INR</span>
                        <span className="hidden h-4 border-l border-bs-border sm:block" />
                        <span className="hidden tabular-nums text-bs-text-tertiary sm:inline">
                            1 USD = ₹
                            <NumberFlow
                                value={usdInrRate}
                                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                transformTiming={{ duration: 400, easing: 'ease-out' }}
                            />
                        </span>
                    </button>
                    <button
                        onClick={openCurrencyModal}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-bs-border bg-bs-card-fg text-bs-text-mute transition-colors hover:text-bs-text-primary"
                        title="Currency Settings"
                        aria-label="Currency Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </header>

            <div className="flex min-h-0 min-w-0 flex-1 gap-0">
                <div className="min-h-0 min-w-0 flex-1">
                    {activeTab === 'spot' ? (
                        <SpotConcepts
                            trade={spotTrade}
                            currency={currency}
                            usdInrRate={usdInrRate}
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

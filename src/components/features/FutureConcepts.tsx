'use client';

import React, { useState } from 'react';
import LiquidationSimulator from './LiquidationSimulator';
import FuturesWalletSimulator from './FuturesWalletSimulator';
import { useLivePrices } from '@/lib/context/LivePricesContext';
import { cn } from '@/lib/utils';

/**
 * FutureConcepts — Educational section shell for the "Future Concepts" tab.
 * Contains sub-section navigation for:
 *   - Liquidation (active, fully built)
 *   - Funding Rate (TODO: future implementation)
 *   - Leverage (TODO: future implementation)
 */

interface FutureConceptsProps {
    currency: 'USD' | 'INR';
    usdInrRate: number;
}

type Section = 'liquidation' | 'wallet' | 'funding' | 'leverage';

export default function FutureConcepts({ currency, usdInrRate }: FutureConceptsProps) {
    const { livePrices } = useLivePrices();
    const [activeSection, setActiveSection] = useState<Section>('liquidation');

    const sections: { id: Section; label: string; enabled: boolean }[] = [
        { id: 'liquidation', label: 'Liquidation', enabled: true },
        { id: 'wallet', label: 'Wallet & Positions', enabled: true },
        { id: 'funding', label: 'Funding Rate', enabled: false },
        { id: 'leverage', label: 'Leverage', enabled: false },
    ];

    return (
        <div className="space-y-4">
            {/* Section Navigation */}
            <div className="flex items-center gap-1 rounded-xl border border-bs-border bg-bs-card-fg p-1">
                {sections.map(({ id, label, enabled }) => (
                    <button
                        key={id}
                        onClick={() => enabled && setActiveSection(id)}
                        disabled={!enabled}
                        className={cn(
                            'rounded-lg border px-4 py-2 text-xs font-medium',
                            activeSection === id
                                ? 'border-bs-border bg-bs-card text-bs-text-primary'
                                : enabled
                                    ? 'border-transparent text-bs-text-tertiary hover:text-bs-text-secondary'
                                    : 'cursor-not-allowed border-transparent text-bs-text-mute'
                        )}
                    >
                        {label}
                        {!enabled && (
                            <span className="ml-1.5 text-[8px] text-bs-text-primary/15 uppercase">soon</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            {activeSection === 'liquidation' && (
                <LiquidationSimulator livePrices={livePrices} currency={currency} usdInrRate={usdInrRate} />
            )}

            {activeSection === 'wallet' && (
                <FuturesWalletSimulator livePrices={livePrices} currency={currency} usdInrRate={usdInrRate} />
            )}

            {/* TODO: Funding Rate section */}
            {/* activeSection === 'funding' && <FundingRateExplainer livePrices={livePrices} /> */}

            {/* TODO: Leverage section */}
            {/* activeSection === 'leverage' && <LeverageExplainer livePrices={livePrices} /> */}
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import LiquidationSimulator from './LiquidationSimulator';
import { useLivePrices } from '@/lib/context/LivePricesContext';

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

type Section = 'liquidation' | 'funding' | 'leverage';

export default function FutureConcepts({ currency, usdInrRate }: FutureConceptsProps) {
    const { livePrices } = useLivePrices();
    const [activeSection, setActiveSection] = useState<Section>('liquidation');

    const sections: { id: Section; label: string; enabled: boolean }[] = [
        { id: 'liquidation', label: 'Liquidation', enabled: true },
        { id: 'funding', label: 'Funding Rate', enabled: false },
        { id: 'leverage', label: 'Leverage', enabled: false },
    ];

    return (
        <div className="space-y-4">
            {/* Section Navigation */}
            <div className="flex items-center gap-1 bg-bs-bg/40 backdrop-blur-xl border border-bs-border p-1">
                {sections.map(({ id, label, enabled }) => (
                    <button
                        key={id}
                        onClick={() => enabled && setActiveSection(id)}
                        disabled={!enabled}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all ${activeSection === id
                            ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border border-bs-brand-tertiary/30'
                            : enabled
                                ? 'text-bs-text-tertiary hover:text-bs-text-secondary hover:bg-bs-card border border-transparent'
                                : 'text-bs-text-mute cursor-not-allowed border border-transparent'
                            }`}
                    >
                        {label}
                        {!enabled && (
                            <span className="ml-1.5 text-[8px] text-white/15 uppercase">soon</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            {activeSection === 'liquidation' && (
                <LiquidationSimulator livePrices={livePrices} currency={currency} usdInrRate={usdInrRate} />
            )}

            {/* TODO: Funding Rate section */}
            {/* activeSection === 'funding' && <FundingRateExplainer livePrices={livePrices} /> */}

            {/* TODO: Leverage section */}
            {/* activeSection === 'leverage' && <LeverageExplainer livePrices={livePrices} /> */}
        </div>
    );
}

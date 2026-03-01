'use client';

import React, { useState } from 'react';
import LiquidationSimulator from './LiquidationSimulator';
import type { PriceData, DemoToken } from '@/lib/hooks/useSpotTrade';

/**
 * FutureConcepts — Educational section shell for the "Future Concepts" tab.
 * Contains sub-section navigation for:
 *   - Liquidation (active, fully built)
 *   - Funding Rate (TODO: future implementation)
 *   - Leverage (TODO: future implementation)
 */

interface FutureConceptsProps {
    livePrices: Record<string, PriceData>;
    currency: 'USD' | 'INR';
    usdInrRate: number;
}

type Section = 'liquidation' | 'funding' | 'leverage';

export default function FutureConcepts({ livePrices, currency, usdInrRate }: FutureConceptsProps) {
    const [activeSection, setActiveSection] = useState<Section>('liquidation');

    const sections: { id: Section; label: string; enabled: boolean }[] = [
        { id: 'liquidation', label: 'Liquidation', enabled: true },
        { id: 'funding', label: 'Funding Rate', enabled: false },
        { id: 'leverage', label: 'Leverage', enabled: false },
    ];

    return (
        <div className="space-y-4">
            {/* Section Navigation */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1">
                {sections.map(({ id, label, enabled }) => (
                    <button
                        key={id}
                        onClick={() => enabled && setActiveSection(id)}
                        disabled={!enabled}
                        className={`px-4 py-2 text-xs font-mono font-medium transition-all ${activeSection === id
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : enabled
                                ? 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                                : 'text-white/20 cursor-not-allowed border border-transparent'
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

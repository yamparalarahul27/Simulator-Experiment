'use client';

import React from 'react';
import { FilterType } from '../../lib/tradeFilters';
import InfoTooltip from '../ui/InfoTooltip';

interface TopBarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

const FILTERS: FilterType[] = ['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year'];

export default function TopBar({ activeFilter, onFilterChange }: TopBarProps) {
    return (
        <div className="flex items-center justify-between gap-6 mb-6 flex-wrap">
            {/* Left: Wallet Selector (Placeholders) */}
            <div className="flex items-center gap-2">
                <div className="flex items-center">
                    <span className="text-white/60 text-sm font-mono mr-2">Wallet:</span>
                    <InfoTooltip infoKey="walletSelector" />
                </div>
                {[1, 2, 3].map((num) => (
                    <button
                        key={num}
                        type="button"
                        className="px-4 py-2 rounded-none bg-white/5 border border-white/10 text-white/60 text-sm font-mono hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-not-allowed"
                        disabled
                    >
                        {num}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-white/10" />

            {/* Right: Time Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center">
                    <span className="text-white/60 text-sm font-mono mr-2">Filters:</span>
                    <InfoTooltip infoKey="timeFilters" />
                </div>
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => onFilterChange(filter)}
                        className={`px-4 py-2 rounded-none text-sm font-mono transition-all duration-200 border-b-2 ${activeFilter === filter
                            ? 'bg-purple-500/20 border-purple-500 text-white/100'
                            : 'bg-white/5 border-x border-t border-white/10 border-b-transparent text-white/60 hover:bg-white/10 hover:border-white/20'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { FilterType } from '../../lib/tradeFilters';

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
                <span className="text-white/60 text-sm font-mono mr-2">Wallet:</span>
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
                <span className="text-white/60 text-sm font-mono mr-2">Filters:</span>
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => onFilterChange(filter)}
                        className={`px-4 py-2 rounded-none text-sm font-mono transition-all duration-200 border-purple-500 ${activeFilter === filter
                            ? 'bg-purple-500/20 border-purple-500 text-white/100'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
}

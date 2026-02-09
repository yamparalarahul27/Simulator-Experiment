import React, { useState } from 'react';
import CardWithCornerShine from './CardWithCornerShine';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

type FilterType = 'All' | 'Yesterday' | 'Today' | 'This Week' | 'This Month' | 'This Year';

export default function PnLCard() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const filters: FilterType[] = ['All', 'Yesterday', 'Today', 'This Week', 'This Month', 'This Year'];

    // Placeholder data based on filter (to show interactivity)
    const getPlaceholderData = (filter: FilterType) => {
        switch (filter) {
            case 'All': return { pnl: '+$124,592.00', percent: '+18.2%' };
            case 'Yesterday': return { pnl: '-$1,240.50', percent: '-0.8%' };
            case 'Today': return { pnl: '+$450.25', percent: '+0.4%' };
            case 'This Week': return { pnl: '+$5,890.00', percent: '+2.1%' };
            case 'This Month': return { pnl: '+$22,400.00', percent: '+8.5%' };
            case 'This Year': return { pnl: '+$85,100.00', percent: '+14.2%' };
            default: return { pnl: '$0.00', percent: '0%' };
        }
    };

    const data = getPlaceholderData(activeFilter);
    const isPositive = data.pnl.startsWith('+');

    return (
        <div className="w-full">
            <CardWithCornerShine padding="lg" minHeight="min-h-[400px]">
                <div className="flex flex-col h-full space-y-8">
                    {/* Header & Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-none border border-purple-500/20">
                                <TrendingUp className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-wide">PnL Analysis</h2>
                                <p className="text-sm text-white/40 font-mono">NET PROFIT & LOSS</p>
                            </div>
                        </div>

                        {/* Filters Scrollable Row */}
                        <div className="flex bg-black/40 border border-white/5 rounded-none p-1 overflow-x-auto scrollbar-hide">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`
                                        px-4 py-1.5 text-sm font-medium rounded-none whitespace-nowrap transition-all duration-300
                                        ${activeFilter === filter
                                            ? 'bg-purple-600/20 text-purple-300 shadow-[0_0_10px_rgba(147,51,234,0.1)] border border-purple-500/30'
                                            : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Metric Area */}
                    <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-4">
                        <div className="text-center space-y-2">
                            <span className="text-sm text-white/40 uppercase tracking-[0.2em]">Total PnL ({activeFilter})</span>
                            <div className={`text-num-56 sm:text-num-72 tracking-normal ${isPositive ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                {data.pnl}
                            </div>
                        </div>

                        <div className={`
                            flex items-center gap-2 px-4 py-2 rounded-none border backdrop-blur-sm
                            ${isPositive
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}
                        `}>
                            {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            <span className="font-mono font-bold text-lg">{data.percent}</span>
                            <span className="text-white/40 text-sm ml-1">vs previous period</span>
                        </div>
                    </div>

                    {/* Placeholder Chart / Graphic Line */}
                    <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-black/80 text-xs text-white/20 uppercase tracking-widest font-mono">
                            Data Visualization Pending
                        </div>
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import CardWithCornerShine from './CardWithCornerShine';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronDown } from 'lucide-react';
import { LineChart } from '@derpdaderp/chartkit';

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
    const [isChartVisible, setIsChartVisible] = useState(false);

    // Generate dummy data based on filter
    const chartData = useMemo(() => {
        const points = 20;
        return Array.from({ length: points }, (_, i) => {
            // Create a wave pattern that goes positive and negative
            const value = Math.sin(i * 0.5) * 500 + (Math.random() * 200 - 100);
            return {
                time: i,
                // Split value into positive and negative fields for color separation
                positive: value >= 0 ? value : null,
                negative: value < 0 ? value : null,
                value: value // Keep raw value if needed
            };
        });
    }, [activeFilter]);

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

                        {/* Filters Row - Grid Layout to fill space */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-black/40 border border-white/5 rounded-none p-1">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`
                                        w-full px-2 py-1.5 text-xs sm:text-sm font-medium rounded-none whitespace-nowrap transition-all duration-300
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

                    {/* Chart Accordion Section */}
                    <div className="w-full border-t border-white/10 pt-4">
                        <button
                            onClick={() => setIsChartVisible(!isChartVisible)}
                            className="w-full flex items-center justify-between group cursor-pointer"
                        >
                            <span className="text-white font-mono text-sm tracking-widest uppercase">
                                Visualise PnL
                            </span>
                            <div className={`
                                p-1.5 rounded-full bg-black border border-white/10 
                                group-hover:border-white/30 transition-all duration-300
                                ${isChartVisible ? 'rotate-180' : ''}
                            `}>
                                <ChevronDown className="w-4 h-4 text-white" />
                            </div>
                        </button>

                        {/* Chart Container */}
                        {isChartVisible && (
                            <div className="mt-6 h-[400px] w-full animate-in fade-in slide-in-from-top-4 duration-300">
                                {/* 
                                    TODO: Replace with CSV data parsing logic once file is provided.
                                    Currently using dummy data to demonstrate green/orange split.
                                */}
                                <LineChart
                                    data={chartData}
                                    series={[
                                        { key: 'positive', label: 'Profit', color: '#4ade80', area: true, areaOpacity: 0.1 },
                                        { key: 'negative', label: 'Loss', color: '#fb923c', area: true, areaOpacity: 0.1 }
                                    ]}
                                    theme="midnight"
                                    responsive
                                    height={400}
                                    padding={20}
                                    curve="monotone"
                                    grid={{ horizontal: true, vertical: false, opacity: 0.1 }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

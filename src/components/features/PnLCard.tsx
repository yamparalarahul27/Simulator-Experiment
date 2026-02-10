import React, { useState, useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronDown } from 'lucide-react';
import { PnLChart } from './PnLChart';
import { MOCK_TRADES, calculateDailyPnL } from '../../lib/mockData';
import {
    filterTradesByDate,
    getPreviousPeriodTrades,
    calculateTotalPnL,
    calculatePercentChange,
    FilterType
} from '../../lib/tradeFilters';

export default function PnLCard() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const filters: FilterType[] = ['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'This Year'];
    const [isChartVisible, setIsChartVisible] = useState(false);

    // Calculate real PnL data based on filter
    const pnlData = useMemo(() => {
        const currentTrades = filterTradesByDate(MOCK_TRADES, activeFilter);
        const previousTrades = getPreviousPeriodTrades(MOCK_TRADES, activeFilter);

        const currentPnL = calculateTotalPnL(currentTrades);
        const previousPnL = calculateTotalPnL(previousTrades);
        const percentChange = calculatePercentChange(currentPnL, previousPnL);

        return {
            pnl: currentPnL,
            pnlFormatted: `${currentPnL >= 0 ? '+' : ''}$${Math.abs(currentPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percent: percentChange,
            isPositive: currentPnL >= 0
        };
    }, [activeFilter]);

    // Generate chart data from real trades
    const chartData = useMemo(() => {
        const currentTrades = filterTradesByDate(MOCK_TRADES, activeFilter);
        const dailyPnL = calculateDailyPnL(currentTrades);

        return dailyPnL.map(day => ({
            time: day.date,
            positive: day.pnl >= 0 ? day.pnl : null,
            negative: day.pnl < 0 ? day.pnl : null,
            value: day.pnl
        }));
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
                            <div className={`text-num-56 sm:text-num-72 tracking-normal ${pnlData.isPositive ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                {pnlData.pnlFormatted}
                            </div>
                        </div>

                        <div className={`
                            flex items-center gap-2 px-4 py-2 rounded-none border backdrop-blur-sm
                            ${pnlData.isPositive
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}
                        `}>
                            {pnlData.isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            <span className="font-mono font-bold text-lg">{pnlData.percent}</span>
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
                                <PnLChart data={chartData} height={400} />
                            </div>
                        )}
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

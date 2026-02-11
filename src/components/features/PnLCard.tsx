import React, { useState, useMemo } from 'react';
import { ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PnLChart } from './PnLChart';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { calculateDailyPnL, MOCK_TRADES } from '../../lib/mockData';
import { filterTradesByDate, FilterType } from '../../lib/tradeFilters';
import { calculateDrawdownSeries, calculateDrawdownStats } from '../../lib/drawdownCalculations';
import type { Trade } from '../../lib/types';

interface PnLCardProps {
    activeFilter?: FilterType;
    trades?: Trade[];
}

export default function PnLCard({ activeFilter = 'All', trades }: PnLCardProps) {
    const [isChartVisible, setIsChartVisible] = useState(false);
    const [showDrawdown, setShowDrawdown] = useState(false);

    const comparisonLabel = useMemo(() => {
        switch (activeFilter) {
            case 'Today':
                return 'vs Yesterday';
            case 'Yesterday':
                return 'vs previous day';
            case 'This Week':
                return 'vs previous week';
            case 'This Month':
                return 'vs previous month';
            case 'This Year':
                return 'vs previous year';
            default:
                return 'vs previous period';
        }
    }, [activeFilter]);

    // Calculate real PnL data based on filter
    const pnlData = useMemo(() => {
        const currentTrades = trades ?? filterTradesByDate(MOCK_TRADES, activeFilter);
        
        // Calculate total PnL from trades
        const currentPnL = currentTrades.reduce((sum, trade) => sum + trade.pnl, 0);

        return {
            pnl: currentPnL,
            pnlFormatted: `${currentPnL >= 0 ? '+' : ''}$${Math.abs(currentPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percent: '0.0%', // Placeholder since comparison logic is not implemented
            isPositive: currentPnL >= 0
        };
    }, [activeFilter, trades]);

    // Generate chart data from real trades
    const chartData = useMemo(() => {
        const currentTrades = trades ?? filterTradesByDate(MOCK_TRADES, activeFilter);
        const dailyPnL = calculateDailyPnL(currentTrades);

        return dailyPnL.map(day => ({
            time: day.date,
            positive: day.pnl >= 0 ? day.pnl : null,
            negative: day.pnl < 0 ? day.pnl : null,
            value: day.pnl
        }));
    }, [activeFilter, trades]);

    // Calculate drawdown data
    const drawdownData = useMemo(() => {
        const currentTrades = trades ?? filterTradesByDate(MOCK_TRADES, activeFilter);
        const dailyPnL = calculateDailyPnL(currentTrades);
        const { drawdowns } = calculateDrawdownSeries(dailyPnL);
        return drawdowns;
    }, [activeFilter, trades]);

    // Calculate drawdown stats
    const drawdownStats = useMemo(() => {
        const currentTrades = trades ?? filterTradesByDate(MOCK_TRADES, activeFilter);
        return calculateDrawdownStats(currentTrades);
    }, [activeFilter, trades]);

    return (
        <div className="w-full">
            <CardWithCornerShine padding="lg" minHeight="min-h-[400px]">
                <div className="flex flex-col h-full space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <img 
    src="/assets/PnL Analysis Icon.png" 
    alt="PnL Analysis" 
    className="w-10 h-10"
/>
                            <div>
                                <div className="flex items-center">
                                    <h2 className="text-xl font-bold text-white tracking-wide">PnL Analysis</h2>
                                    <InfoTooltip infoKey="pnlCard" />
                                </div>
                                <p className="text-sm text-white/40 font-mono">NET PROFIT & LOSS</p>
                            </div>
                        </div>
                        
                        {/* Drawdown Toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-white/60 text-sm">Show Drawdown on Chart</span>
                            <button
                                onClick={() => setShowDrawdown(!showDrawdown)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-none bg-black/10 border border-white/10 transition-colors duration-300 ${
                                    showDrawdown ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-none bg-white transition-transform duration-300 ${
                                        showDrawdown ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Main Metric Area */}
                    <div className="flex-1 flex flex-col justify-center py-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {/* Divider Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block" />
                            
                            {/* Total PnL */}
                            <div className="text-center space-y-2">
                                <span className="text-sm text-white/40 uppercase tracking-[0.2em]">Total PnL ({activeFilter})</span>
                                <div className={`text-num-56 sm:text-num-72 tracking-normal ${pnlData.isPositive ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                    {pnlData.pnlFormatted}
                                </div>
                                {activeFilter !== 'All' && (
                                    <div className={`
                                        flex items-center justify-center gap-2 px-4 py-2 rounded-none border backdrop-blur-sm
                                        ${pnlData.isPositive
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400'}
                                    `}>
                                        {pnlData.isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                        <span className="font-mono font-bold text-lg">{pnlData.percent}</span>
                                        <span className="text-white/40 text-sm ml-1">{comparisonLabel}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Max Drawdown */}
                            <div className="text-center space-y-2">
                                <span className="text-sm text-white/40 uppercase tracking-[0.2em]">Max Drawdown</span>
                                <div className="text-num-56 sm:text-num-72 text-red-400 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    -${Math.abs(drawdownStats.maxDrawdown).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-white/40 text-xs font-mono">
                                    ({drawdownStats.maxDrawdownPercentage.toFixed(1)}% peak-to-trough)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Accordion Section */}
                    <div className="w-full border-t border-white/10 pt-4">
                        <button
                            onClick={() => setIsChartVisible(!isChartVisible)}
                            className="w-full flex items-center justify-center gap-8 group cursor-pointer"
                        >
                            <span className="text-white font-mono text-sm tracking-widest uppercase">
                                Visualisation Chart
                            </span>
                            <div className={`
                                p-1.5 rounded-full bg-black border border-white/10 
                                group-hover:border-white/30 transition-all duration-300
                                ${isChartVisible ? 'rotate-180' : ''}
                            `}>
                                <ChevronDown className="w-4 h-4 text-white" />
                            </div>
                        </button>

                        {/* Drawdown Stats Table - Above Chart */}
                        {isChartVisible && showDrawdown && (
                            <div className="mt-4 p-4 bg-black/20 border border-white/10 rounded-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-red-400 text-num-32 font-mono">
                                            {drawdownStats.maxDrawdownPercentage.toFixed(1)}%
                                        </div>
                                        <div className="text-white/40 text-xs font-mono uppercase">Max DD</div>
                                    </div>
                                    <div>
                                        <div className="text-white/80 text-num-32 font-mono">
                                            {drawdownStats.avgRecoveryDays.toFixed(1)} days
                                        </div>
                                        <div className="text-white/40 text-xs font-mono uppercase">Avg Recovery</div>
                                    </div>
                                    <div>
                                        <div className="text-purple-400 text-num-32 font-mono">
                                            {drawdownStats.pnlToDrawdownRatio.toFixed(1)}x
                                        </div>
                                        <div className="text-white/40 text-xs font-mono uppercase">PnL/DD Ratio</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chart Container */}
                        {isChartVisible && (
                            <div className="mt-6">
                                <div className="h-[400px] w-full animate-in fade-in slide-in-from-top-4 duration-300">
                                    <PnLChart 
                                        data={chartData} 
                                        height={400} 
                                        showDrawdown={showDrawdown}
                                        drawdownData={drawdownData}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}


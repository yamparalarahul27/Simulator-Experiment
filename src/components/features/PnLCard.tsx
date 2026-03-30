import React, { useState, useMemo } from 'react';
import NumberFlow from '@number-flow/react';
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

/**
 * PnLCard Component
 * 
 * PURPOSE:
 * Displays a summary of Profit & Loss (PnL) for a set of trades.
 * Includes total PnL value, a percentage comparison (placeholder), and
 * toggleable visibility for the PnL equity chart and drawdown analysis.
 * 
 * FEATURES:
 * - Dynamic color coding (green for profit, red for loss)
 * - Integration with PnLChart for equity curve visualization
 * - Integration with Drawdown stats via Filter reactivity
 * - Fallback to MOCK_TRADES if real data is not provided
 * 
 * @param activeFilter - The current timeframe filter (e.g., 'Today', 'This Week')
 * @param trades - Optional array of real trade data to analyze
 */
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
                                    <h2 className="text-xl font-bold text-bs-text-primary tracking-wide">PnL Analysis</h2>
                                    <InfoTooltip infoKey="pnlCard" />
                                </div>
                                <p className="text-sm text-bs-text-mute font-mono">NET PROFIT & LOSS</p>
                            </div>
                        </div>

                        {/* Drawdown Toggle */}
                        <div className="flex items-center gap-3">
                            <span className="text-bs-text-tertiary text-sm">Show Drawdown on Chart</span>
                            <button
                                onClick={() => setShowDrawdown(!showDrawdown)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-lg bg-bs-bg/10 border border-bs-border transition-colors duration-300 ${showDrawdown ? 'bg-bs-brand-tertiary' : 'bg-bs-text-mute'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-lg bg-white transition-transform duration-300 ${showDrawdown ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Main Metric Area */}
                    <div className="flex-1 flex flex-col justify-center py-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {/* Divider Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-bs-card-fg hidden md:block" />

                            {/* Total PnL */}
                            <div className="text-center space-y-2">
                                <span className="text-sm text-bs-text-mute uppercase tracking-[0.2em]">Total PnL ({activeFilter})</span>
                                <div className={`text-num-56 sm:text-num-72 tracking-normal ${pnlData.isPositive ? 'text-bs-success' : 'text-bs-error'} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                    <NumberFlow value={Math.abs(pnlData.pnl)} prefix={pnlData.isPositive ? '+$' : '-$'} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 600, easing: 'ease-out' }} />
                                </div>
                                {activeFilter !== 'All' && (
                                    <div className="text-center">
                                        <span className="text-bs-text-mute text-sm font-mono">
                                            {pnlData.isPositive ? '+' : ''}{pnlData.percent} {comparisonLabel}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Max Drawdown */}
                            <div className="text-center space-y-2">
                                <span className="text-sm text-bs-text-mute uppercase tracking-[0.2em]">Max Drawdown</span>
                                <div className="text-num-56 sm:text-num-72 text-bs-error drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    <NumberFlow value={Math.abs(drawdownStats.maxDrawdown)} prefix="-$" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 600, easing: 'ease-out' }} />
                                </div>
                                <div className="text-bs-text-mute text-xs font-mono">
                                    ({drawdownStats.maxDrawdownPercentage.toFixed(1)}% peak-to-trough)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Accordion Section */}
                    <div className="w-full border-t border-bs-border pt-4">
                        <button
                            onClick={() => setIsChartVisible(!isChartVisible)}
                            className="w-full flex items-center justify-center gap-8 group cursor-pointer"
                        >
                            <span className="text-bs-text-primary font-mono text-sm tracking-widest uppercase">
                                Visualisation Chart
                            </span>
                            <div className={`
                                p-1.5 rounded-full bg-bs-bg border border-bs-border 
                                group-hover:border-white/30 transition-all duration-300
                                ${isChartVisible ? 'rotate-180' : ''}
                            `}>
                                <ChevronDown className="w-4 h-4 text-bs-text-primary" />
                            </div>
                        </button>

                        {/* Drawdown Stats Table - Above Chart */}
                        {isChartVisible && showDrawdown && (
                            <div className="mt-4 p-4 bg-bs-bg/20 border border-bs-border rounded-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-bs-error text-num-32 font-mono">
                                            <NumberFlow value={drawdownStats.maxDrawdownPercentage} suffix="%" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                                        </div>
                                        <div className="text-bs-text-mute text-xs font-mono uppercase">Max DD</div>
                                    </div>
                                    <div>
                                        <div className="text-bs-text-secondary text-num-32 font-mono">
                                            <NumberFlow value={drawdownStats.avgRecoveryDays} suffix=" days" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                                        </div>
                                        <div className="text-bs-text-mute text-xs font-mono uppercase">Avg Recovery</div>
                                    </div>
                                    <div>
                                        <div className="text-bs-brand text-num-32 font-mono">
                                            <NumberFlow value={drawdownStats.pnlToDrawdownRatio} suffix="x" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                                        </div>
                                        <div className="text-bs-text-mute text-xs font-mono uppercase">PnL/DD Ratio</div>
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


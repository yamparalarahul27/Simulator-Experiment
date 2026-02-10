import React, { useState, useMemo } from 'react';
import PnLCard from './PnLCard';
import StatsRow from './StatsRow';
import TableUI_Demo from './TableUI_Demo';
import FeeDistribution from './FeeDistribution';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import TopBar from './TopBar';
import InfoTooltip from '../ui/InfoTooltip';
import { MOCK_TRADES, calculateFeeBreakdown } from '../../lib/mockData';
import { calculateTradingVolume, formatCompactNumber, calculateLongShortRatio, filterTradesByDate, FilterType } from '../../lib/tradeFilters';

export default function Home() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('Today');

    // Filter trades based on active filter
    const filteredTrades = useMemo(() => {
        return filterTradesByDate(MOCK_TRADES, activeFilter);
    }, [activeFilter]);

    // Calculate real fee data from FILTERED trades
    const feeData = useMemo(() => {
        const feeBreakdown = calculateFeeBreakdown(filteredTrades);
        const cumulativeFees = filteredTrades.reduce((sum, t) => sum + t.fee, 0);

        return {
            cumulativeFees,
            feeComposition: feeBreakdown
        };
    }, [filteredTrades]);

    // Calculate trading volume from FILTERED trades
    const tradingVolume = useMemo(() => calculateTradingVolume(filteredTrades), [filteredTrades]);

    // Calculate long/short ratio from FILTERED trades
    const longShortRatio = useMemo(() => calculateLongShortRatio(filteredTrades), [filteredTrades]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold text-white">Home Analytics</h1>

                {/* Top Bar with Wallet & Time Filters */}
                <TopBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* PnL Card Section */}
                <PnLCard activeFilter={activeFilter} />

                {/* Stats Row Section */}
                <StatsRow activeFilter={activeFilter} />

                {/* Grid Row 1: Fee Distribution + Trading Volume + Long/Short Ratio */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fee Distribution - Column 1 */}
                    <div className="lg:col-span-1">
                        <FeeDistribution summary={feeData} />
                    </div>

                    {/* Trading Volume Card - Column 2 */}
                    <div className="lg:col-span-1">
                        <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
                                            Trading Volume
                                        </h3>
                                        <InfoTooltip infoKey="tradingVolume" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-num-48 text-white/95 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                                        {formatCompactNumber(tradingVolume)}
                                    </span>
                                </div>
                            </div>
                        </CardWithCornerShine>
                    </div>

                    {/* Long/Short Ratio Card - Column 3 */}
                    <div className="lg:col-span-1">
                        <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
                                            Long/Short Ratio
                                        </h3>
                                        <InfoTooltip infoKey="longShortRatio" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-num-48 text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                                            {longShortRatio.longPercent}%
                                        </span>
                                        <span className="text-white/60 text-sm font-mono">Long</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-num-48 text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">
                                            {longShortRatio.shortPercent}%
                                        </span>
                                        <span className="text-white/60 text-sm font-mono">Short</span>
                                    </div>
                                </div>
                            </div>
                        </CardWithCornerShine>
                    </div>
                </div>

                {/* Grid Row 2: Placeholders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={`placeholder-${i}`} className="lg:col-span-1">
                            <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
                                <div className="flex flex-col h-full justify-center items-center relative z-10 opacity-30">
                                    <span className="text-white/40 text-sm font-mono uppercase tracking-wider">
                                        Placeholder {i}
                                    </span>
                                </div>
                            </CardWithCornerShine>
                        </div>
                    ))}
                </div>

                {/* Table UI - Full Width Below Grids */}
                <TableUI_Demo activeFilter={activeFilter} />
            </div>
        </div>
    );
}


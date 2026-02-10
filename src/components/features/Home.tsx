import React, { useMemo } from 'react';
import PnLCard from './PnLCard';
import StatsRow from './StatsRow';
import TableUI_Demo from './TableUI_Demo';
import FeeDistribution from './FeeDistribution';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { MOCK_TRADES, calculateFeeBreakdown } from '../../lib/mockData';

export default function Home() {
    // Calculate real fee data from MOCK_TRADES
    const feeData = useMemo(() => {
        const feeBreakdown = calculateFeeBreakdown(MOCK_TRADES);
        const cumulativeFees = MOCK_TRADES.reduce((sum, t) => sum + t.fee, 0);

        return {
            cumulativeFees,
            feeComposition: feeBreakdown
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Home Analytics</h1>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* PnL Card Section */}
                <PnLCard />

                {/* Stats Row Section */}
                <StatsRow />

                {/* 3-Column Grid: Fee Distribution + 2 Placeholder Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fee Distribution - Column 1 */}
                    <div className="lg:col-span-1">
                        <FeeDistribution summary={feeData} />
                    </div>

                    {/* Placeholder Card 1 - Column 2 */}
                    <div className="lg:col-span-1">
                        <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
                            <div className="flex flex-col h-full justify-center items-center">
                                <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
                                    Placeholder Card 1
                                </h3>
                                <p className="text-white/20 text-xs mt-2">
                                    Content coming soon
                                </p>
                            </div>
                        </CardWithCornerShine>
                    </div>

                    {/* Placeholder Card 2 - Column 3 */}
                    <div className="lg:col-span-1">
                        <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
                            <div className="flex flex-col h-full justify-center items-center">
                                <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
                                    Placeholder Card 2
                                </h3>
                                <p className="text-white/20 text-xs mt-2">
                                    Content coming soon
                                </p>
                            </div>
                        </CardWithCornerShine>
                    </div>
                </div>

                {/* Table UI - Full Width Below Grid */}
                <TableUI_Demo />
            </div>
        </div>
    );
}

import React from 'react';
import PnLCard from './PnLCard';
import StatsRow from './StatsRow';
import TableUI_Demo from './TableUI_Demo';
import FeeDistribution from './FeeDistribution';

export default function Home() {
    // Mock fee data
    const mockFeeData = {
        cumulativeFees: 1247.85,
        feeComposition: [
            { type: 'Trading Fees', amount: 856.20, percent: 68.6 },
            { type: 'Gas Fees', amount: 312.45, percent: 25.0 },
            { type: 'Protocol Fees', amount: 79.20, percent: 6.4 },
        ],
    };

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

                {/* Fee Distribution and Table Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fee Distribution - Takes 1 column */}
                    <div className="lg:col-span-1">
                        <FeeDistribution summary={mockFeeData} />
                    </div>

                    {/* Table UI - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <TableUI_Demo />
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import PnLCard from './PnLCard';
import StatsRow from './StatsRow';

export default function Dashboard() {
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
            </div>
        </div>
    );
}

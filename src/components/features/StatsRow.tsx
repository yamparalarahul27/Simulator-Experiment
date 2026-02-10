'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import Image from 'next/image';
import { MOCK_TRADES } from '../../lib/mockData';
import { calculateWinRate, calculateTradeStreak, calculateAvgWin, filterTradesByDate, FilterType } from '../../lib/tradeFilters';
import InfoTooltip from '../ui/InfoTooltip';

interface StatsRowProps {
    activeFilter?: FilterType;
}

export default function StatsRow({ activeFilter = 'All' }: StatsRowProps) {
    // Calculate real stats from MOCK_TRADES
    const stats = useMemo(() => {
        const filteredTrades = filterTradesByDate(MOCK_TRADES, activeFilter);
        const { winRate, wins, losses } = calculateWinRate(filteredTrades);
        const avgWin = calculateAvgWin(filteredTrades);

        // Streak is usually calculated on daily basis over a period. 
        // If "Today" or "Yesterday" is selected, streak might just be that day's activity or still the last 7 days.
        // For now, let's keep streak as "Last 7 days" relative to now, regardless of filter, 
        // OR we could filter it. But streaks usually imply a time series. 
        // Let's keep streak global for now (Last 7 Days) as implied by the UI "5/7 days".
        const streak = calculateTradeStreak(MOCK_TRADES);
        const activeDays = streak.filter(Boolean).length;

        return { winRate, wins, losses, avgWin, streak, activeDays };
    }, [activeFilter]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Win Rate */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Win Rate</h3>
                            <InfoTooltip infoKey="winRate" />
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <span className="text-num-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {stats.winRate}%
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                                {stats.wins}W / {stats.losses}L
                            </span>
                        </div>
                    </div>
                </div>
            </CardWithCornerShine>

            {/* Card 2: Avg Win */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">AVG WIN</h3>
                            <InfoTooltip infoKey="avgWin" />
                        </div>
                    </div>
                    <div>
                        <span className="text-num-48 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-green-400">
                            +${Math.abs(stats.avgWin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </CardWithCornerShine>

            {/* Card 3: Trade Streak */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Trade Streak</h3>
                            <InfoTooltip infoKey="tradeStreak" />
                        </div>
                        <p className="text-white/60 text-xs mt-1">
                            Keep it up, you are active {stats.activeDays} days in this week
                        </p>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {stats.streak.map((isActive, index) => (
                            <div key={index} className="relative w-10 h-10 flex-shrink-0">
                                <Image
                                    src={isActive ? '/assets/fire-active.gif' : '/assets/fire-inactive.png'}
                                    alt={isActive ? 'Active Streak' : 'Inactive Streak'}
                                    fill
                                    className="object-contain"
                                    unoptimized // For GIF support
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

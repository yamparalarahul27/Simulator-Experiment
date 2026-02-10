'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import Image from 'next/image';
import { MOCK_TRADES } from '../../lib/mockData';
import { calculateWinRate, calculateAvgWin, calculateTradeStreak } from '../../lib/tradeFilters';

export default function StatsRow() {
    // Calculate real stats from MOCK_TRADES
    const stats = useMemo(() => {
        const { winRate, wins, losses } = calculateWinRate(MOCK_TRADES);
        const avgWin = calculateAvgWin(MOCK_TRADES);
        const streak = calculateTradeStreak(MOCK_TRADES);
        const activeDays = streak.filter(Boolean).length;

        return { winRate, wins, losses, avgWin, streak, activeDays };
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Win Rate */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Win Rate</h3>
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

            {/* Card 2: Avg WIN */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Avg WIN</h3>
                    </div>
                    <div>
                        <span className="text-num-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            ${stats.avgWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </CardWithCornerShine>

            {/* Card 3: Trade Streak */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Trade Streak</h3>
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

'use client';

import React, { useMemo } from 'react';
import NumberFlow from '@number-flow/react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { MOCK_TRADES } from '../../lib/mockData';
import { calculateWinRate, calculateAvgWin, calculateAvgLoss, filterTradesByDate, FilterType } from '../../lib/tradeFilters';
import InfoTooltip from '../ui/InfoTooltip';
import type { Trade } from '../../lib/types';

interface StatsRowProps {
    activeFilter?: FilterType;
    trades?: Trade[];
}

export default function StatsRow({ activeFilter = 'All', trades }: StatsRowProps) {
    // Calculate real stats from MOCK_TRADES
    const stats = useMemo(() => {
        const filteredTrades = trades ?? filterTradesByDate(MOCK_TRADES, activeFilter);
        const { winRate, wins, losses } = calculateWinRate(filteredTrades);
        const avgWin = calculateAvgWin(filteredTrades);
        const avgLoss = calculateAvgLoss(filteredTrades);

        return { winRate, wins, losses, avgWin, avgLoss };
    }, [activeFilter, trades]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Win Rate */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-[var(--bs-text-mute)] text-sm font-mono uppercase tracking-wider">Win Rate</h3>
                            <InfoTooltip infoKey="winRate" />
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <span className="text-num-48 text-[var(--bs-text-primary)] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            <NumberFlow value={parseFloat(stats.winRate)} suffix="%" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-[var(--bs-card-fg)] text-[var(--bs-text-tertiary)] text-xs font-mono rounded-sm">
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
                            <h3 className="text-[var(--bs-text-mute)] text-sm font-mono uppercase tracking-wider">AVG WIN</h3>
                            <InfoTooltip infoKey="avgWin" />
                        </div>
                    </div>
                    <div>
                        <span className="text-num-48 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-[var(--bs-success)]">
                            <NumberFlow value={Math.abs(stats.avgWin)} prefix="+$" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                        </span>
                    </div>
                </div>
            </CardWithCornerShine>

            {/* Card 3: AVG LOSS */}
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
                <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                        <div className="flex items-center">
                            <h3 className="text-[var(--bs-text-mute)] text-sm font-mono uppercase tracking-wider">AVG LOSS</h3>
                            <InfoTooltip infoKey="avgLoss" />
                        </div>
                    </div>
                    <div>
                        <span className="text-num-48 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-[var(--bs-error)]">
                            <NumberFlow value={Math.abs(stats.avgLoss)} prefix={stats.avgLoss === 0 ? '$' : '-$'} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                        </span>
                    </div>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

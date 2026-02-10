'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { MOCK_TRADES } from '../../lib/mockData';
import { calculateTradeStreak } from '../../lib/tradeFilters';

export default function TradeStreakCard() {
  const stats = useMemo(() => {
    const streak = calculateTradeStreak(MOCK_TRADES);
    const activeDays = streak.filter(Boolean).length;
    return { streak, activeDays };
  }, []);

  return (
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
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </CardWithCornerShine>
  );
}

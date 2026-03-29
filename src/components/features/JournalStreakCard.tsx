import React, { useMemo } from 'react';
import NumberFlow from '@number-flow/react';
import Image from 'next/image';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { calculateJournalStreak } from '../../lib/tradeFilters';
import { Trade } from '../../lib/types';

interface JournalStreakCardProps {
  trades: Trade[];
  annotations: Record<string, any>;
}

export default function JournalStreakCard({ trades, annotations }: JournalStreakCardProps) {
  const stats = useMemo(() => {
    const streak = calculateJournalStreak(trades, annotations);
    const activeDays = streak.filter(Boolean).length;
    return { streak, activeDays };
  }, [trades, annotations]);

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-[var(--bs-text-mute)] text-sm font-mono uppercase tracking-wider">Journal Streak</h3>
              <InfoTooltip infoKey="tradeStreak" />
            </div>
            <span className="text-[var(--bs-brand)] text-[10px] font-mono border border-[var(--bs-brand-tertiary)]/20 px-2 py-0.5 bg-[var(--bs-brand-tertiary)]/5">
              <NumberFlow value={stats.activeDays} transformTiming={{ duration: 400, easing: 'ease-out' }} />/21 DAYS
            </span>
          </div>
          <p className="text-[var(--bs-text-tertiary)] text-xs mt-1">
            Journal for 21 days and It will become a Habit.
          </p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide mt-4">
          {stats.streak.map((isActive, index) => (
            <div key={index} className="relative w-7 h-7 flex-shrink-0">
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

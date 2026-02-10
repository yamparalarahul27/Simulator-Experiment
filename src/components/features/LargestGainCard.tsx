'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { Trade } from '../../lib/types';
import { formatTimestamp } from '../../lib/utils';

interface LargestGainCardProps {
  trades: Trade[];
}

export default function LargestGainCard({ trades }: LargestGainCardProps) {
  const bestTrade = useMemo(() => {
    const winners = trades.filter((t) => t.pnl > 0);
    if (winners.length === 0) return null;
    return winners.reduce((best, t) => (t.pnl > best.pnl ? t : best), winners[0]);
  }, [trades]);

  const pnl = bestTrade?.pnl ?? 0;
  const pnlFormatted = `+$${Math.abs(pnl).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
              Largest Gain
            </h3>
            <InfoTooltip infoKey="largestGain" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-num-48 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.25)]">
              {pnlFormatted}
            </span>
          </div>

          {bestTrade ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60 text-sm font-mono">
                <span className="text-white/80">{bestTrade.symbol}</span>
                <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                  {bestTrade.side.toUpperCase()}
                </span>
              </div>
              <div className="text-white/40 text-xs font-mono">
                Closed: {formatTimestamp(bestTrade.closedAt.getTime())}
              </div>
            </div>
          ) : (
            <div className="text-white/40 text-xs font-mono">
              No winning trades in this period
            </div>
          )}
        </div>
      </div>
    </CardWithCornerShine>
  );
}

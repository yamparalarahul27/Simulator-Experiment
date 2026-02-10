'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { Trade } from '../../lib/types';
import { formatTimestamp } from '../../lib/utils';

interface LargestLossCardProps {
  trades: Trade[];
}

export default function LargestLossCard({ trades }: LargestLossCardProps) {
  const worstTrade = useMemo(() => {
    const losers = trades.filter((t) => t.pnl < 0);
    if (losers.length === 0) return null;
    return losers.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), losers[0]);
  }, [trades]);

  const pnl = worstTrade?.pnl ?? 0;
  const pnlFormatted = `-$${Math.abs(pnl).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
              Largest Loss
            </h3>
            <InfoTooltip infoKey="largestLoss" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-num-48 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.25)]">
              {pnlFormatted}
            </span>
          </div>

          {worstTrade ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/60 text-sm font-mono">
                <span className="text-white/80">{worstTrade.symbol}</span>
                <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                  {worstTrade.side.toUpperCase()}
                </span>
              </div>
              <div className="text-white/40 text-xs font-mono">
                Closed: {formatTimestamp(worstTrade.closedAt.getTime())}
              </div>
            </div>
          ) : (
            <div className="text-white/40 text-xs font-mono">
              No losing trades in this period
            </div>
          )}
        </div>
      </div>
    </CardWithCornerShine>
  );
}

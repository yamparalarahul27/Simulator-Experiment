'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import type { Trade } from '../../lib/types';

interface DrawdownCardProps {
  trades: Trade[];
}

function calculateMaxDrawdown(trades: Trade[]): number {
  if (trades.length < 2) return 0;

  const sorted = [...trades].sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime());

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const t of sorted) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return maxDrawdown;
}

export default function DrawdownCard({ trades }: DrawdownCardProps) {
  const maxDrawdown = useMemo(() => calculateMaxDrawdown(trades), [trades]);

  const formatted = `$${maxDrawdown.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Drawdown</h3>
            <InfoTooltip infoKey="drawdown" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-num-48 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.25)]">
              {formatted}
            </span>
          </div>
          <div className="text-white/40 text-xs font-mono">Max peak-to-trough loss</div>
        </div>
      </div>
    </CardWithCornerShine>
  );
}

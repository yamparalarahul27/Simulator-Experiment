'use client';

import React, { useMemo } from 'react';
import NumberFlow from '@number-flow/react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import type { Trade } from '../../lib/types';

interface OrderTypeRatioCardProps {
  trades: Trade[];
}

export default function OrderTypeRatioCard({ trades }: OrderTypeRatioCardProps) {
  const ratio = useMemo(() => {
    const limitCount = trades.filter((t) => t.orderType === 'limit').length;
    const marketCount = trades.filter((t) => t.orderType === 'market').length;
    const total = limitCount + marketCount;

    if (total === 0) {
      return {
        limitCount,
        marketCount,
        limitPercent: 0,
        marketPercent: 0,
      };
    }

    const limitPercent = Math.round((limitCount / total) * 100);
    const marketPercent = 100 - limitPercent;

    return {
      limitCount,
      marketCount,
      limitPercent,
      marketPercent,
    };
  }, [trades]);

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-bs-text-mute text-sm font-mono uppercase tracking-wider">Order Type Ratio</h3>
            <InfoTooltip infoKey="orderTypeRatio" />
          </div>
        </div>
        <div className="mt-4"/>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-num-48 text-bs-success drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
              <NumberFlow value={ratio.limitPercent} suffix="%" transformTiming={{ duration: 500, easing: 'ease-out' }} />
            </span>
            <span className="text-bs-text-tertiary text-sm font-mono">Limit</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-num-48 text-bs-error drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">
              <NumberFlow value={ratio.marketPercent} suffix="%" transformTiming={{ duration: 500, easing: 'ease-out' }} />
            </span>
            <span className="text-bs-text-tertiary text-sm font-mono">Market</span>
          </div>

          <div>
            <span className="px-1.5 py-0.5 bg-bs-card-fg text-bs-text-tertiary text-xs font-mono rounded-sm">
              {ratio.limitCount} Limit / {ratio.marketCount} Market
            </span>
          </div>
        </div>
      </div>
    </CardWithCornerShine>
  );
}

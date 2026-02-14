'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import { Trade } from '../../lib/types';
import { formatTimestamp } from '../../lib/utils';

interface LargestTradesCardProps {
  trades: Trade[];
}

interface TradeDisplay {
  trade: Trade;
  pnl: number;
  pnlFormatted: string;
  type: 'gain' | 'loss';
}

const AssetIcon = ({ trade }: { trade: Trade }) => {
  const iconFolder = trade.isMaker === false ? 'perp' : 'spot';
  const normalizedSymbol = trade.symbol
    .toLowerCase()
    .replace(/-usdc$/i, '')
    .replace(/-perp$/i, '')
    .replace(/--+/g, '-');
  const suffix = iconFolder === 'perp' ? 'perp' : 'usdc';
  const iconPath = `/assets/tokens/${iconFolder}/${normalizedSymbol}-${suffix}.png`;

  return (
    <>
      <img
        src={iconPath}
        alt={trade.symbol}
        className="w-[26px] h-[26px] mr-2"
        onError={(e) => {
          console.log('Icon failed to load:', iconPath);
          // Hide broken image and show fallback
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
        onLoad={() => {
          console.log('Icon loaded successfully:', iconPath);
        }}
      />
      <span className="w-[26px] h-[26px] mr-2 hidden items-center justify-center bg-black text-white text-xs font-mono rounded-none">
        {trade.symbol.slice(0, 3)}
      </span>
    </>
  );
};

export default function LargestTradesCard({ trades }: LargestTradesCardProps) {
  const { bestTrade, worstTrade } = useMemo(() => {
    const winners = trades.filter((t) => t.pnl > 0);
    const losers = trades.filter((t) => t.pnl < 0);

    const bestTrade = winners.length > 0
      ? winners.reduce((best, t) => (t.pnl > best.pnl ? t : best), winners[0])
      : null;

    const worstTrade = losers.length > 0
      ? losers.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), losers[0])
      : null;

    return { bestTrade, worstTrade };
  }, [trades]);

  const bestPnlFormatted = bestTrade
    ? `+$${Math.abs(bestTrade.pnl).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
    : '+$0.00';

  const worstPnlFormatted = worstTrade
    ? `-$${Math.abs(worstTrade.pnl).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
    : '-$0.00';

  return (
    <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
              Largest Trades
            </h3>
            <InfoTooltip infoKey="largestTrades" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          {/* Best Trade */}
          <div className="text-center space-y-2">
            <div className="text-green-400 text-num-32 font-mono drop-shadow-[0_0_10px_rgba(34,197,94,0.25)]">
              {bestPnlFormatted}
            </div>

            {bestTrade ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-white/60 text-sm font-mono">
                  <AssetIcon trade={bestTrade} />
                  <span className="text-white/80">{bestTrade.symbol}</span>
                  <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                    {bestTrade.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-white/40 text-xs font-mono" suppressHydrationWarning>
                  Closed: {formatTimestamp(bestTrade.closedAt.getTime())}
                </div>
              </div>
            ) : (
              <div className="text-white/40 text-xs font-mono">
                No winning trades in this period
              </div>
            )}
          </div>

          {/* Worst Trade */}
          <div className="text-center space-y-2">
            <div className="text-num-32 font-mono text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.25)]">
              {worstPnlFormatted}
            </div>

            {worstTrade ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-white/60 text-sm font-mono">
                  <AssetIcon trade={worstTrade} />
                  <span className="text-white/80">{worstTrade.symbol}</span>
                  <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                    {worstTrade.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-white/40 text-xs font-mono" suppressHydrationWarning>
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
      </div>
    </CardWithCornerShine>
  );
}

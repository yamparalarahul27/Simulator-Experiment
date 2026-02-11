import React, { useState, useMemo } from 'react';
import PnLCard from './PnLCard';
import TableUI_Demo from './TableUI_Demo';
import FeeDistribution from './FeeDistribution';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import TopBar from './TopBar';
import InfoTooltip from '../ui/InfoTooltip';
import LargestTradesCard from './LargestTradesCard';
import DrawdownCard from './DrawdownCard';
import OrderTypeRatioCard from './OrderTypeRatioCard';
import AverageTradeDurationCard from './AverageTradeDurationCard';
import TimeBasedPerformanceCard from './TimeBasedPerformanceCard';
import { MOCK_TRADES, calculateFeeBreakdown } from '../../lib/mockData';
import {
  calculateTradingVolume,
  formatCompactNumber,
  calculateLongShortRatio,
  calculateWinRate,
  calculateAvgWin,
  calculateAvgLoss,
  filterTradesByDate,
  FilterType,
} from '../../lib/tradeFilters';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

/**
 * Main dashboard component displaying comprehensive trading analytics
 * 
 * @returns Dashboard layout with analytics cards, charts, and transaction table
 */
export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [activeWallet, setActiveWallet] = useState<1 | 2 | 3>(1);
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });
  const [draftSelectedPairs, setDraftSelectedPairs] = useState<string[]>([]);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });
  const [appliedSelectedPairs, setAppliedSelectedPairs] = useState<string[]>([]);

  const availablePairs = useMemo(() => {
    const symbols = new Set<string>();
    for (const t of MOCK_TRADES) symbols.add(t.symbol);
    return Array.from(symbols).sort((a, b) => a.localeCompare(b));
  }, []);

  const handleApplyFilters = () => {
    setAppliedDateRange(draftDateRange);
    setAppliedSelectedPairs(draftSelectedPairs);
    setActiveFilter('All');
  };

  // Filter trades based on active filter
  const filteredTrades = useMemo(() => {
    let trades = filterTradesByDate(MOCK_TRADES, activeFilter);

    if (appliedDateRange?.from) {
      const from = startOfDay(appliedDateRange.from);
      trades = trades.filter((t) => t.closedAt >= from);
    }
    if (appliedDateRange?.to) {
      const to = endOfDay(appliedDateRange.to);
      trades = trades.filter((t) => t.closedAt <= to);
    }

    if (appliedSelectedPairs.length > 0) {
      trades = trades.filter((t) => appliedSelectedPairs.includes(t.symbol));
    }

    return trades;
  }, [activeFilter, appliedDateRange, appliedSelectedPairs]);

  // Calculate real fee data from FILTERED trades
  const feeData = useMemo(() => {
    const feeBreakdown = calculateFeeBreakdown(filteredTrades);
    const cumulativeFees = filteredTrades.reduce((sum, t) => sum + t.fee, 0);

    return {
      cumulativeFees,
      feeComposition: feeBreakdown,
    };
  }, [filteredTrades]);

  // Calculate trading volume from FILTERED trades
  const tradingVolume = useMemo(() => calculateTradingVolume(filteredTrades), [filteredTrades]);

  // Calculate long/short ratio from FILTERED trades
  const longShortRatio = useMemo(() => calculateLongShortRatio(filteredTrades), [filteredTrades]);

  const winStats = useMemo(() => calculateWinRate(filteredTrades), [filteredTrades]);
  const avgWin = useMemo(() => calculateAvgWin(filteredTrades), [filteredTrades]);
  const avgLoss = useMemo(() => calculateAvgLoss(filteredTrades), [filteredTrades]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <h1 className="text-3xl font-bold text-white">Home Analytics</h1>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <InfoTooltip infoKey="walletSelector" />
              <span className="text-white/60 text-sm font-mono ml-2 mr-2">Wallet:</span>
            </div>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setActiveWallet(num as 1 | 2 | 3)}
                className={`px-4 py-2 rounded-none text-sm font-mono transition-all duration-200 border-b-2 ${
                  activeWallet === num
                    ? 'bg-purple-500/20 border-purple-500 text-white/100'
                    : 'bg-white/5 border-x border-t border-white/10 border-b-transparent text-white/60 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <TopBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          dateRange={draftDateRange}
          onDateRangeChange={setDraftDateRange}
          availablePairs={availablePairs}
          selectedPairs={draftSelectedPairs}
          onSelectedPairsChange={setDraftSelectedPairs}
          onApply={handleApplyFilters}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="flex items-center justify-center">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-wider">Portfolio Overview</h2>
        </div>
        <div className="w-full">
          <PnLCard activeFilter={activeFilter} trades={filteredTrades} />
          {/* <DrawdownCard trades={filteredTrades} minHeight="min-h-[400px]" /> */}
        </div>

        <div className="flex items-center justify-center">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-wider">Performance &amp; Time In Market</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex items-center">
                  <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Win Rate</h3>
                  <InfoTooltip infoKey="winRate" />
                </div>
              </div>
              <div className="flex flex-col items-start gap-2">
                <span className="text-num-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  {winStats.winRate}%
                </span>
                <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm">
                  {winStats.wins}W / {winStats.losses}L
                </span>
              </div>
            </div>
          </CardWithCornerShine>

          <AverageTradeDurationCard trades={filteredTrades} minHeight="min-h-[200px]" />

          <LargestTradesCard trades={filteredTrades} />
        </div>

        <TimeBasedPerformanceCard
          trades={filteredTrades}
          minHeight="min-h-[600px]"
          chartHeightClass="h-[480px]"
        />

        <div className="flex items-center justify-center">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-wider">Trading Behavior &amp; Risk</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderTypeRatioCard trades={filteredTrades} />

          <CardWithCornerShine padding="lg" minHeight="min-h-[300px]">
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex items-center">
                  <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Long/Short Ratio</h3>
                  <InfoTooltip infoKey="longShortRatio" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-num-48 text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                    {longShortRatio.longPercent}%
                  </span>
                  <span className="text-white/60 text-sm font-mono">Long</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-num-48 text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">
                    {longShortRatio.shortPercent}%
                  </span>
                  <span className="text-white/60 text-sm font-mono">Short</span>
                </div>
              </div>
            </div>
          </CardWithCornerShine>
        </div>

        <div className="flex items-center justify-center">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-wider">Finances</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Trading Volume</h3>
                    <InfoTooltip infoKey="tradingVolume" />
                  </div>
                </div>
                <div>
                  <span className="text-num-48 text-white/95 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                    {formatCompactNumber(tradingVolume)}
                  </span>
                </div>
              </div>
            </CardWithCornerShine>

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
                    +${Math.abs(avgWin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardWithCornerShine>

            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">AVG LOSS</h3>
                    <InfoTooltip infoKey="avgLoss" />
                  </div>
                </div>
                <div>
                  <span className="text-num-48 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-red-400">
                    {avgLoss === 0
                      ? '$0.00'
                      : `-$${Math.abs(avgLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            </CardWithCornerShine>
          </div>

          <FeeDistribution summary={feeData} />
        </div>

        <TableUI_Demo activeFilter={activeFilter} trades={filteredTrades} />
      </div>
    </div>
  );
}

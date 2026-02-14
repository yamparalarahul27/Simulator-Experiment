import React, { useState, useMemo, useEffect } from 'react';
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
import MockDataBanner from '../ui/MockDataBanner';
import { MOCK_TRADES, calculateFeeBreakdown } from '../../lib/mockData';
import { SupabaseTradeService } from '../../services/SupabaseTradeService';
import { SupabaseWalletService } from '../../services/SupabaseWalletService';
import { Trade } from '../../lib/types';
import { toast } from 'sonner';
import SyncStatus from '../ui/SyncStatus';
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
import { addDays, startOfDay, endOfDay, format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { loadAnnotations } from '../../lib/annotationStorage';

/**
 * Main dashboard component displaying comprehensive trading analytics
 * 
 * @returns Dashboard layout with analytics cards, charts, and transaction table
 */

interface HomeProps {
  network?: 'devnet' | 'mainnet' | 'mock';
  analyzingWallet?: string | null;
  onNavigateToLookup?: () => void;
}

export default function Home({ network = 'mock', analyzingWallet, onNavigateToLookup }: HomeProps = {}) {
  const [activeFilter, setActiveFilter] = useState<FilterType | undefined>('All');
  const [lastIngestionAt, setLastIngestionAt] = useState<string | null>(null);
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(undefined);
  const [draftSelectedPairs, setDraftSelectedPairs] = useState<string[]>([]);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedSelectedPairs, setAppliedSelectedPairs] = useState<string[]>([]);

  // Real data state
  const [realTrades, setRealTrades] = useState<Trade[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which trades to display
  const displayTrades = useMemo(() => {
    return network === 'devnet' ? realTrades : MOCK_TRADES;
  }, [network, realTrades]);

  // Fetch real trades when in devnet mode
  useEffect(() => {
    async function fetchRealTrades() {
      if (network === 'devnet' && analyzingWallet) {
        setLoading(true);
        setError(null);
        try {
          const service = new SupabaseTradeService();
          const annotationService = new (await import('../../services/SupabaseAnnotationService')).SupabaseAnnotationService();

          const [trades, dbAnnotations] = await Promise.all([
            service.getTrades(analyzingWallet),
            annotationService.getAnnotationsForWallet(analyzingWallet)
          ]);

          setRealTrades(trades);
          setAnnotations(dbAnnotations);

          if (trades.length === 0) {
            toast.info('No trades found for this wallet on Devnet');
          }
        } catch (err) {
          console.error('Failed to load trades:', err);
          setError('Failed to load trades from database');
          toast.error('Failed to load trades');
        } finally {
          setLoading(false);
        }
      } else if (network === 'devnet' && !analyzingWallet) {
        // Devnet selected but no wallet -> Prompt user
        setRealTrades([]);
        setAnnotations({});
      } else {
        // Mock mode - Load from localStorage
        const localAnnotations = loadAnnotations();
        const mappedAnnotations: Record<string, any> = {};
        Object.keys(localAnnotations).forEach(id => {
          const local = localAnnotations[id];
          mappedAnnotations[id] = {
            tradeId: id,
            notes: local.note,
            tags: [],
            lessonsLearned: ''
          };
        });
        setAnnotations(mappedAnnotations);
      }
    }

    fetchRealTrades();
  }, [network, analyzingWallet]);

  useEffect(() => {
    if (network !== 'devnet' || !analyzingWallet) {
      setLastIngestionAt(null);
      setIngestionLoading(false);
      setIngestionError(null);
      return;
    }

    let mounted = true;
    const walletService = new SupabaseWalletService();

    setIngestionLoading(true);
    setIngestionError(null);
    walletService
      .getWallet(analyzingWallet)
      .then((wallet) => {
        if (!mounted) return;
        setLastIngestionAt(wallet?.last_synced_at ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setIngestionError('Failed to load ingestion time');
        setLastIngestionAt(null);
      })
      .finally(() => {
        if (mounted) {
          setIngestionLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [network, analyzingWallet]);

  const availablePairs = useMemo(() => {
    const symbols = new Set<string>();
    for (const t of displayTrades) symbols.add(t.symbol);
    return Array.from(symbols).sort((a, b) => a.localeCompare(b));
  }, [displayTrades]);

  const handleApplyFilters = () => {
    setAppliedDateRange(draftDateRange);
    setAppliedSelectedPairs(draftSelectedPairs);
    setActiveFilter(undefined); // No filter active when date range is applied
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    // Clear applied date range when any filter is selected (including 'All')
    setAppliedDateRange(undefined);
  };

  const getTimelineText = (filter: FilterType | undefined): string | null => {
    if (!filter) return null;

    const now = new Date();

    switch (filter) {
      case 'All':
        return 'Analytics Since Beginning of Trade Activity';

      case 'Today':
        return format(now, "do MMM yyyy 'Analytics'");

      case 'Yesterday':
        return format(subDays(now, 1), "do MMM yyyy 'Analytics'");

      case 'This Week':
        return format(subDays(now, 7), "do MMM") + ' to ' + format(now, "do MMM yyyy 'Analytics'");

      case 'This Month':
        return format(subDays(now, 30), "do MMM") + ' to ' + format(now, "do MMM yyyy 'Analytics'");

      case 'This Year':
        return format(subDays(now, 365), "do MMM yyyy") + ' to ' + format(now, "do MMM yyyy 'Analytics'");

      default:
        return null;
    }
  };

  const timelineText = getTimelineText(activeFilter);

  // Filter trades based on active filter
  const filteredTrades = useMemo(() => {
    let trades;

    if (activeFilter && activeFilter !== 'All') {
      // Use quick filter, ignore date range completely
      trades = filterTradesByDate(displayTrades, activeFilter);
    } else {
      // Use date range if applied, otherwise show all trades
      trades = displayTrades;
      if (appliedDateRange?.from) {
        const from = startOfDay(appliedDateRange.from);
        trades = trades.filter((t) => t.closedAt >= from);
      }
      if (appliedDateRange?.to) {
        const to = endOfDay(appliedDateRange.to);
        trades = trades.filter((t) => t.closedAt <= to);
      }
    }

    if (appliedSelectedPairs.length > 0) {
      trades = trades.filter((t) => appliedSelectedPairs.includes(t.symbol));
    }

    return trades;
  }, [activeFilter, appliedDateRange, appliedSelectedPairs, displayTrades]);

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

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-white/60">Loading your trading analytics...</p>
      </div>
    );
  }

  // Empty state for Devnet with no wallet or no trades
  if (network === 'devnet' && (!analyzingWallet || realTrades.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div>
          <img
            src="/assets/graphic_no_trade_data.png"
            alt="No trade data"
            className="w-64"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Add or Connect Wallet to view your trades Analytics</h2>
          <p className="text-white/60 max-w-md mx-auto">
            {analyzingWallet
              ? "We couldn't find any saved trades for your wallet in our database."
              : "It seems you haven't selected a wallet to analyze yet."}
          </p>
        </div>
        <button
          onClick={onNavigateToLookup}
          className="px-6 py-3 bg-purple-600/50 hover:bg-purple-700 text-white font-medium rounded-none transition-colors"
        >
          Add Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Home Analytics</h1>
            {timelineText && (
              <p className="text-white/60 text-sm font-mono mt-1">{timelineText}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SyncStatus
              lastSyncedAt={lastIngestionAt}
              dataSource={network === 'devnet' ? 'fresh' : 'mock'}
              isLoading={ingestionLoading}
              error={ingestionError}
              context="home"
              hasWallet={!!analyzingWallet}
            />
          </div>
        </div>

        <TopBar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          dateRange={draftDateRange}
          onDateRangeChange={setDraftDateRange}
          availablePairs={availablePairs}
          selectedPairs={draftSelectedPairs}
          onSelectedPairsChange={setDraftSelectedPairs}
          onApply={handleApplyFilters}
        />
        {network === 'mock' && (
          <MockDataBanner onFetchTrades={onNavigateToLookup} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="flex items-center justify-center">
          <h2 className="text-white/60 text-sm font-mono uppercase tracking-wider">Portfolio Overview</h2>
        </div>
        <div className="w-full space-y-6">
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
                <span className="mt-2 text-num-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
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
              <div className="mt-4" />
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
          <div className="space-y-4">
            <CardWithCornerShine padding="lg" minHeight="min-h-[160px]">
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Trading Volume</h3>
                    <InfoTooltip infoKey="tradingVolume" />
                  </div>
                </div>
                <div className="mt-4" />
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
                <div className="mt-4" />
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
                <div className="mt-4" />
                <div
                >
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

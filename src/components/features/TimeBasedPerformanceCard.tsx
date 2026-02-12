'use client';

import React, { useMemo, useState } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import type { Trade } from '../../lib/types';
import { calculateSessionPerformance, calculateTimeOfDayPerformance } from '../../lib/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type ViewMode = 'session' | 'hourly';

interface TimeBasedPerformanceCardProps {
  trades: Trade[];
  minHeight?: string;
  chartHeightClass?: string;
}

function formatPnL(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const SessionLabel: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

export default function TimeBasedPerformanceCard({
  trades,
  minHeight = 'min-h-[300px]',
  chartHeightClass = 'h-[200px]',
}: TimeBasedPerformanceCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('session');

  const chartData = useMemo(() => {
    if (viewMode === 'session') {
      const order: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'afternoon', 'evening', 'night'];
      const buckets = calculateSessionPerformance(trades);
      const map = new Map(buckets.map((b) => [b.session, b]));
      return order.map((session) => {
        const b = map.get(session);
        const pnl = b?.pnl ?? 0;
        return {
          label: SessionLabel[session],
          pnl,
        };
      });
    }

    const hourly = calculateTimeOfDayPerformance(trades);
    return hourly.map((b) => ({
      label: String(b.hour),
      pnl: b.pnl,
    }));
  }, [trades, viewMode]);

  const hasTrades = trades.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const value = payload[0]?.value ?? 0;
    return (
      <div className="bg-black/90 border border-white/10 p-3 rounded-none shadow-xl backdrop-blur-md">
        <p className="text-white/60 text-xs mb-1 font-mono">{viewMode === 'session' ? 'Session' : 'Hour'}: {label}</p>
        <p className="text-sm font-mono font-bold" style={{ color: value >= 0 ? '#4ade80' : '#f87171' }}>
          PnL: {formatPnL(value)}
        </p>
      </div>
    );
  };

  return (
    <CardWithCornerShine padding="lg" minHeight={minHeight}>
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Time-based Performance</h3>
            <InfoTooltip infoKey="timeBasedPerformance" />
          </div>

          <div className="flex items-center border border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => setViewMode('session')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${viewMode === 'session'
                ? 'bg-purple-500/20 text-white/90'
                : 'text-white/50 hover:text-white/80'}
              `}
            >
              Session
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hourly')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border-l border-white/10 ${viewMode === 'hourly'
                ? 'bg-purple-500/20 text-white/90'
                : 'text-white/50 hover:text-white/80'}
              `}
            >
              Hourly
            </button>
          </div>
        </div>

        <div className="mt-6 flex-1">
          {!hasTrades ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-white/40 text-sm font-mono">No trades in selected period</span>
            </div>
          ) : (
            <div className={`w-full min-w-0 ${chartHeightClass}`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={viewMode === 'hourly' ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => Number(v).toFixed(0)}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="pnl" radius={[0, 0, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.pnl >= 0 ? 'rgba(74, 222, 128, 0.8)' : 'rgba(248, 113, 113, 0.8)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10">
          <span className="text-white/40 text-xs font-mono">PnL by {viewMode === 'session' ? 'session' : 'hour'}</span>
        </div>
      </div>
    </CardWithCornerShine>
  );
}

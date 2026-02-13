'use client';

import React, { useMemo } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import InfoTooltip from '../ui/InfoTooltip';
import type { Trade } from '../../lib/types';

interface AverageTradeDurationCardProps {
  trades: Trade[];
  minHeight?: string;
}

function formatHMS(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export default function AverageTradeDurationCard({ trades, minHeight = 'min-h-[300px]' }: AverageTradeDurationCardProps) {
  const avgSeconds = useMemo(() => {
    const closed = trades.filter((t) => t.closedAt instanceof Date && Number.isFinite(t.durationSeconds));
    if (closed.length === 0) return 0;
    const total = closed.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
    return total / closed.length;
  }, [trades]);

  const formatted = useMemo(() => formatHMS(avgSeconds), [avgSeconds]);

  const [hoursDigits, minutesDigits, secondsDigits] = useMemo(() => {
    const [hh = '00', mm = '00', ss = '00'] = formatted.split(':');
    const pad = (value: string) => (value.length === 2 ? value.split('') : value.padStart(2, '0').split(''));
    return [pad(hh), pad(mm), pad(ss)] as const;
  }, [formatted]);

  const durationSegments = useMemo(
    () => [
      { key: 'hours', caption: 'Hours', digits: hoursDigits },
      { key: 'minutes', caption: 'Minutes', digits: minutesDigits },
      { key: 'seconds', caption: 'Seconds', digits: secondsDigits },
    ],
    [hoursDigits, minutesDigits, secondsDigits]
  );

  const durationAriaLabel = useMemo(() => {
    const [hh = '00', mm = '00', ss = '00'] = formatted.split(':');
    return `Average trade duration ${hh} hours ${mm} minutes ${ss} seconds`;
  }, [formatted]);

  return (
    <CardWithCornerShine padding="lg" minHeight={minHeight}>
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center">
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">Average Trade Duration</h3>
            <InfoTooltip infoKey="avgTradeDuration" />
          </div>
        </div>

        <div className="space-y-4">
          <div aria-label={durationAriaLabel}>
            <div className="grid gap-3 sm:grid-cols-3">
              {durationSegments.map(({ key, caption, digits }) => (
                <div key={key}>
                  <div
                    className="relative mt-3 flex items-center overflow-hidden rounded-none bg-black/20 text-[32px] font-semibold text-white"
                    style={{ fontFamily: '"GeistPixelGridLocal", "Space Mono", monospace' }}
                  >
                    {digits.map((digit, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div
                          key={`${key}-${digit}-${idx}`}
                          className={`flex flex-1 justify-center px-2 py-3 ${
                            isFirst ? 'border-r border-white/20' : ''
                          }`}
                        >
                          {digit}
                        </div>
                      );
                    })}
                    <span
                      className="absolute top-1/2 left-1/2 h-[8px] w-[4px] -translate-y-1/2 rounded-none bg-white/40"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-white/40 text-center">
                    {caption}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardWithCornerShine>
  );
}

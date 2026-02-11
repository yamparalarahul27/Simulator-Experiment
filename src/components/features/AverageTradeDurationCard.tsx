'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tickInstanceRef = useRef<any>(null);
  const fitContainerRef = useRef<HTMLDivElement | null>(null);
  const tickMeasureRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const avgSeconds = useMemo(() => {
    const closed = trades.filter((t) => t.closedAt instanceof Date && Number.isFinite(t.durationSeconds));
    if (closed.length === 0) return 0;
    const total = closed.reduce((sum, t) => sum + (t.durationSeconds || 0), 0);
    return total / closed.length;
  }, [trades]);

  const formatted = useMemo(() => formatHMS(avgSeconds), [avgSeconds]);
  const initialFormattedRef = useRef<string>(formatted);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      if (!rootRef.current) return;

      const TickModule: any = (await import('@pqina/flip')).default;

      if (destroyed) return;

      tickInstanceRef.current = TickModule.DOM.create(rootRef.current, {
        value: initialFormattedRef.current,
      });
    };

    if (!tickInstanceRef.current) {
      init();
    }

    return () => {
      destroyed = true;
      if (tickInstanceRef.current) {
        try {
          tickInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        tickInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tickInstanceRef.current) {
      tickInstanceRef.current.value = formatted;
    }
  }, [formatted]);

  useLayoutEffect(() => {
    if (!fitContainerRef.current) return;

    const computeScale = () => {
      const container = fitContainerRef.current;
      const tickEl = tickMeasureRef.current;
      if (!container || !tickEl) return;

      const availableWidth = container.clientWidth;
      const measuredWidth = tickEl.scrollWidth;

      if (!availableWidth || !measuredWidth) return;

      const nextScale = Math.min(2, Math.max(0.8, availableWidth / measuredWidth));
      setScale(nextScale);
    };

    computeScale();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const ro = new ResizeObserver(() => computeScale());
    ro.observe(fitContainerRef.current);

    return () => ro.disconnect();
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
          <div className="avg-trade-duration-flip" ref={fitContainerRef}>
            <div
              ref={tickMeasureRef}
              className="avg-trade-duration-flip-inner"
              style={{ transform: `scale(${scale})` }}
            >
              <div
                ref={rootRef}
                className="tick"
                data-value={formatted}
                aria-label={formatted}
              >
                <div data-layout="horizontal center" data-repeat="true" aria-hidden="true">
                  <span data-view="flip"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-0 w-full max-w-[360px] px-[12px]">
            <div className="text-white/40 text-xs font-mono uppercase tracking-wider text-left">Hours</div>
            <div className="text-white/40 text-xs font-mono uppercase tracking-wider text-center">Minutes</div>
            <div className="text-white/40 text-xs font-mono uppercase tracking-wider text-right">Seconds</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .avg-trade-duration-flip {
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100px;
        }

        .avg-trade-duration-flip-inner {
          transform-origin: center;
          will-change: transform;
        }

        .avg-trade-duration-flip :global(.tick) {
          font-family: "GeistPixelGridLocal", monospace;
        }

        .avg-trade-duration-flip :global(.tick-credits) {
          display: none !important;
        }

        /* Darken flip panels */
        .avg-trade-duration-flip :global(.tick-flip-panel),
        .avg-trade-duration-flip :global(.tick-flip-card),
        .avg-trade-duration-flip :global(.tick-flip),
        .avg-trade-duration-flip :global(.tick-group) {
          background: rgba(0, 0, 0, 0.25) !important;
        }

        /* Increase flip panel height */
        .avg-trade-duration-flip :global(.tick-flip-card) {
          height: 24px !important;
        }

        .avg-trade-duration-flip :global(.tick-flip-panel),
        .avg-trade-duration-flip :global(.tick-flip-panel-front),
        .avg-trade-duration-flip :global(.tick-flip-panel-back) {
          height: 12px !important;
        }

        .avg-trade-duration-flip :global(.tick-flip-panel-text),
        .avg-trade-duration-flip :global(.tick-text) {
          color: rgba(255, 255, 255, 0.95) !important;
        }

        /* Force sharp corners and PixelGrid font inside flip cards */
        .avg-trade-duration-flip :global(.tick *) {
          border-radius: 0 !important;
          font-family: "GeistPixelGridLocal", monospace !important;
        }
      `}</style>
    </CardWithCornerShine>
  );
}

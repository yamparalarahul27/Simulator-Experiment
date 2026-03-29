'use client';

import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SpotTradeChartProps {
    currentPrice: number;
    pair: string;
    formatPrice: (amount: number, decimals?: number) => string;
}

type Timeframe = '1m' | '5m' | '15m' | '1h';

// Deterministic random walk around a price
function generateChartData(basePrice: number, timeframe: Timeframe): { time: string; price: number; timestamp: number }[] {
    if (!basePrice || basePrice <= 0) return [];

    const points = 100;
    const now = Date.now();

    const intervalMs: Record<Timeframe, number> = {
        '1m': 60_000,
        '5m': 5 * 60_000,
        '15m': 15 * 60_000,
        '1h': 60 * 60_000,
    };

    const interval = intervalMs[timeframe];
    const volatility = basePrice * 0.003; // 0.3% volatility per step
    const data: { time: string; price: number; timestamp: number }[] = [];

    let price = basePrice * (0.98 + Math.sin(basePrice) * 0.02); // Deterministic starting offset

    for (let i = points - 1; i >= 0; i--) {
        const timestamp = now - i * interval;
        const date = new Date(timestamp);

        // Deterministic walk using sin/cos for visual variety
        const noise = Math.sin(i * 0.3 + basePrice * 0.01) * volatility +
            Math.cos(i * 0.7 + basePrice * 0.005) * volatility * 0.5;
        price += noise;
        price = Math.max(price, basePrice * 0.9); // Floor
        price = Math.min(price, basePrice * 1.1); // Ceiling

        // Drift towards current price at the end
        if (i < 10) {
            price += (basePrice - price) * 0.15;
        }

        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');

        data.push({
            time: `${hours}:${mins}`,
            price: parseFloat(price.toFixed(price < 1 ? 8 : 2)),
            timestamp,
        });
    }

    return data;
}

const SpotTradeChart = React.memo(function SpotTradeChart({ currentPrice, pair, formatPrice }: SpotTradeChartProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>('5m');

    const data = useMemo(
        () => generateChartData(currentPrice, timeframe),
        [currentPrice, timeframe]
    );

    const isPositive = data.length >= 2 && data[data.length - 1].price >= data[0].price;
    const gradientColor = isPositive ? '#22c55e' : '#ef4444';
    const lineColor = isPositive ? '#22c55e' : '#ef4444';

    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h'];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-label-12 text-[#adb9d2] uppercase tracking-wider">Price Chart</span>
                <div className="flex gap-1">
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold transition-all ${timeframe === tf
                                ? 'bg-[#00b3b3]/20 text-[#00e6e6] border border-[#00b3b3]/30'
                                : 'text-[#585e6c] hover:text-[#adb9d2] border border-transparent'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[300px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.03)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-geist-mono)' }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                                tickLine={false}
                                interval={Math.floor(data.length / 6)}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-geist-mono)' }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                                tickFormatter={(v: number) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : v < 0.01 ? v.toExponential(1) : v.toFixed(2)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 0,
                                    fontFamily: 'var(--font-geist-mono)',
                                    fontSize: '11px',
                                }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Price']}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={lineColor}
                                strokeWidth={1.5}
                                fill="url(#priceGradient)"
                                dot={false}
                                activeDot={{ r: 3, fill: lineColor, stroke: '#fff', strokeWidth: 1 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-[#585e6c] text-xs font-mono">
                        Waiting for price data...
                    </div>
                )}
            </div>
        </div>
    );
});
export default SpotTradeChart;

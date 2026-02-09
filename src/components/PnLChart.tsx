
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PnLChartProps {
    data: any[];
    height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 border border-white/10 p-3 rounded shadow-xl backdrop-blur-md">
                <p className="text-white/60 text-xs mb-1">Time: {label}</p>
                <p style={{ color: payload[0].color }} className="text-sm font-mono font-bold">
                    {payload[0].name}: {payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export const PnLChart: React.FC<PnLChartProps> = ({ data, height = 400 }) => {
    // 1. Calculate gradient offset based on data range
    const gradientOffset = useMemo(() => {
        const dataMax = Math.max(...data.map((i) => Math.max(i.value, 0)));
        const dataMin = Math.min(...data.map((i) => Math.min(i.value, 0)));

        if (dataMax <= 0) {
            return 0;
        }
        if (dataMin >= 0) {
            return 1;
        }

        return dataMax / (dataMax - dataMin);
    }, [data]);

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={gradientOffset} stopColor="#4ade80" stopOpacity={0.1} />
                            <stop offset={gradientOffset} stopColor="#4ade80" stopOpacity={0} />
                            <stop offset={gradientOffset} stopColor="#fb923c" stopOpacity={0} />
                            <stop offset={gradientOffset} stopColor="#fb923c" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={gradientOffset} stopColor="#4ade80" />
                            <stop offset={gradientOffset} stopColor="#fb923c" />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />

                    <XAxis
                        dataKey="time"
                        hide
                    />

                    <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.toFixed(0)}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />

                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />

                    <Area
                        type="monotone"
                        dataKey="value"
                        fill="url(#splitColor)"
                        stroke="none"
                        strokeWidth={0}
                        activeDot={false}
                        isAnimationActive={false}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="url(#splitStroke)"
                        fill="none"
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={1500}
                    />

                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

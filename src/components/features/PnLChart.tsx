
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import type { DrawdownPoint } from '../../lib/drawdownCalculations';

interface PnLChartProps {
    data: any[];
    height?: number;
    showDrawdown?: boolean;
    drawdownData?: DrawdownPoint[];
}

const CustomTooltip = ({ active, payload, label, showDrawdown }: any) => {
    if (active && payload && payload.length) {
        const drawdownInfo = showDrawdown && payload.find((p: any) => p.name === 'drawdown');
        const pnlInfo = payload.find((p: any) => p.name === 'value');
        const ratioInfo = showDrawdown && payload.find((p: any) => p.name === 'pnlToDrawdownRatio');
        
        return (
            <div className="bg-black/90 border border-white/10 p-3 rounded shadow-xl backdrop-blur-md">
                <p className="text-white/60 text-xs mb-1">Time: {label}</p>
                {pnlInfo && (
                    <p style={{ color: pnlInfo.color }} className="text-sm font-mono font-bold mb-1">
                        PnL: {pnlInfo.value.toFixed(2)}
                    </p>
                )}
                {drawdownInfo && drawdownInfo.value > 0 && (
                    <p className="text-red-400 text-sm font-mono mb-1">
                        Drawdown: -{drawdownInfo.value.toFixed(2)}%
                    </p>
                )}
                {ratioInfo && (
                    <p className="text-purple-400 text-sm font-mono">
                        PnL/DD: {ratioInfo.value.toFixed(2)}x
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export const PnLChart: React.FC<PnLChartProps> = ({ data, height = 400, showDrawdown = false, drawdownData = [] }) => {
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

    // 2. Merge data with drawdown information if enabled
    const chartData = useMemo(() => {
        if (!showDrawdown || !drawdownData.length) return data;
        
        return data.map((item, index) => {
            const drawdownPoint = drawdownData[index];
            const totalPnL = data.slice(0, index + 1).reduce((sum: number, d: any) => sum + d.value, 0);
            const maxDrawdown = drawdownData.slice(0, index + 1).reduce((max: number, dd: DrawdownPoint) => Math.max(max, dd.value), 0);
            
            return {
                ...item,
                drawdown: drawdownPoint?.value || 0,
                pnlToDrawdownRatio: maxDrawdown > 0 ? totalPnL / maxDrawdown : 0
            };
        });
    }, [data, showDrawdown, drawdownData]);

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <AreaChart
                    data={chartData}
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

                    <Tooltip content={<CustomTooltip showDrawdown={showDrawdown} />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />

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

                    {/* Drawdown overlay */}
                    {showDrawdown && (
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            fill="rgba(248, 113, 113, 0.2)"
                            stroke="rgba(248, 113, 113, 0.5)"
                            strokeWidth={1}
                            isAnimationActive={true}
                            animationDuration={300}
                        />
                    )}

                    {/* PnL to Drawdown ratio line */}
                    {showDrawdown && (
                        <Line
                            type="monotone"
                            dataKey="pnlToDrawdownRatio"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                        />
                    )}

                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

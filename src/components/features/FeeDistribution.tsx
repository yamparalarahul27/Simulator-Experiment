'use client';

import React from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { AnalyticsSummary } from '../../lib/types';
import { formatUsd, formatPercent } from '../../lib/utils';

interface FeeDistributionProps {
    summary: AnalyticsSummary;
    className?: string;
}

export default function FeeDistribution({ summary, className }: FeeDistributionProps) {
    const { feeComposition, cumulativeFees } = summary;

    return (
        <CardWithCornerShine padding="lg" minHeight="min-h-[280px]" className={className}>
            <div className="flex flex-col h-full justify-between relative z-10">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="text-white/40 text-sm font-mono uppercase tracking-wider">
                        Fee Distribution
                    </h3>
                    <p className="text-white/60 text-xs mt-1">
                        Breakdown of trading fees
                    </p>
                </div>

                {/* Cumulative Fees - Large Display */}
                <div className="mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-white/50 text-xs font-mono uppercase tracking-wider">
                            Total Fees Paid
                        </span>
                        <span className="text-num-48 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {formatUsd(cumulativeFees)}
                        </span>
                    </div>
                </div>

                {/* Fee Breakdown */}
                <div className="space-y-3">
                    {feeComposition.map((item, index) => (
                        <div
                            key={item.type}
                            className="flex items-center justify-between py-2 border-t border-white/5"
                        >
                            {/* Fee Type */}
                            <span className="text-white/60 text-sm font-mono">
                                {item.type}
                            </span>

                            {/* Amount and Percentage */}
                            <div className="flex items-center gap-3">
                                <span className="text-white font-mono text-sm tabular-nums">
                                    {formatUsd(item.amount)}
                                </span>
                                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs font-mono rounded-sm tabular-nums min-w-[60px] text-center">
                                    {formatPercent(item.percent)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </CardWithCornerShine>
    );
}

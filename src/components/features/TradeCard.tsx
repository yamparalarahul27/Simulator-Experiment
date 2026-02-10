'use client';

import React from 'react';
import { NotebookPen } from 'lucide-react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { Trade } from '../../lib/types';
import { formatUsd } from '../../lib/utils';
import { format } from 'date-fns';

interface TradeCardProps {
    trade: Trade;
    annotation?: string;
    onAnnotate: () => void;
}

export default function TradeCard({ trade, annotation, onAnnotate }: TradeCardProps) {
    const truncatedNote = annotation && annotation.length > 60
        ? annotation.substring(0, 60) + '...'
        : annotation;

    return (
        <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
            <div className="flex flex-col h-full justify-between relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-white font-bold text-lg">{trade.symbol}</h3>
                        <p className="text-white/60 text-sm font-mono">
                            {trade.side.toUpperCase()} • {trade.orderType}
                        </p>
                    </div>
                    <button
                        onClick={onAnnotate}
                        className={`p-2 rounded-lg transition-colors ${annotation
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                            }`}
                        title="Add or edit note"
                    >
                        <NotebookPen className="h-5 w-5" />
                    </button>
                </div>

                {/* PnL */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-num-48 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            } drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                            {trade.pnl >= 0 ? '+' : ''}{formatUsd(trade.pnl)}
                        </span>
                        <span className={`text-sm font-medium ${trade.isWin ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {trade.isWin ? '✓ Win' : '✗ Loss'}
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div className="mb-3">
                    <p className="text-white/40 text-xs font-mono">
                        {format(trade.closedAt, 'MMM d, yyyy • HH:mm')}
                    </p>
                </div>

                {/* Annotation Preview */}
                {annotation && (
                    <div className="mt-auto pt-3 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-mono uppercase tracking-wider">
                            Note
                        </p>
                        <p className="text-sm text-white/70 line-clamp-2">
                            {truncatedNote}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!annotation && (
                    <div className="mt-auto pt-3 border-t border-white/10">
                        <p className="text-xs text-white/30 italic">
                            Annotate your trade, it helps in growth
                        </p>
                    </div>
                )}
            </div>
        </CardWithCornerShine>
    );
}

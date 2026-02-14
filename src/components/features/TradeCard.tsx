'use client';

import React from 'react';
import { PencilLine } from 'lucide-react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import { Trade, TradeAnnotation } from '../../lib/types';
import { formatUsd } from '../../lib/utils';
import { format } from 'date-fns';
import { getPairImage, isPerpetual } from '../../lib/tokenImages';

interface TradeCardProps {
    trade: Trade;
    annotation?: TradeAnnotation;
    onAnnotate: () => void;
}

export default function TradeCard({ trade, annotation, onAnnotate }: TradeCardProps) {
    const truncatedNote = annotation?.notes && annotation.notes.length > 60
        ? annotation.notes.substring(0, 60) + '...'
        : annotation?.notes;

    const pairImage = getPairImage(trade.symbol);
    const isPerp = isPerpetual(trade.symbol);

    return (
        <CardWithCornerShine padding="lg" minHeight="min-h-[200px]">
            <div className="flex flex-col h-full justify-between relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Token Pair Image */}
                        <img
                            src={pairImage}
                            alt={trade.symbol}
                            className="w-12 h-12 rounded-none"
                        />

                        <div>
                            <h3 className="text-white font-bold text-lg">{trade.symbol}</h3>
                            <p className="text-white/60 text-sm font-mono">
                                {trade.side.toUpperCase()} • {trade.orderType}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAnnotate}
                        className={`relative z-20 p-2 rounded-none transition-colors group/btn ${annotation
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                            }`}
                        title={annotation ? "Edit note" : "Annotate your trade, it helps in growth"}
                    >
                        <PencilLine className="h-5 w-5" />
                    </button>
                </div>

                {/* PnL */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-num-40 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            } drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                            {trade.pnl >= 0 ? '+' : ''}{formatUsd(trade.pnl)}
                        </span>
                        <span className={`text-sm font-medium ${trade.isWin ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {trade.isWin ? 'WIN' : 'LOSS'}
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div className="mb-3">
                    <p className="text-white/40 text-xs font-mono" suppressHydrationWarning>
                        {format(trade.closedAt, 'MMM d, yyyy • HH:mm')}
                    </p>
                </div>

                {/* Annotation Preview */}
                {annotation && (
                    <div className="mt-auto pt-3 border-t border-white/10">
                        {/* Tags on card */}
                        {annotation.tags && annotation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {annotation.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/20 font-mono">
                                        #{tag}
                                    </span>
                                ))}
                                {annotation.tags.length > 2 && (
                                    <span className="text-[9px] text-white/20">+{annotation.tags.length - 2}</span>
                                )}
                            </div>
                        )}

                        {truncatedNote && (
                            <p className="text-xs text-white/50 line-clamp-2 italic font-serif">
                                "{truncatedNote}"
                            </p>
                        )}

                        {annotation.lessonsLearned && !truncatedNote && (
                            <div className="bg-purple-500/5 p-2 border border-purple-500/10">
                                <p className="text-[10px] text-purple-400 font-bold mb-1 uppercase">Lesson</p>
                                <p className="text-xs text-white/70 line-clamp-1 italic">
                                    {annotation.lessonsLearned}
                                </p>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </CardWithCornerShine>
    );
}

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

/**
 * TradeCard Component
 * 
 * PURPOSE:
 * Represents a single trading transaction in a compact, visually rich card format.
 * Primarily used within the Journal view to provide a summary of an individual trade
 * and allow the user to add or edit journal annotations.
 * 
 * FEATURES:
 * - Pair-specific branding (token images)
 * - Clear Side (Long/Short) and Order Type indicators
 * - Visual annotation feedback (highlighted pencil icon if note exists)
 * - Integration with AnnotationModal via onAnnotate callback
 * 
 * @param trade - The core trade data object
 * @param annotation - Optional journal entry (notes/tags) associated with this trade
 * @param onAnnotate - Callback function triggered to open the annotation editor
 */
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
                            className="w-12 h-12 rounded-lg"
                        />

                        <div>
                            <h3 className="text-white font-bold text-lg">{trade.symbol}</h3>
                            <p className="text-bs-text-tertiary text-sm font-mono">
                                {trade.side.toUpperCase()} • {trade.orderType}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAnnotate}
                        className={`relative z-20 p-2 rounded-lg transition-colors group/btn ${annotation
                            ? 'bg-bs-brand-tertiary/20 text-bs-brand hover:bg-bs-brand-tertiary/30'
                            : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg hover:text-bs-text-tertiary'
                            }`}
                        title={annotation ? "Edit note" : "Annotate your trade, it helps in growth"}
                    >
                        <PencilLine className="h-5 w-5" />
                    </button>
                </div>

                {/* PnL */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-num-40 ${trade.pnl >= 0 ? 'text-bs-success' : 'text-bs-error'
                            } drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                            {trade.pnl >= 0 ? '+' : ''}{formatUsd(trade.pnl)}
                        </span>
                        <span className={`text-sm font-medium ${trade.isWin ? 'text-bs-success' : 'text-bs-error'
                            }`}>
                            {trade.isWin ? 'WIN' : 'LOSS'}
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div className="mb-3">
                    <p className="text-bs-text-mute text-xs font-mono" suppressHydrationWarning>
                        {format(trade.closedAt, 'MMM d, yyyy • HH:mm')}
                    </p>
                </div>

                {/* Annotation Preview */}
                {annotation && (
                    <div className="mt-auto pt-3 border-t border-bs-border">
                        {/* Tags on card */}
                        {annotation.tags && annotation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {annotation.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-bs-brand-tertiary/20 text-bs-brand border border-bs-brand-tertiary/20 font-mono">
                                        #{tag}
                                    </span>
                                ))}
                                {annotation.tags.length > 2 && (
                                    <span className="text-[9px] text-bs-text-mute">+{annotation.tags.length - 2}</span>
                                )}
                            </div>
                        )}

                        {truncatedNote && (
                            <p className="text-xs text-bs-text-tertiary line-clamp-2 italic font-serif">
                                "{truncatedNote}"
                            </p>
                        )}

                        {annotation.lessonsLearned && !truncatedNote && (
                            <div className="bg-bs-brand-tertiary/5 p-2 border border-bs-brand-tertiary/10">
                                <p className="text-[10px] text-bs-brand font-bold mb-1 uppercase">Lesson</p>
                                <p className="text-xs text-bs-text-secondary line-clamp-1 italic">
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

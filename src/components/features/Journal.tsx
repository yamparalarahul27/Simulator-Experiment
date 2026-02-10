'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import TradeCard from './TradeCard';
import AnnotationModal from './AnnotationModal';
import { Trade } from '../../lib/types';
import {
    loadAnnotations,
    saveAnnotation,
    getAnnotation,
    downloadAnnotations
} from '../../lib/annotationStorage';
import { MOCK_TRADES } from '../../lib/mockData';

const ITEMS_PER_PAGE = 25;

export default function Journal() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [annotations, setAnnotations] = useState<Record<string, any>>({});
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // TODO: Add toggle for data source (Deriverse / All Transactions / Mock)
    // User will explain toggle implementation later
    const [dataSource] = useState<'mock' | 'deriverse' | 'all'>('mock');

    useEffect(() => {
        // Load annotations from localStorage
        setAnnotations(loadAnnotations());

        // Load mock data for now
        // TODO: Replace with actual data based on dataSource toggle
        if (dataSource === 'mock') {
            setTrades(MOCK_TRADES);
        }
    }, [dataSource]);

    const handleAnnotate = (trade: Trade) => {
        setSelectedTrade(trade);
        setIsModalOpen(true);
    };

    const handleSaveAnnotation = (note: string) => {
        if (selectedTrade) {
            saveAnnotation(selectedTrade.id, note);
            setAnnotations(loadAnnotations());
            setIsModalOpen(false);
            setSelectedTrade(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTrade(null);
    };

    const handleDownload = () => {
        downloadAnnotations(trades);
    };

    // Pagination
    const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTrades = trades.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Journal</h1>
                    <p className="text-white/60 text-sm mt-1">
                        Reflect on your trades and track your growth
                    </p>
                </div>

                {/* Download Button */}
                {Object.keys(annotations).length > 0 && (
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                    >
                        <Download className="h-4 w-4" />
                        Export Notes
                    </button>
                )}
            </div>

            {/* Empty State - No Trades */}
            {trades.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="mb-4 rounded-none bg-white/5 p-6">
                        <svg
                            className="h-12 w-12 text-white/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Trades Yet</h3>
                    <p className="text-white/60 max-w-md">
                        Make Trade on Deriverse
                    </p>
                </div>
            )}

            {/* Trade Cards Grid */}
            {trades.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTrades.map((trade) => (
                            <TradeCard
                                key={trade.id}
                                trade={trade}
                                annotation={annotations[trade.id]?.note}
                                onAnnotate={() => handleAnnotate(trade)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-none border border-white/10 bg-white/5 p-2 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first, last, current, and adjacent pages
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`min-w-[40px] rounded-none px-3 py-2 text-sm font-medium transition-colors ${page === currentPage
                                                    ? 'bg-purple-500 text-white'
                                                    : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return (
                                            <span key={page} className="text-white/40">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="rounded-none border border-white/10 bg-white/5 p-2 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Annotation Modal */}
            <AnnotationModal
                isOpen={isModalOpen}
                trade={selectedTrade}
                initialNote={selectedTrade ? (annotations[selectedTrade.id]?.note || '') : ''}
                onSave={handleSaveAnnotation}
                onClose={handleCloseModal}
            />
        </div>
    );
}

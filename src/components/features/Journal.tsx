'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import TradeCard from './TradeCard';
import AnnotationModal from './AnnotationModal';
import { Trade } from '../../lib/types';
import JournalStreakCard from './JournalStreakCard';
import MockDataBanner from '../ui/MockDataBanner';
import {
    loadAnnotations,
    saveAnnotation,
    getAnnotation,
    downloadAnnotations
} from '../../lib/annotationStorage';
import { MOCK_TRADES } from '../../lib/mockData';
import { SupabaseTradeService } from '../../services/SupabaseTradeService';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 25;

/**
 * Trade journal component for annotating and reviewing trading history
 * 
 * @returns Interactive journal with trade cards, annotations, and pagination
 */

interface JournalProps {
    network?: 'devnet' | 'mainnet' | 'mock';
    analyzingWallet?: string | null;
    onNavigateToLookup?: () => void;
}

export default function Journal({ network = 'mock', analyzingWallet, onNavigateToLookup }: JournalProps = {}) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [annotations, setAnnotations] = useState<Record<string, any>>({});
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load annotations from localStorage
        setAnnotations(loadAnnotations());

        async function loadTrades() {
            if (network === 'devnet' && analyzingWallet) {
                setLoading(true);
                try {
                    const service = new SupabaseTradeService();
                    const realTrades = await service.getTrades(analyzingWallet);
                    setTrades(realTrades);

                    if (realTrades.length === 0) {
                        toast.info('No trades found for this wallet');
                    }
                } catch (err) {
                    console.error('Failed to load trades:', err);
                    toast.error('Failed to load journal entries');
                    setTrades([]);
                } finally {
                    setLoading(false);
                }
            } else if (network === 'devnet' && !analyzingWallet) {
                setTrades([]);
            } else {
                // Mock data
                setTrades(MOCK_TRADES);
            }
        }

        loadTrades();
    }, [network, analyzingWallet]);

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
            {/* Mock Data Banner */}
            {network === 'mock' && (
                <MockDataBanner onFetchTrades={onNavigateToLookup} />
            )}

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

            {!loading && trades.length > 0 && <JournalStreakCard />}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-white/60">Loading journal entries...</p>
                </div>
            )}

            {/* Empty State - No Trades */}
            {!loading && trades.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div>
          <img 
            src="/assets/graphic_no_trade_data.png" 
            alt="No trade data" 
            className="w-64"
          />
        </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Add or Connect Wallet to view your trades Journal</h3>
                    <p className="text-white/60 max-w-md mb-6">
                        {network === 'devnet' && !analyzingWallet
                            ? "Go to Wallet Lookup to load your trades."
                            : network === 'devnet'
                                ? "We couldn't find any saved trades for your wallet."
                                : "Make a trade to see it appear here."}
                    </p>
                    {network === 'devnet' && (
                        <button
                            onClick={onNavigateToLookup}
                            className="px-6 py-3 bg-purple-600/50 hover:bg-purple-700 text-white font-medium rounded-none transition-colors"
                        >
                            Add Wallet
                        </button>
                    )}
                </div>
            )}

            {/* Trade Cards Grid */}
            {!loading && trades.length > 0 && (
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

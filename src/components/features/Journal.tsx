'use client';

import React, { useState, useEffect } from 'react';
import {
    Download,
    ChevronLeft,
    ChevronRight,
    BookDown,
    Filter,
    Check
} from 'lucide-react';
import TradeCard from './TradeCard';
import AnnotationModal from './AnnotationModal';
import { Trade, TradeAnnotation } from '../../lib/types';
import JournalStreakCard from './JournalStreakCard';
import MockDataBanner from '../ui/MockDataBanner';
import {
    downloadAnnotations,
    migrateToSupabase,
    loadAnnotations,
    saveAnnotation as saveToLocalStorage
} from '../../lib/annotationStorage';
import SkeletonNote from '../ui/SkeletonNote';
import { MOCK_TRADES } from '../../lib/mockData';
import { SupabaseTradeService } from '../../services/SupabaseTradeService';
import { SupabaseAnnotationService } from '../../services/SupabaseAnnotationService';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
    const [annotations, setAnnotations] = useState<Record<string, TradeAnnotation>>({});
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Tag Filter States
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const annotationService = new SupabaseAnnotationService();

    useEffect(() => {
        async function loadInitialData() {
            setLoading(true);
            try {
                // Determine source
                let tradeList: Trade[] = [];
                if (network === 'devnet' && analyzingWallet) {
                    const tradeService = new SupabaseTradeService();
                    tradeList = await tradeService.getTrades(analyzingWallet);

                    // Load annotations from Supabase ONLY for real wallets
                    const dbAnnotations = await annotationService.getAnnotationsForWallet(analyzingWallet);
                    setAnnotations(dbAnnotations);
                } else if (network === 'mock') {
                    tradeList = MOCK_TRADES;
                    // For mock, load from localStorage
                    const localAnnotations = loadAnnotations();
                    const mappedAnnotations: Record<string, TradeAnnotation> = {};
                    Object.keys(localAnnotations).forEach(id => {
                        const local = localAnnotations[id];
                        mappedAnnotations[id] = {
                            tradeId: id,
                            notes: local.note,
                            tags: [], // Tags not fully supported in old format but we can adapt if needed
                            lessonsLearned: ''
                        };
                    });
                    setAnnotations(mappedAnnotations);
                }

                setTrades(tradeList);

                // Trigger Migration if wallet is connected
                if (network === 'devnet' && analyzingWallet) {
                    const migrated = await migrateToSupabase(analyzingWallet, annotationService);
                    if (migrated > 0) {
                        toast.success(`Successfully backed up ${migrated} notes to cloud`);
                        // Re-fetch annotations after migration
                        const dbAnnotations = await annotationService.getAnnotationsForWallet(analyzingWallet);
                        setAnnotations(dbAnnotations);
                    }
                }

                // Extract unique tags from annotations
                const allTags = new Set<string>();
                Object.values(annotations).forEach(ann => {
                    ann.tags?.forEach(tag => allTags.add(tag));
                });
                // Add some default tags for search
                ['Good Setup', 'Revenge', 'FOMO', 'Patience'].forEach(t => allTags.add(t));
                setAvailableTags(Array.from(allTags).sort());

            } catch (err) {
                console.error('Failed to load journal:', err);
                toast.error('Failed to load journal entries');
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();
    }, [network, analyzingWallet]);

    const handleAnnotate = (trade: Trade) => {
        setSelectedTrade(trade);
        setIsModalOpen(true);
    };

    const handleSaveAnnotation = async (data: TradeAnnotation) => {
        if (!selectedTrade) return;

        try {
            // Count existing annotations with content
            const existingCount = Object.values(annotations).filter(a => a.notes && a.notes.trim().length > 0).length;
            const isFirstAnnotation = existingCount === 0;

            let saved: TradeAnnotation;

            if (network === 'mock') {
                // Save to localStorage
                saveToLocalStorage(selectedTrade.id, data.notes);
                saved = { ...data, updatedAt: new Date() };
            } else {
                // Save to Supabase
                const analyzingWalletAddress = analyzingWallet || undefined;
                saved = await annotationService.saveAnnotation(data, analyzingWalletAddress);
            }

            setAnnotations(prev => ({
                ...prev,
                [selectedTrade.id]: saved
            }));

            if (isFirstAnnotation) {
                // Celebration for the first journal entry!
                // We use a small timeout to let the modal close and state update
                setTimeout(() => {
                    const duration = 5 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

                    const interval: any = setInterval(function () {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 50 * (timeLeft / duration);
                        confetti({ ...defaults, particleCount, origin: { x: Math.random() * (0.3 - 0.1) + 0.1, y: Math.random() - 0.2 } });
                        confetti({ ...defaults, particleCount, origin: { x: Math.random() * (0.9 - 0.7) + 0.7, y: Math.random() - 0.2 } });
                    }, 250);

                    toast.success('Your first journal entry! Keep it up for 21 days!', {
                        duration: 5000,
                        icon: '🚀'
                    });
                }, 300);
            } else {
                toast.success('Annotation saved');
            }
            setIsModalOpen(false);
            setSelectedTrade(null);
        } catch (err) {
            console.error('Failed to save annotation:', err);
            toast.error('Failed to save annotation to cloud');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTrade(null);
    };

    const handleDownload = () => {
        downloadAnnotations(trades);
    };

    // Filtering logic
    const filteredTrades = trades.filter(trade => {
        if (selectedTags.length === 0) return true;
        const annotation = annotations[trade.id];
        if (!annotation) return false;
        return selectedTags.every(tag => annotation.tags.includes(tag));
    });

    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Pagination
    const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Journal</h1>
                    <p className="text-white/60 text-sm mt-1 font-mono tracking-tight">
                        REFLECT ON YOUR TRADES AND TRACK YOUR GROWTH
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Tag Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 rounded-none border px-4 py-2 text-sm font-medium transition-all ${selectedTags.length > 0
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            {selectedTags.length > 0 ? `${selectedTags.length} Tags` : 'Filter Tags'}
                        </button>

                        {isFilterOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsFilterOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-[#0D0D21] border border-white/10 shadow-2xl z-50 p-2 glass-morphism">
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {availableTags.length === 0 ? (
                                            <p className="text-[10px] text-white/30 p-2 italic">Add annotations to see tags</p>
                                        ) : (
                                            availableTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleTagFilter(tag)}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors group"
                                                >
                                                    <span className={selectedTags.includes(tag) ? 'text-purple-400' : ''}>
                                                        #{tag}
                                                    </span>
                                                    {selectedTags.includes(tag) && <Check className="h-3 w-3 text-purple-400" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="w-full mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40 hover:text-white transition-colors text-center pb-1"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center h-10 w-10 rounded-none border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
                        title="Export Journal"
                    >
                        <BookDown className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {!loading && trades.length > 0 && (
                <JournalStreakCard trades={trades} annotations={annotations} />
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                    <p className="text-white/60">Loading journal entries...</p>
                </div>
            )}

            {/* Empty States */}
            {!loading && trades.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div>
                        <img src="/assets/graphic_no_trade_data.png" alt="No trade data" className="w-64" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet to view your Journal</h3>
                    <p className="text-white/60 max-w-md mb-6">
                        {network === 'devnet' && !analyzingWallet
                            ? "Go to Wallet Lookup to load your trades."
                            : "We couldn't find any saved trades for your wallet."}
                    </p>
                </div>
            )}

            {/* Filtered Empty State */}
            {!loading && trades.length > 0 && filteredTrades.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border border-dashed border-white/10 bg-white/5 p-8">
                    <p className="text-xl text-white font-medium mb-3">
                        {selectedTags.includes('FOMO')
                            ? "No trades found with tag '#FOMO' — that's actually a good thing!"
                            : selectedTags.includes('Revenge')
                                ? "No '#Revenge' trades here? Great discipline! You're trading the market, not your emotions."
                                : selectedTags.includes('Good Setup')
                                    ? "No '#GoodSetup' trades yet? Keep refining your entry criteria, quality over quantity!"
                                    : "No trades found matching your active tags."
                        }
                    </p>
                    <button
                        onClick={() => setSelectedTags([])}
                        className="text-purple-400 hover:text-purple-300 text-sm font-mono underline underline-offset-4"
                    >
                        Clear filters to see all trades
                    </button>
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
                                annotation={annotations[trade.id]}
                                onAnnotate={() => handleAnnotate(trade)}
                            />
                        ))}
                        {loading && Array.from({ length: 6 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="bg-white/5 border border-white/10 p-6 h-[200px]">
                                <div className="animate-pulse flex flex-col h-full space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-white/5"></div>
                                        <div className="space-y-2">
                                            <div className="w-24 h-4 bg-white/5"></div>
                                            <div className="w-16 h-3 bg-white/5"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1"></div>
                                    <SkeletonNote />
                                </div>
                            </div>
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
                initialData={selectedTrade ? (annotations[selectedTrade.id] || null) : null}
                onSave={handleSaveAnnotation}
                onClose={handleCloseModal}
            />
        </div>
    );
}

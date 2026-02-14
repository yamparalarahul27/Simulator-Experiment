import { Trade } from '../../lib/types';

interface DeriverseTradesTableProps {
    trades: Trade[];
    onSaveTrades?: () => void;
    savingTrades?: boolean;
    currentWalletAddress?: string | null;
}

/**
 * DeriverseTradesTable Component
 * 
 * PURPOSE:
 * A comprehensive data table for visualizing multiple trade objects.
 * Features a statistics summary (PnL, Fees, Win Rate) at the top and
 * provides functionality to save trades to persistent storage.
 * 
 * FEATURES:
 * - Real-time statistics calculation (PnL, Fees, Win Rate)
 * - "Save to Database" integration for persistence
 * - Handles empty states gracefully for disconnected or inactive wallets
 * 
 * @param trades - Array of trade objects to display
 * @param onSaveTrades - Callback to trigger the data ingestion process
 * @param savingTrades - Boolean state indicating if a save is in progress
 * @param currentWalletAddress - The address of the wallet being analyzed
 */
export default function DeriverseTradesTable({ trades, onSaveTrades, savingTrades = false, currentWalletAddress }: DeriverseTradesTableProps) {
    if (trades.length === 0) {
        return (
            <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden p-12 text-center">
                <p className="text-zinc-400">No Deriverse trades found for this address</p>
                <p className="text-zinc-500 text-sm mt-2">
                    This wallet may not have any trading activity on Deriverse Devnet
                </p>
            </div>
        );
    }

    // Calculate statistics
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
    const wins = trades.filter(t => t.isWin).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total Trades</p>
                    <p className="text-2xl font-semibold text-white font-mono">{trades.length}</p>
                </div>
                <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-4 md:col-span-2">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total PnL</p>
                    <p className={`text-2xl font-semibold font-mono ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDC
                    </p>
                </div>
                <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Win Rate</p>
                    <p className="text-2xl font-semibold text-white font-mono">{winRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total Fees</p>
                    <p className="text-2xl font-semibold text-white font-mono">{totalFees.toFixed(2)} USDC
                    </p>
                </div>
                <div className="rounded-none bg-blue-600/10 backdrop-blur-xl flex flex-col justify-center md:col-span-1 p-4">
                    {onSaveTrades && trades.length > 0 && currentWalletAddress ? (
                        <button
                            onClick={onSaveTrades}
                            disabled={savingTrades}
                            className="px-4 py-2 bg-blue-600 border border-white/10 text-white rounded-none font-semibold hover:bg-blue-700 transition disabled:bg-blue-900/40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {savingTrades ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>

                                    <span>Save & Ingest {trades.length} Trades</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="text-center">
                            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Actions</p>
                            <p className="text-sm text-zinc-500">No trades to save</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Trades Table */}
            <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                    <h3 className="text-lg font-semibold text-white">Deriverse Trades</h3>
                    <p className="text-sm text-zinc-400 mt-1">Showing {trades.length} trades parsed from on-chain data</p>
                </div>
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Symbol</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Side</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">Quantity</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">Notional</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">PnL</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">Fee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Signature</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {trades.map((trade, index) => {
                                const isPerp = trade.side === 'long' || trade.side === 'short';
                                return (
                                    <tr
                                        key={trade.id}
                                        className="hover:bg-white/5 transition-all duration-200 group"
                                        style={{
                                            animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                            {trade.closedAt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                                            {trade.symbol}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-none text-xs font-semibold backdrop-blur-sm
                                      ${isPerp
                                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                                {isPerp ? 'Perpetual' : 'Spot'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-none text-xs font-semibold backdrop-blur-sm
                                      ${trade.side === 'buy' || trade.side === 'long'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                                {trade.side.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-mono">
                                            {trade.quantity.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-mono">
                                            ${trade.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-mono">
                                            ${trade.notional.toFixed(2)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold
                                   ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                            {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-300 font-mono">
                                            {trade.fee.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a
                                                href={`https://solscan.io/tx/${trade.txSignature}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 transition-colors font-mono group-hover:underline"
                                            >
                                                {trade.txSignature.slice(0, 8)}...{trade.txSignature.slice(-8)}
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import NumberFlow from '@number-flow/react';
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
            <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl overflow-hidden p-12 text-center">
                <p className="text-bs-text-tertiary">No Deriverse trades found for this address</p>
                <p className="text-bs-text-mute text-sm mt-2">
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
                <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-bs-text-tertiary uppercase tracking-wider mb-1">Total Trades</p>
                    <p className="text-2xl font-semibold text-white font-mono"><NumberFlow value={trades.length} transformTiming={{ duration: 400, easing: 'ease-out' }} /></p>
                </div>
                <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-4 md:col-span-2">
                    <p className="text-xs text-bs-text-tertiary uppercase tracking-wider mb-1">Total PnL</p>
                    <p className={`text-2xl font-semibold font-mono ${totalPnL >= 0 ? 'text-bs-success' : 'text-bs-error'}`}>
                        <NumberFlow value={totalPnL} prefix={totalPnL >= 0 ? '+' : ''} suffix=" USDC" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 500, easing: 'ease-out' }} />
                    </p>
                </div>
                <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-bs-text-tertiary uppercase tracking-wider mb-1">Win Rate</p>
                    <p className="text-2xl font-semibold text-white font-mono"><NumberFlow value={winRate} suffix="%" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} transformTiming={{ duration: 400, easing: 'ease-out' }} /></p>
                </div>
                <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-4 md:col-span-1">
                    <p className="text-xs text-bs-text-tertiary uppercase tracking-wider mb-1">Total Fees</p>
                    <p className="text-2xl font-semibold text-white font-mono"><NumberFlow value={totalFees} suffix=" USDC" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} transformTiming={{ duration: 400, easing: 'ease-out' }} />
                    </p>
                </div>
                <div className="rounded-lg bg-blue-600/10 backdrop-blur-xl flex flex-col justify-center md:col-span-1 p-4">
                    {onSaveTrades && trades.length > 0 && currentWalletAddress ? (
                        <button
                            onClick={onSaveTrades}
                            disabled={savingTrades}
                            className="px-4 py-2 bg-[#69a2f1] border border-bs-border text-white rounded-lg font-semibold hover:bg-[#69a2f1]/80 transition disabled:bg-blue-900/40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
                            <p className="text-xs text-bs-text-tertiary uppercase tracking-wider mb-1">Actions</p>
                            <p className="text-sm text-bs-text-mute">No trades to save</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Trades Table */}
            <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-bs-border bg-gradient-to-r from-white/5 to-transparent">
                    <h3 className="text-lg font-semibold text-white">Deriverse Trades</h3>
                    <p className="text-sm text-bs-text-tertiary mt-1">Showing {trades.length} trades parsed from on-chain data</p>
                </div>
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-bs-bg/90 backdrop-blur-xl border-b border-bs-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Symbol</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Side</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">Quantity</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">Notional</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">PnL</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">Fee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Signature</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bs-border">
                            {trades.map((trade, index) => {
                                const isPerp = trade.side === 'long' || trade.side === 'short';
                                return (
                                    <tr
                                        key={trade.id}
                                        className="hover:bg-bs-card transition-all duration-200 group"
                                        style={{
                                            animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-bs-text-secondary">
                                            {trade.closedAt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                                            {trade.symbol}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                                      ${isPerp
                                                    ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border border-bs-brand-tertiary/30'
                                                    : 'bg-[#69a2f1]/20 text-blue-300 border border-[#69a2f1]/30'}`}>
                                                {isPerp ? 'Perpetual' : 'Spot'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                                      ${trade.side === 'buy' || trade.side === 'long'
                                                    ? 'bg-bs-success/20 text-green-300 border border-[#00e66b]/30'
                                                    : 'bg-bs-error/20 text-red-300 border border-[#ff285a]/30'}`}>
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
                                   ${trade.pnl > 0 ? 'text-bs-success' : trade.pnl < 0 ? 'text-bs-error' : 'text-bs-text-tertiary'}`}>
                                            {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-bs-text-secondary font-mono">
                                            {trade.fee.toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a
                                                href={`https://solscan.io/tx/${trade.txSignature}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-bs-brand-ts hover:text-blue-300 transition-colors font-mono group-hover:underline"
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

'use client';

import React, { useState } from 'react';
import type { DemoOrder, DemoBalance } from '@/services/SupabaseDemoService';
import type { DemoToken } from '@/lib/hooks/useSpotTrade';
import { useLivePrices } from '@/lib/context/LivePricesContext';

interface SpotTradeHistoryProps {
    openOrders: DemoOrder[];
    filledOrders: DemoOrder[];
    balances: DemoBalance[];
    cancelOrder: (orderId: string) => Promise<void>;
    formatPrice: (amount: number, decimals?: number) => string;
}

type BottomTab = 'open' | 'history' | 'balances';

const SpotTradeHistory = React.memo(function SpotTradeHistory({
    openOrders, filledOrders, balances, cancelOrder, formatPrice,
}: SpotTradeHistoryProps) {
    const { livePrices } = useLivePrices();
    const [tab, setTab] = useState<BottomTab>('open');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const handleCancel = async (id: string) => {
        setCancellingId(id);
        try {
            await cancelOrder(id);
        } finally {
            setCancellingId(null);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            partial: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            filled: 'text-green-400 bg-green-500/10 border-green-500/20',
            cancelled: 'text-white/30 bg-white/5 border-white/10',
            triggered: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        };
        return (
            <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border ${colors[status] || colors.pending}`}>
                {status}
            </span>
        );
    };

    return (
        <div>
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
                {([
                    { key: 'open', label: `Open Orders (${openOrders.length})` },
                    { key: 'history', label: 'Trade History' },
                    { key: 'balances', label: 'Balances' },
                ] as { key: BottomTab; label: string }[]).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-xs font-mono font-medium transition-all border-b-2 ${tab === t.key
                                ? 'text-white border-purple-500'
                                : 'text-white/30 border-transparent hover:text-white/60'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="max-h-[280px] overflow-y-auto">
                {/* ─── Open Orders ──── */}
                {tab === 'open' && (
                    <div>
                        {openOrders.length === 0 ? (
                            <div className="py-8 text-center text-xs font-mono text-white/20">
                                No open orders
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] font-mono text-white/30 uppercase tracking-wider border-b border-white/5">
                                        <th className="text-left px-3 py-2">Time</th>
                                        <th className="text-left px-3 py-2">Pair</th>
                                        <th className="text-left px-3 py-2">Type</th>
                                        <th className="text-left px-3 py-2">Side</th>
                                        <th className="text-right px-3 py-2">Price</th>
                                        <th className="text-right px-3 py-2">Amount</th>
                                        <th className="text-center px-3 py-2">Filled</th>
                                        <th className="text-center px-3 py-2">Status</th>
                                        <th className="text-center px-3 py-2">TP/SL</th>
                                        <th className="text-right px-3 py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {openOrders.map(order => {
                                        const fillPct = order.quantity > 0
                                            ? (order.filledQuantity / order.quantity * 100)
                                            : 0;

                                        return (
                                            <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="text-[10px] font-mono text-white/40 px-3 py-2">
                                                    {formatTime(order.createdAt)}
                                                </td>
                                                <td className="text-[10px] font-mono text-white/60 px-3 py-2">{order.pair}</td>
                                                <td className="text-[10px] font-mono text-white/40 px-3 py-2 uppercase">
                                                    {order.orderType.replace('_', ' ')}
                                                </td>
                                                <td className={`text-[10px] font-mono font-bold px-3 py-2 ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {order.side.toUpperCase()}
                                                </td>
                                                <td className="text-[10px] font-mono text-white/60 px-3 py-2 text-right">
                                                    {order.price ? formatPrice(order.price) : order.stopPrice ? `⊘ ${formatPrice(order.stopPrice)}` : '—'}
                                                </td>
                                                <td className="text-[10px] font-mono text-white/60 px-3 py-2 text-right">
                                                    {order.quantity.toFixed(4)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {(order.orderType === 'iceberg' || order.orderType === 'twap') ? (
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-purple-500 transition-all"
                                                                    style={{ width: `${fillPct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[8px] font-mono text-white/30">{fillPct.toFixed(0)}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-mono text-white/20 text-center block">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center">{statusBadge(order.status)}</td>
                                                <td className="text-[9px] font-mono text-white/30 px-3 py-2 text-center">
                                                    {order.tpPrice ? <span className="text-green-400/60">TP</span> : null}
                                                    {order.tpPrice && order.slPrice ? ' / ' : null}
                                                    {order.slPrice ? <span className="text-red-400/60">SL</span> : null}
                                                    {!order.tpPrice && !order.slPrice ? '—' : null}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <button
                                                        onClick={() => handleCancel(order.id)}
                                                        disabled={cancellingId === order.id}
                                                        className="text-[9px] font-mono text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-30"
                                                    >
                                                        {cancellingId === order.id ? '...' : 'Cancel'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ─── Trade History ──── */}
                {tab === 'history' && (
                    <div>
                        {filledOrders.length === 0 ? (
                            <div className="py-8 text-center text-xs font-mono text-white/20">
                                No trade history yet
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] font-mono text-white/30 uppercase tracking-wider border-b border-white/5">
                                        <th className="text-left px-3 py-2">Date</th>
                                        <th className="text-left px-3 py-2">Time</th>
                                        <th className="text-left px-3 py-2">Pair</th>
                                        <th className="text-left px-3 py-2">Side</th>
                                        <th className="text-left px-3 py-2">Type</th>
                                        <th className="text-right px-3 py-2">Price</th>
                                        <th className="text-right px-3 py-2">Amount</th>
                                        <th className="text-right px-3 py-2">Total</th>
                                        <th className="text-right px-3 py-2">Fee</th>
                                        <th className="text-center px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filledOrders.slice(0, 50).map(order => (
                                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="text-[10px] font-mono text-white/30 px-3 py-2">{formatDate(order.createdAt)}</td>
                                            <td className="text-[10px] font-mono text-white/40 px-3 py-2">{formatTime(order.createdAt)}</td>
                                            <td className="text-[10px] font-mono text-white/60 px-3 py-2">{order.pair}</td>
                                            <td className={`text-[10px] font-mono font-bold px-3 py-2 ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                                {order.side.toUpperCase()}
                                            </td>
                                            <td className="text-[10px] font-mono text-white/40 px-3 py-2 uppercase">
                                                {order.orderType.replace('_', ' ')}
                                            </td>
                                            <td className="text-[10px] font-mono text-white/60 px-3 py-2 text-right">
                                                {order.fillPrice ? formatPrice(order.fillPrice) : '—'}
                                            </td>
                                            <td className="text-[10px] font-mono text-white/60 px-3 py-2 text-right">
                                                {order.filledQuantity.toFixed(4)}
                                            </td>
                                            <td className="text-[10px] font-mono text-white/60 px-3 py-2 text-right">
                                                {order.fillPrice ? formatPrice(order.filledQuantity * order.fillPrice) : '—'}
                                            </td>
                                            <td className="text-[10px] font-mono text-white/30 px-3 py-2 text-right">
                                                {formatPrice(order.fee)}
                                            </td>
                                            <td className="px-3 py-2 text-center">{statusBadge(order.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ─── Balances ──── */}
                {tab === 'balances' && (
                    <div>
                        {balances.length === 0 ? (
                            <div className="py-8 text-center text-xs font-mono text-white/20">
                                Connect wallet to see balances
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] font-mono text-white/30 uppercase tracking-wider border-b border-white/5">
                                        <th className="text-left px-3 py-2">Token</th>
                                        <th className="text-right px-3 py-2">Available</th>
                                        <th className="text-right px-3 py-2">In Order</th>
                                        <th className="text-right px-3 py-2">Total</th>
                                        <th className="text-right px-3 py-2">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balances.map(bal => {
                                        const total = bal.available + bal.inOrder;
                                        const priceData = livePrices[bal.token as DemoToken];
                                        const usdValue = bal.token === 'USDC'
                                            ? total
                                            : priceData ? total * priceData.price : 0;

                                        return (
                                            <tr key={bal.token} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="text-xs font-mono font-bold text-white px-3 py-2.5">{bal.token}</td>
                                                <td className="text-[10px] font-mono text-white/60 px-3 py-2.5 text-right">
                                                    {bal.available > 1_000_000
                                                        ? bal.available.toLocaleString('en-US', { maximumFractionDigits: 0 })
                                                        : bal.available.toFixed(bal.available < 1 ? 6 : 2)
                                                    }
                                                </td>
                                                <td className="text-[10px] font-mono text-yellow-400/50 px-3 py-2.5 text-right">
                                                    {bal.inOrder > 0 ? bal.inOrder.toFixed(bal.inOrder < 1 ? 6 : 2) : '—'}
                                                </td>
                                                <td className="text-[10px] font-mono text-white/40 px-3 py-2.5 text-right">
                                                    {total > 1_000_000
                                                        ? total.toLocaleString('en-US', { maximumFractionDigits: 0 })
                                                        : total.toFixed(total < 1 ? 6 : 2)
                                                    }
                                                </td>
                                                <td className="text-[10px] font-mono text-white/60 px-3 py-2.5 text-right">
                                                    {formatPrice(usdValue)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
export default SpotTradeHistory;

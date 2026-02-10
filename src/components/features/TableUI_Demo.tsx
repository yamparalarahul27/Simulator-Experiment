import React, { useMemo } from 'react';
import { TableUI, Column } from '../ui/TableUI';
import { MOCK_TRADES } from '../../lib/mockData';
import { getPairImage } from '../../lib/tokenImages';
import { format } from 'date-fns';

export default function TableUI_Demo() {
    // Map MOCK_TRADES to table format with custom columns
    const tableData = useMemo(() => {
        return MOCK_TRADES.slice(0, 50).map(trade => ({
            id: trade.id,
            date: format(trade.closedAt, 'MMM d, yyyy'),
            time: format(trade.closedAt, 'HH:mm'),
            pair: trade.symbol,
            pairImage: getPairImage(trade.symbol),
            side: trade.side.toUpperCase(),
            type: trade.orderType,
            price: `$${trade.price.toFixed(2)}`,
            quantity: trade.quantity.toFixed(4),
            notional: `$${trade.notional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            pnl: trade.pnl,
            pnlFormatted: `${trade.pnl >= 0 ? '+' : ''}$${Math.abs(trade.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            fee: `$${trade.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            leverage: trade.leverage ? `${trade.leverage}x` : '1x',
            status: trade.isWin ? 'Win' : 'Loss',
        }));
    }, []);

    // Define custom columns with renderers
    const columns: Column[] = [
        {
            key: 'date',
            header: 'Date',
        },
        {
            key: 'time',
            header: 'Time',
        },
        {
            key: 'pair',
            header: 'Pair',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <img
                        src={row.pairImage}
                        alt={value}
                        className="w-6 h-6 rounded-none"
                    />
                    <span className="font-mono">{value}</span>
                </div>
            ),
        },
        {
            key: 'side',
            header: 'Side',
            render: (value) => (
                <span className={`px-2 py-1 rounded-sm text-xs font-mono ${value === 'BUY' || value === 'LONG'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                    }`}>
                    {value}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Type',
        },
        {
            key: 'price',
            header: 'Price',
        },
        {
            key: 'quantity',
            header: 'Quantity',
        },
        {
            key: 'notional',
            header: 'Total',
        },
        {
            key: 'pnlFormatted',
            header: 'PnL',
            render: (value, row) => (
                <span className={`font-mono font-bold ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {value}
                </span>
            ),
        },
        {
            key: 'fee',
            header: 'Fee',
        },
        {
            key: 'leverage',
            header: 'Leverage',
            render: (value) => (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-sm text-xs font-mono">
                    {value}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (value) => (
                <span className={`px-2 py-1 rounded-sm text-xs font-bold ${value === 'Win'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                    }`}>
                    {value}
                </span>
            ),
        },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Your Trade Data</h2>
                <p className="text-zinc-400">Showing recent 50 trades from mock data</p>
            </div>

            <TableUI data={tableData} columns={columns} maxHeight="70vh" />
        </div>
    );
}

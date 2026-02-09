import React, { useEffect, useState } from 'react';
import { TableUI } from '../ui/TableUI';

export default function TableUI_Demo() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mock Data to prevent fetch errors
        const mockData = Array.from({ length: 50 }, (_, i) => ({
            id: `trade-${i + 1}`,
            date: new Date(Date.now() - Math.random() * 1000000000).toISOString().split('T')[0],
            pair: ['SOL/USDC', 'BTC/USDC', 'ETH/USDC'][Math.floor(Math.random() * 3)],
            side: Math.random() > 0.5 ? 'Buy' : 'Sell',
            price: (Math.random() * 1000 + 10).toFixed(2),
            amount: (Math.random() * 10 + 0.1).toFixed(4),
            total: (Math.random() * 10000 + 100).toFixed(2),
            status: 'Completed'
        }));

        setData(mockData);
        setLoading(false);
    }, []);

    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Your Trade Data</h2>
                <p className="text-zinc-400">Showing recent 500 trades</p>
            </div>

            {loading ? (
                <div className="text-white/60 p-8 text-center rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl">
                    Loading trade data...
                </div>
            ) : error ? (
                <div className="text-red-400 p-8 text-center rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl">
                    Error loading data: {error}
                </div>
            ) : (
                <TableUI data={data} maxHeight="70vh" />
            )}
        </div>
    );
}

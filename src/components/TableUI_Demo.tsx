import React, { useEffect, useState } from 'react';
import { TableUI } from './TableUI';

export default function TableUI_Demo() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/data/trade_data.csv');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const text = await response.text();

                // Simple CSV Parser
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length === 0) {
                    setData([]);
                    return;
                }

                const headers = rows[0].split(',').map(h => h.trim());

                // Parse rows into objects
                const parsedData = rows.slice(1, 501).map(row => { // Limit to 500 for performance
                    const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Handle quoted commas if any, though simple split might work for this specific file based on look
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        // Clean quotes if present
                        let value = values[index]?.trim();
                        if (value && value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        obj[header] = value;
                    });
                    return obj;
                });

                setData(parsedData);
            } catch (err) {
                console.error("Error loading CSV:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Your Trade Data</h2>
                <p className="text-zinc-400">Last updated 20 days back. (Showing recent 500 trades)</p>
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

import { useState } from 'react';
import CardWithCornerShine from './CardWithCornerShine';
import AddressInput from './AddressInput';
import { HeliusService, TransactionLog } from './HeliusService';

export default function TradeHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const heliusService = new HeliusService();

  const handleAddressSubmit = async (address: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await heliusService.fetchAllTransactions(address);
      setTransactions(response.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyTransactions = transactions.length > 0;

  return (
    <div className="min-h-screen text-white py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Input Section */}
        <CardWithCornerShine padding="md">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Deriverse Activity Lookup
          </h2>
          <AddressInput
            onSubmit={handleAddressSubmit}
            loading={loading}
          />
        </CardWithCornerShine>

        {/* Error Display */}
        {error && hasSearched && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <div>
                <p className="text-white font-semibold mb-1">Service Status</p>
                <p className="text-zinc-300">{error}</p>
                {error.includes('unavailable') && (
                  <p className="text-zinc-400 text-sm mt-2">
                    You can check the status at: <a href="https://deriverse.gitbook.io/deriverse-v1" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Deriverse Documentation</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-zinc-900 rounded-none p-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-zinc-400">Fetching transactions...</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && hasSearched && (
          <>
            {/* No transactions found message */}
            {!hasAnyTransactions && !error && (
              <div className="bg-zinc-900 rounded-none p-6 mb-8 text-center">
                <p className="text-zinc-400">No transactions found for this address</p>
                <p className="text-zinc-500 text-sm mt-2">
                  This wallet may not have any activity on Solana Devnet
                </p>
              </div>
            )}

            {/* All Transactions Table */}
            {transactions.length > 0 && (
              <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <h3 className="text-lg font-semibold text-white">All Transactions (via Helius RPC)</h3>
                  <p className="text-sm text-zinc-400 mt-1">Showing last {transactions.length} transactions for this address</p>
                </div>
                <div className="overflow-x-auto max-h-[70vh]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider text-right">Fee (lamports)</th>
                        <th className="px-6 py-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx, index) => (
                        <tr
                          key={tx.signature}
                          className="hover:bg-white/5 transition-all duration-200 group"
                          style={{
                            animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                            {HeliusService.formatTime(tx.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 rounded-none text-xs font-semibold backdrop-blur-sm
                                            ${tx.type.includes('Transfer') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                tx.type.includes('Swap') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                  tx.type.includes('Deriverse') ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1.5 rounded-none text-xs font-semibold backdrop-blur-sm
                                           ${tx.status === 'Confirmed'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-mono font-semibold">
                            {tx.fee.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors font-mono group-hover:underline"
                            >
                              {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </>
        )}

        {/* Initial Instructions */}
        {!hasSearched && (
          <div className="bg-zinc-900 rounded-none p-8 text-left">
            <h3 className="text-xl font-semibold text-white mb-4">
              How Transaction Lookup Works
            </h3>
            <div className="text-zinc-400 space-y-2">
              <p>🔍 This tool uses <strong>Helius RPC</strong> to fetch transaction history from Solana Devnet</p>
              <p>Steps:</p>
              <p>1. Paste any Solana wallet address in the field above</p>
              <p>2. Click "Run" to fetch the last 50 transactions</p>
              <p>3. View all transaction types: transfers, swaps, and more</p>
              <p>4. Click on any signature to view details on Solscan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
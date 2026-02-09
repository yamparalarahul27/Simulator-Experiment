import { useState } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import AddressInput from '../ui/AddressInput';
import { HeliusService, TransactionLog } from '../../services/HeliusService';
import { DeriverseTradeService } from '../../services/DeriverseTradeService';
import { Trade } from '../../lib/types';
import { getRpcConnection } from '../../lib/utils';
import DeriverseTradesTable from './DeriverseTradesTable';

type TabType = 'deriverse' | 'all';

export default function TradeHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [deriverseTrades, setDeriverseTrades] = useState<Trade[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('deriverse');
  const [loadingDeriverse, setLoadingDeriverse] = useState(false);
  const [loadingHelius, setLoadingHelius] = useState(false);

  const heliusService = new HeliusService();
  const deriverseService = new DeriverseTradeService();

  const handleAddressSubmit = async (address: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setTransactions([]);
    setDeriverseTrades([]);

    // Fetch both in parallel using shared RPC connection
    const connection = getRpcConnection();

    try {
      // Fetch Helius transactions
      setLoadingHelius(true);
      const heliusPromise = heliusService.fetchAllTransactions(address)
        .then(response => {
          setTransactions(response.transactions);
          setLoadingHelius(false);
        })
        .catch(err => {
          console.error('[Helius] Error:', err);
          setLoadingHelius(false);
        });

      // Fetch Deriverse trades
      setLoadingDeriverse(true);
      const deriversePromise = deriverseService.fetchTradesForWallet(connection, address)
        .then(trades => {
          setDeriverseTrades(trades);
          setLoadingDeriverse(false);
        })
        .catch(err => {
          console.error('[Deriverse] Error:', err);
          setLoadingDeriverse(false);
        });

      await Promise.all([heliusPromise, deriversePromise]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

        {/* Results Section */}
        {hasSearched && !loading && (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('deriverse')}
                className={`px-6 py-3 font-semibold transition-all duration-200 relative
                           ${activeTab === 'deriverse'
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-zinc-400 hover:text-zinc-300'}`}
              >
                Deriverse Trades
                {deriverseTrades.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300">
                    {deriverseTrades.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 font-semibold transition-all duration-200 relative
                           ${activeTab === 'all'
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-zinc-400 hover:text-zinc-300'}`}
              >
                All Transactions
                {transactions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300">
                    {transactions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'deriverse' && (
              <div>
                {loadingDeriverse ? (
                  <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-zinc-400">Parsing Deriverse trades...</span>
                    </div>
                  </div>
                ) : (
                  <DeriverseTradesTable trades={deriverseTrades} />
                )}
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                {loadingHelius ? (
                  <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-zinc-400">Fetching transactions...</span>
                    </div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-12 text-center">
                    <p className="text-zinc-400">No transactions found for this address</p>
                    <p className="text-zinc-500 text-sm mt-2">
                      This wallet may not have any activity on Solana Devnet
                    </p>
                  </div>
                ) : (
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
              </div>
            )}
          </>
        )}

        {/* Initial Instructions */}
        {!hasSearched && (
          <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              How It Works
            </h3>
            <div className="text-zinc-400 space-y-2">
              <p>🎯 <strong>Deriverse Trades</strong>: Parsed on-chain trading activity (spot & perpetual fills, PnL, fees)</p>
              <p>📊 <strong>All Transactions</strong>: Complete transaction history via Helius RPC</p>
              <p className="mt-4">Steps:</p>
              <p>1. Paste any Solana wallet address</p>
              <p>2. Click "Run" to fetch both Deriverse trades and all transactions</p>
              <p>3. Switch between tabs to view different data</p>
              <p>4. Click signatures to view details on Solscan</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
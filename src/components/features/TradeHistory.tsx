import { useState } from 'react';
import CardWithCornerShine from '../ui/CardWithCornerShine';
import AddressInput from '../ui/AddressInput';
import { HeliusService, TransactionLog } from '../../services/HeliusService';
import { DeriverseTradeService } from '../../services/DeriverseTradeService';
import { getRpcConnection } from '../../lib/utils';
import DeriverseTradesTable from './DeriverseTradesTable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { useWalletConnection } from '../../lib/hooks/useWalletConnection';
import { SupabaseWalletService } from '../../services/SupabaseWalletService';
import { SupabaseTradeService } from '../../services/SupabaseTradeService';
import { toast } from 'sonner';

type TabType = 'deriverse' | 'all';
type InputMode = 'manual' | 'wallet';

/**
 * Trade history component for fetching and displaying wallet transaction data
 * 
 * @returns Interface for wallet address input and transaction history display
 */
export default function TradeHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [deriverseTrades, setDeriverseTrades] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('deriverse');
  const [loadingDeriverse, setLoadingDeriverse] = useState(false);
  const [loadingHelius, setLoadingHelius] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);
  const [savingTrades, setSavingTrades] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);

  const heliusService = new HeliusService();
  const deriverseService = new DeriverseTradeService();
  const walletService = new SupabaseWalletService();
  const tradeService = new SupabaseTradeService();
  const {
    connect,
    disconnect,
    connected,
    connecting,
    walletAddress,
    shortAddress,
    walletName,
    openWalletModal
  } = useWalletConnection();

  const handleWalletConnect = async () => {
    try {
      openWalletModal();
      await connect();
    } catch (err) {
      console.error('[Wallet] connect failed', err);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('[Wallet] disconnect failed', err);
    }
  };

  const handleAddressSubmit = async (address: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setTransactions([]);
    setDeriverseTrades([]);
    setCurrentWalletAddress(address);

    // Fetch both in parallel using shared RPC connection
    const connection = getRpcConnection();

    try {
      // Save wallet to Supabase
      try {
        await walletService.saveWallet({
          address,
          network: 'devnet',
          provider: walletName || undefined,
          method: inputMode === 'wallet' ? 'wallet_connect' : 'manual',
        });
        console.log('[Supabase] Wallet saved:', address);
      } catch (supabaseError) {
        console.error('[Supabase] Failed to save wallet:', supabaseError);
        // Don't block the trade fetch if Supabase fails
      }

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

  const handleSaveTrades = async () => {
    if (!currentWalletAddress || deriverseTrades.length === 0) {
      return;
    }

    setSavingTrades(true);
    try {
      const result = await tradeService.saveTrades(currentWalletAddress, deriverseTrades);
      console.log(`[Supabase] Saved ${result.saved} trades`);
      toast.success(`Successfully saved ${result.saved} trades!`, {
        description: 'Trades are now cached in database',
        duration: 3000,
      });
    } catch (error) {
      console.error('[Supabase] Failed to save trades:', error);
      toast.error('Failed to save trades', {
        description: 'Please check your connection and try again',
        duration: 4000,
      });
    } finally {
      setSavingTrades(false);
    }
  };

  return (
    <div className="min-h-screen text-white py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Input Mode Switcher */}
        <div className="flex gap-4 border-b border-white/10 pb-2">
          {(['manual', 'wallet'] as InputMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`px-4 py-2 font-semibold uppercase tracking-wide text-sm transition-all ${inputMode === mode
                ? 'text-white border-b-2 border-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {mode === 'manual' ? 'Manual Address' : 'Connect Wallet'}
            </button>
          ))}
        </div>

        {/* Input Section */}
        <CardWithCornerShine padding="xs">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Wallet Transaction Search on Devnet
          </h2>
          {inputMode === 'manual' ? (
            <AddressInput
              onSubmit={handleAddressSubmit}
              loading={loading}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center py-4 w-full">
              <p className="text-zinc-400 max-w-md">
                Connect your Solana wallet to quickly run the lookup without pasting the address manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <button
                  onClick={handleWalletConnect}
                  disabled={connecting || connected}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-none font-semibold text-white hover:bg-white/15 transition disabled:opacity-50"
                >
                  {connecting
                    ? 'Connecting…'
                    : connected
                      ? 'Wallet Connected'
                      : 'Connect Wallet'}
                </button>
                {connected && (
                  <button
                    onClick={handleWalletDisconnect}
                    className="px-6 py-3 border border-white/20 rounded-none font-semibold text-white hover:bg-white/10 transition"
                  >
                    Disconnect
                  </button>
                )}
              </div>
              {walletAddress && (
                <div className="text-sm text-blue-300 font-mono">
                  {walletName ? `${walletName} • ${shortAddress}` : shortAddress}
                </div>
              )}
              <button
                onClick={() => walletAddress && handleAddressSubmit(walletAddress)}
                disabled={!walletAddress || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-none font-semibold hover:bg-blue-700 transition disabled:bg-blue-900/40"
              >
                {loading ? 'Running…' : walletAddress ? 'Run Lookup' : 'Connect to Run'}
              </button>
            </div>
          )}
        </CardWithCornerShine>

        {/* Results Section */}
        {hasSearched && !loading && (
          <CardWithCornerShine padding="sm" className="space-y-6">
            {/* Results Header */}
            <div className="flex gap-4 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab('deriverse')}
                className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide transition-all ${activeTab === 'deriverse'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
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
                className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide transition-all ${activeTab === 'all'
                  ? 'text-white border-b-2 border-blue-400'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
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
              <div className="space-y-4">
                {loadingDeriverse ? (
                  <div className="rounded-none border border-white/10 bg-black/80 backdrop-blur-xl p-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-zinc-400">Parsing Deriverse trades...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <DeriverseTradesTable trades={deriverseTrades} />
                    {deriverseTrades.length > 0 && currentWalletAddress && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveTrades}
                          disabled={savingTrades}
                          className="px-6 py-3 bg-blue-600 text-white rounded-none font-semibold hover:bg-blue-700 transition disabled:bg-blue-900/40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {savingTrades ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              <span>Save {deriverseTrades.length} Trades to Database</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
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
          </CardWithCornerShine>
        )}

        {/* Initial Instructions */}
        {!hasSearched && (
          <Accordion
            type="single"
            collapsible
            value={howItWorksOpen ? 'how-it-works' : undefined}
            onValueChange={value => setHowItWorksOpen(value === 'how-it-works')}
            className="border border-white/10 rounded-none bg-black/80"
          >
            <AccordionItem value="how-it-works" className="px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <span>How It Works</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-zinc-400 space-y-2">
                  {inputMode === 'manual' ? (
                    <>
                      <p>🎯 <strong>Deriverse Trades</strong>: Parsed on-chain trading activity (spot & perpetual fills, PnL, fees)</p>
                      <p>📊 <strong>All Transactions</strong>: Complete transaction history via Helius RPC</p>
                      <p className="mt-4 font-semibold text-white">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                        <li>Paste any Solana wallet address or connect your wallet</li>
                        <li>Click "Run" to fetch Deriverse trades & full history</li>
                        <li>Switch between tabs to compare Deriverse vs. all transactions</li>
                        <li>Open any signature in Solscan for full details</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 font-semibold text-white">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                        <li>Click "Connect Wallet" to link your Solana wallet</li>
                        <li>Choose your preferred wallet provider (Phantom, Solflare, etc.)</li>
                        <li>Approve the connection to fetch your wallet address</li>
                        <li>Click "Run" to load Deriverse trades & transaction history</li>
                        <li>Switch between tabs to compare Deriverse vs. all transactions</li>
                        <li>Open any signature in Solscan for full details</li>
                      </ol>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
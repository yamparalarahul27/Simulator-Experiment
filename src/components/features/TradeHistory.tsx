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
import AnalyticsConfirmModal from '../ui/AnalyticsConfirmModal';
import SyncStatus from '../ui/SyncStatus';

type TabType = 'deriverse' | 'all';
type InputMode = 'manual' | 'wallet';

interface TradeHistoryProps {
  onSwitchToRealData?: (walletAddress: string) => void;
}

/**
 * Trade history component for fetching and displaying wallet transaction data
 * 
 * @returns Interface for wallet address input and transaction history display
 */
export default function TradeHistory({ onSwitchToRealData }: TradeHistoryProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [deriverseTrades, setDeriverseTrades] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('deriverse');
  const [loadingDeriverse, setLoadingDeriverse] = useState(false);
  const [loadingHelius, setLoadingHelius] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('wallet');
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);
  const [savingTrades, setSavingTrades] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);

  // Modal state
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [savedTradeCount, setSavedTradeCount] = useState(0);

  // Cached trades state
  const [dataSource, setDataSource] = useState<'cache' | 'fresh'>('fresh');
  const [hasCachedData, setHasCachedData] = useState(false);
  const [walletInfo, setWalletInfo] = useState<any>(null);

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

  const handleAddressSubmit = async (address: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    // Only clear tables if we are doing a fresh lookup or forced refresh
    if (forceRefresh || !hasCachedData) {
      setTransactions([]);
      setDeriverseTrades([]);
    }

    setCurrentWalletAddress(address);
    if (forceRefresh) {
      setDataSource('fresh');
    }

    try {
      // Save/Get wallet from Supabase
      let currentWallet;
      try {
        currentWallet = await walletService.saveWallet({
          address,
          network: 'devnet',
          provider: walletName || undefined,
          method: inputMode === 'wallet' ? 'wallet_connect' : 'manual',
        });
        console.log('[Supabase] Wallet info sync:', address);
        setWalletInfo(currentWallet);
      } catch (supabaseError) {
        console.error('[Supabase] Failed to sync wallet info:', supabaseError);
      }

      // Check for cached trades if not forced to refresh
      let cachedTrades: any[] = [];
      if (!forceRefresh) {
        try {
          cachedTrades = await tradeService.getTrades(address);
          if (cachedTrades.length > 0) {
            console.log(`[Cache] Found ${cachedTrades.length} cached trades`);
            setDeriverseTrades(cachedTrades);
            setDataSource('cache');
            setHasCachedData(true);
            setLoadingDeriverse(false);
          }
        } catch (cacheError) {
          console.warn('[Cache] Failed to load cached trades:', cacheError);
        }
      }

      // Fetch fresh data if needed (forced or no cache)
      if (forceRefresh || cachedTrades.length === 0) {
        const connection = getRpcConnection();
        setDataSource('fresh');

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
          .then(async (trades) => {
            setDeriverseTrades(trades);
            setLoadingDeriverse(false);
            setHasCachedData(true); // Now we have data that CAN be cached

            // Update sync time after successful fetch
            try {
              await walletService.updateSyncTime(address);
              // Refresh wallet info from DB to get NEW sync time
              const updatedWallet = await walletService.getWallet(address);
              if (updatedWallet) setWalletInfo(updatedWallet);
              console.log('[Supabase] Updated sync time for:', address);
            } catch (syncError) {
              console.warn('[Supabase] Failed to update sync time:', syncError);
            }
          })
          .catch(err => {
            console.error('[Deriverse] Error:', err);
            setLoadingDeriverse(false);
          });

        await Promise.all([heliusPromise, deriversePromise]);
      } else {
        // We are showing cached data. Skip Helius fetch to save RPC credits.
        console.log('[Cache] Skipping Helius fetch to save RPC credits');
      }
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

      // Update state and show modal
      setSavedTradeCount(result.saved);
      setShowAnalyticsModal(true);

      // Also show toast as backup/confirmation
      toast.success(`Successfully saved ${result.saved} trades!`);
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

  const handleAnalyticsConfirm = () => {
    setShowAnalyticsModal(false);
    if (onSwitchToRealData && currentWalletAddress) {
      onSwitchToRealData(currentWalletAddress);
    }
  };

  return (
    <div className="min-h-screen text-bs-text-primary py-8">
      <AnalyticsConfirmModal
        isOpen={showAnalyticsModal}
        onConfirm={handleAnalyticsConfirm}
        onCancel={() => setShowAnalyticsModal(false)}
        tradeCount={savedTradeCount}
      />
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Input Mode Switcher */}
        <div className="flex gap-4 border-b border-bs-border pb-2">
          {(['wallet', 'manual'] as InputMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`px-4 py-2 font-semibold uppercase tracking-wide text-sm transition-all ${inputMode === mode
                ? 'text-bs-text-primary border-b-2 border-blue-400'
                : 'text-bs-text-mute hover:text-bs-text-secondary'
                }`}
            >
              {mode === 'manual' ? 'Manual Address' : 'Connect Wallet'}
            </button>
          ))}
        </div>

        {/* Input Section */}
        <CardWithCornerShine padding="xs">
          <h2 className="text-xl font-semibold text-bs-text-primary mb-4 text-center">
            Wallet Transaction Search on Devnet
          </h2>
          {inputMode === 'manual' ? (
            <AddressInput
              onSubmit={handleAddressSubmit}
              loading={loading}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center py-4 w-full">
              <p className="text-bs-text-tertiary max-w-md">
                Connect your Solana wallet to quickly run the lookup without pasting the address manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <button
                  onClick={handleWalletConnect}
                  disabled={connecting || connected}
                  className="px-6 py-3 bg-bs-card-fg border border-bs-border rounded-lg font-semibold text-bs-text-primary hover:bg-bs-card-fg transition disabled:opacity-50"
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
                    className="px-6 py-3 border border-bs-border rounded-lg font-semibold text-bs-text-primary hover:bg-bs-card-fg transition"
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
                onClick={() => walletAddress && handleAddressSubmit(walletAddress, hasCachedData)}
                disabled={!walletAddress || loading}
                className={`px-6 py-3 text-bs-text-primary rounded-lg font-semibold transition disabled:opacity-50 
                  ${hasCachedData ? 'bg-bs-card-fg hover:bg-bs-border border border-bs-border' : 'bg-[#69a2f1] hover:bg-[#69a2f1]/80'}`}
              >
                {loading ? 'Running…' : walletAddress ? (hasCachedData ? 'Force Refresh' : 'Run Lookup') : 'Connect to Run'}
              </button>
            </div>
          )}
        </CardWithCornerShine>

        {/* Results Section */}
        {hasSearched && !loading && (
          <CardWithCornerShine padding="sm" className="space-y-6">
            {/* Results Header */}
            <div className="flex gap-4 border-b border-bs-border pb-2">
              <button
                onClick={() => setActiveTab('deriverse')}
                className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide transition-all ${activeTab === 'deriverse'
                  ? 'text-bs-text-primary border-b-2 border-blue-400'
                  : 'text-bs-text-tertiary hover:text-bs-text-primary'
                  }`}
              >
                Deriverse Trades
                {deriverseTrades.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#69a2f1]/20 text-blue-300">
                    {deriverseTrades.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 font-semibold text-sm uppercase tracking-wide transition-all ${activeTab === 'all'
                  ? 'text-bs-text-primary border-b-2 border-blue-400'
                  : 'text-bs-text-tertiary hover:text-bs-text-primary'
                  }`}
              >
                All Transactions
                {transactions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#69a2f1]/20 text-blue-300">
                    {transactions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sync Status */}
            {dataSource === 'cache' && walletInfo && (
              <SyncStatus
                lastSyncedAt={walletInfo.last_synced_at}
                dataSource="cache"
                isLoading={false}
                context="tradeHistory"
              />
            )}

            {/* Tab Content */}
            {activeTab === 'deriverse' && (
              <div className="space-y-4">
                {loadingDeriverse ? (
                  <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-bs-text-tertiary">Parsing Deriverse trades...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <DeriverseTradesTable
                      trades={deriverseTrades}
                      onSaveTrades={handleSaveTrades}
                      savingTrades={savingTrades}
                      currentWalletAddress={currentWalletAddress}
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                {loadingHelius ? (
                  <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-bs-text-tertiary">Fetching transactions...</span>
                    </div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto">
                    <p className="text-bs-text-tertiary mb-2">Transaction history is not cached.</p>
                    <p className="text-bs-text-mute text-sm mb-6 italic">
                      "Sorry for the inconvenience, we are working on limited resources, that's why this force refresh is enabled, to save Helius usage."
                    </p>
                    <p className="text-bs-text-tertiary text-sm">
                      Click <span className="text-bs-text-primary font-semibold">"Force Refresh"</span> above to fetch full transaction history from Helius.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-bs-border bg-bs-bg/80 backdrop-blur-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-bs-border bg-gradient-to-r from-white/5 to-transparent">
                      <h3 className="text-lg font-semibold text-bs-text-primary">All Transactions (via Helius RPC)</h3>
                      <p className="text-sm text-bs-text-tertiary mt-1">Showing last {transactions.length} transactions for this address</p>
                    </div>
                    <div className="overflow-x-auto max-h-[70vh]">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-bs-bg/90 backdrop-blur-xl border-b border-bs-border">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Time</th>
                            <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider text-right">Fee (lamports)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Signature</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-bs-border">
                          {transactions.map((tx, index) => (
                            <tr
                              key={tx.signature}
                              className="hover:bg-bs-card transition-all duration-200 group"
                              style={{
                                animation: `fadeIn 0.3s ease-in-out ${index * 0.05}s both`
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-bs-text-secondary">
                                {HeliusService.formatTime(tx.time)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                                                ${tx.type.includes('Transfer') ? 'bg-[#69a2f1]/20 text-blue-300 border border-[#69a2f1]/30' :
                                    tx.type.includes('Swap') ? 'bg-bs-brand-tertiary/20 text-bs-brand-secondary border border-bs-brand-tertiary/30' :
                                      tx.type.includes('Deriverse') ? 'bg-bs-success/20 text-green-300 border border-[#00e66b]/30' :
                                        'bg-bs-text-mute/20 text-bs-text-secondary border border-[#585e6c]/30'}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                                               ${tx.status === 'Confirmed'
                                    ? 'bg-bs-success/20 text-green-300 border border-[#00e66b]/30'
                                    : 'bg-bs-error/20 text-red-300 border border-[#ff285a]/30'}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-bs-text-primary font-mono font-semibold">
                                {tx.fee.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <a
                                  href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-bs-brand-ts hover:text-blue-300 transition-colors font-mono group-hover:underline"
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
            className="border border-bs-border rounded-lg bg-bs-bg/80"
          >
            <AccordionItem value="how-it-works" className="px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <span>How It Works</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-bs-text-tertiary space-y-2">
                  {inputMode === 'manual' ? (
                    <>
                      <p>🎯 <strong>Deriverse Trades</strong>: Parsed on-chain trading activity (spot & perpetual fills, PnL, fees)</p>
                      <p>📊 <strong>All Transactions</strong>: Complete transaction history via Helius RPC</p>
                      <p className="mt-4 font-semibold text-bs-text-primary">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-bs-text-secondary">
                        <li>Paste any Solana wallet address or connect your wallet</li>
                        <li>Click "Run" to fetch Deriverse trades & full history</li>
                        <li>Switch between tabs to compare Deriverse vs. all transactions</li>
                        <li>Open any signature in Solscan for full details</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 font-semibold text-bs-text-primary">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-bs-text-secondary">
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
'use client';

import { useState } from 'react';
import CardWithCornerShine from './CardWithCornerShine';
import AddressInput from './AddressInput';
import OrdersTable from './OrdersTable';

import { DeriverseService, OrderData, TradeHistoryResponse } from './DeriverseService';

export default function TradeHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spotOrders, setSpotOrders] = useState<OrderData[]>([]);
  const [perpOrders, setPerpOrders] = useState<OrderData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const deriverseService = new DeriverseService();

  const handleAddressSubmit = async (address: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response: TradeHistoryResponse = await deriverseService.fetchTradesForAddress(address);
      setSpotOrders(response.spotOrders);
      setPerpOrders(response.perpOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSpotOrders([]);
      setPerpOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyOrders = spotOrders.length > 0 || perpOrders.length > 0;

  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Input Section */}
        <CardWithCornerShine padding="md">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Trade Wallet Lookup
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
          <div className="bg-zinc-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-zinc-400">Fetching trades from Deriverse...</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && hasSearched && (
          <>
            {/* No trades found message */}
            {!hasAnyOrders && !error && (
              <div className="bg-zinc-900 rounded-lg p-6 mb-8 text-center">
                <p className="text-zinc-400">No trades found on Deriverse Devnet</p>
                <p className="text-zinc-500 text-sm mt-2">
                  This wallet may not have traded on Deriverse or only has mainnet activity
                </p>
              </div>
            )}

            {/* Spot Orders Table */}
            <OrdersTable
              title="Spot Orders"
              orders={spotOrders}
              loading={loading}
            />

            {/* Perpetual Orders Table */}
            <OrdersTable
              title="Perpetual Orders"
              orders={perpOrders}
              loading={loading}
            />
          </>
        )}

        {/* Initial Instructions */}
        {!hasSearched && (
          <div className="bg-zinc-900 rounded-none p-8 text-left">
            <h3 className="text-xl font-semibold text-white mb-4">
              How Deriverse Lookup Works (Devnet)
            </h3>
            <div className="text-zinc-400 space-y-2">
              <p>🧪 This Lookup tool connects to <strong>Deriverse SDK</strong> to fetch the trades done on <a href="http://alpha.deriverse.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Deriverse DEX</a></p>
              <p>Steps:</p>
              <p>1. Paste your Solana wallet address in the field above</p>
              <p>2. Click "Run" to fetch trading data from Deriverse DEX</p>
              <p>3. View spot and perpetual orders for that address</p>
              <p>4. Note: Only devnet trading data will be shown</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
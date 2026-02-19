'use client';

import { useMemo } from 'react';

interface Exchange {
  name: string;
  status: 'connected' | 'disconnected';
  accounts: number;
  lastSynced: string;
  network: string;
}

const exchanges: Exchange[] = [
  {
    name: 'Binance (CEX)',
    status: 'connected',
    accounts: 2,
    lastSynced: '5m ago',
    network: 'API Key'
  },
  {
    name: 'Raydium (DEX)',
    status: 'connected',
    accounts: 3,
    lastSynced: '10m ago',
    network: 'Solana'
  },
  {
    name: 'Jupiter (Aggregator)',
    status: 'disconnected',
    accounts: 0,
    lastSynced: 'Not synced',
    network: 'Solana'
  },
  {
    name: 'Pacifica DEX',
    status: 'disconnected',
    accounts: 0,
    lastSynced: 'Not synced',
    network: 'https://pacificadex.com/'
  },
  {
    name: 'Backpack Exchange',
    status: 'disconnected',
    accounts: 0,
    lastSynced: 'Not synced',
    network: 'https://backpack.exchange/'
  }
];

export default function ExchangeManager() {
  const summary = useMemo(() => {
    const connected = exchanges.filter(e => e.status === 'connected').length;
    const totalAccounts = exchanges.reduce((sum, e) => sum + e.accounts, 0);
    return { connected, totalAccounts };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">Exchange Manager</p>
            <h1 className="text-3xl font-semibold text-white">Connect and manage exchanges</h1>
            <p className="text-white/60 mt-2 max-w-2xl">
              Control centralized and decentralized exchange connections in one place. Add API keys, refresh balances,
              and keep your trade data in sync across networks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white text-black font-semibold uppercase tracking-wide text-xs border border-white/20 hover:bg-white/90 transition-colors">
              Add Exchange
            </button>
            <button className="px-4 py-2 bg-transparent text-white font-semibold uppercase tracking-wide text-xs border border-white/30 hover:border-white hover:bg-white/5 transition-colors">
              Sync All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Connected Exchanges</p>
            <p className="text-3xl font-semibold text-white">{summary.connected}</p>
            <p className="text-white/60 text-sm">Active connections across CEX and DEX</p>
          </div>
          <div className="border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Tracked Accounts</p>
            <p className="text-3xl font-semibold text-white">{summary.totalAccounts}</p>
            <p className="text-white/60 text-sm">Wallets and subaccounts being monitored</p>
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Connections</h2>
          <span className="text-xs text-white/50">Status · Network · Accounts · Last Sync</span>
        </div>
        <div className="divide-y divide-white/10">
          {exchanges.map((exchange) => (
            <div key={exchange.name} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-medium">{exchange.name}</p>
                <p className="text-white/50 text-sm">{exchange.network}</p>
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <span
                  className={`h-2 w-2 rounded-full ${exchange.status === 'connected' ? 'bg-emerald-400' : 'bg-orange-400'}`}
                  aria-hidden
                />
                <span className="text-white/70 text-sm capitalize">{exchange.status}</span>
              </div>
              <div className="text-white/70 text-sm min-w-[120px]">{exchange.accounts} accounts</div>
              <div className="text-white/50 text-sm min-w-[120px]">{exchange.lastSynced}</div>
              <div className="flex items-center gap-2 ml-auto">
                <button className="px-3 py-2 text-xs uppercase tracking-wide border border-white/20 text-white hover:border-white/50">
                  Manage
                </button>
                <button className="px-3 py-2 text-xs uppercase tracking-wide border border-white/20 text-white hover:border-white/50">
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-dashed border-white/20 bg-white/5 p-4">
        <h3 className="text-white font-semibold mb-2">Integration notes</h3>
        <ul className="text-white/60 text-sm list-disc pl-4 space-y-1">
          <li>Use API keys or wallet connections depending on the exchange type.</li>
          <li>We never store private keys; only signed transactions and encrypted secrets.</li>
          <li>Per-exchange rate limits are respected to avoid throttling during sync.</li>
        </ul>
      </div>
    </div>
  );
}

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-[#585e6c]">Exchange Manager</p>
            <h1 className="text-xl md:text-3xl font-semibold text-white">Connect and manage exchanges</h1>
            <p className="text-[#adb9d2] mt-2 max-w-2xl text-sm md:text-base">
              Control centralized and decentralized exchange connections in one place. Add API keys, refresh balances,
              and keep your trade data in sync across networks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white text-black font-semibold uppercase tracking-wide text-xs border border-white/20 hover:bg-white/90 transition-colors">
              Add Exchange
            </button>
            <button className="px-4 py-2 bg-transparent text-white font-semibold uppercase tracking-wide text-xs border border-white/30 hover:border-white hover:bg-[#11141a] transition-colors">
              Sync All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-[#1a1e26] bg-[#11141a] p-4">
            <p className="text-[#adb9d2] text-xs uppercase tracking-[0.2em]">Connected Exchanges</p>
            <p className="text-3xl font-semibold text-white">{summary.connected}</p>
            <p className="text-[#adb9d2] text-sm">Active connections across CEX and DEX</p>
          </div>
          <div className="border border-[#1a1e26] bg-[#11141a] p-4">
            <p className="text-[#adb9d2] text-xs uppercase tracking-[0.2em]">Tracked Accounts</p>
            <p className="text-3xl font-semibold text-white">{summary.totalAccounts}</p>
            <p className="text-[#adb9d2] text-sm">Wallets and subaccounts being monitored</p>
          </div>
        </div>
      </div>

      <div className="border border-[#1a1e26] bg-[#11141a]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1e26]">
          <h2 className="text-base md:text-lg font-semibold text-white">Connections</h2>
          <span className="text-xs text-[#adb9d2] hidden md:inline">Status · Network · Accounts · Last Sync</span>
        </div>
        <div className="divide-y divide-[#1a1e26]">
          {exchanges.map((exchange) => (
            <div key={exchange.name} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
              <div className="flex-1 min-w-0 md:min-w-[200px]">
                <p className="text-white font-medium text-sm md:text-base">{exchange.name}</p>
                <p className="text-[#adb9d2] text-xs md:text-sm truncate">{exchange.network}</p>
              </div>
              <div className="flex items-center justify-between gap-4 md:contents">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${exchange.status === 'connected' ? 'bg-emerald-400' : 'bg-orange-400'}`}
                    aria-hidden
                  />
                  <span className="text-[#ced5e4] text-sm capitalize">{exchange.status}</span>
                </div>
                <div className="text-[#ced5e4] text-sm">{exchange.accounts} accounts</div>
                <div className="text-[#adb9d2] text-sm">{exchange.lastSynced}</div>
              </div>
              <div className="flex items-center gap-2 md:ml-auto">
                <button className="flex-1 md:flex-none px-3 py-2 text-xs uppercase tracking-wide border border-white/20 text-white hover:border-[#1a1e26]0">
                  Manage
                </button>
                <button className="flex-1 md:flex-none px-3 py-2 text-xs uppercase tracking-wide border border-white/20 text-white hover:border-[#1a1e26]0">
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-dashed border-white/20 bg-[#11141a] p-4">
        <h3 className="text-white font-semibold mb-2">Integration notes</h3>
        <ul className="text-[#adb9d2] text-sm list-disc pl-4 space-y-1">
          <li>Use API keys or wallet connections depending on the exchange type.</li>
          <li>We never store private keys; only signed transactions and encrypted secrets.</li>
          <li>Per-exchange rate limits are respected to avoid throttling during sync.</li>
        </ul>
      </div>
    </div>
  );
}

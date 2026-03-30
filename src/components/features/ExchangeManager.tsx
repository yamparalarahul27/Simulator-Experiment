'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

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
        network: 'API Key',
    },
    {
        name: 'Raydium (DEX)',
        status: 'connected',
        accounts: 3,
        lastSynced: '10m ago',
        network: 'Solana',
    },
    {
        name: 'Jupiter (Aggregator)',
        status: 'disconnected',
        accounts: 0,
        lastSynced: 'Not synced',
        network: 'Solana',
    },
    {
        name: 'Pacifica DEX',
        status: 'disconnected',
        accounts: 0,
        lastSynced: 'Not synced',
        network: 'https://pacificadex.com/',
    },
    {
        name: 'Backpack Exchange',
        status: 'disconnected',
        accounts: 0,
        lastSynced: 'Not synced',
        network: 'https://backpack.exchange/',
    },
];

export default function ExchangeManager() {
    const summary = useMemo(() => {
        const connected = exchanges.filter((exchange) => exchange.status === 'connected').length;
        const totalAccounts = exchanges.reduce((sum, exchange) => sum + exchange.accounts, 0);
        return { connected, totalAccounts };
    }, []);

    return (
        <div className="space-y-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">Exchange Manager</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Connect and govern every exchange in one view.
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Add connections, monitor sync state, and keep wallet plus CEX activity organized across your
                    workflow.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <button className="rounded-xl bg-bs-brand-rust px-4 py-2 text-sm font-semibold text-black">
                        Add Exchange
                    </button>
                    <button className="rounded-xl border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-primary">
                        Sync All
                    </button>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                    <p className="text-sm text-bs-text-tertiary">Connected exchanges</p>
                    <p className="mt-1 text-4xl font-semibold tabular-nums text-bs-text-primary">{summary.connected}</p>
                    <p className="mt-2 text-sm text-bs-text-secondary">Active CEX and DEX integrations.</p>
                </article>
                <article className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                    <p className="text-sm text-bs-text-tertiary">Tracked accounts</p>
                    <p className="mt-1 text-4xl font-semibold tabular-nums text-bs-text-primary">{summary.totalAccounts}</p>
                    <p className="mt-2 text-sm text-bs-text-secondary">Wallets and exchange subaccounts monitored.</p>
                </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-bs-border bg-bs-card">
                <div className="border-b border-bs-border px-5 py-4">
                    <h2 className="text-xl font-semibold text-bs-text-primary text-balance">Connections</h2>
                </div>
                <div className="divide-y divide-bs-border">
                    {exchanges.map((exchange) => (
                        <article
                            key={exchange.name}
                            className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                        >
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-bs-text-primary text-balance">{exchange.name}</h3>
                                <p className="mt-1 truncate text-sm text-bs-text-tertiary">{exchange.network}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                                        exchange.status === 'connected'
                                            ? 'border-bs-success/30 bg-bs-success/10 text-bs-success'
                                            : 'border-bs-brand-rust/30 bg-bs-brand-rust/10 text-bs-brand-rust'
                                    )}
                                >
                                    <span className="size-1.5 rounded-full bg-current" />
                                    {exchange.status}
                                </span>
                                <span className="text-sm tabular-nums text-bs-text-secondary">
                                    {exchange.accounts} account{exchange.accounts === 1 ? '' : 's'}
                                </span>
                                <span className="text-sm text-bs-text-tertiary">{exchange.lastSynced}</span>
                            </div>

                            <div className="flex items-center gap-2 md:ml-4">
                                <button className="rounded-lg border border-bs-border px-3 py-1.5 text-xs font-medium text-bs-text-primary">
                                    Manage
                                </button>
                                <button className="rounded-lg border border-bs-border px-3 py-1.5 text-xs font-medium text-bs-text-primary">
                                    Sync
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card-fg px-5 py-6">
                <h3 className="text-lg font-semibold text-bs-text-primary text-balance">Integration notes</h3>
                <ul className="mt-3 grid gap-2">
                    <li className="text-sm text-bs-text-secondary text-pretty">
                        Use API keys or wallet connections depending on exchange type.
                    </li>
                    <li className="text-sm text-bs-text-secondary text-pretty">
                        Private keys are never stored. Only encrypted credentials and signed metadata are persisted.
                    </li>
                    <li className="text-sm text-bs-text-secondary text-pretty">
                        Per-exchange rate limits are respected automatically during sync runs.
                    </li>
                </ul>
            </section>
        </div>
    );
}

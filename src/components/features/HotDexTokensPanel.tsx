'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ExternalLink, Flame, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';

import type { HotDiscoveryResponse, HotTokenCandidate } from '@/lib/discovery/types';
import { cn } from '@/lib/utils';

interface ChainPreset {
    key: string;
    label: string;
}

const CHAIN_PRESETS: ChainPreset[] = [
    { key: 'solana,base', label: 'Solana + Base' },
    { key: 'solana', label: 'Solana' },
    { key: 'base', label: 'Base' },
    { key: 'ethereum', label: 'Ethereum' },
];

interface HotDexTokensPanelProps {
    className?: string;
    limit?: number;
    defaultChains?: string;
    showChainPresets?: boolean;
}

const fetcher = async (url: string): Promise<HotDiscoveryResponse> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json() as Promise<HotDiscoveryResponse>;
};

function formatUsdCompact(value: number): string {
    if (!Number.isFinite(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPrice(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '$0';
    if (value >= 1_000) {
        return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
    if (value >= 1) {
        return `$${value.toFixed(4)}`;
    }
    if (value >= 0.01) {
        return `$${value.toFixed(6)}`;
    }
    return `$${value.toFixed(8)}`;
}

function formatPct(value: number): string {
    if (!Number.isFinite(value)) return '0.00%';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
}

function scoreClass(score: number): string {
    if (score >= 80) return 'border-bs-success/35 bg-bs-success/10 text-bs-success';
    if (score >= 65) return 'border-bs-brand-rust/35 bg-bs-brand-rust/10 text-bs-brand-rust';
    return 'border-bs-border bg-bs-card-fg text-bs-text-secondary';
}

function freshnessText(generatedAt?: string): string {
    if (!generatedAt) return 'Live feed';
    const generatedMs = Date.parse(generatedAt);
    if (!Number.isFinite(generatedMs)) return 'Live feed';

    const diffSeconds = Math.max(Math.round((Date.now() - generatedMs) / 1000), 0);
    if (diffSeconds < 5) return 'Updated just now';
    if (diffSeconds < 60) return `Updated ${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    return `Updated ${diffMinutes}m ago`;
}

function TokenRow({ token }: { token: HotTokenCandidate }) {
    const isUp = token.priceChangeH1 >= 0;
    const topTags = token.tags.slice(0, 3);

    return (
        <li className="rounded-xl border border-bs-border bg-bs-card-fg p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-bs-border px-1.5 text-[11px] font-semibold text-bs-text-secondary">
                            {token.rank}
                        </span>
                        <span className="text-sm font-semibold text-bs-text-primary">{token.tokenSymbol}</span>
                        <span className="truncate text-xs text-bs-text-tertiary">{token.tokenName}</span>
                        <span className="rounded-md border border-bs-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-bs-text-secondary">
                            {token.chainId}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-bs-text-primary">{formatPrice(token.priceUsd)}</span>
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                                isUp
                                    ? 'border-bs-success/35 bg-bs-success/10 text-bs-success'
                                    : 'border-bs-error/35 bg-bs-error/10 text-bs-error'
                            )}
                        >
                            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {formatPct(token.priceChangeH1)}
                        </span>
                        {topTags.map((tag) => (
                            <span
                                key={`${token.tokenAddress}-${tag}`}
                                className="rounded-md border border-bs-border px-1.5 py-0.5 text-[10px] text-bs-text-tertiary"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold',
                            scoreClass(token.score)
                        )}
                    >
                        <Flame size={12} />
                        {token.score.toFixed(1)}
                    </span>

                    {token.pairUrl ? (
                        <a
                            href={token.pairUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md border border-bs-border p-1.5 text-bs-text-tertiary hover:text-bs-text-primary"
                            aria-label={`Open ${token.tokenSymbol} on Dexscreener`}
                            title="Open on Dexscreener"
                        >
                            <ExternalLink size={13} />
                        </a>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-bs-text-secondary sm:grid-cols-4">
                <div className="rounded-md border border-bs-border/80 px-2 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">24h Volume</div>
                    <div className="font-medium text-bs-text-primary">{formatUsdCompact(token.volumeH24)}</div>
                </div>
                <div className="rounded-md border border-bs-border/80 px-2 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Liquidity</div>
                    <div className="font-medium text-bs-text-primary">{formatUsdCompact(token.liquidityUsd)}</div>
                </div>
                <div className="rounded-md border border-bs-border/80 px-2 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Txns (1h)</div>
                    <div className="font-medium text-bs-text-primary">{token.txnsH1.toLocaleString('en-US')}</div>
                </div>
                <div className="rounded-md border border-bs-border/80 px-2 py-1">
                    <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Buy Pressure</div>
                    <div className={cn('font-medium', token.buyPressure >= 0 ? 'text-bs-success' : 'text-bs-error')}>
                        {formatPct(token.buyPressure * 100)}
                    </div>
                </div>
            </div>
        </li>
    );
}

export default function HotDexTokensPanel({
    className,
    limit = 8,
    defaultChains = 'solana,base',
    showChainPresets = true,
}: HotDexTokensPanelProps) {
    const [chains, setChains] = useState(defaultChains);

    const endpoint = useMemo(
        () => `/api/discovery/hot?chains=${encodeURIComponent(chains)}&limit=${encodeURIComponent(String(limit))}`,
        [chains, limit]
    );

    const { data, error, isLoading, isValidating, mutate } = useSWR(endpoint, fetcher, {
        refreshInterval: 20_000,
        revalidateOnFocus: false,
    });

    return (
        <section className={cn('rounded-2xl border border-bs-border bg-bs-card p-4 md:p-5', className)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm text-bs-text-tertiary">Discovery Feed</p>
                    <h2 className="mt-1 text-2xl font-semibold text-bs-text-primary text-balance">Hot DEX Tokens</h2>
                    <p className="mt-1 text-xs text-bs-text-secondary">
                        Scored with liquidity, volume velocity, buy pressure, and Dex boosts.
                    </p>
                    <p className="mt-1 text-[11px] text-bs-text-mute">{freshnessText(data?.generatedAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void mutate()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-xs font-medium text-bs-text-secondary hover:text-bs-text-primary"
                    >
                        <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href={endpoint}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-xs font-medium text-bs-text-secondary hover:text-bs-text-primary"
                        title="Open hot token API response as JSON"
                    >
                        <ExternalLink size={14} />
                        Test API JSON
                    </a>
                </div>
            </div>

            {showChainPresets ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {CHAIN_PRESETS.map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => setChains(preset.key)}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                chains === preset.key
                                    ? 'border-bs-border-active bg-bs-card-fg text-bs-text-primary'
                                    : 'border-bs-border text-bs-text-tertiary hover:text-bs-text-primary'
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {error ? (
                <div className="mt-4 rounded-xl border border-bs-error/35 bg-bs-error/10 p-3 text-sm text-bs-error">
                    Unable to load discovery feed right now.
                </div>
            ) : null}

            {isLoading ? (
                <div className="mt-4 grid gap-3">
                    {Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
                        <div
                            key={`hot-loading-${index}`}
                            className="h-24 animate-pulse rounded-xl border border-bs-border bg-bs-card-fg"
                        />
                    ))}
                </div>
            ) : null}

            {!isLoading && !error && data?.tokens?.length === 0 ? (
                <div className="mt-4 rounded-xl border border-bs-border bg-bs-card-fg p-3 text-sm text-bs-text-secondary">
                    No tokens matched the current filters. Try switching the chain preset.
                </div>
            ) : null}

            {!isLoading && !error && data?.tokens?.length ? (
                <ul className="mt-4 space-y-3">
                    {data.tokens.map((token) => (
                        <TokenRow key={`${token.chainId}-${token.tokenAddress}`} token={token} />
                    ))}
                </ul>
            ) : null}

            <p className="mt-4 text-[11px] text-bs-text-mute">
                Discovery feed inspiration credit:{' '}
                <a
                    href="https://github.com/vibeforge1111/dexscreener-cli-mcp-tool"
                    target="_blank"
                    rel="noreferrer"
                    className="text-bs-brand-ts hover:underline"
                >
                    vibeforge1111/dexscreener-cli-mcp-tool
                </a>
            </p>
        </section>
    );
}

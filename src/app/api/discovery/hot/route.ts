import { NextRequest, NextResponse } from 'next/server';

import type { HotDiscoveryResponse, HotTokenCandidate } from '@/lib/discovery/types';

const DEX_API_BASE = 'https://api.dexscreener.com';
const DEFAULT_CHAINS = ['solana', 'base'];
const KNOWN_CHAINS = new Set([
    'solana',
    'base',
    'ethereum',
    'bsc',
    'arbitrum',
    'polygon',
    'optimism',
    'avalanche',
]);

const DEFAULT_LIMIT = 8;
const MIN_LIMIT = 3;
const MAX_LIMIT = 20;
const MAX_TOKENS_PER_CHAIN = 72;
const TOKEN_BATCH_SIZE = 30;

const DEFAULT_MIN_LIQUIDITY_USD = 10_000;
const DEFAULT_MIN_VOLUME_H24_USD = 20_000;
const DEFAULT_MIN_TXNS_H1 = 10;

type DexSeedRow = {
    chainId?: string;
    tokenAddress?: string;
    totalAmount?: number;
    amount?: number;
};

type DexPairRow = {
    chainId?: string;
    dexId?: string;
    url?: string;
    pairAddress?: string;
    baseToken?: {
        address?: string;
        symbol?: string;
        name?: string;
    };
    priceUsd?: string | number;
    txns?: {
        h1?: {
            buys?: number;
            sells?: number;
        };
        h24?: {
            buys?: number;
            sells?: number;
        };
    };
    volume?: {
        h1?: number;
        h24?: number;
    };
    priceChange?: {
        h1?: number;
        h24?: number;
    };
    liquidity?: {
        usd?: number;
    };
    marketCap?: number;
    fdv?: number;
    boosts?: {
        active?: number;
    };
    pairCreatedAt?: number;
};

interface SeedToken {
    chainId: string;
    tokenAddress: string;
    boostTotal: number;
    boostCount: number;
    hasProfile: boolean;
}

interface ScanParams {
    chains: string[];
    limit: number;
    minLiquidityUsd: number;
    minVolumeH24Usd: number;
    minTxnsH1: number;
}

function asNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return clamp((value - min) / (max - min), 0, 1);
}

function round(value: number, precision = 2): number {
    return Number(value.toFixed(precision));
}

function parseChains(raw: string | null): string[] {
    if (!raw) return DEFAULT_CHAINS;
    const parsed = raw
        .split(',')
        .map((chain) => chain.trim().toLowerCase())
        .filter(Boolean)
        .filter((chain) => KNOWN_CHAINS.has(chain));

    return parsed.length > 0 ? Array.from(new Set(parsed)) : DEFAULT_CHAINS;
}

function parseIntParam(raw: string | null, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
}

function parseFloatParam(raw: string | null, fallback: number, min: number, max: number): number {
    const parsed = Number.parseFloat(raw ?? '');
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

async function fetchList<T>(path: string): Promise<T[]> {
    try {
        const response = await fetch(`${DEX_API_BASE}${path}`, {
            next: { revalidate: 15 },
        });

        if (!response.ok) {
            return [];
        }

        const payload: unknown = await response.json();
        return Array.isArray(payload) ? (payload as T[]) : [];
    } catch {
        return [];
    }
}

function buildSeeds(
    chains: string[],
    boostsTop: DexSeedRow[],
    boostsLatest: DexSeedRow[],
    profiles: DexSeedRow[],
): SeedToken[] {
    const chainSet = new Set(chains);
    const seeds = new Map<string, SeedToken>();

    const touchSeed = (chainIdRaw: string | undefined, tokenAddressRaw: string | undefined): SeedToken | null => {
        const chainId = String(chainIdRaw ?? '').toLowerCase();
        const tokenAddress = String(tokenAddressRaw ?? '').trim();
        if (!chainId || !tokenAddress || !chainSet.has(chainId)) return null;

        const key = `${chainId}:${tokenAddress.toLowerCase()}`;
        const existing = seeds.get(key);
        if (existing) return existing;

        const seed: SeedToken = {
            chainId,
            tokenAddress,
            boostTotal: 0,
            boostCount: 0,
            hasProfile: false,
        };
        seeds.set(key, seed);
        return seed;
    };

    for (const row of boostsTop) {
        const seed = touchSeed(row.chainId, row.tokenAddress);
        if (!seed) continue;
        seed.boostTotal += asNumber(row.totalAmount);
        seed.boostCount += 1;
    }

    for (const row of boostsLatest) {
        const seed = touchSeed(row.chainId, row.tokenAddress);
        if (!seed) continue;
        seed.boostTotal += asNumber(row.totalAmount) || asNumber(row.amount);
        seed.boostCount += 1;
    }

    for (const row of profiles) {
        const seed = touchSeed(row.chainId, row.tokenAddress);
        if (!seed) continue;
        seed.hasProfile = true;
    }

    return Array.from(seeds.values())
        .sort((a, b) => b.boostTotal - a.boostTotal || b.boostCount - a.boostCount)
        .slice(0, MAX_TOKENS_PER_CHAIN * Math.max(chains.length, 1));
}

async function fetchPairsForChain(chainId: string, tokenAddresses: string[]): Promise<DexPairRow[]> {
    const allPairs: DexPairRow[] = [];

    for (const group of chunk(tokenAddresses, TOKEN_BATCH_SIZE)) {
        const encoded = group.map((address) => encodeURIComponent(address)).join(',');
        const batch = await fetchList<DexPairRow>(`/tokens/v1/${encodeURIComponent(chainId)}/${encoded}`);
        if (batch.length > 0) {
            allPairs.push(...batch);
        }
    }

    return allPairs;
}

function pairPriority(pair: DexPairRow): number {
    const volumeH24 = asNumber(pair.volume?.h24);
    const liquidityUsd = asNumber(pair.liquidity?.usd);
    const buysH1 = asNumber(pair.txns?.h1?.buys);
    const sellsH1 = asNumber(pair.txns?.h1?.sells);
    const txnsH1 = buysH1 + sellsH1;
    const activeBoosts = asNumber(pair.boosts?.active);

    return volumeH24 + liquidityUsd * 0.3 + txnsH1 * 250 + activeBoosts * 800;
}

function buildCandidate(seed: SeedToken, pair: DexPairRow, params: ScanParams): HotTokenCandidate | null {
    const tokenAddress = String(pair.baseToken?.address ?? '').trim();
    if (!tokenAddress) return null;

    const tokenSymbol = String(pair.baseToken?.symbol ?? '').trim() || 'UNKNOWN';
    const tokenName = String(pair.baseToken?.name ?? '').trim() || tokenSymbol;

    const liquidityUsd = asNumber(pair.liquidity?.usd);
    const volumeH24 = asNumber(pair.volume?.h24);
    const volumeH1 = asNumber(pair.volume?.h1);

    const buysH1 = asNumber(pair.txns?.h1?.buys);
    const sellsH1 = asNumber(pair.txns?.h1?.sells);
    const txnsH1 = buysH1 + sellsH1;

    const buysH24 = asNumber(pair.txns?.h24?.buys);
    const sellsH24 = asNumber(pair.txns?.h24?.sells);
    const txnsH24 = buysH24 + sellsH24;

    if (liquidityUsd < params.minLiquidityUsd) return null;
    if (volumeH24 < params.minVolumeH24Usd) return null;
    if (txnsH1 < params.minTxnsH1) return null;

    const priceUsd = asNumber(pair.priceUsd);
    const priceChangeH1 = asNumber(pair.priceChange?.h1);
    const priceChangeH24 = asNumber(pair.priceChange?.h24);
    const marketCap = asNumber(pair.marketCap);
    const fdv = asNumber(pair.fdv);

    const volPerHourBaseline = (volumeH24 > volumeH1 ? (volumeH24 - volumeH1) / 23 : volumeH24 / 24) || 1;
    const txPerHourBaseline = (txnsH24 > txnsH1 ? (txnsH24 - txnsH1) / 23 : txnsH24 / 24) || 1;

    const volumeVelocity = volumeH1 / Math.max(volPerHourBaseline, 1);
    const txnVelocity = txnsH1 / Math.max(txPerHourBaseline, 1);
    const buyPressure = (buysH1 - sellsH1) / Math.max(txnsH1, 1);

    const boostFromPair = asNumber(pair.boosts?.active);
    const boostTotal = Math.max(seed.boostTotal, boostFromPair);

    const liquidityNorm = normalize(Math.log10(liquidityUsd + 1), 3.7, 6.2);
    const volumeNorm = normalize(Math.log10(volumeH24 + 1), 4.2, 8.1);
    const momentumNorm = normalize(priceChangeH1, -15, 45);
    const pressureNorm = normalize(buyPressure, -0.55, 0.8);
    const volVelocityNorm = normalize(volumeVelocity, 0.4, 3.2);
    const txnVelocityNorm = normalize(txnVelocity, 0.4, 3.2);
    const boostNorm = normalize(boostTotal, 0, 600);

    let score =
        volumeNorm * 24 +
        liquidityNorm * 17 +
        momentumNorm * 15 +
        pressureNorm * 13 +
        volVelocityNorm * 13 +
        txnVelocityNorm * 10 +
        boostNorm * 8;

    const volLiqRatio = volumeH24 / Math.max(liquidityUsd, 1);
    if (volLiqRatio > 80) score -= 6;
    if (volLiqRatio > 120) score -= 10;
    if (priceChangeH1 > 120 && txnsH1 < 60) score -= 8;
    if (buysH1 >= 20 && sellsH1 === 0) score -= 6;
    if (liquidityUsd < 15_000) score -= 4;

    score = clamp(score, 0, 100);

    const tags: string[] = [];
    if (priceChangeH1 >= 20) tags.push('momentum');
    if (buyPressure >= 0.35) tags.push('buy-pressure');
    if (volumeVelocity >= 1.8) tags.push('volume-spike');
    if (txnVelocity >= 1.8) tags.push('txn-velocity');
    if (boostTotal >= 100) tags.push('boosted');
    if (seed.hasProfile) tags.push('profiled');

    const createdAtMs = asNumber(pair.pairCreatedAt);
    let ageHours: number | null = null;
    if (createdAtMs > 0) {
        const hours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
        if (Number.isFinite(hours) && hours >= 0) {
            ageHours = round(hours, 2);
        }
    }

    return {
        rank: 0,
        chainId: seed.chainId,
        tokenAddress,
        tokenSymbol,
        tokenName,
        pairAddress: String(pair.pairAddress ?? ''),
        pairUrl: String(pair.url ?? ''),
        dexId: String(pair.dexId ?? 'unknown'),
        score: round(score, 2),
        tags,
        priceUsd,
        priceChangeH1: round(priceChangeH1, 2),
        priceChangeH24: round(priceChangeH24, 2),
        volumeH1: round(volumeH1, 2),
        volumeH24: round(volumeH24, 2),
        liquidityUsd: round(liquidityUsd, 2),
        txnsH1,
        buysH1,
        sellsH1,
        buyPressure: round(buyPressure, 3),
        marketCap: round(marketCap, 2),
        fdv: round(fdv, 2),
        boostTotal: round(boostTotal, 2),
        boostCount: seed.boostCount,
        hasProfile: seed.hasProfile,
        ageHours,
    };
}

function sortCandidates(candidates: HotTokenCandidate[]): HotTokenCandidate[] {
    return candidates
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.volumeH24 !== a.volumeH24) return b.volumeH24 - a.volumeH24;
            return b.liquidityUsd - a.liquidityUsd;
        })
        .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function parseParams(request: NextRequest): ScanParams {
    const search = request.nextUrl.searchParams;

    return {
        chains: parseChains(search.get('chains')),
        limit: parseIntParam(search.get('limit'), DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT),
        minLiquidityUsd: parseFloatParam(
            search.get('minLiquidityUsd'),
            DEFAULT_MIN_LIQUIDITY_USD,
            100,
            1_000_000,
        ),
        minVolumeH24Usd: parseFloatParam(
            search.get('minVolumeH24Usd'),
            DEFAULT_MIN_VOLUME_H24_USD,
            1_000,
            10_000_000,
        ),
        minTxnsH1: parseIntParam(search.get('minTxnsH1'), DEFAULT_MIN_TXNS_H1, 1, 50_000),
    };
}

export async function GET(request: NextRequest) {
    try {
        const params = parseParams(request);

        const [boostsTop, boostsLatest, profiles] = await Promise.all([
            fetchList<DexSeedRow>('/token-boosts/top/v1'),
            fetchList<DexSeedRow>('/token-boosts/latest/v1'),
            fetchList<DexSeedRow>('/token-profiles/latest/v1'),
        ]);

        const seeds = buildSeeds(params.chains, boostsTop, boostsLatest, profiles);
        if (seeds.length === 0) {
            const emptyResponse: HotDiscoveryResponse = {
                generatedAt: new Date().toISOString(),
                params,
                count: 0,
                tokens: [],
            };
            return NextResponse.json(emptyResponse, {
                headers: {
                    'Cache-Control': 's-maxage=15, stale-while-revalidate=30',
                },
            });
        }

        const candidates: HotTokenCandidate[] = [];
        for (const chainId of params.chains) {
            const chainSeeds = seeds
                .filter((seed) => seed.chainId === chainId)
                .slice(0, MAX_TOKENS_PER_CHAIN);

            if (chainSeeds.length === 0) continue;

            const chainAddresses = chainSeeds.map((seed) => seed.tokenAddress);
            const pairs = await fetchPairsForChain(chainId, chainAddresses);

            const bestPairByToken = new Map<string, DexPairRow>();
            for (const pair of pairs) {
                const tokenAddress = String(pair.baseToken?.address ?? '').toLowerCase();
                if (!tokenAddress) continue;

                const existing = bestPairByToken.get(tokenAddress);
                if (!existing || pairPriority(pair) > pairPriority(existing)) {
                    bestPairByToken.set(tokenAddress, pair);
                }
            }

            for (const seed of chainSeeds) {
                const pair = bestPairByToken.get(seed.tokenAddress.toLowerCase());
                if (!pair) continue;

                const candidate = buildCandidate(seed, pair, params);
                if (candidate) {
                    candidates.push(candidate);
                }
            }
        }

        const ranked = sortCandidates(candidates).slice(0, params.limit);
        const response: HotDiscoveryResponse = {
            generatedAt: new Date().toISOString(),
            params,
            count: ranked.length,
            tokens: ranked,
        };

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 's-maxage=15, stale-while-revalidate=30',
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to build hot token discovery feed.',
                detail: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

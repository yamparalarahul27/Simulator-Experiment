export interface HotTokenCandidate {
    rank: number;
    chainId: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    pairAddress: string;
    pairUrl: string;
    dexId: string;
    score: number;
    tags: string[];
    priceUsd: number;
    priceChangeH1: number;
    priceChangeH24: number;
    volumeH1: number;
    volumeH24: number;
    liquidityUsd: number;
    txnsH1: number;
    buysH1: number;
    sellsH1: number;
    buyPressure: number;
    marketCap: number;
    fdv: number;
    boostTotal: number;
    boostCount: number;
    hasProfile: boolean;
    ageHours: number | null;
}

export interface HotDiscoveryResponse {
    generatedAt: string;
    params: {
        chains: string[];
        limit: number;
        minLiquidityUsd: number;
        minVolumeH24Usd: number;
        minTxnsH1: number;
    };
    count: number;
    tokens: HotTokenCandidate[];
}

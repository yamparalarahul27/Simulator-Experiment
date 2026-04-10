import type { RoadmapPhase, RoadmapStatus } from '@/lib/types';

export const FALLBACK_ROADMAP_PHASES: RoadmapPhase[] = [
    {
        title: 'Phase 0 — Foundation',
        status: 'done',
        subtitle: 'Analytics, Journal, Wallet Lookup',
        items: [
            'Trading analytics dashboard with PnL, drawdown, session performance, and fee distribution',
            'Trade journal with annotations, tags, and streak tracking',
            'Wallet lookup via Helius RPC plus Deriverse parsing',
            'Mock and devnet data modes',
            'Supabase cloud persistence',
            'Initial product shell and navigation framework',
        ],
    },
    {
        title: 'Phase 1 — Education Engine',
        status: 'done',
        subtitle: 'Spot Simulator, Order Flow, Liquidation',
        items: [
            'Spot simulator with eight core order types',
            'Interactive order-flow visualizer with state-machine diagrams',
            'Price-scale slider with TP and SL simulation',
            'Liquidation simulator with visual margin context',
            'Live price feeds with WebSocket plus REST fallback',
            'Trade summary panel with risk and reward framing',
            'AI assistant integration',
        ],
    },
    {
        title: 'Phase 2 — Expand & Polish',
        status: 'next',
        subtitle: 'More concepts, more DEXes, mainnet',
        items: [
            'Funding-rate interactive explainer',
            'Leverage mechanics visual explainer',
            'Slippage and price-impact simulator',
            'Multi-DEX integration across major Solana venues',
            'Mainnet wallet support',
            'Wallet-based account model',
            'Mobile-optimized learning flows',
            'Position-level PnL grouping',
        ],
    },
    {
        title: 'Phase 3 — Execute & Scale',
        status: 'future',
        subtitle: 'From simulation to real trading',
        items: [
            'Paper trading against real market conditions',
            'Live trade execution through aggregator routing',
            'Multi-wallet portfolio aggregation',
            'Real-time portfolio and unrealized PnL tracking',
            'Push notifications and actionable alerts',
            'Social and collaborative learning features',
        ],
    },
];

export const STATUS_COPY: Record<RoadmapStatus, string> = {
    done: 'Complete',
    next: 'Up Next',
    future: 'Planned',
};

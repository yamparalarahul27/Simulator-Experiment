const phases = [
    {
        title: 'Phase 0 — Foundation',
        status: 'done' as const,
        subtitle: 'Analytics, Journal, Wallet Lookup',
        items: [
            'Trading analytics dashboard — PnL, drawdown, session performance, fee distribution',
            'Trade journal with annotations, tags, streak tracking',
            'Wallet lookup via Helius RPC + Deriverse on-chain parsing',
            'Mock and devnet data modes',
            'Supabase cloud persistence',
            'Premium glassmorphism dark UI',
        ]
    },
    {
        title: 'Phase 1 — Education Engine',
        status: 'done' as const,
        subtitle: 'Spot Simulator, Order Flow, Liquidation',
        items: [
            'Spot order simulator — 8 order types (Market, Limit, Stop Market, Stop Limit, Iceberg, TWAP, Trailing Stop, OCO)',
            'Interactive order flow visualiser with state machine diagrams',
            'Price scale slider with TP/SL simulation and post-fill extrema tracking',
            'Liquidation simulator with visual margin gauge',
            'Live price feeds — Binance WebSocket + CoinGecko REST fallback',
            'Trade summary panel with R:R analysis',
            'AI assistant powered by Gemini',
        ]
    },
    {
        title: 'Phase 2 — Expand & Polish',
        status: 'next' as const,
        subtitle: 'More concepts, more DEXes, mainnet',
        items: [
            'Funding Rate interactive explainer',
            'Leverage Mechanics visual explainer',
            'Slippage & Price Impact simulator',
            'Multi-DEX integration (Jupiter, Raydium, Orca)',
            'Mainnet wallet support',
            'User accounts (wallet-based auth)',
            'Mobile responsive layout',
            'Position-level PnL grouping',
        ]
    },
    {
        title: 'Phase 3 — Execute & Scale',
        status: 'future' as const,
        subtitle: 'From simulation to real trading',
        items: [
            'Paper trading mode — simulated fills against real orderbooks',
            'Live trade execution via Jupiter aggregator',
            'Multi-wallet portfolio aggregation',
            'Real-time portfolio tracking (balances, unrealised PnL)',
            'Push notifications and price alerts',
            'Social features — share setups, leaderboards',
        ]
    }
];

export default function RoadmapScreen() {
    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8 p-4 md:p-8 text-bs-text-secondary">
            <div className="flex w-full flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
                <header className="text-left max-w-6xl md:flex-1">
                    <h1 className="mt-2 md:mt-3 text-2xl md:text-4xl font-semibold text-bs-text-primary">Development Roadmap</h1>
                    <p className="mt-1 md:mt-2 text-xs md:text-sm uppercase tracking-[0.4em] text-bs-text-mute">From simulation to real trading</p>
                    <p className="mt-3 md:mt-4 text-sm md:text-base leading-relaxed text-bs-text-secondary">
                        YDEX is built in phases — each one expands capabilities while keeping education at the core.
                    </p>
                </header>

            </div>

            <div className="space-y-4 md:space-y-6">
                {phases.map((phase) => (
                    <div
                        key={phase.title}
                        className={`rounded-lg border p-4 md:p-6 ${
                            phase.status === 'done'
                                ? 'border-cyan-500/20 bg-cyan-500/5'
                                : phase.status === 'next'
                                  ? 'border-bs-brand-tertiary/20 bg-bs-brand-tertiary/5'
                                  : 'border-bs-border bg-bs-text-primary/5'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <p className="text-sm uppercase tracking-[0.3em] text-bs-text-mute">{phase.title}</p>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                    phase.status === 'done'
                                        ? 'bg-cyan-500/15 text-cyan-400'
                                        : phase.status === 'next'
                                          ? 'bg-bs-brand-tertiary/15 text-bs-brand'
                                          : 'bg-bs-card-fg text-bs-text-mute'
                                }`}
                            >
                                {phase.status === 'done' ? 'Complete' : phase.status === 'next' ? 'Up Next' : 'Planned'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-bs-text-tertiary">{phase.subtitle}</p>
                        <ul className="mt-3 md:mt-4 space-y-2 text-sm md:text-base text-bs-text-primary/75">
                            {phase.items.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span
                                        className={`mt-1.5 h-2 w-2 rounded-full ${
                                            phase.status === 'done'
                                                ? 'bg-cyan-400'
                                                : phase.status === 'next'
                                                  ? 'bg-[#00e6e6]'
                                                  : 'bg-white/30'
                                        }`}
                                    />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}

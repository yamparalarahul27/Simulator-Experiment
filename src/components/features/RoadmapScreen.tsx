const phases = [
    {
        title: 'Phase 01 – Today',
        items: [
            'Wallet sync improvements & reliability',
            'Saved annotations + screenshot storage',
            'Mock data playground for onboarding'
        ]
    },
    {
        title: 'Phase 02 – Next 60 days',
        items: [
            'Collab mode with shared dashboards',
            'Multi-chain ingest (Base + Ethereum)',
            'Automated trade tagging suggestions'
        ]
    },
    {
        title: 'Phase 03 – On the horizon',
        items: [
            'Strategy backtests powered by your journal',
            'AI-assisted narrative summaries',
            'Enterprise admin + compliance exports'
        ]
    }
];

export default function RoadmapScreen() {
    return (
        <section className="mx-auto flex max-w-5xl flex-col gap-8 p-8 text-white/80">
            <header className="text-center">
                <p className="text-sm uppercase tracking-[0.4em] text-white/40">Build path</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Deriverse Roadmap</h1>
                <p className="mt-4 text-lg leading-relaxed text-white/70">
                    Shipping fast, with traders in the loop. Here is what is live, what is next, and what
                    we are dreaming about.
                </p>
            </header>

            <div className="space-y-6">
                {phases.map((phase) => (
                    <div key={phase.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">{phase.title}</p>
                        <ul className="mt-4 space-y-2 text-base text-white/75">
                            {phase.items.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
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

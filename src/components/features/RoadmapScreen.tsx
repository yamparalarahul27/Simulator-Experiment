const phases = [
    {
        title: 'Phase 01 – 1 to 20th Feb 2026',
        items: [
            'Anlytics Widgets with Real & Mock Data',
            'Wallet Integration',
            'SignUp, Help and About Screen'
        ]
    },
    {
        title: 'Phase 02 – Next 30 days',
        items: [
            'Multi-Wallet Analytics',
            'AI Assistant',
            'Learning Module'
        ]
    },
    {
        title: 'Phase 03 – On the horizon',
        items: [
            'Community Feature Request',
        ]
    }
];

export default function RoadmapScreen() {
    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-8 p-8 text-white/80">
            <header className="text-center">
                
                <h1 className="mt-3 text-4xl font-semibold text-white">Development Roadmap</h1>
                <p className="mt-2 text-sm uppercase tracking-[0.4em] text-white/40">Trade anything, Trust your Journal</p>
                <p className="mt-4 text-md leading-relaxed text-white/70">
                    Plan for next features & updates.
                </p>
            </header>

            <div className="space-y-6">
                {phases.map((phase) => (
                    <div key={phase.title} className="rounded-none border border-white/10 bg-white/5 p-6">
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

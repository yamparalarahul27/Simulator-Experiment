export default function AboutScreen() {
    return (
        <section className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80 backdrop-blur">
            <header>
                <p className="text-sm uppercase tracking-[0.4em] text-white/40">Deriverse</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Why we built this</h1>
                <p className="mt-4 text-lg leading-relaxed text-white/70">
                    Traders juggle screenshots, spreadsheets, and scattered notes. Deriverse stitches
                    on-chain data with narrative context so you can debug your own behavior, share
                    learnings, and move faster with conviction.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                {[
                    {
                        title: 'Journal-first analytics',
                        body: 'Advanced PnL, drawdowns, streak heatmaps, and tagging built specifically for active traders.'
                    },
                    {
                        title: 'Human annotations',
                        body: 'Attach text, images, or voice notes directly to trades. Build a knowledge graph of your own decisions.'
                    },
                    {
                        title: 'Team-ready',
                        body: 'Share curated dashboards with collaborators or mentors without leaking wallet secrets.'
                    }
                ].map((card) => (
                    <div key={card.title} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">{card.title}</p>
                        <p className="mt-3 text-sm leading-relaxed text-white/70">{card.body}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 p-6 text-sm leading-relaxed text-white/80">
                Currently focused on Solana wallets with multi-chain support on the roadmap. If you run a
                fund, collective, or trading desk and want bespoke tooling, email <a className="underline" href="mailto:hey@deriverse.xyz">hey@deriverse.xyz</a>.
            </div>
        </section>
    );
}

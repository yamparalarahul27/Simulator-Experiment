export default function HelpScreen() {
    return (
        <section className="mx-auto flex max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/80 backdrop-blur">
            <header>
                <p className="text-sm uppercase tracking-[0.4em] text-white/40">Need a hand?</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">Help Center</h1>
                <p className="mt-3 text-lg leading-relaxed text-white/70">
                    Quick answers to the most common Deriverse questions. Reach out if you need a human.
                </p>
            </header>

            <div className="space-y-4 text-base leading-relaxed">
                <details className="rounded-2xl border border-white/10 bg-white/5 p-4" open>
                    <summary className="cursor-pointer text-white">
                        How do I switch between wallets?
                    </summary>
                    <p className="mt-3 text-white/70">
                        Use the network pill in the navbar. You can connect multiple wallets and toggle
                        between mock, devnet, or mainnet data. Each wallet keeps its own journal context.
                    </p>
                </details>

                <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-white">
                        My trades are missing—what now?
                    </summary>
                    <p className="mt-3 text-white/70">
                        Try re-syncing from the Trade History tab. If you still do not see your data, export a
                        CSV from your CEX and drag it into the uploader. We normalize everything on import.
                    </p>
                </details>

                <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-white">
                        Can I collaborate with teammates?
                    </summary>
                    <p className="mt-3 text-white/70">
                        Shared workspaces are on the roadmap. For now, export a PDF snapshot or invite a
                        teammate to view using a read-only link.
                    </p>
                </details>
            </div>

            <footer className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-white/80">
                Still stuck? Email <a className="underline" href="mailto:hey@deriverse.xyz">hey@deriverse.xyz</a>
                {' '}or ping <span className="font-mono">@deriverse</span> on Warpcast.
            </footer>
        </section>
    );
}

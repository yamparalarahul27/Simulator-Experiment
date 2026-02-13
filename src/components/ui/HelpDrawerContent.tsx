export default function HelpDrawerContent() {
    return (
        <div className="p-4 text-white/80 space-y-5">
            <section>
                <p className="text-sm uppercase tracking-[0.2em] text-white/40">Getting started</p>
                <ul className="mt-3 space-y-2 text-base">
                    <li>
                        1. Connect a wallet from the navbar (Devnet/Mainnet supported).
                    </li>
                    <li>2. Sync recent trades or import a CSV from your CEX.</li>
                    <li>3. Annotate positions with context, memes, and screenshots.</li>
                </ul>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
                Experiencing an issue? Toggle to mock data in the navbar to ensure the
                dashboard renders while your wallet sync completes in the background.
            </section>

            <section className="space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-white/40">Support</p>
                <div className="text-sm text-white/70">
                    <p>Email: <a className="underline" href="mailto:hey@deriverse.xyz">hey@deriverse.xyz</a></p>
                    <p>Warpcast: <span className="font-mono">@deriverse</span></p>
                    <p>Discord: <span className="font-mono">deriverse.gg/invite</span></p>
                </div>
            </section>
        </div>
    );
}

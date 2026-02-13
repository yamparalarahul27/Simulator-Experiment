import { DrawerDescription } from './drawer';

export default function AboutDrawerContent() {
    return (
        <div className="p-4 text-white/80 space-y-4">
            <DrawerDescription className="text-white/70">
                Deriverse is a crypto-native journal that helps you reflect on positions
                faster and with more context than a spreadsheet ever could.
            </DrawerDescription>

            <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/40">What you get</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-base text-white/80">
                    <li>Wallet-aware analytics (PnL, drawdowns, streaks)</li>
                    <li>Human notes layered on top of chain data</li>
                    <li>Export-ready journal snapshots for sharing</li>
                </ul>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
                We are shipping Deriverse iteratively. Expect weekly drops that expand the
                analytics surface, improve saved annotations, and unlock collaborative
                workflows for teams.
            </div>
        </div>
    );
}

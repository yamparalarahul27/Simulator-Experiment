'use client';

const TOPICS = [
    { title: 'What is a DEX?', description: 'CEX vs DEX, how AMMs work, liquidity pools' },
    { title: 'Wallets & Keys', description: 'Public/private keys, connecting to dApps, transaction signing' },
    { title: 'Order Types', description: 'Market, Limit, Stop, OCO — when and why to use each' },
    { title: 'Risk Management', description: 'Position sizing, stop losses, TP/SL, R:R ratios' },
    { title: 'Solana Ecosystem', description: 'Jupiter, Raydium, Orca — the DEX landscape' },
    { title: 'Trading Psychology', description: 'FOMO, revenge trading, discipline, journaling' },
];

export default function Web3Hub() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-mono font-bold text-white tracking-wide">Web3</h1>
                <p className="text-sm font-mono text-white/50 mt-1">Learn the building blocks of DEX trading</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOPICS.map((topic) => (
                    <div
                        key={topic.title}
                        className="bg-black border border-white/10 p-6 flex flex-col gap-3 hover:border-white/20 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-mono font-semibold text-white">{topic.title}</h2>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400/70 bg-purple-500/10 px-2 py-0.5 border border-purple-500/20">
                                Coming Soon
                            </span>
                        </div>
                        <p className="text-xs font-mono text-white/40 leading-relaxed">{topic.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

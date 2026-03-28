'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';

const TELEGRAM_URL = 'https://t.me/yamparalarahul1';
const QR_IMAGE_SRC = '/assets/QR_image.png';

export default function AboutScreen() {
    const [copied, setCopied] = useState(false);
    const [isQrOpen, setIsQrOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(TELEGRAM_URL);
            setCopied(true);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => setCopied(false), 1800);
        } catch (error) {
            console.error('Failed to copy Telegram handle', error);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-10 rounded-none px-4 py-4 sm:p-8 text-white/80 backdrop-blur">
            <header className="space-y-4">
                <p className="text-center text-sm uppercase tracking-[0.4em] text-white/40">About YDEX</p>
                <h1 className="text-center text-lg font-semibold text-white sm:text-xl md:text-3xl">
                    Make Decentralised Exchanges easy to understand for the New Age Traders on Solana.
                </h1>
                <div className="text-center space-y-4 md:space-y-6 text-sm md:text-base leading-relaxed text-white/80">
                    <p>
                        Hey there, I&apos;m Rahul — a design engineer who believes trading doesn&apos;t have to feel overwhelming or
                        complicated. YDEX bridges the knowledge gap between centralised exchange UX and decentralised exchange
                        complexity by combining real DEX data with interactive education tools.
                    </p>
                    <p>
                        Whether you&apos;re a seasoned trader or just starting out, YDEX helps you learn, simulate, and eventually
                        execute trades on Solana DEXes — all from one place.
                    </p>
                </div>
            </header>

            {/* Two Pillars */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-none border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/70">Pillar 1</p>
                    <p className="mt-1 text-base font-semibold text-white">DEX Integration & Insights</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                        Integrate Solana DEXes into the app and surface useful analytics from real on-chain trades.
                    </p>
                </div>
                <div className="rounded-none border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/10">
                    <p className="text-sm uppercase tracking-[0.3em] text-purple-400/70">Pillar 2</p>
                    <p className="mt-1 text-base font-semibold text-white">Education & Simulation</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                        Make complex trading concepts simple so traders can simulate setups, and in future execute from the platform on their preferred DEX.
                    </p>
                </div>
            </div>

            {/* Feature Inventory */}
            <div className="space-y-2">
                <h2 className="text-xl text-center font-semibold text-white">What&apos;s Built</h2>
                <p className="text-center text-sm text-white/40">Phase 0 + Phase 1 complete</p>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[
                    {
                        title: 'Analytics & Insights',
                        body: 'PnL card, equity curve, drawdown, session performance, order type ratios, fee distribution, largest trades, win rate — all powered by Helius RPC and on-chain parsing.'
                    },
                    {
                        title: 'Trade Journal',
                        body: 'Annotations, tags, lessons learned, streak tracking, and pagination. Build consistency with structured prompts and detailed trade notes.'
                    },
                    {
                        title: 'Wallet Lookup',
                        body: 'Enter or connect a wallet, fetch trades via Helius RPC + Deriverse on-chain parsing. Full sortable and filterable trade history.'
                    },
                    {
                        title: 'Spot Order Simulator',
                        body: '8 order types — Market, Limit, Stop Market, Stop Limit, Iceberg, TWAP, Trailing Stop, OCO. Interactive simulation with live Binance prices.'
                    },
                    {
                        title: 'Order Flow Visualiser',
                        body: 'Interactive node-graph state machine showing order lifecycle for all 8 types, with drag-to-pan, zoom, and price scale slider simulation.'
                    },
                    {
                        title: 'Live Price Feeds',
                        body: 'Binance WebSocket for real-time prices with CoinGecko REST fallback. 6 spot pairs (SOL, BTC, ETH, JUP, BONK, XRP vs USDC) plus ticker display.'
                    }
                ].map((card) => (
                    <div key={card.title} className="rounded-none border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/10">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">{card.title}</p>
                        <p className="mt-3 text-sm leading-relaxed text-white/70">{card.body}</p>
                    </div>
                ))}
            </div>

            {/* Design Principles */}
            <div className="space-y-4 rounded-none border border-white/10 bg-black/40 p-4 md:p-6">
                <h3 className="text-base font-semibold text-white">Design Principles</h3>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {[
                        { label: 'Education-first', desc: 'Every feature teaches something.' },
                        { label: 'Simulate before you execute', desc: 'Build confidence through simulation before risking real capital.' },
                        { label: 'Progressive disclosure', desc: 'Simple on the surface, deep on demand.' },
                        { label: 'Solana-native', desc: 'Built for the Solana DeFi ecosystem.' },
                        { label: 'Visual-first', desc: 'Interactive diagrams, sliders, and gauges over walls of text.' },
                    ].map((p) => (
                        <div key={p.label} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                            <p className="text-sm text-white/70"><span className="text-white/90 font-medium">{p.label}</span> — {p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 rounded-none bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 p-4 md:p-6 text-sm leading-relaxed text-white/85">
                <p>
                    Check out the Roadmap tab for what&apos;s shipping next — from funding rate explainers and multi-DEX support
                    to paper trading and live trade execution via Jupiter.
                </p>
                <div className="space-y-3 rounded-none border border-white/10 bg-black/20 p-4 text-white/80">
                    <p>
                        If you run a fund or just want to support what I'm building, I'd love to chat. Hit me up on Telegram or
                        scan the QR code.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-white">
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-none border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/40"
                        >
                            {TELEGRAM_URL.replace('https://', '')}
                        </a>
                        <button
                            type="button"
                            onClick={handleCopy}
                            aria-label="Copy Telegram handle"
                            className="flex items-center gap-2 rounded-none border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/40"
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy handle'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsQrOpen(true)}
                            className="flex items-center gap-2 rounded-none border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/40"
                        >
                            <QrCode className="h-4 w-4" />
                            View QR
                        </button>
                    </div>
                </div>
            </div>

            {isQrOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setIsQrOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-none border border-white/10 bg-[#05050c]/95 p-6 text-center shadow-2xl">
                        <h4 className="text-lg font-semibold text-white">Scan to say Hi!</h4>
                        <p className="mt-2 text-sm text-white/70">Waiting to talk to you soon.</p>
                        <div className="mt-6 overflow-hidden rounded-none">
                            <Image
                                src={QR_IMAGE_SRC}
                                alt="Telegram QR code"
                                width={280}
                                height={280}
                                className="h-auto w-full"
                                priority
                            />
                        </div>
                        <button
                            aria-label="Close QR modal"
                            className="Center rounded-none border border-white/10 p-2 text-white/60 transition-colors hover:text-white"
                            onClick={() => setIsQrOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        
                    </div>
                </div>
            )}
        </section>
    );
}

'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';

const TELEGRAM_URL = 'https://t.me/yamparalarahul1';
const QR_IMAGE_SRC = '/assets/QR_image.png';

const PILLARS = [
    {
        title: 'DEX Integration & Insights',
        description: 'Integrate Solana DEXes into the app and surface useful analytics from real on-chain trades.',
    },
    {
        title: 'Education & Simulation',
        description:
            'Turn complex trading concepts into clear interactive experiences so users can practice before execution.',
    },
] as const;

const FEATURES = [
    {
        title: 'Analytics & Insights',
        description:
            'PnL card, equity curve, drawdown, session performance, order-type ratios, fee distribution, largest trades, and win rate powered by Helius RPC parsing.',
    },
    {
        title: 'Trade Journal',
        description:
            'Annotations, tags, lessons learned, streak tracking, and pagination so traders can build disciplined review loops.',
    },
    {
        title: 'Wallet Lookup',
        description:
            'Connect or enter a wallet, fetch on-chain trades, and analyze sortable history in one place.',
    },
    {
        title: 'Spot Order Simulator',
        description:
            'Eight order types including Market, Limit, Stop variants, Iceberg, TWAP, Trailing Stop, and OCO.',
    },
    {
        title: 'Order Flow Visualiser',
        description:
            'Interactive state-machine mapping order lifecycles with pan, zoom, and scenario-based simulation.',
    },
    {
        title: 'Live Price Feeds',
        description:
            'Real-time Binance WebSocket streaming with CoinGecko fallback across major learning pairs.',
    },
] as const;

const PRINCIPLES = [
    {
        title: 'Education first',
        description: 'Every product surface should teach, not just display.',
    },
    {
        title: 'Simulate before execute',
        description: 'Confidence comes from repetition in a safe environment.',
    },
    {
        title: 'Progressive disclosure',
        description: 'Keep interfaces simple first, then expose depth where needed.',
    },
    {
        title: 'Solana native',
        description: 'Built around real Solana DeFi behavior and data.',
    },
    {
        title: 'Visual clarity',
        description: 'Use interaction and structure to explain what text alone cannot.',
    },
] as const;

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
        <section className="mx-auto flex max-w-6xl flex-col gap-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">About YDEX</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Make decentralised exchange trading understandable for new-age Solana traders.
                </h1>
                <div className="mt-4 space-y-3 text-sm text-bs-text-secondary text-pretty md:text-base">
                    <p>
                        Rahul is a design engineer focused on making trading less intimidating. YDEX bridges the gap
                        between familiar centralised UX and the complexity of decentralised execution through guided
                        learning and simulation.
                    </p>
                    <p>
                        Whether someone is brand new or already active in markets, YDEX helps them learn core concepts,
                        practice setups, and build execution confidence.
                    </p>
                </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2">
                {PILLARS.map((pillar, index) => (
                    <article key={pillar.title} className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                        <p className="text-sm text-bs-text-tertiary">Pillar {index + 1}</p>
                        <h2 className="mt-1 text-xl font-semibold text-bs-text-primary text-balance">{pillar.title}</h2>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">{pillar.description}</p>
                    </article>
                ))}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold text-bs-text-primary text-balance">What is built now</h2>
                    <p className="mt-1 text-sm text-bs-text-tertiary">Phase 0 and Phase 1 are complete.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {FEATURES.map((feature) => (
                        <article key={feature.title} className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                            <h3 className="text-lg font-semibold text-bs-text-primary text-balance">{feature.title}</h3>
                            <p className="mt-2 text-sm text-bs-text-secondary text-pretty">{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                <h3 className="text-xl font-semibold text-bs-text-primary text-balance">Design principles</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {PRINCIPLES.map((principle) => (
                        <article key={principle.title} className="rounded-xl border border-bs-border bg-bs-card-fg px-4 py-4">
                            <h4 className="text-base font-semibold text-bs-text-primary text-balance">{principle.title}</h4>
                            <p className="mt-1 text-sm text-bs-text-secondary text-pretty">{principle.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card-fg px-5 py-6">
                <p className="text-sm text-bs-text-secondary text-pretty">
                    Visit the roadmap to see what ships next: funding-rate explainers, multi-DEX support, paper
                    trading improvements, and live execution workflows.
                </p>
                <div className="mt-4 rounded-xl border border-bs-border bg-bs-card px-4 py-4">
                    <p className="text-sm text-bs-text-secondary text-pretty">
                        If you run a fund or want to support what is being built, reach out on Telegram or scan the QR
                        code.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-primary"
                        >
                            {TELEGRAM_URL.replace('https://', '')}
                        </a>
                        <button
                            type="button"
                            onClick={handleCopy}
                            aria-label="Copy Telegram handle"
                            className="inline-flex items-center gap-2 rounded-xl border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-secondary"
                        >
                            {copied ? <Check className="h-4 w-4 text-bs-success" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy handle'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsQrOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-secondary"
                        >
                            <QrCode className="h-4 w-4" />
                            View QR
                        </button>
                    </div>
                </div>
            </section>

            {isQrOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/65" onClick={() => setIsQrOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bs-border bg-bs-card p-6 text-center">
                        <h4 className="text-lg font-semibold text-bs-text-primary text-balance">Scan to connect</h4>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">
                            Feedback and collaboration messages are welcome.
                        </p>
                        <div className="mt-6 overflow-hidden rounded-xl border border-bs-border">
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
                            className="mt-6 inline-flex items-center justify-center rounded-lg border border-bs-border px-4 py-2 text-sm text-bs-text-secondary"
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

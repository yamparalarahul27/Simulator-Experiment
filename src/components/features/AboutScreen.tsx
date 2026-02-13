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
        <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-none p-6 sm:p-8 text-white/80 backdrop-blur">
            <header className="space-y-4">
                <p className="text-center text-sm uppercase tracking-[0.4em] text-white/40">About Deriverse Journal</p>
                <h1 className="text-center text-xl font-semibold text-white sm:text-3xl">
                    "Trade is not about Trading, it&apos;s about discipline"
                
                </h1>
                <div className="text-center space-y-6 text-md leading-relaxed text-white/80">
                    <p>
                        Hey there, I&apos;m Rahul—a design engineer who believes trading doesn&apos;t have to feel overwhelming or
                        complicated.
                    </p>
                    <p>
                        I built Deriverse Journal to change that narrative. Whether you&apos;re a seasoned trader or just starting
                        out, this app brings clarity and structure to your trading journey through systematic journaling and
                        portfolio analysis.
                    </p>
                </div>
                <div className="mt-12"></div>
                <h2 className="text-xl text-center font-semibold text-white">What&apos;s inside v0.0.1 Alpha</h2>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                {[
                    {
                        title: 'Analytics',
                        body: 'Track PnL, drawdown, win rate, trade duration, biggest wins/losses, time segments, order types, long/short ratio, volume, average win/loss, and fee distribution—all in one place.'
                    },
                    {
                        title: 'Journaling',
                        body: 'Build consistency with journal streaks, structured prompts, and detailed trade notes so you can reflect on what is working (and what is not).'
                    },
                    {
                        title: 'Wallet(s)',
                        body: 'Connect wallets manually or automatically, then search transactions across Deriverse DEX and other venues without leaving the app.'
                    }
                ].map((card) => (
                    <div key={card.title} className="rounded-none border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/10">
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">{card.title}</p>
                        <p className="mt-3 text-sm leading-relaxed text-white/70">{card.body}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4 rounded-none bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 p-6 text-sm leading-relaxed text-white/85">
                <p>
                    Right now, I&apos;m focused on making Deriverse DEX trades measurable and actionable, powered by the Deriverse SDK
                    and Solana Network. Check out the roadmap for what&apos;s shipping next.
                </p>
                <div>
                    <h3 className="text-base font-semibold text-white">How this gets built</h3>
                    <p className="mt-2">
                        I&apos;m submitting Deriverse Journal to the Superteam Earn Deriverse bounty. If it wins, every dollar loops
                        back into sharper UX, richer insights, and tools that actually help you trade right.
                    </p>
                </div>
                <div className="space-y-3 rounded-none border border-white/10 bg-black/20 p-4 text-white/80">
                    <p>
                        If you run a fund or just want to support what I&apos;m building, I&apos;d love to chat. Hit me up on Telegram or
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
                <div className="fixed inset-0 z-50 flex items-center justify-center px-">
                    <div className="absolute" onClick={() => setIsQrOpen(false)} />
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

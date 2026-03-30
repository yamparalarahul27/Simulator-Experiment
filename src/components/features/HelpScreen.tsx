'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const TELEGRAM_URL = 'https://t.me/yamparalarahul1';
const QR_IMAGE_SRC = '/assets/QR_image.png';

const FAQ_ITEMS = [
    {
        value: 'wallets',
        title: 'How do I switch between wallets?',
        body: 'Use the network pill in the navbar. You can connect multiple wallets and toggle between mock, devnet, or mainnet data. Each wallet keeps its own journal context.'
    },
    {
        value: 'missing-trades',
        title: 'My trades are missing—what now?',
        body: 'Try re-syncing from the Trade History tab. If you still do not see your data, export a CSV from your CEX and drag it into the uploader. We normalize everything on import.'
    },
    {
        value: 'collaboration',
        title: 'Can I collaborate with teammates?',
        body: 'Shared workspaces are on the roadmap. For now, export a PDF snapshot or invite a teammate to view using a read-only link.'
    }
];

export default function HelpScreen() {
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
        <section className="mx-auto flex max-w-4xl flex-col gap-6 md:gap-8 rounded-lg text-bs-text-secondary backdrop-blur">
            <header className="space-y-3">
                <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-bs-text-mute">Need a hand?</p>
                <h1 className="text-2xl md:text-4xl font-semibold text-bs-text-primary">Help Center</h1>
                <p className="text-base md:text-lg leading-relaxed text-bs-text-secondary">
                    Quick answers to the most common questions.
                </p>
            </header>

            <Accordion
                type="single"
                collapsible
                defaultValue="wallets"
                className="rounded-lg border border-bs-border bg-bs-card text-base leading-relaxed"
            >
                {FAQ_ITEMS.map((item) => (
                    <AccordionItem key={item.value} value={item.value} className="px-4">
                        <AccordionTrigger className="text-bs-text-primary text-base md:text-lg">
                            {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-bs-text-secondary text-sm">
                            {item.body}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <footer className="space-y-4 rounded-lg bg-gradient-to-r from-[#00ffff]/15 via-[#00e6e6]/15 to-[#00b3b3]/15 p-4 md:p-6 text-sm leading-relaxed text-bs-text-primary/85">

                <div className="text-center space-y-3 rounded-lg border border-bs-border bg-bs-bg/20 p-4 text-bs-text-secondary">
                    <p>
                        If you have any other question or need help, connect with me on Telegram
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center flex-wrap items-center gap-2 sm:gap-3 text-bs-text-primary">
                        <a
                            href={TELEGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-primary/90 transition-colors hover:border-white/40"
                        >
                            {TELEGRAM_URL.replace('https://', '')}
                        </a>
                        <button
                            type="button"
                            onClick={handleCopy}
                            aria-label="Copy Telegram handle"
                            className="flex items-center gap-2 rounded-lg border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-secondary transition-colors hover:border-white/40"
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied' : 'Copy handle'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsQrOpen(true)}
                            className="flex items-center gap-2 rounded-lg border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-secondary transition-colors hover:border-white/40"
                        >
                            <QrCode className="h-4 w-4" />
                            View QR
                        </button>
                    </div>
                </div>
            </footer>

            {isQrOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-bs-bg/70 backdrop-blur-sm" onClick={() => setIsQrOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-lg bg-[#05050c]/95 p-6 text-center shadow-2xl">
                        <button
                            aria-label="Close QR modal"
                            className="absolute right-4 top-4 rounded-lg border border-bs-border p-1 text-bs-text-tertiary transition-colors hover:text-bs-text-primary"
                            onClick={() => setIsQrOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <h4 className="text-lg font-semibold text-bs-text-primary">Scan to say hi!</h4>
                        <p className="mt-2 text-sm text-bs-text-secondary">Waiting to talk to you soon.</p>
                        <div className="mt-6 overflow-hidden rounded-lg">
                            <Image
                                src={QR_IMAGE_SRC}
                                alt="Telegram QR code"
                                width={280}
                                height={280}
                                className="h-auto w-full"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

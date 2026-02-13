'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

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

export default function HelpDrawerContent() {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
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
        <div className="p-4 text-white/80 space-y-6">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Need a hand?</p>
                <h2 className="text-2xl font-semibold text-white">Help Center</h2>
                <p className="text-sm leading-relaxed text-white/70">
                    Quick answers to the most common questions.
                </p>
            </header>

            <Accordion
                type="single"
                collapsible
                defaultValue="wallets"
                className="rounded-none border border-white/10 bg-white/5 text-sm leading-relaxed"
            >
                {FAQ_ITEMS.map((item) => (
                    <AccordionItem key={item.value} value={item.value} className="px-2">
                        <AccordionTrigger className="text-white text-base">
                            {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 text-sm">
                            {item.body}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <section className="space-y-3 rounded-none border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <p className="text-center">
                    Still need help? Reach out on Telegram.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
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
                </div>
            </section>
        </div>
    );
}

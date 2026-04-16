'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, QrCode, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { useFAQ } from '@/lib/hooks/useContent';

const TELEGRAM_URL = 'https://t.me/yamparalarahul1';
const QR_IMAGE_SRC = '/assets/QR_image.png';

export default function HelpScreen() {
    const [copied, setCopied] = useState(false);
    const [isQrOpen, setIsQrOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { data } = useFAQ();
    const faqItems = data?.faq ?? [];
    const supportPaths = data?.supportPaths ?? [];

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
                <p className="text-sm text-bs-text-tertiary">YDEX Help</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Get unstuck quickly.
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Answers for common issues, practical fixes, and direct support when you need a fast hand.
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
                {supportPaths.map((path) => (
                    <article key={path.title} className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6">
                        <h2 className="text-lg font-semibold text-bs-text-primary text-balance">{path.title}</h2>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">{path.description}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card">
                <div className="border-b border-bs-border px-5 py-4">
                    <h2 className="text-xl font-semibold text-bs-text-primary text-balance">Frequently asked questions</h2>
                </div>
                <Accordion type="single" collapsible defaultValue="wallets" className="px-4 pb-2 pt-1">
                    {faqItems.map((item) => (
                        <AccordionItem key={item.value} value={item.value} className="border-bs-border px-1">
                            <AccordionTrigger className="text-left text-base text-bs-text-primary">
                                {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-bs-text-secondary">{item.body}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card-fg px-5 py-6">
                <p className="text-sm text-bs-text-secondary text-pretty">
                    Need more than a FAQ? Connect directly on Telegram for help with setup, data issues, or product
                    feedback.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
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
            </section>

            {isQrOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/65" onClick={() => setIsQrOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bs-border bg-bs-card p-6 text-center">
                        <h4 className="text-lg font-semibold text-bs-text-primary text-balance">Scan to connect</h4>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">
                            Share feedback, issues, or product ideas directly.
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

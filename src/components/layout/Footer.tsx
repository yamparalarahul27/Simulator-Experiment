'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAppSound } from '@/lib/context/SoundContext';

const QR_IMAGE_SRC = '/assets/QR_image.png';

export default function Footer() {
    const [isScanOpen, setIsScanOpen] = useState(false);
    const { playClick, playOpen } = useAppSound();

    const openScan = useCallback(() => {
        playOpen();
        setIsScanOpen(true);
    }, [playOpen]);

    const closeScan = useCallback(() => {
        playClick();
        setIsScanOpen(false);
    }, [playClick]);

    useEffect(() => {
        if (!isScanOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeScan();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeScan, isScanOpen]);

    return (
        <footer className="mt-auto shrink-0 border-t border-bs-border-subtle py-1">
            <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="font-semibold text-bs-text-primary">YDEX</span>
                    <span className="hidden h-4 border-l border-bs-border-subtle sm:block" />
                    <p className="text-bs-text-secondary">
                        Trading case simulator for orders, liquidation, and risk.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-bs-text-tertiary">
                    <span className="tabular-nums">© 2026 Yamparala Rahul</span>
                    <button
                        type="button"
                        onClick={openScan}
                        className="rounded-md border border-bs-border bg-bs-card px-2.5 py-0.5 text-xs font-medium text-bs-text-primary transition-colors hover:bg-bs-card-fg"
                    >
                        Connect
                    </button>
                </div>
            </div>

            {isScanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/65"
                        onClick={closeScan}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bs-border bg-bs-card p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_24px_rgba(0,0,0,0.1)]">
                        <h4 className="text-lg font-semibold text-bs-text-primary text-balance">Scan to say hi</h4>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">
                            Send feedback, ideas, or collaboration notes directly.
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
                            onClick={closeScan}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </footer>
    );
}

'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { X } from 'lucide-react';

const QR_IMAGE_SRC = '/assets/QR_image.png';

export default function Footer() {
    const [isScanOpen, setIsScanOpen] = useState(false);

    return (
        <footer className="mb-8 mt-14">
            <div className="overflow-hidden rounded-2xl border border-bs-border bg-bs-card">
                <div className="grid gap-5 px-5 py-6 md:grid-cols-[1fr_auto] md:items-center md:px-6">
                    <div className="space-y-1">
                        <p className="text-lg font-semibold text-bs-text-primary text-balance">
                            Built for traders who want clarity before execution.
                        </p>
                        <p className="text-sm text-bs-text-secondary text-pretty">
                            Design and engineering by Yamparala Rahul. © 2026 YDEX.
                        </p>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => setIsScanOpen(true)}
                            className="rounded-xl border border-bs-border px-4 py-2 text-sm font-medium text-bs-text-primary"
                        >
                            Connect with Rahul
                        </button>
                    </div>
                </div>
            </div>

            {isScanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/65"
                        onClick={() => setIsScanOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bs-border bg-bs-card p-6 text-center">
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
                            onClick={() => setIsScanOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </footer>
    );
}

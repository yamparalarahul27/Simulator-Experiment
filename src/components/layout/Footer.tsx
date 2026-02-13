'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { X } from 'lucide-react';

const QR_IMAGE_SRC = '/assets/QR_image.png';

export default function Footer() {
    const [isScanOpen, setIsScanOpen] = useState(false);

    return (
        <footer className="mt-12 mb-8">
            <div className="relative">
                {/* Glassmorphism Container */}
                <div className="relative overflow-hidden rounded-none border border-white/10 bg-black/2">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-100/40"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-100/40"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-100/40"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-100/40"></div>

                    {/* Content */}
                    <div className="relative z-10 py-6 px-">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-white/60 text-sm font-mono text-center">
                                Design & Engineered by{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsScanOpen(true)}
                                    className="text-white/90 font-semibold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
                                >
                                    Yamparala Rahul
                                </button>
                                , © 2026 Powered by Deriverse.
                            </p>
                        </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-100/5 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {isScanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setIsScanOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-none border border-white/10 bg-[#05050c]/95 p-6 text-center shadow-2xl">
                        <h4 className="text-lg font-semibold text-white">Scan to say hi!</h4>
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
                            className="mt-6 inline-flex items-center justify-center rounded-none border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:text-white"
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

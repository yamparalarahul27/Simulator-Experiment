'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { WifiOff, Terminal as TerminalIcon } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 font-mono selection:bg-[var(--bs-error)]/30 selection:text-[var(--bs-error)]">
            <div className="max-w-xl w-full">
                {/* Terminal Header */}
                <div className="border border-[var(--bs-border)] bg-[var(--bs-card)] p-3 md:p-4 flex items-center justify-between mb-6 md:mb-8 overflow-hidden relative gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-[var(--bs-error)] animate-pulse shrink-0"></div>
                        <span className="text-[10px] md:text-[12px] text-[var(--bs-text-mute)] uppercase tracking-widest leading-none font-bold truncate">
                            Status: Critical Malfunction
                        </span>
                    </div>
                    <div className="text-[10px] md:text-[12px] text-[var(--bs-text-mute)] uppercase tracking-widest leading-none font-bold shrink-0">Ref: ER_VOID_404</div>

                    {/* Subtle Glitch Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-10">
                        <div className="h-px w-full bg-white absolute top-1/4 animate-glitch-1"></div>
                        <div className="h-px w-full bg-white absolute top-3/4 animate-glitch-2"></div>
                    </div>
                </div>

                {/* Error Content */}
                <div className="space-y-8">
                    <div className="flex items-start gap-4 md:gap-6">
                        <div className="p-3 md:p-4 bg-[var(--bs-error)]/10 border border-[var(--bs-error)]/20 text-[var(--bs-error)] mt-1 shrink-0">
                            <WifiOff size={24} className="md:w-8 md:h-8" />
                        </div>
                        <div className="space-y-3 md:space-y-4 min-w-0">
                            <h1 className="text-2xl md:text-4xl font-bold text-[var(--bs-text-primary)] uppercase tracking-tighter leading-none">SIGNAL LOST</h1>
                            <p className="text-[var(--bs-text-mute)] text-xs md:text-sm leading-relaxed uppercase tracking-tighter">
                                The requested coordinate does not exist within the current simulation grid. Packet loss at 100%.
                                Data retrieval failed.
                            </p>
                        </div>
                    </div>

                    {/* Diagnostic Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--bs-card)] border border-[var(--bs-border)]">
                            <span className="text-[12px] text-[var(--bs-text-mute)] uppercase block mb-1 font-bold">Error Code</span>
                            <span className="text-sm font-bold text-[var(--bs-text-primary)]">404_PAGE_NOT_FOUND</span>
                        </div>
                        <div className="p-4 bg-[var(--bs-card)] border border-[var(--bs-border)]">
                            <span className="text-[12px] text-[var(--bs-text-mute)] uppercase block mb-1 font-bold">Subsystem</span>
                            <span className="text-sm font-bold text-[var(--bs-text-primary)]">ROUTING_MANAGER_V2</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-4">
                        <Link
                            href="/"
                            className="group relative flex items-center justify-between p-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-[var(--bs-error)] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <TerminalIcon size={18} />
                                <span>Reestablish Connection</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">{'->'}</span>

                            {/* Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                                <div className="w-full h-1 bg-[var(--bs-bg)] absolute top-0 animate-scanline"></div>
                            </div>
                        </Link>
                    </div>

                    <p className="text-center text-[12px] text-[var(--bs-text-mute)] uppercase tracking-[0.3em] pt-8 font-bold">
                        &copy; 2024 YDEX // SYSTEM V2.4.0
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes glitch-1 {
                    0% { transform: translateY(0); }
                    20% { transform: translateY(5px); }
                    40% { transform: translateY(-5px); }
                    60% { transform: translateY(2px); }
                    100% { transform: translateY(0); }
                }
                @keyframes glitch-2 {
                    0% { transform: translateY(0); }
                    25% { transform: translateY(-3px); }
                    50% { transform: translateY(7px); }
                    75% { transform: translateY(-2px); }
                    100% { transform: translateY(0); }
                }
                @keyframes scanline {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-glitch-1 { animation: glitch-1 4s infinite linear; }
                .animate-glitch-2 { animation: glitch-2 3.5s infinite linear; }
                .animate-scanline { animation: scanline 2s infinite linear; }
            `}</style>
        </div>
    );
}

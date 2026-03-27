'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { WifiOff, Terminal as TerminalIcon } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 font-mono selection:bg-red-500/30 selection:text-red-500">
            <div className="max-w-xl w-full">
                {/* Terminal Header */}
                <div className="border border-white/10 bg-white/5 p-4 flex items-center justify-between mb-8 overflow-hidden relative">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[12px] text-white/40 uppercase tracking-widest leading-none font-bold">
                            Status: Critical Malfunction
                        </span>
                    </div>
                    <div className="text-[12px] text-white/20 uppercase tracking-widest leading-none font-bold">Ref: ER_VOID_404</div>

                    {/* Subtle Glitch Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-10">
                        <div className="h-px w-full bg-white absolute top-1/4 animate-glitch-1"></div>
                        <div className="h-px w-full bg-white absolute top-3/4 animate-glitch-2"></div>
                    </div>
                </div>

                {/* Error Content */}
                <div className="space-y-8">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 mt-1">
                            <WifiOff size={32} />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold text-white uppercase tracking-tighter leading-none">SIGNAL LOST</h1>
                            <p className="text-white/40 text-sm leading-relaxed uppercase tracking-tighter">
                                The requested coordinate does not exist within the current simulation grid. Packet loss at 100%.
                                Data retrieval failed.
                            </p>
                        </div>
                    </div>

                    {/* Diagnostic Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[12px] text-white/20 uppercase block mb-1 font-bold">Error Code</span>
                            <span className="text-sm font-bold text-white">404_PAGE_NOT_FOUND</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10">
                            <span className="text-[12px] text-white/20 uppercase block mb-1 font-bold">Subsystem</span>
                            <span className="text-sm font-bold text-white">ROUTING_MANAGER_V2</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-4">
                        <Link
                            href="/"
                            className="group relative flex items-center justify-between p-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-red-500 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <TerminalIcon size={18} />
                                <span>Reestablish Connection</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">{'->'}</span>

                            {/* Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                                <div className="w-full h-1 bg-black absolute top-0 animate-scanline"></div>
                            </div>
                        </Link>
                    </div>

                    <p className="text-center text-[12px] text-white/20 uppercase tracking-[0.3em] pt-8 font-bold">
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

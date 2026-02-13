import React from 'react';
import Image from "next/image";

export default function MobileRestrictedView() {
    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center bg-[#0D0D21]"
            style={{
                backgroundImage: "url('/assets/background_wallpaper_dot.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="mb-8">
                <Image
                    src="/assets/deriverse_j_hero_logo.png"
                    alt="Deriverse hero logo"
                    width={180}
                    height={56}
                    priority
                    className="h-auto w-40"
                />
            </div>

            <div className="bg-black/30 p-8 rounded-none max-w-sm w-full backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/20 blur-xl rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="p-4 flex items-center justify-center">
                        <Image
                            src="/assets/deriverse_desktop_icon.png"
                            alt="Deriverse desktop icon"
                            width={192}
                            height={192}
                        />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-wide">Desktop Optimized</h2>
                        <p className="text-white/70 text-sm">
                            Switch to desktop for full power. Mobile App coming soon.
                        </p>
                    </div>

                    <div className="w-full h-px bg-white/10"></div>

                    <div className="bg-black/60 p-4 w-full">
                        <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-mono">IN ROADMAP</p>
                        <div className="flex flex-row gap-3 max-w-400">
                            <div className="flex flex-col items-center gap-2 w-full">
                                <Image
                                    src="/assets/seeker_icon.png"
                                    alt="Solana Mobile App"
                                    width={20}
                                    height={20}
                                />
                                <span className="text-sm text-white/80">Solana Mobile App</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <Image
                                    src="/assets/app_store_icon.png"
                                    alt="Android / iPhone App"
                                    width={20}
                                    height={20}
                                />
                                <span className="text-sm text-white/80">Android / iPhone App</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

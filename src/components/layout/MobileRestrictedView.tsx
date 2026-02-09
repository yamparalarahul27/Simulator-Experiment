import React from 'react';
import { Smartphone, MonitorSmartphone } from 'lucide-react';
import { DeriverseLogo } from './DeriverseLogo';

export default function MobileRestrictedView() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D0D21] p-6 text-center">
            <div className="mb-8">
                <DeriverseLogo />
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-none max-w-sm w-full backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/20 blur-xl rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="p-4 bg-white/5 rounded-full border border-white/10">
                        <MonitorSmartphone className="w-8 h-8 text-purple-400" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-wide">Desktop Optimized</h2>
                        <p className="text-white/60 text-sm">
                            Mobile view coming soon.
                        </p>
                    </div>

                    <div className="w-full h-px bg-white/10"></div>

                    <div className="bg-black/40 p-4 w-full border border-white/5">
                        <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-mono">IN PIPELINE</p>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-left">
                                <Smartphone size={16} className="text-green-400" />
                                <span className="text-sm text-white/80">Solana Phone App</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <Smartphone size={16} className="text-blue-400" />
                                <span className="text-sm text-white/80">Android / iPhone App</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

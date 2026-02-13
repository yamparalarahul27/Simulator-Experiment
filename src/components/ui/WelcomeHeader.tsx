'use client';

import React from 'react';
import { XSquare } from 'lucide-react';
import {
    Drawer,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from './drawer';
import HelpDrawerContent from './HelpDrawerContent';

/**
 * WelcomeHeader component for onboarding surfaces (Welcome + Wallet Ask).
 *
 * Layout / behavior:
 * - Help button (left) opens drawer from the left with close button.
 * - About button (center) opens drawer from the top with max height 800px and closes on outside click.
 * - Login button (right) is visually identical to others; no functionality is wired yet.
 *
 * Props: none (self-contained header for onboarding screens).
 */
export default function WelcomeHeader() {
    return (
        <div className="absolute top-0 left-0 right-0 z-10 p-6">
            <div className="flex justify-between items-center">
                {/* Help Drawer - Left Side */}
                <Drawer direction="left">
                    <DrawerTrigger asChild>
                        <button className="text-white/60 text-base font-mono hover:text-white/80 transition-colors flex items-center gap-2">
                            <img src="/assets/help_icon.png" alt="Help" className="w-5 h-5" />
                            Help
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-black/80 backdrop-blur-xl w-[]90vw] max-w-3xl border-white/10">
                        <DrawerClose asChild>
                            <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                                <XSquare className="h-4 w-4" />
                            </button>
                        </DrawerClose>
                        <DrawerHeader className="pr-8">
                            <DrawerTitle className="text-white">Help</DrawerTitle>
                        </DrawerHeader>
                        <HelpDrawerContent />
                    </DrawerContent>
                </Drawer>

                {/* Login Button - Right Side (Looks Normal) */}
                <button className="text-white/60 text-base font-mono hover:text-white/80 transition-colors flex items-center gap-2" onClick={() => {}}>
                    <img src="/assets/login_icon.png" alt="Login" className="w-5 h-5" />
                    Login
                </button>
            </div>
        </div>
    );
}

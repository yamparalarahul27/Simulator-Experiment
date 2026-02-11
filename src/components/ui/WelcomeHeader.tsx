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

export default function WelcomeHeader() {
    return (
        <div className="absolute top-0 left-0 right-0 z-10 p-6">
            <div className="flex justify-between items-start">
                {/* About Drawer - Left Side */}
                <Drawer direction="left">
                    <DrawerTrigger asChild>
                        <button className="text-white/60 text-sm font-mono hover:text-white/80 transition-colors">
                            About
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-black/80 backdrop-blur-xl border-white/10">
                        <DrawerClose asChild>
                            <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                                <XSquare className="h-4 w-4" />
                            </button>
                        </DrawerClose>
                        <DrawerHeader className="pr-8">
                            <DrawerTitle className="text-white">About</DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 text-white/80">
                            About content
                        </div>
                    </DrawerContent>
                </Drawer>

                {/* Help Drawer - Right Side */}
                <Drawer direction="right">
                    <DrawerTrigger asChild>
                        <button className="text-white/60 text-sm font-mono hover:text-white/80 transition-colors">
                            Help
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-black/80 backdrop-blur-xl border-white/10">
                        <DrawerClose asChild>
                            <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                                <XSquare className="h-4 w-4" />
                            </button>
                        </DrawerClose>
                        <DrawerHeader className="pr-8">
                            <DrawerTitle className="text-white">Help</DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 text-white/80">
                            Help content
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}

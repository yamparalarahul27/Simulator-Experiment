'use client';

import React from 'react';

export default function Footer() {
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
                                Made by{' '}
                                <span className="text-white/90 font-semibold">
                                    Yamparala Rahul
                                </span>
                                , Design Engineer, © 2026
                            </p>
                        </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-100/5 to-transparent pointer-events-none"></div>
                </div>
            </div>
        </footer>
    );
}

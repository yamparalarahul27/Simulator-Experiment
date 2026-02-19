'use client';

import React from 'react';
import Image from 'next/image';

/**
 * WelcomeHeader component for onboarding surfaces (Welcome + Wallet Ask).
 *
 * Simplified header with no buttons to provide clean onboarding experience.
 * The wallet login flow is now the primary interaction method.
 * 
 * Props: none (self-contained header for onboarding screens).
 */
export default function WelcomeHeader() {
    return (
        <div className="absolute top-0 left-0 right-0 z-10 p-6">
            <div className="flex items-center">
                <Image
                    src="/Logo.png"
                    alt="YDEX logo"
                    width={140}
                    height={40}
                    priority
                    className="h-auto w-32"
                />
            </div>
        </div>
    );
}

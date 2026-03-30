'use client';

import React, { useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAppearance } from '@/lib/context/AppearanceContext';
import GeneratedBackground from '@/components/ui/GeneratedBackground';

export default function AppBackground() {
    const { preferences } = useAppearance();
    const { bgType, bgImagePath, bgColor, overlayOpacity, blurAmount } = preferences;
    const [imgError, setImgError] = useState(false);
    const { resolvedTheme } = useTheme();

    const handleImgError = useCallback(() => setImgError(true), []);

    // Determine if we should show a custom image
    const hasCustomImage = bgType === 'custom' && bgImagePath && !imgError;
    const isLight = resolvedTheme === 'light';

    return (
        <div>
            {/* Base Layer */}
            {bgType === 'color' ? (
                <div
                    className="fixed inset-0 -z-20"
                    style={{
                        backgroundColor: bgColor,
                        transition: 'background-color 0.5s ease-in-out',
                    }}
                />
            ) : hasCustomImage ? (
                <div
                    className="fixed inset-0 -z-20"
                    style={{
                        backgroundImage: `url('${bgImagePath}')`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                        backgroundSize: 'cover',
                        transition: 'background-image 0.5s ease-in-out',
                    }}
                >
                    {/* Hidden img for error detection on custom images */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bgImagePath}
                        alt=""
                        onError={handleImgError}
                        className="hidden"
                    />
                </div>
            ) : isLight ? (
                <div
                    className="fixed inset-0 -z-20 bg-bs-bg transition-colors duration-500"
                />
            ) : (
                <GeneratedBackground className="fixed inset-0 -z-20" />
            )}

            {/* Overlay Layer — darkness + blur */}
            {(overlayOpacity > 0 || blurAmount > 0) && (
                <div
                    className="fixed inset-0 -z-10"
                    style={{
                        backgroundColor: `rgba(13, 13, 33, ${overlayOpacity / 100})`,
                        backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        WebkitBackdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
                    }}
                />
            )}
        </div>
    );
}

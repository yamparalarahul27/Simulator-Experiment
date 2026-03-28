'use client';

import React, { useCallback, useState } from 'react';
import { useAppearance } from '@/lib/context/AppearanceContext';

const DEFAULT_BG = '/assets/background.png';

export default function AppBackground() {
    const { preferences } = useAppearance();
    const { bgType, bgImagePath, bgColor, overlayOpacity, blurAmount } = preferences;
    const [imgError, setImgError] = useState(false);

    const handleImgError = useCallback(() => setImgError(true), []);

    // Determine which image URL to use
    const showImage = bgType !== 'color';
    const imageUrl =
        bgType === 'custom' && bgImagePath && !imgError
            ? bgImagePath
            : DEFAULT_BG;

    return (
        <div>
            {/* Base Layer */}
            {showImage ? (
                <div
                    className="fixed inset-0 -z-20"
                    style={{
                        backgroundImage: `url('${imageUrl}')`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                        backgroundSize: 'cover',
                        transition: 'background-image 0.5s ease-in-out',
                    }}
                >
                    {/* Hidden img for error detection on custom images */}
                    {bgType === 'custom' && bgImagePath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={bgImagePath}
                            alt=""
                            onError={handleImgError}
                            className="hidden"
                        />
                    )}
                </div>
            ) : (
                <div
                    className="fixed inset-0 -z-20"
                    style={{
                        backgroundColor: bgColor,
                        transition: 'background-color 0.5s ease-in-out',
                    }}
                />
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

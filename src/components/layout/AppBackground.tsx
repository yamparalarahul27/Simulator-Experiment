'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useAppearance } from '@/lib/context/AppearanceContext';

/**
 * AppBackground — Paper Texture UI
 *
 * All-CSS paper texture background with grain, fiber lines, and warm vignette.
 * No asset imports — everything is generated via CSS gradients, SVG data URIs,
 * and blend modes.
 *
 * Light: warm parchment cream
 * Dark: deep midnight navy
 */
export default function AppBackground() {
    const { preferences } = useAppearance();
    const { bgType, bgColor, overlayOpacity, blurAmount } = preferences;
    const { resolvedTheme } = useTheme();

    const isLight = resolvedTheme === 'light';

    // Base colors
    const baseBg = isLight ? '#f0ebe3' : '#111827';
    const grainBlend = isLight ? 'multiply' : 'soft-light';
    const grainOpacity = isLight ? 0.4 : 0.25;
    const fiberColor = isLight
        ? 'rgba(139, 105, 20, 0.08)'
        : 'rgba(212, 165, 74, 0.04)';
    const fiberOpacity = isLight ? 0.5 : 0.35;

    // Vignette colors
    const vignetteColor = isLight
        ? 'rgba(44, 36, 22, 0.07)'
        : 'rgba(8, 10, 18, 0.2)';

    // Warm subtle gradient for depth
    const warmGradient = isLight
        ? 'radial-gradient(ellipse at 30% 20%, rgba(218, 195, 150, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(200, 180, 140, 0.1) 0%, transparent 50%)'
        : 'radial-gradient(ellipse at 30% 20%, rgba(42, 53, 85, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(26, 34, 54, 0.3) 0%, transparent 50%)';

    // SVG noise pattern (inline, no imports)
    const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

    // Fiber lines (horizontal, very subtle)
    const fiberPattern = `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        ${fiberColor} 3px,
        ${fiberColor} 4px
    )`;

    // Stain/age spots using radial gradients
    const ageSpots = isLight
        ? `radial-gradient(ellipse at 15% 85%, rgba(180, 155, 110, 0.06) 0%, transparent 40%),
           radial-gradient(ellipse at 85% 15%, rgba(170, 145, 100, 0.04) 0%, transparent 35%),
           radial-gradient(ellipse at 50% 50%, rgba(190, 165, 120, 0.03) 0%, transparent 50%)`
        : `radial-gradient(ellipse at 15% 85%, rgba(42, 53, 85, 0.15) 0%, transparent 40%),
           radial-gradient(ellipse at 85% 15%, rgba(30, 40, 70, 0.1) 0%, transparent 35%),
           radial-gradient(ellipse at 50% 50%, rgba(26, 34, 54, 0.08) 0%, transparent 50%)`;

    return (
        <div>
            {/* Layer 1: Solid base color */}
            {bgType === 'color' ? (
                <div
                    className="fixed inset-0 -z-30"
                    style={{
                        backgroundColor: bgColor,
                        transition: 'background-color 0.5s ease-in-out',
                    }}
                />
            ) : (
                <div
                    className="fixed inset-0 -z-30"
                    style={{ backgroundColor: baseBg }}
                />
            )}

            {/* Layer 2: Warm depth gradient */}
            <div
                className="fixed inset-0 -z-29"
                style={{
                    backgroundImage: warmGradient,
                    zIndex: -29,
                }}
            />

            {/* Layer 3: Age spots / subtle warmth variations */}
            <div
                className="fixed inset-0"
                style={{
                    backgroundImage: ageSpots,
                    zIndex: -28,
                }}
            />

            {/* Layer 4: Noise grain texture (SVG-generated, no file import) */}
            <div
                className="fixed inset-0"
                style={{
                    backgroundImage: noiseSvg,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '512px 512px',
                    mixBlendMode: grainBlend as React.CSSProperties['mixBlendMode'],
                    opacity: grainOpacity,
                    zIndex: -27,
                }}
            />

            {/* Layer 5: Paper fiber lines */}
            <div
                className="fixed inset-0"
                style={{
                    backgroundImage: fiberPattern,
                    opacity: fiberOpacity,
                    zIndex: -26,
                }}
            />

            {/* Layer 6: Vignette edge darkening */}
            <div
                className="fixed inset-0"
                style={{
                    background: `radial-gradient(ellipse at center, transparent 45%, ${vignetteColor} 100%)`,
                    zIndex: -25,
                }}
            />

            {/* Overlay Layer — user-controlled darkness + blur */}
            {(overlayOpacity > 0 || blurAmount > 0) && (
                <div
                    className="fixed inset-0"
                    style={{
                        backgroundColor: isLight
                            ? `rgba(240, 235, 227, ${overlayOpacity / 100})`
                            : `rgba(17, 24, 39, ${overlayOpacity / 100})`,
                        backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        WebkitBackdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
                        zIndex: -24,
                    }}
                />
            )}
        </div>
    );
}

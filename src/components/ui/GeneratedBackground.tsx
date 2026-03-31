'use client';

import React from 'react';
import { useTheme } from 'next-themes';

/**
 * CSS-generated paper texture background for the Welcome/Landing screen.
 *
 * Replaces the old aurora gradient backgrounds with a paper texture
 * that matches the global Paper Texture UI system.
 *
 * Light: warm parchment cream with grain, fibers, age spots
 * Dark: midnight navy with warm paper-like texture
 *
 * No asset imports — all CSS-generated.
 */

interface GeneratedBackgroundProps {
    dotOverlay?: boolean;
    variant?: 'dark' | 'light';
    className?: string;
    style?: React.CSSProperties;
}

function PaperTexture({ isLight }: { isLight: boolean }) {
    const baseBg = isLight ? '#f0ebe3' : '#111827';
    const grainBlend = isLight ? 'multiply' : 'soft-light';
    const grainOpacity = isLight ? 0.45 : 0.5;

    const fiberColor = isLight
        ? 'rgba(139, 105, 20, 0.08)'
        : 'rgba(180, 155, 100, 0.05)';

    const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

    return (
        <>
            {/* Layer 1: Solid base */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: baseBg }} />

            {/* Layer 2: Warm depth gradients */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: isLight
                        ? 'radial-gradient(ellipse at 30% 20%, rgba(218, 195, 150, 0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(200, 180, 140, 0.12) 0%, transparent 50%)'
                        : 'radial-gradient(ellipse at 30% 20%, rgba(30, 42, 72, 0.6) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(22, 30, 55, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(42, 53, 85, 0.3) 0%, transparent 40%)',
                }}
            />

            {/* Layer 3: Warm vertical wash */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: isLight
                        ? 'linear-gradient(180deg, rgba(240, 235, 227, 0) 0%, rgba(225, 215, 195, 0.08) 50%, rgba(240, 235, 227, 0) 100%)'
                        : 'linear-gradient(180deg, rgba(25, 32, 52, 0) 0%, rgba(30, 38, 60, 0.35) 30%, rgba(20, 28, 48, 0.18) 70%, rgba(17, 24, 39, 0) 100%)',
                }}
            />

            {/* Layer 4: Age spots */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: isLight
                        ? `radial-gradient(ellipse at 15% 85%, rgba(180, 155, 110, 0.07) 0%, transparent 40%),
                           radial-gradient(ellipse at 85% 15%, rgba(170, 145, 100, 0.05) 0%, transparent 35%),
                           radial-gradient(ellipse at 50% 50%, rgba(190, 165, 120, 0.04) 0%, transparent 50%)`
                        : `radial-gradient(ellipse at 15% 85%, rgba(35, 45, 75, 0.3) 0%, transparent 40%),
                           radial-gradient(ellipse at 85% 15%, rgba(28, 38, 65, 0.25) 0%, transparent 35%),
                           radial-gradient(ellipse at 50% 50%, rgba(22, 30, 50, 0.18) 0%, transparent 50%),
                           radial-gradient(ellipse at 20% 30%, rgba(45, 55, 90, 0.15) 0%, transparent 30%),
                           radial-gradient(ellipse at 80% 70%, rgba(30, 40, 70, 0.12) 0%, transparent 35%)`,
                }}
            />

            {/* Layer 5: Noise grain */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: noiseSvg,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '512px 512px',
                    mixBlendMode: grainBlend as React.CSSProperties['mixBlendMode'],
                    opacity: grainOpacity,
                }}
            />

            {/* Layer 6: Paper fiber lines */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 3px,
                        ${fiberColor} 3px,
                        ${fiberColor} 4px
                    )`,
                    opacity: isLight ? 0.5 : 0.45,
                }}
            />
        </>
    );
}

export default function GeneratedBackground({
    dotOverlay = false,
    className = '',
    style,
}: GeneratedBackgroundProps) {
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme !== 'dark';

    return (
        <div
            className={`absolute inset-0 ${className}`}
            style={style}
        >
            <PaperTexture isLight={isLight} />

            {/* Dot grid overlay (wallpaper variant) — subtle on paper */}
            {dotOverlay && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(
                            circle,
                            ${isLight
                                ? 'rgba(139, 105, 20, 0.04)'
                                : 'rgba(212, 165, 74, 0.04)'
                            } 1px,
                            transparent 1px
                        )`,
                        backgroundSize: '20px 20px',
                    }}
                />
            )}
        </div>
    );
}

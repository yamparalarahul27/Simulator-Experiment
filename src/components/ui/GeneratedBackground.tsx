'use client';

import React from 'react';

/**
 * CSS-generated recreation of the aurora background images.
 *
 * Replaces:
 *   - /assets/background.png          → <GeneratedBackground />
 *   - /assets/background_wallpaper_dot.png → <GeneratedBackground dotOverlay />
 *
 * Benefits: eliminates ~5.3 MB of static PNGs, resolution-independent,
 * and can be animated or themed in the future.
 */

interface GeneratedBackgroundProps {
    /** Show the dot-grid overlay (replaces background_wallpaper_dot.png) */
    dotOverlay?: boolean;
    /** Additional className for the wrapper */
    className?: string;
    /** Additional inline styles */
    style?: React.CSSProperties;
}

export default function GeneratedBackground({
    dotOverlay = false,
    className = '',
    style,
}: GeneratedBackgroundProps) {
    return (
        <div
            className={`absolute inset-0 overflow-hidden ${className}`}
            style={{ backgroundColor: '#050510', ...style }}
        >
            {/* Aurora arc - main teal/cyan sweep */}
            <div
                style={{
                    position: 'absolute',
                    width: '140%',
                    height: '140%',
                    top: '-20%',
                    left: '-20%',
                    background: `
                        radial-gradient(
                            ellipse 50% 70% at 58% 52%,
                            rgba(0, 210, 190, 0.35) 0%,
                            rgba(0, 150, 180, 0.2) 25%,
                            rgba(0, 80, 160, 0.1) 45%,
                            transparent 65%
                        )
                    `,
                    transform: 'rotate(-15deg)',
                }}
            />

            {/* Secondary blue glow - left side ambient */}
            <div
                style={{
                    position: 'absolute',
                    width: '80%',
                    height: '80%',
                    top: '10%',
                    left: '-10%',
                    background: `
                        radial-gradient(
                            ellipse 60% 50% at 35% 55%,
                            rgba(20, 60, 160, 0.25) 0%,
                            rgba(10, 30, 100, 0.12) 40%,
                            transparent 70%
                        )
                    `,
                }}
            />

            {/* Bright teal focal point at the arc apex */}
            <div
                style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    top: '5%',
                    left: '30%',
                    background: `
                        radial-gradient(
                            ellipse 40% 50% at 55% 60%,
                            rgba(0, 230, 200, 0.3) 0%,
                            rgba(0, 180, 170, 0.15) 30%,
                            transparent 60%
                        )
                    `,
                }}
            />

            {/* Curved arc shape using a clipped pseudo-gradient */}
            <div
                style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    top: '-10%',
                    left: '-10%',
                    background: `
                        conic-gradient(
                            from 200deg at 55% 50%,
                            transparent 0deg,
                            rgba(0, 80, 180, 0.15) 30deg,
                            rgba(0, 180, 170, 0.2) 60deg,
                            rgba(0, 220, 190, 0.18) 80deg,
                            transparent 120deg,
                            transparent 360deg
                        )
                    `,
                    filter: 'blur(60px)',
                }}
            />

            {/* Bottom-right subtle blue wash */}
            <div
                style={{
                    position: 'absolute',
                    width: '70%',
                    height: '50%',
                    bottom: '-5%',
                    right: '-5%',
                    background: `
                        radial-gradient(
                            ellipse 70% 60% at 60% 70%,
                            rgba(0, 60, 140, 0.18) 0%,
                            rgba(0, 30, 80, 0.08) 50%,
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Vignette - darken edges */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(
                            ellipse 80% 80% at 55% 45%,
                            transparent 30%,
                            rgba(5, 5, 16, 0.6) 100%
                        )
                    `,
                }}
            />

            {/* Dot grid overlay (for wallpaper variant) */}
            {dotOverlay && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(
                            circle,
                            rgba(255, 255, 255, 0.08) 1px,
                            transparent 1px
                        )`,
                        backgroundSize: '20px 20px',
                    }}
                />
            )}
        </div>
    );
}

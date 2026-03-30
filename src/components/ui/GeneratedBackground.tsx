'use client';

import React from 'react';

/**
 * CSS-generated recreation of the aurora background images.
 *
 * Replaces:
 *   - /assets/background.png          → <GeneratedBackground />
 *   - /assets/background_wallpaper_dot.png → <GeneratedBackground dotOverlay />
 *
 * The arc is created using a large off-screen ring (circle with transparent
 * center and gradient border) so only the curved edge is visible — producing
 * a natural crescent shape instead of an elliptical blob.
 */

interface GeneratedBackgroundProps {
    dotOverlay?: boolean;
    className?: string;
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
            {/* Layer 1: Main arc — large ring positioned off-screen
                A 1600px circle with only the right edge visible creates
                the sweeping crescent curve from the original image. */}
            <div
                style={{
                    position: 'absolute',
                    width: '1600px',
                    height: '1600px',
                    top: '-55%',
                    left: '-45%',
                    borderRadius: '50%',
                    background: 'transparent',
                    boxShadow: `
                        120px 80px 120px 0px rgba(0, 180, 170, 0.18),
                        160px 60px 80px 0px rgba(0, 220, 200, 0.12),
                        80px 120px 160px 20px rgba(0, 80, 160, 0.15),
                        200px 40px 60px 0px rgba(0, 230, 200, 0.08)
                    `,
                    border: '80px solid transparent',
                    borderRightColor: 'rgba(0, 180, 170, 0.08)',
                    borderBottomColor: 'rgba(0, 100, 170, 0.06)',
                    filter: 'blur(40px)',
                    transform: 'rotate(-25deg)',
                }}
            />

            {/* Layer 2: Curved glow trail — conic gradient for the arc sweep */}
            <div
                style={{
                    position: 'absolute',
                    width: '1400px',
                    height: '1400px',
                    top: '-50%',
                    left: '-35%',
                    borderRadius: '50%',
                    background: `conic-gradient(
                        from 160deg,
                        transparent 0deg,
                        rgba(0, 60, 140, 0.08) 20deg,
                        rgba(0, 130, 170, 0.14) 45deg,
                        rgba(0, 200, 185, 0.18) 70deg,
                        rgba(0, 230, 200, 0.15) 90deg,
                        rgba(0, 180, 170, 0.08) 110deg,
                        transparent 130deg,
                        transparent 360deg
                    )`,
                    filter: 'blur(60px)',
                    transform: 'rotate(-15deg)',
                }}
            />

            {/* Layer 3: Bright teal focal point at the arc's apex */}
            <div
                style={{
                    position: 'absolute',
                    width: '500px',
                    height: '400px',
                    top: '5%',
                    right: '15%',
                    background: `
                        radial-gradient(
                            ellipse 70% 80% at 50% 55%,
                            rgba(0, 230, 200, 0.25) 0%,
                            rgba(0, 190, 175, 0.12) 35%,
                            transparent 70%
                        )
                    `,
                    filter: 'blur(30px)',
                }}
            />

            {/* Layer 4: Secondary blue glow — left/center ambient */}
            <div
                style={{
                    position: 'absolute',
                    width: '70%',
                    height: '70%',
                    top: '15%',
                    left: '-5%',
                    background: `
                        radial-gradient(
                            ellipse 55% 50% at 40% 55%,
                            rgba(15, 50, 150, 0.2) 0%,
                            rgba(10, 30, 100, 0.1) 45%,
                            transparent 75%
                        )
                    `,
                }}
            />

            {/* Layer 5: Bottom-right blue wash */}
            <div
                style={{
                    position: 'absolute',
                    width: '60%',
                    height: '45%',
                    bottom: '-5%',
                    right: '0%',
                    background: `
                        radial-gradient(
                            ellipse 65% 55% at 55% 65%,
                            rgba(0, 50, 130, 0.15) 0%,
                            rgba(0, 25, 70, 0.06) 55%,
                            transparent 85%
                        )
                    `,
                }}
            />

            {/* Layer 6: Subtle lower arc hint — the faint curve at bottom-right */}
            <div
                style={{
                    position: 'absolute',
                    width: '1200px',
                    height: '1200px',
                    bottom: '-85%',
                    right: '-30%',
                    borderRadius: '50%',
                    boxShadow: '-60px -40px 100px 0px rgba(0, 120, 160, 0.06)',
                    border: '40px solid transparent',
                    borderTopColor: 'rgba(0, 140, 160, 0.04)',
                    borderLeftColor: 'rgba(0, 80, 140, 0.03)',
                    filter: 'blur(30px)',
                }}
            />

            {/* Layer 7: Vignette — darken edges */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(
                            ellipse 75% 75% at 55% 40%,
                            transparent 25%,
                            rgba(5, 5, 16, 0.65) 100%
                        )
                    `,
                }}
            />

            {/* Layer 8: Dot grid overlay (wallpaper variant) */}
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

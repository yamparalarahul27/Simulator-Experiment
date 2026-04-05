'use client';

import React from 'react';
import type { TextureConfig } from '@/lib/presets';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/**
 * Grid/scanline texture for the Retro preset.
 * Creates a subtle grid pattern with horizontal scanlines.
 */
export default function GridTexture({ config }: { config: TextureConfig }) {
  const p = config.params;
  const gridSize = (p.gridSize as number) || 24;
  const scanlineSize = (p.scanlineSize as number) || 3;

  // CSS grid pattern using repeating gradients
  const gridPattern = `
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent ${gridSize - 1}px,
      ${p.gridColor} ${gridSize - 1}px,
      ${p.gridColor} ${gridSize}px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent ${gridSize - 1}px,
      ${p.gridColor} ${gridSize - 1}px,
      ${p.gridColor} ${gridSize}px
    )
  `;

  // Horizontal scanlines
  const scanlines = `repeating-linear-gradient(
    0deg,
    transparent,
    transparent ${scanlineSize}px,
    ${p.scanlineColor} ${scanlineSize}px,
    ${p.scanlineColor} ${scanlineSize + 1}px
  )`;

  return (
    <>
      {/* Layer 1: Solid base */}
      <div className="fixed inset-0 -z-30" style={{ backgroundColor: config.baseBg }} />

      {/* Layer 2: Grid pattern */}
      <div className="fixed inset-0" style={{ backgroundImage: gridPattern, zIndex: -29 }} />

      {/* Layer 3: Scanlines */}
      <div className="fixed inset-0" style={{ backgroundImage: scanlines, zIndex: -28 }} />

      {/* Layer 4: Warm age gradient for retro feel */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 20%, rgba(200, 170, 100, 0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 70% 80%, rgba(180, 150, 90, 0.04) 0%, transparent 50%)
          `,
          zIndex: -27,
        }}
      />

      {/* Layer 5: Noise grain */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '512px 512px',
          mixBlendMode: 'multiply',
          opacity: p.grainOpacity as number,
          zIndex: -26,
        }}
      />

      {/* Layer 6: Vignette */}
      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${p.vignetteColor} 100%)`,
          zIndex: -24,
        }}
      />
    </>
  );
}

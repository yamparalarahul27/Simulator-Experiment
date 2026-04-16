'use client';

import React from 'react';
import type { TextureConfig } from '@/lib/presets';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export default function FrostTexture({ config }: { config: TextureConfig }) {
  const p = config.params;

  return (
    <>
      {/* Layer 1: Solid base */}
      <div className="fixed inset-0 -z-30" style={{ backgroundColor: config.baseBg }} />

      {/* Layer 2: Frost glow patches — mimics ice crystal clusters */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 15%, ${p.frostColor1} 0%, transparent 50%),
            radial-gradient(ellipse at 75% 30%, ${p.frostColor2} 0%, transparent 45%),
            radial-gradient(ellipse at 40% 80%, ${p.frostColor1} 0%, transparent 55%)
          `,
          zIndex: -29,
        }}
      />

      {/* Layer 3: Shimmer band — subtle horizontal ice gleam */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent 20%, ${p.shimmerColor} 45%, transparent 65%)`,
          zIndex: -28,
        }}
      />

      {/* Layer 4: Fine frost crystal pattern (diagonal lines) */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 8px,
              rgba(200, 220, 245, 0.04) 8px,
              rgba(200, 220, 245, 0.04) 9px
            )
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
          mixBlendMode: 'soft-light',
          opacity: p.grainOpacity as number,
          zIndex: -26,
        }}
      />

      {/* Layer 6: Vignette */}
      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, ${p.vignetteColor} 100%)`,
          zIndex: -24,
        }}
      />
    </>
  );
}

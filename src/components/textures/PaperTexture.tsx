'use client';

import React from 'react';
import type { TextureConfig } from '@/lib/presets';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export default function PaperTexture({ config }: { config: TextureConfig }) {
  const p = config.params;

  const fiberPattern = `repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    ${p.fiberColor} 3px,
    ${p.fiberColor} 4px
  )`;

  return (
    <>
      {/* Layer 1: Solid base */}
      <div className="fixed inset-0 -z-30" style={{ backgroundColor: config.baseBg }} />

      {/* Layer 2: Warm depth gradient */}
      <div className="fixed inset-0" style={{ backgroundImage: p.warmGradient as string, zIndex: -29 }} />

      {/* Layer 3: Warm wash */}
      <div className="fixed inset-0" style={{ backgroundImage: p.warmWash as string, zIndex: -28 }} />

      {/* Layer 4: Age spots */}
      <div className="fixed inset-0" style={{ backgroundImage: p.ageSpots as string, zIndex: -27 }} />

      {/* Layer 5: Noise grain */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '512px 512px',
          mixBlendMode: (p.grainBlend as string) as React.CSSProperties['mixBlendMode'],
          opacity: p.grainOpacity as number,
          zIndex: -26,
        }}
      />

      {/* Layer 6: Paper fiber lines */}
      <div
        className="fixed inset-0"
        style={{ backgroundImage: fiberPattern, opacity: p.fiberOpacity as number, zIndex: -25 }}
      />

      {/* Layer 7: Vignette */}
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

'use client';

import React from 'react';
import type { TextureConfig } from '@/lib/presets';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/**
 * Generic gradient texture used by Spring, Summer, and Soft presets.
 * Each preset provides 3 radial gradients via params.
 */
export default function GradientTexture({ config }: { config: TextureConfig }) {
  const p = config.params;

  return (
    <>
      {/* Layer 1: Solid base */}
      <div className="fixed inset-0 -z-30" style={{ backgroundColor: config.baseBg }} />

      {/* Layer 2: Primary gradient blob */}
      <div
        className="fixed inset-0"
        style={{ backgroundImage: p.gradient1 as string, zIndex: -29 }}
      />

      {/* Layer 3: Secondary gradient blob */}
      <div
        className="fixed inset-0"
        style={{ backgroundImage: p.gradient2 as string, zIndex: -28 }}
      />

      {/* Layer 4: Tertiary gradient blob */}
      <div
        className="fixed inset-0"
        style={{ backgroundImage: p.gradient3 as string, zIndex: -27 }}
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
          background: `radial-gradient(ellipse at center, transparent 45%, ${p.vignetteColor} 100%)`,
          zIndex: -24,
        }}
      />
    </>
  );
}

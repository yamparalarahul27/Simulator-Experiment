'use client';

import React from 'react';
import type { TextureConfig } from '@/lib/presets';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export default function GlassTexture({ config }: { config: TextureConfig }) {
  const p = config.params;

  return (
    <>
      {/* Layer 1: Solid base */}
      <div className="fixed inset-0 -z-30" style={{ backgroundColor: config.baseBg }} />

      {/* Layer 2: Soft color blobs — glassmorphism ambient light */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, ${p.glowColor1} 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, ${p.glowColor2} 0%, transparent 35%),
            radial-gradient(circle at 50% 80%, ${p.glowColor3} 0%, transparent 45%)
          `,
          zIndex: -29,
        }}
      />

      {/* Layer 3: Large frosted glass refraction band */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 45%, transparent 60%),
            linear-gradient(225deg, transparent 40%, rgba(255,255,255,0.03) 55%, transparent 70%)
          `,
          zIndex: -28,
        }}
      />

      {/* Layer 4: Subtle noise for glass texture feel */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '512px 512px',
          mixBlendMode: 'overlay',
          opacity: p.grainOpacity as number,
          zIndex: -26,
        }}
      />

      {/* Layer 5: Vignette */}
      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, ${p.vignetteColor} 100%)`,
          zIndex: -24,
        }}
      />
    </>
  );
}

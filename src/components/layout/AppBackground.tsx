'use client';

import React from 'react';
import { useAppearance } from '@/lib/context/AppearanceContext';
import { useThemePreset } from '@/lib/context/ThemePresetContext';
import { PRESETS } from '@/lib/presets';
import type { TextureConfig } from '@/lib/presets';
import { PaperTexture, FrostTexture, GlassTexture, GradientTexture, GridTexture } from '@/components/textures';

/**
 * AppBackground — Preset-aware texture dispatcher
 *
 * Reads the active preset from ThemePresetContext and renders
 * the appropriate CSS-only texture. Also applies the user's
 * overlay/blur controls from AppearanceContext.
 */
export default function AppBackground() {
    const { preferences } = useAppearance();
    const { bgType, bgColor, overlayOpacity, blurAmount } = preferences;
    const { presetId } = useThemePreset();

    const preset = PRESETS[presetId];
    const texture = preset.texture;

    // When user picks a solid color, show that instead of the texture
    const showSolidColor = bgType === 'color';

    return (
        <div>
            {showSolidColor ? (
                <div
                    className="fixed inset-0 -z-30"
                    style={{
                        backgroundColor: bgColor,
                        transition: 'background-color 0.5s ease-in-out',
                    }}
                />
            ) : (
                <TextureRenderer texture={texture} />
            )}

            {/* Overlay Layer — user-controlled darkness + blur */}
            {(overlayOpacity > 0 || blurAmount > 0) && (
                <div
                    className="fixed inset-0"
                    style={{
                        backgroundColor: `${texture.params.overlayTint || 'rgba(240, 235, 227,'} ${overlayOpacity / 100})`,
                        backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        WebkitBackdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                        transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
                        zIndex: -23,
                    }}
                />
            )}
        </div>
    );
}

function TextureRenderer({ texture }: { texture: TextureConfig }) {
    switch (texture.type) {
        case 'paper':
            return <PaperTexture config={texture} />;
        case 'frost':
            return <FrostTexture config={texture} />;
        case 'glass':
            return <GlassTexture config={texture} />;
        case 'gradient':
            return <GradientTexture config={texture} />;
        case 'grid':
            return <GridTexture config={texture} />;
        case 'none':
            return <div className="fixed inset-0 -z-30" style={{ backgroundColor: texture.baseBg }} />;
        default:
            return <PaperTexture config={texture} />;
    }
}

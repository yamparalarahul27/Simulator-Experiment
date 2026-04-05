/**
 * Theme Preset System — Type Definitions
 *
 * Each preset defines a complete set of CSS custom property overrides
 * plus a texture configuration for the background layer.
 */

/** All CSS variable tokens a preset can override */
export interface PresetColorTokens {
  // Core surfaces
  '--bs-bg': string;
  '--bs-card': string;
  '--bs-card-fg': string;
  '--bs-border': string;
  '--bs-border-subtle': string;
  '--bs-border-active': string;
  '--bs-bg-primary': string;

  // Text
  '--bs-text-primary': string;
  '--bs-text-secondary': string;
  '--bs-text-tertiary': string;
  '--bs-text-mute': string;

  // Brand
  '--bs-brand': string;
  '--bs-brand-secondary': string;
  '--bs-brand-tertiary': string;
  '--bs-brand-anchor': string;
  '--bs-brand-rust': string;
  '--bs-brand-ts': string;

  // Semantic
  '--bs-success': string;
  '--bs-error': string;
  '--bs-buy': string;
  '--bs-sell': string;
  '--bs-info': string;
  '--bs-accent-cyan': string;
  '--bs-warning': string;
  '--bs-chart-green': string;
  '--bs-chart-red': string;

  // shadcn compatibility
  '--background': string;
  '--foreground': string;
  '--card': string;
  '--card-foreground': string;
  '--popover': string;
  '--popover-foreground': string;
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--muted': string;
  '--muted-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--destructive': string;
  '--border': string;
  '--input': string;
  '--ring': string;
}

export type TextureType = 'paper' | 'frost' | 'glass' | 'gradient' | 'grid' | 'none';

export interface TextureConfig {
  type: TextureType;
  /** Base background color (used as layer 1) */
  baseBg: string;
  /** Preset-specific params passed to the texture component */
  params: Record<string, string | number>;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  /** Swatch colors shown in the preset picker (3-4 representative colors) */
  swatches: [string, string, string, string?];
  /** Light-mode color tokens */
  tokens: PresetColorTokens;
  /** Background texture configuration */
  texture: TextureConfig;
}

export type PresetId = 'paper' | 'winter' | 'spring' | 'summer' | 'glass' | 'soft' | 'retro';

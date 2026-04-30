'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PRESETS, PRESET_ORDER } from '@/lib/presets';
import type { PresetId, PresetColorTokens } from '@/lib/presets';
import { useSiteSettings } from '@/lib/hooks/useContent';
import { useAppearance } from '@/lib/context/AppearanceContext';

// ============================================
// Types
// ============================================

interface ThemePresetContextValue {
  presetId: PresetId;
  setPresetId: (id: PresetId) => void;
  /** Admin-controlled list of enabled presets */
  enabledPresets: PresetId[];
  /** Admin-controlled default preset for new users */
  defaultPresetId: PresetId;
  /** Whether the preset has been loaded from storage */
  isLoaded: boolean;
}

const ThemePresetContext = createContext<ThemePresetContextValue>({
  presetId: 'paper',
  setPresetId: () => {},
  enabledPresets: [...PRESET_ORDER],
  defaultPresetId: 'paper',
  isLoaded: false,
});

// ============================================
// CSS variable injection
// ============================================

const LEGACY_TOKEN_MAP: Record<string, string> = {
  '--bs-bg': '--ds-bg-dark',
  '--bs-brand-tertiary': '--ds-primary',
  '--bs-brand-secondary': '--ds-secondary',
  '--bs-brand': '--ds-accent',
  '--bs-border': '--ds-border',
  '--bs-text-primary': '--ds-text-primary',
  '--bs-text-mute': '--ds-text-muted',
};

function applyPresetTokens(tokens: PresetColorTokens) {
  const root = document.documentElement;
  const entries = Object.entries(tokens) as [string, string][];

  for (const [key, value] of entries) {
    root.style.setProperty(key, value);
    const legacy = LEGACY_TOKEN_MAP[key];
    if (legacy) {
      root.style.setProperty(legacy, value);
    }
  }
}

function clearPresetTokens(tokens: PresetColorTokens) {
  const root = document.documentElement;
  const entries = Object.entries(tokens) as [string, string][];

  for (const [key] of entries) {
    root.style.removeProperty(key);
    const legacy = LEGACY_TOKEN_MAP[key];
    if (legacy) {
      root.style.removeProperty(legacy);
    }
  }
}

// ============================================
// localStorage helpers
// ============================================

const PRESET_CACHE_KEY = 'deriverse.preset';

function getCachedPresetId(): PresetId | null {
  try {
    const raw = localStorage.getItem(PRESET_CACHE_KEY);
    if (raw && PRESET_ORDER.includes(raw as PresetId)) {
      return raw as PresetId;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedPresetId(id: PresetId) {
  try {
    localStorage.setItem(PRESET_CACHE_KEY, id);
  } catch {
    // non-critical
  }
}

// ============================================
// Provider
// ============================================

export function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<PresetId>('paper');
  const [isLoaded, setIsLoaded] = useState(false);
  const prevPresetRef = useRef<PresetId>('paper');
  const { data: siteSettings } = useSiteSettings();
  const { preferences, updatePreference } = useAppearance();

  const enabledPresets = (siteSettings?.enabledPresets ?? PRESET_ORDER) as PresetId[];
  const defaultPresetId = (siteSettings?.defaultPresetId ?? 'paper') as PresetId;

  // On mount: read from AppearanceContext (Supabase-backed) or localStorage
  useEffect(() => {
    // Priority: Supabase preference > localStorage > admin default
    const supabasePreset = preferences.presetId as PresetId | undefined;
    const cached = getCachedPresetId();
    const resolved = (supabasePreset && PRESET_ORDER.includes(supabasePreset))
      ? supabasePreset
      : (cached && PRESET_ORDER.includes(cached))
        ? cached
        : defaultPresetId;

    if (resolved !== 'paper') {
      setPresetIdState(resolved);
      applyPresetTokens(PRESETS[resolved].tokens);
      prevPresetRef.current = resolved;
    } else if (presetId !== 'paper') {
      // Reset to paper if resolved is paper but current isn't
      setPresetIdState('paper');
      clearPresetTokens(PRESETS[prevPresetRef.current].tokens);
      prevPresetRef.current = 'paper';
    }
    setCachedPresetId(resolved);
    setIsLoaded(true);
    // Only run on mount and when supabase preferences load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.presetId, defaultPresetId]);

  const setPresetId = useCallback((id: PresetId) => {
    // Clear previous preset tokens if it wasn't paper
    const prev = prevPresetRef.current;
    if (prev !== 'paper') {
      clearPresetTokens(PRESETS[prev].tokens);
    }

    // Apply new tokens (paper doesn't need injection — CSS :root handles it)
    if (id !== 'paper') {
      applyPresetTokens(PRESETS[id].tokens);
    }

    prevPresetRef.current = id;
    setPresetIdState(id);
    setCachedPresetId(id);

    // Persist to Supabase via AppearanceContext (debounced)
    updatePreference('presetId', id);
  }, [updatePreference]);

  return (
    <ThemePresetContext.Provider value={{ presetId, setPresetId, enabledPresets, defaultPresetId, isLoaded }}>
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset() {
  return useContext(ThemePresetContext);
}

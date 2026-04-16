'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PRESETS, PRESET_ORDER } from '@/lib/presets';
import type { PresetId, PresetColorTokens } from '@/lib/presets';

// ============================================
// Types
// ============================================

interface ThemePresetContextValue {
  presetId: PresetId;
  setPresetId: (id: PresetId) => void;
  /** Whether the preset has been loaded from storage */
  isLoaded: boolean;
}

const ThemePresetContext = createContext<ThemePresetContextValue>({
  presetId: 'paper',
  setPresetId: () => {},
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
    // Also set legacy aliases
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

  // On mount: read from localStorage and apply
  useEffect(() => {
    const cached = getCachedPresetId();
    if (cached && cached !== 'paper') {
      setPresetIdState(cached);
      applyPresetTokens(PRESETS[cached].tokens);
      prevPresetRef.current = cached;
    }
    setIsLoaded(true);
  }, []);

  const setPresetId = useCallback((id: PresetId) => {
    // Clear previous preset tokens if it wasn't paper (paper = CSS defaults)
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
  }, []);

  return (
    <ThemePresetContext.Provider value={{ presetId, setPresetId, isLoaded }}>
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset() {
  return useContext(ThemePresetContext);
}

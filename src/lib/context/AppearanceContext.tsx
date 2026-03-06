'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    SupabaseProfileService,
    DEFAULT_APPEARANCE,
    type AppearancePreferences,
} from '@/services/SupabaseProfileService';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface AppearanceContextValue {
    preferences: AppearancePreferences;
    updatePreference: <K extends keyof AppearancePreferences>(
        key: K,
        value: AppearancePreferences[K]
    ) => void;
    uploadBackground: (file: File) => Promise<void>;
    removeBackground: () => Promise<void>;
    resetToDefault: () => Promise<void>;
    isUploading: boolean;
    isLoaded: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue>({
    preferences: { ...DEFAULT_APPEARANCE },
    updatePreference: () => {},
    uploadBackground: async () => {},
    removeBackground: async () => {},
    resetToDefault: async () => {},
    isUploading: false,
    isLoaded: false,
});

// ============================================
// localStorage cache helpers
// ============================================

const CACHE_KEY_PREFIX = 'deriverse.appearance.';

function getCached(walletAddress: string): { prefs: AppearancePreferences; updatedAt: string } | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY_PREFIX + walletAddress);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function setCache(walletAddress: string, prefs: AppearancePreferences, updatedAt: string) {
    try {
        localStorage.setItem(
            CACHE_KEY_PREFIX + walletAddress,
            JSON.stringify({ prefs, updatedAt })
        );
    } catch {
        // localStorage full or unavailable — non-critical
    }
}

// ============================================
// Image compression
// ============================================

const MAX_RAW_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_COMPRESSED_SIZE = 300 * 1024; // 300KB
const MAX_WIDTH = 1920;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            reject(new Error('Invalid format. Please upload a JPG, PNG, or WebP image.'));
            return;
        }
        if (file.size > MAX_RAW_SIZE) {
            reject(new Error('File too large. Maximum size is 2MB.'));
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Compression failed'));
                        return;
                    }
                    if (blob.size > MAX_COMPRESSED_SIZE) {
                        reject(new Error(
                            `Image too complex after compression (${Math.round(blob.size / 1024)}KB). Try a simpler background.`
                        ));
                        return;
                    }
                    resolve(blob);
                },
                'image/webp',
                0.7
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to read image file.'));
        };

        img.src = url;
    });
}

// ============================================
// Provider
// ============================================

export function AppearanceProvider({
    children,
    walletAddress,
}: {
    children: React.ReactNode;
    walletAddress: string | null;
}) {
    const [preferences, setPreferences] = useState<AppearancePreferences>({ ...DEFAULT_APPEARANCE });
    const [isUploading, setIsUploading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentWalletRef = useRef<string | null>(null);

    // Load preferences when wallet changes
    useEffect(() => {
        currentWalletRef.current = walletAddress;

        if (!walletAddress) {
            setPreferences({ ...DEFAULT_APPEARANCE });
            setIsLoaded(true);
            return;
        }

        // 1. Hydrate from localStorage immediately
        const cached = getCached(walletAddress);
        if (cached) {
            setPreferences(cached.prefs);
            setIsLoaded(true);
        }

        // 2. Fetch from Supabase in background
        (async () => {
            try {
                const result = await SupabaseProfileService.getPreferences(walletAddress);
                // Only update if wallet hasn't changed while we were fetching
                if (currentWalletRef.current !== walletAddress) return;

                const shouldUpdate = !cached || cached.updatedAt !== result.updatedAt;
                if (shouldUpdate) {
                    setPreferences(result.preferences);
                    setCache(walletAddress, result.preferences, result.updatedAt);
                }
            } catch (err) {
                console.error('[Appearance] Failed to load preferences:', err);
                // Keep cached/default — don't crash
            } finally {
                if (currentWalletRef.current === walletAddress) {
                    setIsLoaded(true);
                }
            }
        })();

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        };
    }, [walletAddress]);

    // Debounced save to Supabase
    const debouncedSave = useCallback(
        (prefs: AppearancePreferences) => {
            if (!walletAddress) return;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(async () => {
                try {
                    const result = await SupabaseProfileService.updatePreferences(walletAddress, prefs);
                    setCache(walletAddress, result.preferences, result.updatedAt);
                } catch (err) {
                    console.error('[Appearance] Failed to save preferences:', err);
                }
            }, 500);
        },
        [walletAddress]
    );

    const updatePreference = useCallback(
        <K extends keyof AppearancePreferences>(key: K, value: AppearancePreferences[K]) => {
            setPreferences((prev) => {
                const next = { ...prev, [key]: value };
                // Cache locally immediately
                if (walletAddress) {
                    setCache(walletAddress, next, new Date().toISOString());
                }
                debouncedSave(next);
                return next;
            });
        },
        [walletAddress, debouncedSave]
    );

    const uploadBackground = useCallback(
        async (file: File) => {
            if (!walletAddress) {
                toast.error('Connect your wallet to upload a background.');
                return;
            }

            setIsUploading(true);
            try {
                const compressed = await compressImage(file);
                const publicUrl = await SupabaseProfileService.uploadBackgroundImage(walletAddress, compressed);

                // Cache-bust by appending timestamp
                const urlWithBust = `${publicUrl}?v=${Date.now()}`;

                const newPrefs: AppearancePreferences = {
                    ...preferences,
                    bgType: 'custom',
                    bgImagePath: urlWithBust,
                };

                setPreferences(newPrefs);

                const result = await SupabaseProfileService.updatePreferences(walletAddress, newPrefs);
                setCache(walletAddress, result.preferences, result.updatedAt);

                toast.success('Background updated');
            } catch (err: any) {
                toast.error(err?.message || 'Failed to upload background.');
            } finally {
                setIsUploading(false);
            }
        },
        [walletAddress, preferences]
    );

    const removeBackground = useCallback(async () => {
        if (!walletAddress) return;

        try {
            await SupabaseProfileService.deleteBackgroundImage(walletAddress);

            const newPrefs: AppearancePreferences = {
                ...preferences,
                bgType: 'default',
                bgImagePath: null,
            };

            setPreferences(newPrefs);
            const result = await SupabaseProfileService.updatePreferences(walletAddress, newPrefs);
            setCache(walletAddress, result.preferences, result.updatedAt);

            toast.success('Custom background removed');
        } catch (err) {
            console.error('[Appearance] removeBackground error:', err);
            toast.error('Failed to remove background.');
        }
    }, [walletAddress, preferences]);

    const resetToDefault = useCallback(async () => {
        // Cancel any pending debounced save that would overwrite the reset
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }

        // Update local state immediately (works even without wallet)
        setPreferences({ ...DEFAULT_APPEARANCE });

        if (!walletAddress) return;

        try {
            // Delete stored image if it exists
            if (preferences.bgImagePath) {
                await SupabaseProfileService.deleteBackgroundImage(walletAddress);
            }

            const result = await SupabaseProfileService.updatePreferences(walletAddress, { ...DEFAULT_APPEARANCE });
            setCache(walletAddress, result.preferences, result.updatedAt);

            toast.success('Reset to default');
        } catch (err) {
            console.error('[Appearance] resetToDefault error:', err);
            toast.error('Failed to reset preferences.');
        }
    }, [walletAddress, preferences]);

    return (
        <AppearanceContext.Provider
            value={{
                preferences,
                updatePreference,
                uploadBackground,
                removeBackground,
                resetToDefault,
                isUploading,
                isLoaded,
            }}
        >
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    return useContext(AppearanceContext);
}

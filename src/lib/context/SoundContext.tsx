'use client';

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { useSound } from '@/hooks/use-sound';
import { clickSoftSound } from '@/lib/click-soft';
import { open001Sound } from '@/lib/open-001';
import { successChimeSound } from '@/lib/success-chime';

const SOUND_STORAGE_KEY = 'ydex-sound-enabled';
const SOUND_CHANGE_EVENT = 'ydex-sound-preference-change';

interface PlayOptions {
    force?: boolean;
}

interface SoundContextValue {
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    toggleSound: () => void;
    playClick: (options?: PlayOptions) => void;
    playOpen: (options?: PlayOptions) => void;
    playSuccess: (options?: PlayOptions) => void;
    playTick: (options?: PlayOptions) => void;
}

const noop = () => {};

const SoundContext = createContext<SoundContextValue>({
    soundEnabled: true,
    setSoundEnabled: noop,
    toggleSound: noop,
    playClick: noop,
    playOpen: noop,
    playSuccess: noop,
    playTick: noop,
});

function persistSoundPreference(enabled: boolean) {
    try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
        // Preference persistence is non-critical.
    }
}

function readSoundPreference() {
    if (typeof window === 'undefined') return true;

    try {
        return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
    } catch {
        return true;
    }
}

function subscribeSoundPreference(onStoreChange: () => void) {
    if (typeof window === 'undefined') return () => {};

    const handleStorage = (event: StorageEvent) => {
        if (event.key === SOUND_STORAGE_KEY) onStoreChange();
    };
    const handlePreferenceChange = () => onStoreChange();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SOUND_CHANGE_EVENT, handlePreferenceChange);

    return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(SOUND_CHANGE_EVENT, handlePreferenceChange);
    };
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const soundEnabled = useSyncExternalStore(
        subscribeSoundPreference,
        readSoundPreference,
        () => true,
    );

    const [playClickBase] = useSound(clickSoftSound, {
        volume: 0.18,
        playbackRate: 1.1,
        interrupt: true,
    });
    const [playOpenBase] = useSound(open001Sound, {
        volume: 0.13,
        interrupt: true,
    });
    const [playSuccessBase] = useSound(successChimeSound, {
        volume: 0.16,
        interrupt: true,
    });
    const [playTickBase] = useSound(clickSoftSound, {
        volume: 0.07,
        playbackRate: 1.45,
        interrupt: true,
    });

    const setSoundEnabled = useCallback((enabled: boolean) => {
        persistSoundPreference(enabled);
        window.dispatchEvent(new Event(SOUND_CHANGE_EVENT));
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled(!soundEnabled);
    }, [setSoundEnabled, soundEnabled]);

    const playClick = useCallback((options?: PlayOptions) => {
        if (options?.force || soundEnabled) playClickBase();
    }, [playClickBase, soundEnabled]);

    const playOpen = useCallback((options?: PlayOptions) => {
        if (options?.force || soundEnabled) playOpenBase();
    }, [playOpenBase, soundEnabled]);

    const playSuccess = useCallback((options?: PlayOptions) => {
        if (options?.force || soundEnabled) playSuccessBase();
    }, [playSuccessBase, soundEnabled]);

    const playTick = useCallback((options?: PlayOptions) => {
        if (options?.force || soundEnabled) playTickBase();
    }, [playTickBase, soundEnabled]);

    const value = useMemo<SoundContextValue>(() => ({
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        playClick,
        playOpen,
        playSuccess,
        playTick,
    }), [playClick, playOpen, playSuccess, playTick, setSoundEnabled, soundEnabled, toggleSound]);

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
}

export function useAppSound() {
    return useContext(SoundContext);
}

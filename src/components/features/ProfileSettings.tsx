'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAppearance } from '@/lib/context/AppearanceContext';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import type { AppearancePreferences } from '@/services/SupabaseProfileService';
import { cn } from '@/lib/utils';

type BgMode = AppearancePreferences['bgType'];

const BG_MODES: { value: BgMode; label: string; icon: string }[] = [
    { value: 'default', label: 'Default', icon: '🖼️' },
    { value: 'custom', label: 'Upload', icon: '📁' },
    { value: 'color', label: 'Color', icon: '■' },
];

function AppearanceSection() {
    const { connected } = useWalletConnection();
    const { preferences, updatePreference, uploadBackground, removeBackground, resetToDefault, isUploading } =
        useAppearance();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [colorInput, setColorInput] = useState(preferences.bgColor);

    const handleModeChange = useCallback(
        (mode: BgMode) => {
            if (mode === 'custom' && !connected) return;
            updatePreference('bgType', mode);
        },
        [connected, updatePreference]
    );

    const handleFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) uploadBackground(file);
            event.target.value = '';
        },
        [uploadBackground]
    );

    const handleColorChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setColorInput(value);
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                updatePreference('bgColor', value);
            }
        },
        [updatePreference]
    );

    const handleColorPickerChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setColorInput(event.target.value);
            updatePreference('bgColor', event.target.value);
        },
        [updatePreference]
    );

    return (
        <section className="overflow-hidden rounded-2xl border border-bs-border bg-bs-card">
            <header className="border-b border-bs-border px-5 py-4">
                <h2 className="text-xl font-semibold text-bs-text-primary text-balance">Appearance</h2>
                {!connected && (
                    <p className="mt-1 text-sm text-bs-text-tertiary">Connect your wallet to persist these settings.</p>
                )}
            </header>

            <div className="space-y-6 px-5 py-5">
                <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                        Background mode
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {BG_MODES.map((mode) => {
                            const isActive = preferences.bgType === mode.value;
                            const isDisabled = mode.value === 'custom' && !connected;

                            return (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => handleModeChange(mode.value)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm',
                                        isActive
                                            ? 'border-bs-border-active bg-bs-card-fg text-bs-text-primary'
                                            : 'border-bs-border bg-bs-card-fg text-bs-text-secondary',
                                        isDisabled && 'cursor-not-allowed opacity-50'
                                    )}
                                >
                                    <span>{mode.icon}</span>
                                    <span>{mode.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {preferences.bgType === 'custom' && (
                    <div className="space-y-3">
                        <label className="block text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Custom image
                        </label>

                        {preferences.bgImagePath && (
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-24 overflow-hidden rounded-lg border border-bs-border bg-bs-card-fg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={preferences.bgImagePath}
                                        alt="Current background"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeBackground}
                                    className="rounded-lg border border-bs-error/30 bg-bs-error/10 px-3 py-1.5 text-xs font-medium text-bs-error"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={cn(
                                    'rounded-lg border border-bs-border bg-bs-card-fg px-4 py-2 text-sm text-bs-text-primary',
                                    isUploading && 'cursor-not-allowed opacity-60'
                                )}
                            >
                                {isUploading ? 'Compressing and Uploading...' : 'Upload New Image'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        <p className="text-xs text-bs-text-tertiary">
                            Max input 2MB (JPG/PNG/WebP). Compressed to WebP around 300KB.
                        </p>
                    </div>
                )}

                {preferences.bgType === 'color' && (
                    <div className="space-y-2">
                        <label className="block text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Background color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={preferences.bgColor}
                                onChange={handleColorPickerChange}
                                className="h-10 w-10 cursor-pointer rounded border border-bs-border bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0"
                            />
                            <input
                                type="text"
                                value={colorInput}
                                onChange={handleColorChange}
                                placeholder="#0b0e14"
                                maxLength={7}
                                className="w-28 rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm font-mono text-bs-text-secondary placeholder:text-bs-text-mute focus:border-bs-border-active focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Image overlay darkness
                        </label>
                        <span className="text-xs tabular-nums text-bs-text-mute">{preferences.overlayOpacity}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={preferences.overlayOpacity}
                        onChange={(event) => updatePreference('overlayOpacity', Number(event.target.value))}
                        className="h-1 w-full cursor-pointer appearance-none bg-bs-card-fg [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bs-brand-tertiary [&::-webkit-slider-thumb]:bg-bs-brand-secondary"
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Image blur intensity
                        </label>
                        <span className="text-xs tabular-nums text-bs-text-mute">{preferences.blurAmount}px</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={20}
                        value={preferences.blurAmount}
                        onChange={(event) => updatePreference('blurAmount', Number(event.target.value))}
                        className="h-1 w-full cursor-pointer appearance-none bg-bs-card-fg [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-bs-brand-tertiary [&::-webkit-slider-thumb]:bg-bs-brand-secondary"
                    />
                </div>

                <div className="border-t border-bs-border pt-2">
                    <button
                        type="button"
                        onClick={resetToDefault}
                        className="rounded-lg border border-bs-border px-4 py-2 text-xs font-medium text-bs-text-secondary"
                    >
                        Reset to Default
                    </button>
                </div>
            </div>
        </section>
    );
}

export default function ProfileSettings() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Supabase sign-out failed:', error);
        }

        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('deriverse.activeTab');
                window.dispatchEvent(new Event('deriverse:show-welcome'));
            }
            router.push('/lessons');
            setIsLoggingOut(false);
        }, 800);
    };

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">Profile Settings</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Tune your workspace experience.
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Personalize visual behavior, background style, and environment controls.
                </p>
            </header>

            <AppearanceSection />

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                        'rounded-xl border px-6 py-2.5 text-sm font-medium',
                        isLoggingOut
                            ? 'cursor-not-allowed border-bs-border bg-bs-card-fg text-bs-text-mute'
                            : 'border-bs-error/35 bg-bs-error/10 text-bs-error'
                    )}
                >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                </button>
            </div>
        </div>
    );
}

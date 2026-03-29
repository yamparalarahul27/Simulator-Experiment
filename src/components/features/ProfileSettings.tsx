'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAppearance } from '@/lib/context/AppearanceContext';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import type { AppearancePreferences } from '@/services/SupabaseProfileService';

// ============================================
// Appearance Section
// ============================================

type BgMode = AppearancePreferences['bgType'];

const BG_MODES: { value: BgMode; label: string; icon: string }[] = [
    { value: 'default', label: 'Default', icon: '🖼️' },
    { value: 'custom', label: 'Upload', icon: '📁' },
    { value: 'color', label: 'Color', icon: '■' },
];

function AppearanceSection() {
    const { connected } = useWalletConnection();
    const {
        preferences,
        updatePreference,
        uploadBackground,
        removeBackground,
        resetToDefault,
        isUploading,
    } = useAppearance();

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
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) uploadBackground(file);
            // Reset so re-selecting the same file triggers onChange
            e.target.value = '';
        },
        [uploadBackground]
    );

    const handleColorChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setColorInput(val);
            // Only push valid hex to context
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                updatePreference('bgColor', val);
            }
        },
        [updatePreference]
    );

    const handleColorPickerChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setColorInput(e.target.value);
            updatePreference('bgColor', e.target.value);
        },
        [updatePreference]
    );

    return (
        <div className="w-full border border-[var(--bs-border)] bg-white/[0.03]">
            {/* Section Header */}
            <div className="px-5 py-3 border-b border-[var(--bs-border)]">
                <h2 className="text-sm font-semibold text-[var(--bs-text-primary)]/90 uppercase tracking-wider">
                    Appearance
                </h2>
                {!connected && (
                    <p className="text-xs text-[var(--bs-text-mute)] mt-1">
                        Connect your wallet to save appearance settings.
                    </p>
                )}
            </div>

            <div className="p-5 space-y-6">
                {/* Background Mode Selector */}
                <div>
                    <label className="text-xs text-[var(--bs-text-tertiary)] uppercase tracking-wider mb-2 block">
                        Background Mode
                    </label>
                    <div className="flex gap-2">
                        {BG_MODES.map((mode) => {
                            const isActive = preferences.bgType === mode.value;
                            const isDisabled = mode.value === 'custom' && !connected;

                            return (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => handleModeChange(mode.value)}
                                    disabled={isDisabled}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 text-sm font-medium
                                        border transition-all duration-200
                                        ${isActive
                                            ? 'border-[var(--bs-brand-tertiary)]/60 bg-[var(--bs-brand-tertiary)]/15 text-[var(--bs-text-primary)]'
                                            : 'border-[var(--bs-border)] bg-white/[0.03] text-[var(--bs-text-tertiary)] hover:border-[var(--bs-border)] hover:text-[var(--bs-text-secondary)]'
                                        }
                                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    <span>{mode.icon}</span>
                                    <span>{mode.label}</span>
                                    {isDisabled && <span className="text-[10px]">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Image Upload */}
                {preferences.bgType === 'custom' && (
                    <div className="space-y-3">
                        <label className="text-xs text-[var(--bs-text-tertiary)] uppercase tracking-wider block">
                            Custom Image
                        </label>

                        {preferences.bgImagePath && (
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-14 border border-[var(--bs-border)] overflow-hidden bg-black/30">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={preferences.bgImagePath}
                                        alt="Current background"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeBackground}
                                    className="px-3 py-1.5 text-xs border border-[var(--bs-error)]/30 text-[var(--bs-error)]
                                               hover:bg-[var(--bs-error)]/10 transition-colors"
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
                                className={`
                                    px-4 py-2 text-sm border border-[var(--bs-border)] bg-white/[0.03]
                                    hover:border-[var(--bs-border)] transition-colors
                                    ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-[var(--bs-text-secondary)] hover:text-[var(--bs-text-primary)]'}
                                `}
                            >
                                {isUploading ? 'Compressing & Uploading...' : 'Upload New Image'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        <p className="text-[11px] text-[var(--bs-text-mute)]">
                            Max: 2MB input (JPG/PNG/WebP). Compressed to WebP ≤300KB. Ideal: 2560px wide.
                        </p>
                    </div>
                )}

                {/* Solid Color Picker */}
                {preferences.bgType === 'color' && (
                    <div className="space-y-2">
                        <label className="text-xs text-[var(--bs-text-tertiary)] uppercase tracking-wider block">
                            Background Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={preferences.bgColor}
                                onChange={handleColorPickerChange}
                                className="w-10 h-10 border border-[var(--bs-border)] bg-transparent cursor-pointer
                                           [&::-webkit-color-swatch-wrapper]:p-0
                                           [&::-webkit-color-swatch]:border-0"
                            />
                            <input
                                type="text"
                                value={colorInput}
                                onChange={handleColorChange}
                                placeholder="#0b0e14"
                                maxLength={7}
                                className="w-28 px-3 py-2 text-sm bg-white/[0.03] border border-[var(--bs-border)]
                                           text-[var(--bs-text-secondary)] font-mono placeholder:text-[var(--bs-text-mute)]
                                           focus:outline-none focus:border-[var(--bs-brand-tertiary)]/40"
                            />
                        </div>
                    </div>
                )}

                {/* Overlay Opacity Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-[var(--bs-text-tertiary)] uppercase tracking-wider">
                            Image Overlay Darkness
                        </label>
                        <span className="text-xs text-[var(--bs-text-mute)] font-mono">
                            {preferences.overlayOpacity}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={preferences.overlayOpacity}
                        onChange={(e) => updatePreference('overlayOpacity', Number(e.target.value))}
                        className="w-full h-1 bg-[var(--bs-card-fg)] appearance-none cursor-pointer
                                   [&::-webkit-slider-thumb]:appearance-none
                                   [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                                   [&::-webkit-slider-thumb]:bg-[var(--bs-brand-secondary)] [&::-webkit-slider-thumb]:rounded-full
                                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bs-brand-tertiary)]"
                    />
                </div>

                {/* Blur Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-[var(--bs-text-tertiary)] uppercase tracking-wider">
                            Image Blur Intensity
                        </label>
                        <span className="text-xs text-[var(--bs-text-mute)] font-mono">
                            {preferences.blurAmount}px
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={20}
                        value={preferences.blurAmount}
                        onChange={(e) => updatePreference('blurAmount', Number(e.target.value))}
                        className="w-full h-1 bg-[var(--bs-card-fg)] appearance-none cursor-pointer
                                   [&::-webkit-slider-thumb]:appearance-none
                                   [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                                   [&::-webkit-slider-thumb]:bg-[var(--bs-brand-secondary)] [&::-webkit-slider-thumb]:rounded-full
                                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bs-brand-tertiary)]"
                    />
                </div>

                {/* Reset Button */}
                <div className="pt-2 border-t border-[var(--bs-border)]">
                    <button
                        type="button"
                        onClick={resetToDefault}
                        className="px-4 py-2 text-xs text-[var(--bs-text-mute)] border border-[var(--bs-border)]
                                   hover:text-[var(--bs-text-tertiary)] hover:border-[var(--bs-border)] transition-colors"
                    >
                        ↺ Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

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
        <div className="flex flex-col items-center gap-6 md:gap-8 max-w-2xl mx-auto py-4 md:py-8 w-full">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl md:text-4xl font-bold text-[var(--bs-text-primary)] mb-2">Profile &amp; Settings</h1>
                <p className="text-[var(--bs-text-tertiary)] text-sm md:text-base">Configure your profile details and preferences.</p>
            </div>

            {/* Appearance Section */}
            <AppearanceSection />

            {/* Log out */}
            <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-8 py-3 border-2 rounded-lg font-semibold text-base transition-all duration-300 ${isLoggingOut
                    ? 'bg-[var(--bs-card-fg)] border-[var(--bs-border)] text-[var(--bs-text-mute)] cursor-not-allowed'
                    : 'bg-red-900/40 border-[var(--bs-error)]/10 text-[var(--bs-text-primary)] hover:bg-red-900/60 hover:border-[var(--bs-error)]/10'
                    }`}
            >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
        </div>
    );
}

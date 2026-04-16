'use client';

import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useSiteSettings } from '@/lib/hooks/useContent';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { PRESETS, PRESET_ORDER } from '@/lib/presets';
import type { PresetId } from '@/lib/presets';
import { cn } from '@/lib/utils';

export default function AdminPresetsPage() {
    const { data: settings } = useSiteSettings();

    const [defaultPreset, setDefaultPreset] = useState<string>('paper');
    const [enabled, setEnabled] = useState<Set<string>>(new Set(PRESET_ORDER));
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Sync local state when SWR data loads
    useEffect(() => {
        if (settings) {
            setDefaultPreset(settings.defaultPresetId);
            setEnabled(new Set(settings.enabledPresets));
        }
    }, [settings]);

    const togglePreset = (id: string) => {
        setEnabled(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                // Don't allow disabling the default preset
                if (id === defaultPreset) return prev;
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setDirty(true);
    };

    const handleDefaultChange = (id: string) => {
        setDefaultPreset(id);
        // Auto-enable if it was disabled
        setEnabled(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const ok = await SupabaseContentService.updateSiteSettings({
            defaultPresetId: defaultPreset,
            enabledPresets: PRESET_ORDER.filter(id => enabled.has(id)),
        });
        if (ok) {
            await mutate('content:site-settings');
            setDirty(false);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-bs-border bg-bs-card">
                <header className="border-b border-bs-border px-5 py-4">
                    <h2 className="text-xl font-semibold text-bs-text-primary">Theme Presets</h2>
                    <p className="mt-1 text-sm text-bs-text-secondary">
                        Control which presets are available to users and set the default.
                    </p>
                </header>

                <div className="px-5 py-5 space-y-6">
                    {/* Default Preset */}
                    <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Default Preset (for new users)
                        </label>
                        <select
                            value={defaultPreset}
                            onChange={(e) => handleDefaultChange(e.target.value)}
                            className="rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary focus:border-bs-border-active focus:outline-none"
                        >
                            {PRESET_ORDER.map(id => (
                                <option key={id} value={id}>{PRESETS[id].name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Preset Grid */}
                    <div>
                        <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-bs-text-tertiary">
                            Enabled Presets
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {PRESET_ORDER.map((id) => {
                                const preset = PRESETS[id];
                                const isEnabled = enabled.has(id);
                                const isDefault = defaultPreset === id;

                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            'relative rounded-xl border p-4 transition-all',
                                            isEnabled
                                                ? 'border-bs-border bg-bs-card-fg'
                                                : 'border-bs-border/50 bg-bs-card-fg/50 opacity-60'
                                        )}
                                    >
                                        {/* Swatch bar */}
                                        <div className="mb-3 flex gap-1 overflow-hidden rounded-lg">
                                            {preset.swatches.map((color, i) =>
                                                color ? (
                                                    <div
                                                        key={i}
                                                        className="h-5 flex-1"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ) : null
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="mb-3">
                                            <h3 className="text-sm font-semibold text-bs-text-primary">{preset.name}</h3>
                                            <p className="text-xs text-bs-text-tertiary">{preset.description}</p>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex items-center gap-2">
                                            {isDefault && (
                                                <span className="rounded-full bg-bs-brand/15 px-2 py-0.5 text-[10px] font-medium text-bs-brand">
                                                    DEFAULT
                                                </span>
                                            )}
                                            <span className={cn(
                                                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                                                isEnabled
                                                    ? 'bg-bs-success/15 text-bs-success'
                                                    : 'bg-bs-error/15 text-bs-error'
                                            )}>
                                                {isEnabled ? 'ENABLED' : 'DISABLED'}
                                            </span>
                                        </div>

                                        {/* Toggle button */}
                                        <button
                                            type="button"
                                            onClick={() => togglePreset(id)}
                                            disabled={isDefault}
                                            className={cn(
                                                'mt-3 w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                                isDefault
                                                    ? 'cursor-not-allowed border-bs-border/30 text-bs-text-mute'
                                                    : isEnabled
                                                        ? 'border-bs-error/30 bg-bs-error/10 text-bs-error hover:bg-bs-error/20'
                                                        : 'border-bs-success/30 bg-bs-success/10 text-bs-success hover:bg-bs-success/20'
                                            )}
                                        >
                                            {isDefault ? 'Default (cannot disable)' : isEnabled ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-3 border-t border-bs-border pt-4">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !dirty}
                            className={cn(
                                'rounded-lg border px-5 py-2 text-sm font-medium transition-colors',
                                dirty
                                    ? 'border-bs-brand/30 bg-bs-brand/10 text-bs-brand hover:bg-bs-brand/20'
                                    : 'cursor-not-allowed border-bs-border bg-bs-card-fg text-bs-text-mute'
                            )}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        {dirty && (
                            <span className="text-xs text-bs-warning">Unsaved changes</span>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

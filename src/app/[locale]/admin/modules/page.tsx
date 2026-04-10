'use client';

import { useState } from 'react';
import { useModules } from '@/lib/hooks/useContent';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { mutate } from 'swr';

export default function AdminModulesPage() {
    const { data: modules = [] } = useModules();
    const [editing, setEditing] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        icon: '',
        difficulty: 'beginner' as string,
        simulatorKind: '' as string,
        comingSoon: false,
        walletRequired: false,
    });

    const startEdit = (moduleSlug: string) => {
        const m = modules.find(mod => mod.moduleSlug === moduleSlug);
        if (!m) return;
        setForm({
            title: m.title,
            description: m.description,
            icon: m.icon,
            difficulty: m.difficulty,
            simulatorKind: m.simulatorKind || '',
            comingSoon: m.comingSoon,
            walletRequired: m.walletRequired,
        });
        setEditing(moduleSlug);
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        const idx = modules.findIndex(m => m.moduleSlug === editing);
        await SupabaseContentService.upsertModule({
            moduleSlug: editing,
            title: form.title,
            description: form.description,
            icon: form.icon,
            difficulty: form.difficulty,
            simulatorKind: form.simulatorKind || null,
            comingSoon: form.comingSoon,
            walletRequired: form.walletRequired,
            sortOrder: idx >= 0 ? idx : modules.length,
        });
        await mutate('content:modules');
        setSaving(false);
        setEditing(null);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-bs-text-primary">Learning Modules</h2>

            <div className="space-y-3">
                {modules.map((m) => (
                    <div key={m.moduleSlug} className="rounded-xl border border-bs-border bg-bs-card px-5 py-4">
                        {editing === m.moduleSlug ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Title</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Icon (emoji)</label>
                                        <input
                                            value={form.icon}
                                            onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-bs-text-mute">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Difficulty</label>
                                        <select
                                            value={form.difficulty}
                                            onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Simulator Kind</label>
                                        <select
                                            value={form.simulatorKind}
                                            onChange={(e) => setForm(f => ({ ...f, simulatorKind: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        >
                                            <option value="">None</option>
                                            <option value="spot">Spot</option>
                                            <option value="futures">Futures</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <label className="flex items-center gap-2 text-xs text-bs-text-mute">
                                            <input
                                                type="checkbox"
                                                checked={form.comingSoon}
                                                onChange={(e) => setForm(f => ({ ...f, comingSoon: e.target.checked }))}
                                            />
                                            Coming Soon
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="rounded-lg bg-bs-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditing(null)}
                                        className="rounded-lg border border-bs-border px-4 py-2 text-sm text-bs-text-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{m.icon}</span>
                                        <h3 className="text-base font-semibold text-bs-text-primary">{m.title}</h3>
                                        <span className="rounded-full border border-bs-border px-2 py-0.5 text-xs text-bs-text-mute">
                                            {m.difficulty}
                                        </span>
                                        {m.comingSoon && (
                                            <span className="rounded-full border border-bs-brand-rust/30 bg-bs-brand-rust/10 px-2 py-0.5 text-xs text-bs-brand-rust">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-bs-text-secondary">{m.description}</p>
                                    <p className="mt-1 text-xs text-bs-text-mute">{m.lessons.length} lessons</p>
                                </div>
                                <button
                                    onClick={() => startEdit(m.moduleSlug)}
                                    className="rounded-lg border border-bs-border px-3 py-1.5 text-xs text-bs-text-secondary hover:text-bs-text-primary"
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

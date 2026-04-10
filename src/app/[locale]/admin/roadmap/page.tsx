'use client';

import { useState } from 'react';
import { useRoadmap } from '@/lib/hooks/useContent';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { STATUS_COPY } from '@/lib/fallbacks/roadmap';
import { mutate } from 'swr';
import type { RoadmapStatus } from '@/lib/types';

export default function AdminRoadmapPage() {
    const { data: phases = [] } = useRoadmap();
    const [editing, setEditing] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        status: 'future' as RoadmapStatus,
        subtitle: '',
        items: '',
    });

    const startEdit = (index: number) => {
        const phase = phases[index];
        if (!phase) return;
        setForm({
            title: phase.title,
            status: phase.status,
            subtitle: phase.subtitle,
            items: phase.items.join('\n'),
        });
        setEditing(index);
    };

    const handleSave = async () => {
        if (editing === null) return;
        setSaving(true);
        const phase = phases[editing];
        await SupabaseContentService.upsertRoadmapPhase({
            id: phase?.id,
            title: form.title,
            status: form.status,
            subtitle: form.subtitle,
            items: form.items.split('\n').map(s => s.trim()).filter(Boolean),
            sortOrder: editing,
        });
        await mutate('content:roadmap');
        setSaving(false);
        setEditing(null);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-bs-text-primary">Roadmap Phases</h2>

            <div className="space-y-3">
                {phases.map((phase, i) => (
                    <div key={phase.title} className="rounded-xl border border-bs-border bg-bs-card px-5 py-4">
                        {editing === i ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs text-bs-text-mute">Title</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm(f => ({ ...f, status: e.target.value as RoadmapStatus }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        >
                                            <option value="done">Complete</option>
                                            <option value="next">Up Next</option>
                                            <option value="future">Planned</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-bs-text-mute">Subtitle</label>
                                    <input
                                        value={form.subtitle}
                                        onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-bs-text-mute">Items (one per line)</label>
                                    <textarea
                                        value={form.items}
                                        onChange={(e) => setForm(f => ({ ...f, items: e.target.value }))}
                                        rows={6}
                                        className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary font-mono"
                                    />
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
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-bs-text-primary">{phase.title}</h3>
                                        <span className="rounded-full border border-bs-border px-2 py-0.5 text-xs text-bs-text-mute">
                                            {STATUS_COPY[phase.status] ?? phase.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-bs-text-secondary">{phase.subtitle}</p>
                                    <p className="mt-1 text-xs text-bs-text-mute">{phase.items.length} items</p>
                                </div>
                                <button
                                    onClick={() => startEdit(i)}
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

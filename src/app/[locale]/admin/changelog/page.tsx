'use client';

import { useState } from 'react';
import { useChangelog } from '@/lib/hooks/useContent';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { TAG } from '@/lib/fallbacks/changelog';
import { mutate } from 'swr';
import type { ChangelogCategory } from '@/lib/types';

const TAG_OPTIONS = Object.entries(TAG).map(([key, val]) => ({ key, ...val }));

export default function AdminChangelogPage() {
    const [activeTab, setActiveTab] = useState<ChangelogCategory>('product');
    const { data: entries = [] } = useChangelog(activeTab);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        tagKey: 'added',
        title: '',
        description: '',
        credit: '',
        source: '',
        testHref: '',
        testLabel: '',
    });

    const resetForm = () => {
        setForm({
            date: new Date().toISOString().split('T')[0],
            tagKey: 'added',
            title: '',
            description: '',
            credit: '',
            source: '',
            testHref: '',
            testLabel: '',
        });
    };

    const handleAdd = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        const tag = TAG[form.tagKey] || TAG.added;
        await SupabaseContentService.createChangelogEntry({
            category: activeTab,
            date: form.date,
            tagLabel: tag.label,
            tagColor: tag.color,
            title: form.title,
            description: form.description || undefined,
            credit: form.credit || undefined,
            source: form.source || undefined,
            testHref: form.testHref || undefined,
            testLabel: form.testLabel || undefined,
        });
        await mutate(`content:changelog:${activeTab}`);
        setSaving(false);
        setShowAdd(false);
        resetForm();
    };

    const handleDelete = async (id: number) => {
        await SupabaseContentService.deleteChangelogEntry(id);
        await mutate(`content:changelog:${activeTab}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-bs-text-primary">Changelog</h2>
                <button
                    onClick={() => { setShowAdd(!showAdd); resetForm(); }}
                    className="rounded-lg bg-bs-brand px-4 py-2 text-sm font-medium text-white"
                >
                    {showAdd ? 'Cancel' : 'Add Entry'}
                </button>
            </div>

            <div className="flex gap-2">
                {(['product', 'design', 'dev'] as ChangelogCategory[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${
                            activeTab === tab
                                ? 'border-bs-brand/30 bg-bs-brand/10 text-bs-brand'
                                : 'border-bs-border text-bs-text-secondary'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {showAdd && (
                <div className="rounded-xl border border-bs-brand/30 bg-bs-card px-5 py-4 space-y-3">
                    <h3 className="text-sm font-semibold text-bs-text-primary">New Entry</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-bs-text-mute">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-bs-text-mute">Tag</label>
                            <select
                                value={form.tagKey}
                                onChange={(e) => setForm(f => ({ ...f, tagKey: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                            >
                                {TAG_OPTIONS.map((t) => (
                                    <option key={t.key} value={t.key}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-bs-text-mute">Title *</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                            placeholder="What changed?"
                        />
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-bs-text-mute">Credit</label>
                            <input
                                value={form.credit}
                                onChange={(e) => setForm(f => ({ ...f, credit: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-bs-text-mute">Source URL</label>
                            <input
                                value={form.source}
                                onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={saving || !form.title.trim()}
                        className="rounded-lg bg-bs-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {saving ? 'Adding...' : 'Add Entry'}
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {entries.map((entry) => (
                    <div key={entry.id ?? entry.title} className="flex items-start justify-between rounded-xl border border-bs-border bg-bs-card px-4 py-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${entry.tag.color}`}>
                                    {entry.tag.label}
                                </span>
                                <span className="text-xs text-bs-text-mute">{entry.date}</span>
                            </div>
                            <p className="text-sm text-bs-text-primary">{entry.title}</p>
                            {entry.description && (
                                <p className="text-xs text-bs-text-secondary line-clamp-2">{entry.description}</p>
                            )}
                        </div>
                        {entry.id && (
                            <button
                                onClick={() => handleDelete(entry.id!)}
                                className="shrink-0 rounded-lg border border-bs-error/30 px-2 py-1 text-xs text-bs-error hover:bg-bs-error/10"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                ))}
                {entries.length === 0 && (
                    <p className="text-sm text-bs-text-mute py-4 text-center">No entries in this category.</p>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useFAQ } from '@/lib/hooks/useContent';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { mutate } from 'swr';

export default function AdminFAQPage() {
    const { data } = useFAQ();
    const faqItems = data?.faq ?? [];
    const supportPaths = data?.supportPaths ?? [];

    const [editingFaq, setEditingFaq] = useState<string | null>(null);
    const [editingSp, setEditingSp] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [faqForm, setFaqForm] = useState({ value: '', title: '', body: '' });
    const [spForm, setSpForm] = useState({ title: '', description: '' });

    const startEditFaq = (value: string) => {
        const item = faqItems.find(f => f.value === value);
        if (!item) return;
        setFaqForm({ value: item.value, title: item.title, body: item.body });
        setEditingFaq(value);
    };

    const handleSaveFaq = async () => {
        if (!editingFaq) return;
        setSaving(true);
        const idx = faqItems.findIndex(f => f.value === editingFaq);
        await SupabaseContentService.upsertFAQItem({
            value: faqForm.value,
            title: faqForm.title,
            body: faqForm.body,
            sortOrder: idx >= 0 ? idx : faqItems.length,
        });
        await mutate('content:faq');
        setSaving(false);
        setEditingFaq(null);
    };

    const startEditSp = (index: number) => {
        const sp = supportPaths[index];
        if (!sp) return;
        setSpForm({ title: sp.title, description: sp.description });
        setEditingSp(index);
    };

    const handleSaveSp = async () => {
        if (editingSp === null) return;
        setSaving(true);
        const sp = supportPaths[editingSp];
        await SupabaseContentService.upsertSupportPath({
            id: sp?.id,
            title: spForm.title,
            description: spForm.description,
            sortOrder: editingSp,
        });
        await mutate('content:faq');
        setSaving(false);
        setEditingSp(null);
    };

    return (
        <div className="space-y-8">
            {/* FAQ Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-bs-text-primary">FAQ Items</h2>
                <div className="space-y-3">
                    {faqItems.map((item) => (
                        <div key={item.value} className="rounded-xl border border-bs-border bg-bs-card px-5 py-4">
                            {editingFaq === item.value ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Question</label>
                                        <input
                                            value={faqForm.title}
                                            onChange={(e) => setFaqForm(f => ({ ...f, title: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Answer</label>
                                        <textarea
                                            value={faqForm.body}
                                            onChange={(e) => setFaqForm(f => ({ ...f, body: e.target.value }))}
                                            rows={3}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveFaq}
                                            disabled={saving}
                                            className="rounded-lg bg-bs-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingFaq(null)}
                                            className="rounded-lg border border-bs-border px-4 py-2 text-sm text-bs-text-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-bs-text-primary">{item.title}</h3>
                                        <p className="mt-1 text-xs text-bs-text-secondary line-clamp-2">{item.body}</p>
                                    </div>
                                    <button
                                        onClick={() => startEditFaq(item.value)}
                                        className="shrink-0 rounded-lg border border-bs-border px-3 py-1.5 text-xs text-bs-text-secondary hover:text-bs-text-primary"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Support Paths Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-bs-text-primary">Support Paths</h2>
                <div className="space-y-3">
                    {supportPaths.map((sp, i) => (
                        <div key={sp.title} className="rounded-xl border border-bs-border bg-bs-card px-5 py-4">
                            {editingSp === i ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Title</label>
                                        <input
                                            value={spForm.title}
                                            onChange={(e) => setSpForm(f => ({ ...f, title: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-bs-text-mute">Description</label>
                                        <textarea
                                            value={spForm.description}
                                            onChange={(e) => setSpForm(f => ({ ...f, description: e.target.value }))}
                                            rows={2}
                                            className="mt-1 w-full rounded-lg border border-bs-border bg-bs-card-fg px-3 py-2 text-sm text-bs-text-primary"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveSp}
                                            disabled={saving}
                                            className="rounded-lg bg-bs-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingSp(null)}
                                            className="rounded-lg border border-bs-border px-4 py-2 text-sm text-bs-text-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-bs-text-primary">{sp.title}</h3>
                                        <p className="mt-1 text-xs text-bs-text-secondary">{sp.description}</p>
                                    </div>
                                    <button
                                        onClick={() => startEditSp(i)}
                                        className="shrink-0 rounded-lg border border-bs-border px-3 py-1.5 text-xs text-bs-text-secondary hover:text-bs-text-primary"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

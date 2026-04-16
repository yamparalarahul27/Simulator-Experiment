'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useChangelog } from '@/lib/hooks/useContent';
import type { ChangelogEntry, ChangelogCategory } from '@/lib/types';

// ============================================
// Types
// ============================================

type ChangelogTab = ChangelogCategory;

// ============================================
// Tab metadata
// ============================================

const TAB_META: Record<ChangelogTab, { icon: string; description: string }> = {
    product: { icon: '🚀', description: 'Features, modules, and user-facing changes' },
    design:  { icon: '🎨', description: 'UI, styling, and visual changes' },
    dev:     { icon: '🔧', description: 'Dependencies, infra, and developer tooling' },
};

// ============================================
// Group entries by date
// ============================================

interface DayGroup {
    dateKey: string;
    displayDate: string;
    entries: ChangelogEntry[];
}

function groupByDate(entries: ChangelogEntry[]): DayGroup[] {
    const groups: Record<string, ChangelogEntry[]> = {};

    for (const entry of entries) {
        if (!groups[entry.date]) groups[entry.date] = [];
        groups[entry.date].push(entry);
    }

    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a)) // newest first
        .map(([dateKey, entries]) => {
            const d = new Date(dateKey + 'T00:00:00');
            const displayDate = d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return { dateKey, displayDate, entries };
        });
}

// ============================================
// Components
// ============================================

function TabButton({
    tab,
    active,
    onClick,
}: {
    tab: ChangelogTab;
    active: boolean;
    onClick: () => void;
}) {
    const { icon, description } = TAB_META[tab];
    const label = tab.charAt(0).toUpperCase() + tab.slice(1);

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex-1 rounded-xl border px-4 py-3 text-left transition-colors',
                active
                    ? 'border-bs-border bg-bs-card text-bs-text-primary'
                    : 'border-bs-border bg-bs-card-fg text-bs-text-tertiary'
            )}
        >
            <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="mt-1 text-xs text-bs-text-tertiary">{description}</p>
        </button>
    );
}

function EntryItem({ entry }: { entry: ChangelogEntry }) {
    return (
        <li className="space-y-2 rounded-xl border border-bs-border bg-bs-card px-4 py-4">
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${entry.tag.color}`}>
                    {entry.tag.label}
                </span>
                <span className="text-sm leading-relaxed text-bs-text-primary text-pretty">
                    {entry.title}
                </span>
            </div>
            {entry.description && (
                <p className="pl-12 text-sm leading-relaxed text-bs-text-secondary text-pretty">
                    {entry.description}
                </p>
            )}
            {(entry.credit || entry.source) && (
                <div className="flex items-center gap-2 pl-12">
                    {entry.credit && (
                        <span className="text-xs text-bs-text-tertiary">
                            Credit: {entry.source ? (
                                <a
                                    href={entry.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-bs-brand-ts hover:underline"
                                >
                                    {entry.credit}
                                </a>
                            ) : entry.credit}
                        </span>
                    )}
                </div>
            )}
            {entry.testHref && (
                <div className="pl-12">
                    <a
                        href={entry.testHref}
                        className="inline-flex rounded-md border border-bs-border px-2.5 py-1 text-xs text-bs-text-secondary hover:text-bs-text-primary"
                    >
                        {entry.testLabel ?? 'Test now'}
                    </a>
                </div>
            )}
        </li>
    );
}

// ============================================
// Page
// ============================================

export default function ChangelogPage() {
    const [activeTab, setActiveTab] = useState<ChangelogTab>('product');
    const { data: entries = [] } = useChangelog(activeTab);
    const days = groupByDate(entries);

    return (
        <div className="space-y-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">Changelog</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    What changed in YDEX
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Product, design, and engineering updates tracked with clear context.
                </p>
            </header>

            <div className="flex flex-wrap gap-2">
                {(['product', 'design', 'dev'] as ChangelogTab[]).map((tab) => (
                    <TabButton
                        key={tab}
                        tab={tab}
                        active={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                    />
                ))}
            </div>

            {days.length === 0 ? (
                <p className="text-sm text-bs-text-mute">No entries yet.</p>
            ) : (
                <div className="space-y-6">
                    {days.map((day) => (
                        <section key={day.dateKey} className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl font-semibold text-bs-text-primary text-balance">{day.displayDate}</h2>
                                <span className="rounded-full border border-bs-border bg-bs-card-fg px-3 py-1 text-xs text-bs-text-tertiary">
                                    {day.entries.length} {day.entries.length === 1 ? 'change' : 'changes'}
                                </span>
                            </div>

                            <ul className="space-y-3">
                                {day.entries.map((entry, index) => (
                                    <EntryItem key={`${day.dateKey}-${index}`} entry={entry} />
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

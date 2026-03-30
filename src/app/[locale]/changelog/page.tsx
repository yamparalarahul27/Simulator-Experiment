'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

// ============================================
// Types
// ============================================

type ChangelogTab = 'product' | 'design' | 'dev';

interface ChangelogEntry {
    date: string;
    tag: { label: string; color: string };
    title: string;
    description?: string;
    credit?: string;
    source?: string;
}

// ============================================
// Tag helpers
// ============================================

const TAG = {
    added:    { label: 'Added',    color: 'text-[#00e66b] bg-[#00e66b]/10 border-[#00e66b]/20' },
    improved: { label: 'Improved', color: 'text-[#00ffff] bg-[#00ffff]/10 border-[#00ffff]/20' },
    fixed:    { label: 'Fixed',    color: 'text-[#69a2f1] bg-[#69a2f1]/10 border-[#69a2f1]/20' },
    changed:  { label: 'Changed',  color: 'text-[#ffad66] bg-[#ffad66]/10 border-[#ffad66]/20' },
    removed:  { label: 'Removed',  color: 'text-[#ff285a] bg-[#ff285a]/10 border-[#ff285a]/20' },
    dep:      { label: 'Dependency', color: 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/20' },
    infra:    { label: 'Infra',    color: 'text-[#585e6c] bg-[#585e6c]/10 border-[#585e6c]/20' },
} as const;

// ============================================
// Changelog data — manually curated
// ============================================

const PRODUCT_LOG: ChangelogEntry[] = [
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Order Book learning module with 6 interactive lessons',
        description: 'New intermediate-level module covering order book basics, limit vs market orders, heatmap reading, depth delta calculations, depth overlay indicator, and pro tips. Includes interactive order book with live Binance data.',
        credit: '@exitpumpBTC',
        source: 'https://x.com/exitpumpbtc/status/2002814707380707576',
    },
    {
        date: '2026-03-29',
        tag: TAG.added,
        title: 'Auto-logged changelog page',
        description: 'Fetches commits from GitHub API grouped by date with timeline UI.',
    },
    {
        date: '2026-03-29',
        tag: TAG.added,
        title: 'NumberFlow animated number transitions',
        description: 'Smooth spring-based number animations across PnLCard, StatsRow, DrawdownCard, DeriverseTradesTable, DemoMarket, and more.',
        credit: '@number-flow/react',
        source: 'https://number-flow.barvian.me',
    },
    {
        date: '2026-03-29',
        tag: TAG.fixed,
        title: 'Safari auto-zoom on AI chat input',
        description: 'Safari auto-zooms inputs with font-size < 16px. Changed input to text-base (16px).',
    },
    {
        date: '2026-03-29',
        tag: TAG.fixed,
        title: 'Horizontal scroll in AI panel input area',
        description: 'Replaced absolute positioning with flex layout to prevent overflow on mobile.',
    },
    {
        date: '2026-03-29',
        tag: TAG.improved,
        title: 'AI assistant converted from full page to inline panel',
        description: 'AI assistant now opens as a side panel instead of a separate route.',
    },
    {
        date: '2026-03-29',
        tag: TAG.added,
        title: 'Welcome screen hero + full mobile optimization',
    },
    {
        date: '2026-03-29',
        tag: TAG.improved,
        title: 'Header navigation reorganized',
    },
];

const DESIGN_LOG: ChangelogEntry[] = [
    {
        date: '2026-03-30',
        tag: TAG.improved,
        title: 'Aurora background reshaped into proper crescent curve',
        description: 'Replaced elliptical radial gradients with ring-based approach: large off-screen circles with gradient borders so only the curved edge is visible.',
    },
    {
        date: '2026-03-30',
        tag: TAG.changed,
        title: 'Background PNGs replaced with CSS-generated aurora effect',
        description: 'Eliminated ~5.3 MB of static assets (background.png + background_wallpaper_dot.png) by recreating the aurora gradient with CSS radial/conic gradients and blur.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Animated number cells in interactive order book',
        description: 'Cells flash green/red when values change. Depth bars animate with 500ms CSS transitions.',
    },
    {
        date: '2026-03-29',
        tag: TAG.changed,
        title: 'Blueshift dark color palette applied across entire app',
        description: 'Replaced all bg-black with #0b0e14, borders with #1a1e26, purple accents with cyan brand (#00ffff), green/red with #00e66b/#ff285a. Updated 73 files.',
        credit: 'Blueshift Design System',
        source: 'https://learn.blueshift.gg',
    },
    {
        date: '2026-03-29',
        tag: TAG.changed,
        title: 'Border radius updated from sharp to rounded-lg (8px)',
        description: 'Applied minimum 8px border radius to all UI elements across the app.',
    },
    {
        date: '2026-03-29',
        tag: TAG.added,
        title: 'Color Palette reference page at /learn2',
        description: 'Displays all Blueshift color tokens with swatches, token names, hex values, and live preview.',
    },
];

const DEV_LOG: ChangelogEntry[] = [
    {
        date: '2026-03-30',
        tag: TAG.dep,
        title: 'react-rewrite-cli added as dev dependency',
        description: 'Visual editing tool for React apps — edit Tailwind layout, spacing, typography, and colors while the app is running, writes changes back to source files.',
        credit: 'donghaxkim/react-rewrite',
        source: 'https://github.com/donghaxkim/react-rewrite',
    },
    {
        date: '2026-03-30',
        tag: TAG.dep,
        title: 'expect skill installed from millionco',
        description: 'Agent skill for Claude Code and other AI coding agents.',
        credit: 'millionco/expect',
        source: 'https://github.com/millionco/expect',
    },
    {
        date: '2026-03-30',
        tag: TAG.improved,
        title: 'Changelog tag detection improved for non-conventional commits',
        description: 'Added keyword-based detection (add, replace, use, remove, etc.) so commits without feat:/fix: prefixes still get proper tags.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Live Binance WebSocket depth stream for interactive order book',
        description: 'REST snapshot on load + wss://stream.binance.com depth20@1000ms for live updates. Falls back to REST if WebSocket fails.',
    },
    {
        date: '2026-03-29',
        tag: TAG.infra,
        title: 'Route-based architecture with i18n support',
        description: 'Next.js App Router with next-intl for locale-aware routing.',
    },
    {
        date: '2026-03-29',
        tag: TAG.dep,
        title: '@number-flow/react installed',
        description: 'Spring-based number animation library for smooth value transitions.',
        credit: '@number-flow/react',
        source: 'https://number-flow.barvian.me',
    },
];

const TAB_DATA: Record<ChangelogTab, { entries: ChangelogEntry[]; icon: string; description: string }> = {
    product: { entries: PRODUCT_LOG, icon: '🚀', description: 'Features, modules, and user-facing changes' },
    design:  { entries: DESIGN_LOG, icon: '🎨', description: 'UI, styling, and visual changes' },
    dev:     { entries: DEV_LOG, icon: '🔧', description: 'Dependencies, infra, and developer tooling' },
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
    const { icon, description } = TAB_DATA[tab];
    const label = tab.charAt(0).toUpperCase() + tab.slice(1);

    return (
        <button
            onClick={onClick}
            className={`flex-1 px-4 py-3 text-left transition-all border ${
                active
                    ? 'bg-[#00b3b3]/10 border-[#00b3b3]/30 text-[#00e6e6]'
                    : 'bg-transparent border-[#1a1e26] text-[#585e6c] hover:text-[#adb9d2] hover:border-white/10'
            }`}
        >
            <div className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-sm font-mono font-semibold">{label}</span>
            </div>
            <p className="text-[10px] font-mono mt-1 opacity-60">{description}</p>
        </button>
    );
}

function EntryItem({ entry }: { entry: ChangelogEntry }) {
    return (
        <li className="space-y-1.5">
            <div className="flex items-start gap-2.5">
                <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold border rounded-lg ${entry.tag.color}`}>
                    {entry.tag.label}
                </span>
                <span className="text-sm text-[#ced5e4] font-mono leading-relaxed">
                    {entry.title}
                </span>
            </div>
            {entry.description && (
                <p className="text-xs font-mono text-[#585e6c] leading-relaxed ml-[calc(0.625rem+10px+0.625rem)]">
                    {entry.description}
                </p>
            )}
            {(entry.credit || entry.source) && (
                <div className="flex items-center gap-2 ml-[calc(0.625rem+10px+0.625rem)]">
                    {entry.credit && (
                        <span className="text-[10px] font-mono text-[#adb9d2]/50">
                            Credit: {entry.source ? (
                                <a href={entry.source} target="_blank" rel="noopener noreferrer" className="text-[#00b3b3]/60 hover:text-[#00e6e6] transition-colors underline underline-offset-2">
                                    {entry.credit}
                                </a>
                            ) : entry.credit}
                        </span>
                    )}
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
    const { entries } = TAB_DATA[activeTab];
    const days = groupByDate(entries);

    return (
        <div className="min-h-screen text-[#eff1f6]">
            <div className="max-w-3xl mx-auto py-8 md:py-12 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-mono text-[#eff1f6]">
                        Changelog
                    </h1>
                    <p className="text-[#adb9d2] text-sm mt-2 font-mono">
                        What&apos;s new in Deriverse
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {(['product', 'design', 'dev'] as ChangelogTab[]).map((tab) => (
                        <TabButton
                            key={tab}
                            tab={tab}
                            active={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                        />
                    ))}
                </div>

                {/* Timeline */}
                {days.length === 0 ? (
                    <p className="text-[#585e6c] font-mono text-sm">No entries yet.</p>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1a1e26]" />

                        <div className="space-y-10">
                            {days.map((day) => (
                                <div key={day.dateKey} className="relative pl-8">
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-[#00ffff]/20 border-2 border-[#00ffff] z-10" />

                                    {/* Date header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="text-base font-semibold text-[#eff1f6] font-mono">
                                            {day.displayDate}
                                        </h2>
                                        <span className="text-[10px] text-[#585e6c] font-mono border border-[#1a1e26] px-2 py-0.5 rounded-lg">
                                            {day.entries.length} {day.entries.length === 1 ? 'change' : 'changes'}
                                        </span>
                                    </div>

                                    {/* Entries */}
                                    <ul className="space-y-4">
                                        {day.entries.map((entry, i) => (
                                            <EntryItem key={`${day.dateKey}-${i}`} entry={entry} />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

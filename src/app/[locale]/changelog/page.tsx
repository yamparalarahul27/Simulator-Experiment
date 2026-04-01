'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    testHref?: string;
    testLabel?: string;
}

// ============================================
// Tag helpers
// ============================================

const TAG = {
    added: { label: 'Added', color: 'border-bs-success/30 bg-bs-success/10 text-bs-success' },
    improved: { label: 'Improved', color: 'border-bs-brand/30 bg-bs-brand/10 text-bs-brand' },
    fixed: { label: 'Fixed', color: 'border-bs-brand-ts/35 bg-bs-brand-ts/10 text-bs-brand-ts' },
    changed: { label: 'Changed', color: 'border-bs-brand-rust/35 bg-bs-brand-rust/10 text-bs-brand-rust' },
    removed: { label: 'Removed', color: 'border-bs-error/30 bg-bs-error/10 text-bs-error' },
    dep: { label: 'Dependency', color: 'border-bs-brand-ts/30 bg-bs-brand-ts/10 text-bs-brand-ts' },
    infra: { label: 'Infra', color: 'border-bs-border bg-bs-card-fg text-bs-text-secondary' },
} as const;

// ============================================
// Changelog data — manually curated
// ============================================

const PRODUCT_LOG: ChangelogEntry[] = [
    {
        date: '2026-04-01',
        tag: TAG.added,
        title: 'Hot DEX Tokens discovery feed added to Simulator and Home Analytics',
        description: 'Added a live discovery API (`/api/discovery/hot`) and a UI panel with chain presets, scoring, and token metrics. Includes a built-in "Test API JSON" button for quick validation.',
        credit: 'vibeforge1111 (inspiration from dexscreener-cli-mcp-tool)',
        source: 'https://github.com/vibeforge1111/dexscreener-cli-mcp-tool',
        testHref: '/simulator',
        testLabel: 'Test in Simulator',
    },
    {
        date: '2026-03-31',
        tag: TAG.changed,
        title: 'Navigation streamlined — Learn, Simulator, Changelog, About',
        description: 'Removed Perks, Help, Roadmap, and Exchange Manager from nav. Moved Changelog to main nav, About out of dropdown. Profile icon links directly to settings without dropdown.',
    },
    {
        date: '2026-03-31',
        tag: TAG.changed,
        title: 'Dark theme temporarily disabled to focus on light theme polish',
        description: 'Forced light theme via next-themes forcedTheme. Theme toggle removed from navbar. Will re-enable after light theme is finalized.',
    },
    {
        date: '2026-03-31',
        tag: TAG.added,
        title: 'Simulator page now uses standard layout with navbar',
        description: 'Simulator was previously a full-screen route without navigation. Now shares the same layout shell, navbar, and footer as other pages.',
    },
    {
        date: '2026-03-31',
        tag: TAG.fixed,
        title: 'Hydration mismatch on theme-dependent components',
        description: 'Server rendered dark colors while client resolved to light. Fixed by changing isLight check from resolvedTheme === "light" to resolvedTheme !== "dark" so undefined (SSR) defaults to light.',
    },
    {
        date: '2026-03-31',
        tag: TAG.improved,
        title: 'Hero CTA button restyled with gold brand fill',
        description: '"Start with Order Types" button updated from flat dark fill to bg-bs-brand (gold) with white text for clear visual affordance in both themes.',
    },
    {
        date: '2026-03-31',
        tag: TAG.improved,
        title: 'Lesson shell back button repositioned above title',
        description: 'Back button moved from side-by-side with title to stacked above it. Icon changed to Undo2 from Lucide.',
    },
    {
        date: '2026-03-31',
        tag: TAG.removed,
        title: 'AI assistant button temporarily disabled',
        description: 'Floating AI assistant button commented out as the chat API is not yet functional.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Logo splash animation on app load',
        description: 'Replaced welcome screen with a branded logo splash that fades out after loading. Covers iOS safe areas correctly.',
    },
    {
        date: '2026-03-30',
        tag: TAG.fixed,
        title: 'iOS Safari chrome tint and safe area issues',
        description: 'Added theme-color meta tag, viewport-fit=cover, and fixed splash screen not covering iOS safe areas. Resolved white overlay and flat color strips at edges.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Light / Dark / System theme switching',
        description: 'Full theme support with next-themes. Toggle in navbar cycles Light → Dark → System. Light mode includes a soft aurora background variant. 80+ component files updated to use CSS variable tokens.',
    },
    {
        date: '2026-03-30',
        tag: TAG.changed,
        title: 'Changelog rewritten with 3-tab curated layout',
        description: 'Removed auto-fetch from GitHub API. Replaced with manually curated entries across Product, Design, and Dev tabs. Each entry has date, tag, title, description, and optional credit/source.',
    },
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
        date: '2026-03-31',
        tag: TAG.improved,
        title: 'Module card layout improved — removed emoji icons, better badge wrapping',
        description: 'Removed circular emoji badges from module cards. Difficulty badges now use whitespace-nowrap and flex-wrap to sit beside the title or flow below it on narrow screens.',
    },
    {
        date: '2026-03-31',
        tag: TAG.improved,
        title: 'Network selector and AI button removed from navbar for cleaner UI',
        description: 'Commented out the "On Mock Data" network switcher and AI assistant floating button. Profile dropdown replaced with direct link to settings.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Paper Texture UI design system',
        description: 'Replaced aurora backgrounds with an all-CSS paper texture system. Warm parchment cream for light mode, deep midnight navy for dark. Includes grain, fiber lines, age spots, and vignette — all generated via CSS gradients and SVG data URIs.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Postage stamp card design applied to all learn cards',
        description: 'Cards now use a stamp-card style with inner borders and subtle paper texture feel.',
    },
    {
        date: '2026-03-30',
        tag: TAG.changed,
        title: 'Logo switched from PNG to theme-aware SVG using CSS mask',
        description: 'Logo now uses a CSS mask with LogoPath.svg, colored via backgroundColor. Adapts to theme automatically.',
    },
    {
        date: '2026-03-30',
        tag: TAG.added,
        title: 'Theme toggle button in navbar',
        description: 'Sun/Moon/Monitor icon button added next to profile icon on desktop and in Settings section on mobile menu.',
    },
    {
        date: '2026-03-30',
        tag: TAG.changed,
        title: '1000+ hardcoded hex colors replaced with CSS variable tokens',
        description: 'All bg-[#0b0e14], text-[#ced5e4], border-[#1a1e26] etc. now use bg-bs-bg, text-bs-text-secondary, border-bs-border — enabling theme switching.',
    },
    {
        date: '2026-03-30',
        tag: TAG.changed,
        title: 'Background PNGs replaced with CSS-generated effects',
        description: 'Eliminated ~5.3 MB of static assets by recreating backgrounds with CSS gradients and paper texture.',
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
        date: '2026-03-31',
        tag: TAG.infra,
        title: 'Storybook 8 added for component development',
        description: 'Configured Storybook with .storybook/ directory and src/stories/ for isolated component development and visual testing.',
    },
    {
        date: '2026-03-31',
        tag: TAG.infra,
        title: 'Vitest configured for unit testing',
        description: 'Added vitest.config.ts and vitest.shims.d.ts for fast Vite-native unit testing alongside the Next.js app.',
    },
    {
        date: '2026-03-31',
        tag: TAG.changed,
        title: 'ESLint config updated (eslint.config.mjs)',
        description: 'Refreshed ESLint flat config to align with current project conventions.',
    },
    {
        date: '2026-03-31',
        tag: TAG.infra,
        title: 'Theme forced to light — removed system/dark SSR paths',
        description: 'next-themes configured with forcedTheme="light". Eliminates SSR mismatch for theme-dependent components (AppBackground, GeneratedBackground).',
    },
    {
        date: '2026-03-30',
        tag: TAG.dep,
        title: '@chenglou/pretext installed',
        description: 'Pure JS/TS multiline text measurement and layout library with broad international language support. Renders to DOM, Canvas, SVG, and server-side.',
        credit: 'Cheng Lou',
        source: 'https://www.npmjs.com/package/@chenglou/pretext',
    },
    {
        date: '2026-03-30',
        tag: TAG.dep,
        title: 'next-themes installed',
        description: 'Abstraction for light/dark/system theme switching in Next.js. Handles class toggling, system preference detection, and localStorage persistence.',
        credit: 'pacocoursey/next-themes',
        source: 'https://github.com/pacocoursey/next-themes',
    },
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
    const { entries } = TAB_DATA[activeTab];
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

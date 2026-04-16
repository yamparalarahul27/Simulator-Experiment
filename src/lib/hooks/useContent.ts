'use client';

import useSWR from 'swr';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { SupabaseContentService } from '@/services/SupabaseContentService';
import { FALLBACK_MODULES } from '@/lib/fallbacks/modules';
import { FALLBACK_ORDER_TYPE_DETAILS, FALLBACK_ORDER_BOOK_DETAILS } from '@/lib/fallbacks/lessonDetails';
import { FALLBACK_PRODUCT_LOG, FALLBACK_DESIGN_LOG, FALLBACK_DEV_LOG } from '@/lib/fallbacks/changelog';
import { FALLBACK_ROADMAP_PHASES } from '@/lib/fallbacks/roadmap';
import { FALLBACK_FAQ_ITEMS, FALLBACK_SUPPORT_PATHS } from '@/lib/fallbacks/faq';
import type {
    LearningModule,
    ChangelogEntry,
    ChangelogCategory,
    RoadmapPhase,
    FAQItem,
    SupportPath,
    OrderTypeDetail,
    OrderBookDetail,
} from '@/lib/types';

const SWR_OPTIONS = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60_000,
};

// ─── Modules ────────────────────────────────

export function useModules() {
    return useSWR<LearningModule[]>(
        'content:modules',
        async () => {
            if (!isSupabaseConfigured()) return FALLBACK_MODULES;
            try {
                const data = await SupabaseContentService.getModules();
                return data.length > 0 ? data : FALLBACK_MODULES;
            } catch (err) {
                console.warn('[useModules] Supabase fetch failed, using fallback:', err);
                return FALLBACK_MODULES;
            }
        },
        { ...SWR_OPTIONS, fallbackData: FALLBACK_MODULES },
    );
}

export function useModuleBySlug(slug: string | null) {
    const fallback = slug ? FALLBACK_MODULES.find(m => m.moduleSlug === slug) ?? null : null;

    return useSWR<LearningModule | null>(
        slug ? `content:module:${slug}` : null,
        async () => {
            if (!slug || !isSupabaseConfigured()) return fallback;
            try {
                const data = await SupabaseContentService.getModuleBySlug(slug);
                return data ?? fallback;
            } catch (err) {
                console.warn(`[useModuleBySlug] Supabase fetch failed for ${slug}:`, err);
                return fallback;
            }
        },
        { ...SWR_OPTIONS, fallbackData: fallback },
    );
}

// ─── Lesson Details ─────────────────────────

export function useOrderTypeDetails() {
    return useSWR<Record<string, OrderTypeDetail>>(
        'content:lesson-details:order-types',
        async () => {
            if (!isSupabaseConfigured()) return FALLBACK_ORDER_TYPE_DETAILS;
            try {
                const data = await SupabaseContentService.getAllLessonDetails('order-types');
                return Object.keys(data).length > 0
                    ? data as Record<string, OrderTypeDetail>
                    : FALLBACK_ORDER_TYPE_DETAILS;
            } catch (err) {
                console.warn('[useOrderTypeDetails] Supabase fetch failed:', err);
                return FALLBACK_ORDER_TYPE_DETAILS;
            }
        },
        { ...SWR_OPTIONS, fallbackData: FALLBACK_ORDER_TYPE_DETAILS },
    );
}

export function useOrderBookDetails() {
    return useSWR<Record<string, OrderBookDetail>>(
        'content:lesson-details:order-book',
        async () => {
            if (!isSupabaseConfigured()) return FALLBACK_ORDER_BOOK_DETAILS;
            try {
                const data = await SupabaseContentService.getAllLessonDetails('order-book');
                return Object.keys(data).length > 0
                    ? data as Record<string, OrderBookDetail>
                    : FALLBACK_ORDER_BOOK_DETAILS;
            } catch (err) {
                console.warn('[useOrderBookDetails] Supabase fetch failed:', err);
                return FALLBACK_ORDER_BOOK_DETAILS;
            }
        },
        { ...SWR_OPTIONS, fallbackData: FALLBACK_ORDER_BOOK_DETAILS },
    );
}

// ─── Changelog ──────────────────────────────

const FALLBACK_BY_CATEGORY: Record<ChangelogCategory, ChangelogEntry[]> = {
    product: FALLBACK_PRODUCT_LOG,
    design: FALLBACK_DESIGN_LOG,
    dev: FALLBACK_DEV_LOG,
};

export function useChangelog(category: ChangelogCategory) {
    const fallback = FALLBACK_BY_CATEGORY[category];

    return useSWR<ChangelogEntry[]>(
        `content:changelog:${category}`,
        async () => {
            if (!isSupabaseConfigured()) return fallback;
            try {
                const data = await SupabaseContentService.getChangelog(category);
                return data.length > 0 ? data : fallback;
            } catch (err) {
                console.warn(`[useChangelog] Supabase fetch failed for ${category}:`, err);
                return fallback;
            }
        },
        { ...SWR_OPTIONS, fallbackData: fallback },
    );
}

// ─── Roadmap ────────────────────────────────

export function useRoadmap() {
    return useSWR<RoadmapPhase[]>(
        'content:roadmap',
        async () => {
            if (!isSupabaseConfigured()) return FALLBACK_ROADMAP_PHASES;
            try {
                const data = await SupabaseContentService.getRoadmap();
                return data.length > 0 ? data : FALLBACK_ROADMAP_PHASES;
            } catch (err) {
                console.warn('[useRoadmap] Supabase fetch failed:', err);
                return FALLBACK_ROADMAP_PHASES;
            }
        },
        { ...SWR_OPTIONS, fallbackData: FALLBACK_ROADMAP_PHASES },
    );
}

// ─── FAQ ────────────────────────────────────

export function useFAQ() {
    const fallback = { faq: FALLBACK_FAQ_ITEMS, supportPaths: FALLBACK_SUPPORT_PATHS };

    return useSWR<{ faq: FAQItem[]; supportPaths: SupportPath[] }>(
        'content:faq',
        async () => {
            if (!isSupabaseConfigured()) return fallback;
            try {
                const data = await SupabaseContentService.getFAQ();
                return data.faq.length > 0 ? data : fallback;
            } catch (err) {
                console.warn('[useFAQ] Supabase fetch failed:', err);
                return fallback;
            }
        },
        { ...SWR_OPTIONS, fallbackData: fallback },
    );
}

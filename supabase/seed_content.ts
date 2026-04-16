/**
 * Seed script: populate Supabase content tables from hardcoded fallback data.
 *
 * Usage: npx tsx supabase/seed_content.ts
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)
 */

import { createClient } from '@supabase/supabase-js';
import { FALLBACK_MODULES } from '../src/lib/fallbacks/modules';
import { FALLBACK_ORDER_TYPE_DETAILS, FALLBACK_ORDER_BOOK_DETAILS } from '../src/lib/fallbacks/lessonDetails';
import { FALLBACK_PRODUCT_LOG, FALLBACK_DESIGN_LOG, FALLBACK_DEV_LOG } from '../src/lib/fallbacks/changelog';
import { FALLBACK_ROADMAP_PHASES } from '../src/lib/fallbacks/roadmap';
import { FALLBACK_FAQ_ITEMS, FALLBACK_SUPPORT_PATHS } from '../src/lib/fallbacks/faq';

// ─── Setup ──────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
    console.log('Seeding content tables...\n');

    // ─── 1. Modules ─────────────────────────
    console.log('  Modules...');
    for (let i = 0; i < FALLBACK_MODULES.length; i++) {
        const m = FALLBACK_MODULES[i];
        const { error } = await supabase
            .from('content_modules')
            .upsert({
                module_slug: m.moduleSlug,
                title: m.title,
                description: m.description,
                icon: m.icon,
                difficulty: m.difficulty,
                simulator_kind: m.simulatorKind || null,
                coming_soon: m.comingSoon,
                wallet_required: m.walletRequired,
                sort_order: i,
            }, { onConflict: 'module_slug' });

        if (error) {
            console.error(`    FAIL module ${m.moduleSlug}:`, error.message);
        }
    }
    console.log(`    ${FALLBACK_MODULES.length} modules upserted`);

    // ─── 2. Lessons ─────────────────────────
    console.log('  Lessons...');
    let lessonCount = 0;
    for (const m of FALLBACK_MODULES) {
        for (let j = 0; j < m.lessons.length; j++) {
            const l = m.lessons[j];
            const { error } = await supabase
                .from('content_lessons')
                .upsert({
                    module_slug: m.moduleSlug,
                    lesson_slug: l.lessonSlug,
                    title: l.title,
                    description: l.description,
                    simulator_preset: l.simulatorPreset || null,
                    sort_order: j,
                }, { onConflict: 'module_slug,lesson_slug' });

            if (error) {
                console.error(`    FAIL lesson ${m.moduleSlug}/${l.lessonSlug}:`, error.message);
            }
            lessonCount++;
        }
    }
    console.log(`    ${lessonCount} lessons upserted`);

    // ─── 3. Lesson Details — Order Types ────
    console.log('  Lesson details (order types)...');
    const otEntries = Object.entries(FALLBACK_ORDER_TYPE_DETAILS);
    for (const [slug, detail] of otEntries) {
        const { error } = await supabase
            .from('content_lesson_details')
            .upsert({
                module_slug: 'order-types',
                lesson_slug: slug,
                detail_type: 'order_type',
                emoji: detail.emoji,
                content: {
                    whenToUse: detail.whenToUse,
                    risk: detail.risk,
                    example: detail.example,
                },
            }, { onConflict: 'module_slug,lesson_slug' });

        if (error) {
            console.error(`    FAIL order-type detail ${slug}:`, error.message);
        }
    }
    console.log(`    ${otEntries.length} order type details upserted`);

    // ─── 4. Lesson Details — Order Book ─────
    console.log('  Lesson details (order book)...');
    const obEntries = Object.entries(FALLBACK_ORDER_BOOK_DETAILS);
    for (const [slug, detail] of obEntries) {
        const { error } = await supabase
            .from('content_lesson_details')
            .upsert({
                module_slug: 'order-book',
                lesson_slug: slug,
                detail_type: 'order_book',
                emoji: detail.emoji,
                content: { sections: detail.sections },
            }, { onConflict: 'module_slug,lesson_slug' });

        if (error) {
            console.error(`    FAIL order-book detail ${slug}:`, error.message);
        }
    }
    console.log(`    ${obEntries.length} order book details upserted`);

    // ─── 5. Changelog ───────────────────────
    console.log('  Changelog...');

    // Clear existing entries to avoid duplicates (no natural unique key)
    await supabase.from('content_changelog').delete().neq('id', 0);

    const allChangelog = [
        ...FALLBACK_PRODUCT_LOG.map((e, i) => ({ ...e, category: 'product' as const, sort_order: i })),
        ...FALLBACK_DESIGN_LOG.map((e, i) => ({ ...e, category: 'design' as const, sort_order: i })),
        ...FALLBACK_DEV_LOG.map((e, i) => ({ ...e, category: 'dev' as const, sort_order: i })),
    ];

    const changelogRows = allChangelog.map((e) => ({
        category: e.category,
        date: e.date,
        tag_label: e.tag.label,
        tag_color: e.tag.color,
        title: e.title,
        description: e.description || null,
        credit: e.credit || null,
        source: e.source || null,
        test_href: e.testHref || null,
        test_label: e.testLabel || null,
        sort_order: e.sort_order,
    }));

    const { error: clError } = await supabase
        .from('content_changelog')
        .insert(changelogRows);

    if (clError) {
        console.error('    FAIL changelog:', clError.message);
    }
    console.log(`    ${changelogRows.length} changelog entries inserted`);

    // ─── 6. Roadmap ─────────────────────────
    console.log('  Roadmap...');

    // Clear existing
    await supabase.from('content_roadmap_items').delete().neq('id', 0);
    await supabase.from('content_roadmap_phases').delete().neq('id', 0);

    for (let i = 0; i < FALLBACK_ROADMAP_PHASES.length; i++) {
        const phase = FALLBACK_ROADMAP_PHASES[i];

        const { data: phaseData, error: phaseError } = await supabase
            .from('content_roadmap_phases')
            .insert({
                title: phase.title,
                status: phase.status,
                subtitle: phase.subtitle,
                sort_order: i,
            })
            .select('id')
            .single();

        if (phaseError || !phaseData) {
            console.error(`    FAIL roadmap phase ${phase.title}:`, phaseError?.message);
            continue;
        }

        if (phase.items.length > 0) {
            const itemRows = phase.items.map((text, j) => ({
                phase_id: phaseData.id,
                item_text: text,
                sort_order: j,
            }));
            const { error: itemError } = await supabase
                .from('content_roadmap_items')
                .insert(itemRows);

            if (itemError) {
                console.error(`    FAIL roadmap items for ${phase.title}:`, itemError.message);
            }
        }
    }
    console.log(`    ${FALLBACK_ROADMAP_PHASES.length} phases + items inserted`);

    // ─── 7. FAQ ─────────────────────────────
    console.log('  FAQ...');
    for (let i = 0; i < FALLBACK_FAQ_ITEMS.length; i++) {
        const faq = FALLBACK_FAQ_ITEMS[i];
        const { error } = await supabase
            .from('content_faq')
            .upsert({
                value: faq.value,
                title: faq.title,
                body: faq.body,
                sort_order: i,
            }, { onConflict: 'value' });

        if (error) {
            console.error(`    FAIL faq ${faq.value}:`, error.message);
        }
    }
    console.log(`    ${FALLBACK_FAQ_ITEMS.length} FAQ items upserted`);

    // ─── 8. Support Paths ───────────────────
    console.log('  Support paths...');

    await supabase.from('content_support_paths').delete().neq('id', 0);

    const spRows = FALLBACK_SUPPORT_PATHS.map((sp, i) => ({
        title: sp.title,
        description: sp.description,
        sort_order: i,
    }));
    const { error: spError } = await supabase
        .from('content_support_paths')
        .insert(spRows);

    if (spError) {
        console.error('    FAIL support paths:', spError.message);
    }
    console.log(`    ${spRows.length} support paths inserted`);

    console.log('\nDone!');
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});

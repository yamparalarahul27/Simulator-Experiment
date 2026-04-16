import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type {
    LearningModule,
    LessonConfig,
    SimulatorPreset,
    ChangelogEntry,
    ChangelogCategory,
    ChangelogTag,
    RoadmapPhase,
    RoadmapStatus,
    FAQItem,
    SupportPath,
    OrderTypeDetail,
    OrderBookDetail,
} from '@/lib/types';

// ============================================
// DB row → App type transformers
// ============================================

function toModule(row: any, lessonRows: any[]): LearningModule {
    return {
        moduleSlug: row.module_slug,
        title: row.title,
        description: row.description,
        icon: row.icon,
        difficulty: row.difficulty,
        simulatorKind: row.simulator_kind || undefined,
        comingSoon: row.coming_soon,
        walletRequired: row.wallet_required,
        lessons: lessonRows
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map(toLesson),
    };
}

function toLesson(row: any): LessonConfig {
    return {
        lessonSlug: row.lesson_slug,
        title: row.title,
        description: row.description,
        simulatorPreset: row.simulator_preset || undefined,
    };
}

function toChangelogEntry(row: any): ChangelogEntry {
    return {
        id: row.id,
        category: row.category,
        date: row.date,
        tag: { label: row.tag_label, color: row.tag_color },
        title: row.title,
        description: row.description || undefined,
        credit: row.credit || undefined,
        source: row.source || undefined,
        testHref: row.test_href || undefined,
        testLabel: row.test_label || undefined,
    };
}

function toRoadmapPhase(row: any, itemRows: any[]): RoadmapPhase {
    return {
        id: row.id,
        title: row.title,
        status: row.status as RoadmapStatus,
        subtitle: row.subtitle,
        items: itemRows
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((r: any) => r.item_text),
    };
}

function toFAQItem(row: any): FAQItem {
    return {
        id: row.id,
        value: row.value,
        title: row.title,
        body: row.body,
    };
}

function toSupportPath(row: any): SupportPath {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
    };
}

// ============================================
// Service Class
// ============================================

export class SupabaseContentService {

    // ─── Modules & Lessons ──────────────────

    static async getModules(): Promise<LearningModule[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from('content_modules')
            .select('*, content_lessons(*)')
            .order('sort_order');

        if (error) {
            console.error('[ContentService] getModules error:', error);
            return [];
        }

        return (data || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((row: any) => toModule(row, row.content_lessons || []));
    }

    static async getModuleBySlug(slug: string): Promise<LearningModule | null> {
        if (!isSupabaseConfigured()) return null;

        const { data, error } = await supabase
            .from('content_modules')
            .select('*, content_lessons(*)')
            .eq('module_slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('[ContentService] getModuleBySlug error:', error);
            return null;
        }

        return toModule(data, data.content_lessons || []);
    }

    // ─── Lesson Details ─────────────────────

    static async getLessonDetails(moduleSlug: string, lessonSlug: string): Promise<OrderTypeDetail | OrderBookDetail | null> {
        if (!isSupabaseConfigured()) return null;

        const { data, error } = await supabase
            .from('content_lesson_details')
            .select('*')
            .eq('module_slug', moduleSlug)
            .eq('lesson_slug', lessonSlug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('[ContentService] getLessonDetails error:', error);
            return null;
        }

        if (data.detail_type === 'order_type') {
            return {
                emoji: data.emoji,
                whenToUse: data.content?.whenToUse || '',
                risk: data.content?.risk || '',
                example: data.content?.example || '',
            } as OrderTypeDetail;
        }

        if (data.detail_type === 'order_book') {
            return {
                emoji: data.emoji,
                sections: data.content?.sections || [],
            } as OrderBookDetail;
        }

        return null;
    }

    static async getAllLessonDetails(moduleSlug: string): Promise<Record<string, OrderTypeDetail | OrderBookDetail>> {
        if (!isSupabaseConfigured()) return {};

        const { data, error } = await supabase
            .from('content_lesson_details')
            .select('*')
            .eq('module_slug', moduleSlug);

        if (error) {
            console.error('[ContentService] getAllLessonDetails error:', error);
            return {};
        }

        const result: Record<string, OrderTypeDetail | OrderBookDetail> = {};
        for (const row of data || []) {
            if (row.detail_type === 'order_type') {
                result[row.lesson_slug] = {
                    emoji: row.emoji,
                    whenToUse: row.content?.whenToUse || '',
                    risk: row.content?.risk || '',
                    example: row.content?.example || '',
                };
            } else if (row.detail_type === 'order_book') {
                result[row.lesson_slug] = {
                    emoji: row.emoji,
                    sections: row.content?.sections || [],
                };
            }
        }
        return result;
    }

    // ─── Changelog ──────────────────────────

    static async getChangelog(category?: ChangelogCategory): Promise<ChangelogEntry[]> {
        if (!isSupabaseConfigured()) return [];

        let query = supabase
            .from('content_changelog')
            .select('*')
            .order('date', { ascending: false })
            .order('sort_order');

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[ContentService] getChangelog error:', error);
            return [];
        }

        return (data || []).map(toChangelogEntry);
    }

    // ─── Roadmap ────────────────────────────

    static async getRoadmap(): Promise<RoadmapPhase[]> {
        if (!isSupabaseConfigured()) return [];

        const { data: phases, error: phaseError } = await supabase
            .from('content_roadmap_phases')
            .select('*')
            .order('sort_order');

        if (phaseError) {
            console.error('[ContentService] getRoadmap phases error:', phaseError);
            return [];
        }

        const { data: items, error: itemError } = await supabase
            .from('content_roadmap_items')
            .select('*')
            .order('sort_order');

        if (itemError) {
            console.error('[ContentService] getRoadmap items error:', itemError);
            return [];
        }

        return (phases || []).map((phase: any) => {
            const phaseItems = (items || []).filter((item: any) => item.phase_id === phase.id);
            return toRoadmapPhase(phase, phaseItems);
        });
    }

    // ─── FAQ & Support ──────────────────────

    static async getFAQ(): Promise<{ faq: FAQItem[]; supportPaths: SupportPath[] }> {
        if (!isSupabaseConfigured()) return { faq: [], supportPaths: [] };

        const [faqResult, spResult] = await Promise.all([
            supabase.from('content_faq').select('*').order('sort_order'),
            supabase.from('content_support_paths').select('*').order('sort_order'),
        ]);

        if (faqResult.error) {
            console.error('[ContentService] getFAQ error:', faqResult.error);
        }
        if (spResult.error) {
            console.error('[ContentService] getSupportPaths error:', spResult.error);
        }

        return {
            faq: (faqResult.data || []).map(toFAQItem),
            supportPaths: (spResult.data || []).map(toSupportPath),
        };
    }

    // ─── Admin Write Methods ────────────────

    static async upsertModule(data: {
        moduleSlug: string;
        title: string;
        description: string;
        icon: string;
        difficulty: string;
        simulatorKind?: string | null;
        comingSoon: boolean;
        walletRequired: boolean;
        sortOrder: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_modules')
            .upsert({
                module_slug: data.moduleSlug,
                title: data.title,
                description: data.description,
                icon: data.icon,
                difficulty: data.difficulty,
                simulator_kind: data.simulatorKind || null,
                coming_soon: data.comingSoon,
                wallet_required: data.walletRequired,
                sort_order: data.sortOrder,
            }, { onConflict: 'module_slug' });

        if (error) {
            console.error('[ContentService] upsertModule error:', error);
            return false;
        }
        return true;
    }

    static async upsertLesson(data: {
        moduleSlug: string;
        lessonSlug: string;
        title: string;
        description: string;
        simulatorPreset?: SimulatorPreset | null;
        sortOrder: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_lessons')
            .upsert({
                module_slug: data.moduleSlug,
                lesson_slug: data.lessonSlug,
                title: data.title,
                description: data.description,
                simulator_preset: data.simulatorPreset || null,
                sort_order: data.sortOrder,
            }, { onConflict: 'module_slug,lesson_slug' });

        if (error) {
            console.error('[ContentService] upsertLesson error:', error);
            return false;
        }
        return true;
    }

    static async upsertLessonDetail(data: {
        moduleSlug: string;
        lessonSlug: string;
        detailType: 'order_type' | 'order_book';
        emoji: string;
        content: Record<string, any>;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_lesson_details')
            .upsert({
                module_slug: data.moduleSlug,
                lesson_slug: data.lessonSlug,
                detail_type: data.detailType,
                emoji: data.emoji,
                content: data.content,
            }, { onConflict: 'module_slug,lesson_slug' });

        if (error) {
            console.error('[ContentService] upsertLessonDetail error:', error);
            return false;
        }
        return true;
    }

    static async createChangelogEntry(data: {
        category: ChangelogCategory;
        date: string;
        tagLabel: string;
        tagColor: string;
        title: string;
        description?: string;
        credit?: string;
        source?: string;
        testHref?: string;
        testLabel?: string;
        sortOrder?: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_changelog')
            .insert({
                category: data.category,
                date: data.date,
                tag_label: data.tagLabel,
                tag_color: data.tagColor,
                title: data.title,
                description: data.description || null,
                credit: data.credit || null,
                source: data.source || null,
                test_href: data.testHref || null,
                test_label: data.testLabel || null,
                sort_order: data.sortOrder ?? 0,
            });

        if (error) {
            console.error('[ContentService] createChangelogEntry error:', error);
            return false;
        }
        return true;
    }

    static async updateChangelogEntry(id: number, data: Partial<{
        category: ChangelogCategory;
        date: string;
        tagLabel: string;
        tagColor: string;
        title: string;
        description: string | null;
        credit: string | null;
        source: string | null;
        testHref: string | null;
        testLabel: string | null;
        sortOrder: number;
    }>): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const updates: Record<string, any> = {};
        if (data.category !== undefined) updates.category = data.category;
        if (data.date !== undefined) updates.date = data.date;
        if (data.tagLabel !== undefined) updates.tag_label = data.tagLabel;
        if (data.tagColor !== undefined) updates.tag_color = data.tagColor;
        if (data.title !== undefined) updates.title = data.title;
        if (data.description !== undefined) updates.description = data.description;
        if (data.credit !== undefined) updates.credit = data.credit;
        if (data.source !== undefined) updates.source = data.source;
        if (data.testHref !== undefined) updates.test_href = data.testHref;
        if (data.testLabel !== undefined) updates.test_label = data.testLabel;
        if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;

        const { error } = await supabase
            .from('content_changelog')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('[ContentService] updateChangelogEntry error:', error);
            return false;
        }
        return true;
    }

    static async deleteChangelogEntry(id: number): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_changelog')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ContentService] deleteChangelogEntry error:', error);
            return false;
        }
        return true;
    }

    static async upsertRoadmapPhase(data: {
        id?: number;
        title: string;
        status: RoadmapStatus;
        subtitle: string;
        items: string[];
        sortOrder: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        // Upsert phase
        const phasePayload: Record<string, any> = {
            title: data.title,
            status: data.status,
            subtitle: data.subtitle,
            sort_order: data.sortOrder,
        };
        if (data.id) phasePayload.id = data.id;

        const { data: phaseData, error: phaseError } = await supabase
            .from('content_roadmap_phases')
            .upsert(phasePayload)
            .select('id')
            .single();

        if (phaseError || !phaseData) {
            console.error('[ContentService] upsertRoadmapPhase error:', phaseError);
            return false;
        }

        // Replace items
        const phaseId = phaseData.id;
        await supabase.from('content_roadmap_items').delete().eq('phase_id', phaseId);

        if (data.items.length > 0) {
            const itemRows = data.items.map((text, i) => ({
                phase_id: phaseId,
                item_text: text,
                sort_order: i,
            }));
            const { error: itemError } = await supabase
                .from('content_roadmap_items')
                .insert(itemRows);

            if (itemError) {
                console.error('[ContentService] upsertRoadmapPhase items error:', itemError);
                return false;
            }
        }

        return true;
    }

    static async upsertFAQItem(data: {
        value: string;
        title: string;
        body: string;
        sortOrder: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('content_faq')
            .upsert({
                value: data.value,
                title: data.title,
                body: data.body,
                sort_order: data.sortOrder,
            }, { onConflict: 'value' });

        if (error) {
            console.error('[ContentService] upsertFAQItem error:', error);
            return false;
        }
        return true;
    }

    // ─── Site Settings ──────────────────────

    static async getSiteSettings(): Promise<{ defaultPresetId: string; enabledPresets: string[] }> {
        const fallback = { defaultPresetId: 'paper', enabledPresets: ['paper', 'winter', 'spring', 'summer', 'glass', 'soft', 'retro'] };
        if (!isSupabaseConfigured()) return fallback;

        const { data, error } = await supabase
            .from('site_settings')
            .select('default_preset_id, enabled_presets')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('[ContentService] getSiteSettings error:', error);
            return fallback;
        }

        return {
            defaultPresetId: data.default_preset_id || 'paper',
            enabledPresets: data.enabled_presets || fallback.enabledPresets,
        };
    }

    static async updateSiteSettings(data: {
        defaultPresetId: string;
        enabledPresets: string[];
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('site_settings')
            .update({
                default_preset_id: data.defaultPresetId,
                enabled_presets: data.enabledPresets,
            })
            .eq('id', 1);

        if (error) {
            console.error('[ContentService] updateSiteSettings error:', error);
            return false;
        }
        return true;
    }

    static async upsertSupportPath(data: {
        id?: number;
        title: string;
        description: string;
        sortOrder: number;
    }): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const payload: Record<string, any> = {
            title: data.title,
            description: data.description,
            sort_order: data.sortOrder,
        };
        if (data.id) payload.id = data.id;

        const { error } = await supabase
            .from('content_support_paths')
            .upsert(payload);

        if (error) {
            console.error('[ContentService] upsertSupportPath error:', error);
            return false;
        }
        return true;
    }
}

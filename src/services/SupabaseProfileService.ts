import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ============================================
// Types
// ============================================

export interface AppearancePreferences {
    bgType: 'default' | 'custom' | 'color';
    bgImagePath: string | null;
    bgColor: string;
    overlayOpacity: number;
    blurAmount: number;
    presetId?: string;
}

export interface UserPreferences {
    walletAddress: string;
    preferences: AppearancePreferences;
    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
    bgType: 'default',
    bgImagePath: null,
    bgColor: '#0D0D21',
    overlayOpacity: 0,
    blurAmount: 0,
};

const STORAGE_BUCKET = 'user-backgrounds';

// ============================================
// DB row → App type transformer
// ============================================

function toUserPreferences(row: any): UserPreferences {
    return {
        walletAddress: row.wallet_address,
        preferences: {
            ...DEFAULT_APPEARANCE,
            ...(row.preferences || {}),
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ============================================
// Service Class
// ============================================

export class SupabaseProfileService {

    // ─── Preferences ─────────────────────────

    static async getPreferences(walletAddress: string): Promise<UserPreferences> {
        if (!isSupabaseConfigured()) {
            return {
                walletAddress,
                preferences: { ...DEFAULT_APPEARANCE },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found → create defaults
                const { data: created, error: createErr } = await supabase
                    .from('user_preferences')
                    .insert({
                        wallet_address: walletAddress,
                        preferences: { ...DEFAULT_APPEARANCE },
                    })
                    .select()
                    .single();

                if (createErr) {
                    console.error('[ProfileService] create preferences error:', createErr);
                    throw createErr;
                }
                return toUserPreferences(created);
            }
            console.error('[ProfileService] getPreferences error:', error);
            throw error;
        }
        return toUserPreferences(data);
    }

    static async updatePreferences(
        walletAddress: string,
        partial: Partial<AppearancePreferences>
    ): Promise<UserPreferences> {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        // Fetch current prefs to merge
        const current = await this.getPreferences(walletAddress);
        const merged = { ...current.preferences, ...partial };

        const { data, error } = await supabase
            .from('user_preferences')
            .update({ preferences: merged })
            .eq('wallet_address', walletAddress)
            .select()
            .single();

        if (error) {
            console.error('[ProfileService] updatePreferences error:', error);
            throw error;
        }
        return toUserPreferences(data);
    }

    // ─── Background Image Storage ────────────

    static async uploadBackgroundImage(
        walletAddress: string,
        blob: Blob
    ): Promise<string> {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const path = `${walletAddress}/bg.webp`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, blob, {
                contentType: 'image/webp',
                upsert: true,
            });

        if (uploadError) {
            console.error('[ProfileService] uploadBackgroundImage error:', uploadError);
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

        return urlData.publicUrl;
    }

    static async deleteBackgroundImage(walletAddress: string): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const path = `${walletAddress}/bg.webp`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([path]);

        if (error) {
            console.error('[ProfileService] deleteBackgroundImage error:', error);
            // Don't throw — deletion failure shouldn't block the UI
        }
    }
}

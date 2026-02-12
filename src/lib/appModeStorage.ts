import { supabase } from './supabaseClient';

export type AppMode = 'REAL' | 'MOCK';

const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function persistAppMode(mode: AppMode, address?: string) {
    if (!hasSupabaseConfig) {
        // eslint-disable-next-line no-console
        console.warn('[AppMode] Supabase not configured; skipping persistence');
        return;
    }

    try {
        const { error } = await supabase.from('app_modes').upsert(
            {
                mode,
                address: address ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'address' }
        );
        if (error) {
            // eslint-disable-next-line no-console
            console.warn('[AppMode] Failed to persist app mode', error);
        }
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[AppMode] Unexpected error persisting app mode', err);
    }
}

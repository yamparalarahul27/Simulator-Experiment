import { FALLBACK_MODULES } from '@/lib/fallbacks/modules';

/**
 * Re-export fallback modules as MODULES for backward compatibility.
 * Components should migrate to useModules() hook for Supabase-backed data.
 */
export const MODULES = FALLBACK_MODULES;

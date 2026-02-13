import { supabase } from '@/lib/supabaseClient';

export interface UserWallet {
    id: string;
    wallet_address: string;
    network: string;
    wallet_provider: string;
    connection_method: string;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SaveWalletParams {
    address: string;
    network: string;
    provider?: string;
    method?: 'manual' | 'wallet_connect';
}

/**
 * Service for interacting with the user_wallets table in Supabase
 */
export class SupabaseWalletService {
    /**
     * Save or update a wallet in the database
     * Uses upsert to handle both new and existing wallets
     */
    async saveWallet(params: SaveWalletParams): Promise<UserWallet> {
        const { address, network, provider, method } = params;

        const { data, error } = await supabase
            .from('user_wallets')
            .upsert(
                {
                    wallet_address: address,
                    network,
                    wallet_provider: provider || 'manual',
                    connection_method: method || 'manual',
                    last_synced_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'wallet_address',
                }
            )
            .select()
            .single();

        if (error) {
            console.error('[SupabaseWalletService] Error saving wallet:', error);
            throw error;
        }

        return data as UserWallet;
    }

    /**
     * Get a wallet by address
     * Returns null if not found
     */
    async getWallet(address: string): Promise<UserWallet | null> {
        const { data, error } = await supabase
            .from('user_wallets')
            .select('*')
            .eq('wallet_address', address)
            .single();

        if (error) {
            // PGRST116 = not found, which is expected
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('[SupabaseWalletService] Error getting wallet:', error);
            throw error;
        }

        return data as UserWallet;
    }

    /**
     * Update the last_synced_at timestamp for a wallet
     */
    async updateSyncTime(address: string): Promise<void> {
        const { error } = await supabase
            .from('user_wallets')
            .update({
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('wallet_address', address);

        if (error) {
            console.error('[SupabaseWalletService] Error updating sync time:', error);
            throw error;
        }
    }

    /**
     * Get recently synced wallets
     * Useful for showing "Recent Wallets" in UI
     */
    async getRecentWallets(limit: number = 5): Promise<UserWallet[]> {
        const { data, error } = await supabase
            .from('user_wallets')
            .select('*')
            .order('last_synced_at', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) {
            console.error('[SupabaseWalletService] Error getting recent wallets:', error);
            throw error;
        }

        return (data as UserWallet[]) || [];
    }

    /**
     * Check if wallet data is stale (older than specified hours)
     */
    isDataStale(wallet: UserWallet, hoursThreshold: number = 24): boolean {
        if (!wallet.last_synced_at) {
            return true; // Never synced = stale
        }

        const lastSynced = new Date(wallet.last_synced_at);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60);

        return hoursSinceSync > hoursThreshold;
    }

    /**
     * Get human-readable time since last sync
     */
    getTimeSinceSync(wallet: UserWallet): string {
        if (!wallet.last_synced_at) {
            return 'Never synced';
        }

        const lastSynced = new Date(wallet.last_synced_at);
        const now = new Date();
        const minutesSinceSync = Math.floor((now.getTime() - lastSynced.getTime()) / (1000 * 60));

        if (minutesSinceSync < 1) return 'Just now';
        if (minutesSinceSync < 60) return `${minutesSinceSync} minute${minutesSinceSync > 1 ? 's' : ''} ago`;

        const hoursSinceSync = Math.floor(minutesSinceSync / 60);
        if (hoursSinceSync < 24) return `${hoursSinceSync} hour${hoursSinceSync > 1 ? 's' : ''} ago`;

        const daysSinceSync = Math.floor(hoursSinceSync / 24);
        return `${daysSinceSync} day${daysSinceSync > 1 ? 's' : ''} ago`;
    }
}

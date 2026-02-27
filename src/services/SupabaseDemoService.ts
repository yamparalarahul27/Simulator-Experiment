import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ============================================
// Types
// ============================================

export type DemoOrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit' | 'iceberg' | 'twap';
export type DemoOrderSide = 'buy' | 'sell';
export type DemoOrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled' | 'triggered';

export interface DemoOrder {
    id: string;
    walletAddress: string;
    pair: string;
    side: DemoOrderSide;
    orderType: DemoOrderType;
    status: DemoOrderStatus;
    price: number | null;
    stopPrice: number | null;
    limitPrice: number | null;
    fillPrice: number | null;
    quantity: number;
    filledQuantity: number;
    tpPrice: number | null;
    slPrice: number | null;
    visibleQty: number | null;
    twapDuration: number | null;
    twapIntervals: number | null;
    twapNextSliceAt: string | null;
    parentOrderId: string | null;
    fee: number;
    feeCurrency: string;
    pnl: number | null;
    createdAt: string;
    updatedAt: string;
    filledAt: string | null;
}

export interface DemoBalance {
    walletAddress: string;
    token: string;
    available: number;
    inOrder: number;
    updatedAt: string;
}

export interface DemoSettings {
    walletAddress: string;
    currency: 'USD' | 'INR';
    usdInrRate: number;
    priceOverrides: Record<string, number | null>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderParams {
    pair: string;
    side: DemoOrderSide;
    orderType: DemoOrderType;
    price?: number | null;
    stopPrice?: number | null;
    limitPrice?: number | null;
    quantity: number;
    tpPrice?: number | null;
    slPrice?: number | null;
    visibleQty?: number | null;
    twapDuration?: number | null;
    twapIntervals?: number | null;
    parentOrderId?: string | null;
    fee?: number;
}

// Default starting balances
export const DEFAULT_BALANCES: Record<string, number> = {
    USDC: 10_000,
    SOL: 50,
    BTC: 0.1,
    ETH: 2,
    JUP: 500,
    BONK: 5_000_000,
    XRP: 1_000,
};

// ============================================
// DB row → App type transformers
// ============================================

function toOrder(row: any): DemoOrder {
    return {
        id: row.id,
        walletAddress: row.wallet_address,
        pair: row.pair,
        side: row.side,
        orderType: row.order_type,
        status: row.status,
        price: row.price != null ? Number(row.price) : null,
        stopPrice: row.stop_price != null ? Number(row.stop_price) : null,
        limitPrice: row.limit_price != null ? Number(row.limit_price) : null,
        fillPrice: row.fill_price != null ? Number(row.fill_price) : null,
        quantity: Number(row.quantity),
        filledQuantity: Number(row.filled_quantity),
        tpPrice: row.tp_price != null ? Number(row.tp_price) : null,
        slPrice: row.sl_price != null ? Number(row.sl_price) : null,
        visibleQty: row.visible_qty != null ? Number(row.visible_qty) : null,
        twapDuration: row.twap_duration,
        twapIntervals: row.twap_intervals,
        twapNextSliceAt: row.twap_next_slice_at,
        parentOrderId: row.parent_order_id,
        fee: Number(row.fee),
        feeCurrency: row.fee_currency,
        pnl: row.pnl != null ? Number(row.pnl) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        filledAt: row.filled_at,
    };
}

function toBalance(row: any): DemoBalance {
    return {
        walletAddress: row.wallet_address,
        token: row.token,
        available: Number(row.available),
        inOrder: Number(row.in_order),
        updatedAt: row.updated_at,
    };
}

function toSettings(row: any): DemoSettings {
    return {
        walletAddress: row.wallet_address,
        currency: row.currency,
        usdInrRate: Number(row.usd_inr_rate),
        priceOverrides: row.price_overrides || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ============================================
// Service Class
// ============================================

export class SupabaseDemoService {

    // ─── Balances ───────────────────────────

    /**
     * Get all balances for a wallet
     */
    async getBalances(walletAddress: string): Promise<DemoBalance[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from('demo_balances')
            .select('*')
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('[DemoService] getBalances error:', error);
            throw error;
        }
        return (data || []).map(toBalance);
    }

    /**
     * Initialize default balances for a new wallet.
     * Only inserts if no balances exist yet (idempotent).
     */
    async initializeBalances(walletAddress: string): Promise<DemoBalance[]> {
        if (!isSupabaseConfigured()) return [];

        // Check if already initialized
        const existing = await this.getBalances(walletAddress);
        if (existing.length > 0) return existing;

        const rows = Object.entries(DEFAULT_BALANCES).map(([token, amount]) => ({
            wallet_address: walletAddress,
            token,
            available: amount,
            in_order: 0,
        }));

        const { data, error } = await supabase
            .from('demo_balances')
            .insert(rows)
            .select();

        if (error) {
            console.error('[DemoService] initializeBalances error:', error);
            throw error;
        }
        return (data || []).map(toBalance);
    }

    /**
     * Update a single token balance
     */
    async updateBalance(walletAddress: string, token: string, available: number, inOrder: number): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const { error } = await supabase
            .from('demo_balances')
            .upsert({
                wallet_address: walletAddress,
                token,
                available,
                in_order: inOrder,
            }, { onConflict: 'wallet_address,token' });

        if (error) {
            console.error('[DemoService] updateBalance error:', error);
            throw error;
        }
    }

    /**
     * Reset all balances to defaults
     */
    async resetBalances(walletAddress: string): Promise<DemoBalance[]> {
        if (!isSupabaseConfigured()) return [];

        // Delete existing
        await supabase
            .from('demo_balances')
            .delete()
            .eq('wallet_address', walletAddress);

        // Re-insert defaults
        const rows = Object.entries(DEFAULT_BALANCES).map(([token, amount]) => ({
            wallet_address: walletAddress,
            token,
            available: amount,
            in_order: 0,
        }));

        const { data, error } = await supabase
            .from('demo_balances')
            .insert(rows)
            .select();

        if (error) {
            console.error('[DemoService] resetBalances error:', error);
            throw error;
        }
        return (data || []).map(toBalance);
    }

    // ─── Orders ─────────────────────────────

    /**
     * Get orders for a wallet, optionally filtered by status
     */
    async getOrders(walletAddress: string, status?: DemoOrderStatus | DemoOrderStatus[]): Promise<DemoOrder[]> {
        if (!isSupabaseConfigured()) return [];

        let query = supabase
            .from('demo_orders')
            .select('*')
            .eq('wallet_address', walletAddress)
            .order('created_at', { ascending: false });

        if (status) {
            if (Array.isArray(status)) {
                query = query.in('status', status);
            } else {
                query = query.eq('status', status);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('[DemoService] getOrders error:', error);
            throw error;
        }
        return (data || []).map(toOrder);
    }

    /**
     * Create a new order
     */
    async createOrder(walletAddress: string, params: CreateOrderParams): Promise<DemoOrder> {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const row = {
            wallet_address: walletAddress,
            pair: params.pair,
            side: params.side,
            order_type: params.orderType,
            status: params.orderType === 'market' ? 'filled' : 'pending',
            price: params.price ?? null,
            stop_price: params.stopPrice ?? null,
            limit_price: params.limitPrice ?? null,
            fill_price: params.orderType === 'market' ? params.price : null,
            quantity: params.quantity,
            filled_quantity: params.orderType === 'market' ? params.quantity : 0,
            tp_price: params.tpPrice ?? null,
            sl_price: params.slPrice ?? null,
            visible_qty: params.visibleQty ?? null,
            twap_duration: params.twapDuration ?? null,
            twap_intervals: params.twapIntervals ?? null,
            parent_order_id: params.parentOrderId ?? null,
            fee: params.fee ?? 0,
            fee_currency: 'USDC',
            filled_at: params.orderType === 'market' ? new Date().toISOString() : null,
        };

        const { data, error } = await supabase
            .from('demo_orders')
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('[DemoService] createOrder error:', error);
            throw error;
        }
        return toOrder(data);
    }

    /**
     * Update order fields (status, filled_quantity, fill_price, etc.)
     */
    async updateOrder(orderId: string, fields: Partial<{
        status: DemoOrderStatus;
        filledQuantity: number;
        fillPrice: number;
        filledAt: string;
        pnl: number;
        twapNextSliceAt: string;
    }>): Promise<DemoOrder> {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const dbFields: any = {};
        if (fields.status !== undefined) dbFields.status = fields.status;
        if (fields.filledQuantity !== undefined) dbFields.filled_quantity = fields.filledQuantity;
        if (fields.fillPrice !== undefined) dbFields.fill_price = fields.fillPrice;
        if (fields.filledAt !== undefined) dbFields.filled_at = fields.filledAt;
        if (fields.pnl !== undefined) dbFields.pnl = fields.pnl;
        if (fields.twapNextSliceAt !== undefined) dbFields.twap_next_slice_at = fields.twapNextSliceAt;

        const { data, error } = await supabase
            .from('demo_orders')
            .update(dbFields)
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('[DemoService] updateOrder error:', error);
            throw error;
        }
        return toOrder(data);
    }

    /**
     * Cancel a pending/partial order
     */
    async cancelOrder(orderId: string): Promise<DemoOrder> {
        return this.updateOrder(orderId, { status: 'cancelled' });
    }

    // ─── Settings ───────────────────────────

    /**
     * Get settings for a wallet. Creates defaults if none exist.
     */
    async getSettings(walletAddress: string): Promise<DemoSettings> {
        if (!isSupabaseConfigured()) {
            return {
                walletAddress,
                currency: 'USD',
                usdInrRate: 90.98,
                priceOverrides: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        const { data, error } = await supabase
            .from('demo_settings')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found → create defaults
                const { data: created, error: createErr } = await supabase
                    .from('demo_settings')
                    .insert({
                        wallet_address: walletAddress,
                        currency: 'USD',
                        usd_inr_rate: 90.98,
                        price_overrides: {},
                    })
                    .select()
                    .single();

                if (createErr) {
                    console.error('[DemoService] create settings error:', createErr);
                    throw createErr;
                }
                return toSettings(created);
            }
            console.error('[DemoService] getSettings error:', error);
            throw error;
        }
        return toSettings(data);
    }

    /**
     * Update settings (currency, rate, price overrides)
     */
    async updateSettings(walletAddress: string, fields: Partial<{
        currency: 'USD' | 'INR';
        usdInrRate: number;
        priceOverrides: Record<string, number | null>;
    }>): Promise<DemoSettings> {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const dbFields: any = {};
        if (fields.currency !== undefined) dbFields.currency = fields.currency;
        if (fields.usdInrRate !== undefined) dbFields.usd_inr_rate = fields.usdInrRate;
        if (fields.priceOverrides !== undefined) dbFields.price_overrides = fields.priceOverrides;

        const { data, error } = await supabase
            .from('demo_settings')
            .update(dbFields)
            .eq('wallet_address', walletAddress)
            .select()
            .single();

        if (error) {
            console.error('[DemoService] updateSettings error:', error);
            throw error;
        }
        return toSettings(data);
    }
}

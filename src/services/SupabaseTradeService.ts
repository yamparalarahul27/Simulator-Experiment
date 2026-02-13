import { supabase } from '@/lib/supabaseClient';
import type { Trade } from '@/lib/types';

export interface SaveTradesResult {
    saved: number;
    updated: number;
    errors: number;
}

/**
 * Service for interacting with the trades table in Supabase
 */
export class SupabaseTradeService {
    /**
     * Save multiple trades to the database
     * Uses upsert to handle both new and existing trades
     */
    async saveTrades(walletAddress: string, trades: Trade[]): Promise<SaveTradesResult> {
        if (trades.length === 0) {
            return { saved: 0, updated: 0, errors: 0 };
        }

        // Transform Trade[] to database format
        const dbTrades = trades.map(trade => ({
            id: trade.id,
            wallet_address: walletAddress,
            symbol: trade.symbol,
            quote_currency: trade.quoteCurrency,
            side: trade.side,
            order_type: trade.orderType,
            quantity: trade.quantity,
            price: trade.price,
            notional: trade.notional,
            pnl: trade.pnl,
            fee: trade.fee,
            fee_currency: trade.feeCurrency,
            opened_at: trade.openedAt.toISOString(),
            closed_at: trade.closedAt.toISOString(),
            duration_seconds: trade.durationSeconds,
            is_win: trade.isWin,
            tx_signature: trade.txSignature,
            is_maker: trade.isMaker ?? null,
            leverage: trade.leverage ?? null,
            liquidation_price: trade.liquidationPrice ?? null,
            margin_used: trade.marginUsed ?? null,
            fee_breakdown: trade.feeBreakdown ? JSON.stringify(trade.feeBreakdown) : null,
        }));

        const { data, error, count } = await supabase
            .from('trades')
            .upsert(dbTrades, {
                onConflict: 'id',
                count: 'exact',
            })
            .select();

        if (error) {
            console.error('[SupabaseTradeService] Error saving trades:', error);
            throw error;
        }

        return {
            saved: count ?? 0,
            updated: 0, // Supabase doesn't distinguish between insert/update in upsert
            errors: 0,
        };
    }

    /**
     * Get all trades for a wallet
     */
    async getTrades(walletAddress: string, limit?: number): Promise<Trade[]> {
        let query = supabase
            .from('trades')
            .select('*')
            .eq('wallet_address', walletAddress)
            .order('closed_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[SupabaseTradeService] Error getting trades:', error);
            throw error;
        }

        // Transform database format to Trade[]
        return (data || []).map(dbTrade => ({
            id: dbTrade.id,
            symbol: dbTrade.symbol,
            quoteCurrency: dbTrade.quote_currency,
            side: dbTrade.side,
            orderType: dbTrade.order_type,
            quantity: Number(dbTrade.quantity),
            price: Number(dbTrade.price),
            notional: Number(dbTrade.notional),
            pnl: Number(dbTrade.pnl),
            fee: Number(dbTrade.fee),
            feeCurrency: dbTrade.fee_currency,
            openedAt: new Date(dbTrade.opened_at),
            closedAt: new Date(dbTrade.closed_at),
            durationSeconds: dbTrade.duration_seconds,
            isWin: dbTrade.is_win,
            txSignature: dbTrade.tx_signature,
            isMaker: dbTrade.is_maker,
            leverage: dbTrade.leverage ? Number(dbTrade.leverage) : undefined,
            liquidationPrice: dbTrade.liquidation_price ? Number(dbTrade.liquidation_price) : undefined,
            marginUsed: dbTrade.margin_used ? Number(dbTrade.margin_used) : undefined,
            feeBreakdown: dbTrade.fee_breakdown ? JSON.parse(dbTrade.fee_breakdown) : undefined,
        }));
    }

    /**
     * Get trade count for a wallet
     */
    async getTradeCount(walletAddress: string): Promise<number> {
        const { count, error } = await supabase
            .from('trades')
            .select('*', { count: 'exact', head: true })
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('[SupabaseTradeService] Error getting trade count:', error);
            throw error;
        }

        return count ?? 0;
    }

    /**
     * Delete all trades for a wallet
     */
    async deleteTrades(walletAddress: string): Promise<number> {
        const { count, error } = await supabase
            .from('trades')
            .delete({ count: 'exact' })
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('[SupabaseTradeService] Error deleting trades:', error);
            throw error;
        }

        return count ?? 0;
    }

    /**
     * Get analytics summary for a wallet
     */
    async getAnalytics(walletAddress: string): Promise<{
        totalTrades: number;
        totalPnl: number;
        winRate: number;
        totalFees: number;
    }> {
        const { data, error } = await supabase
            .from('trades')
            .select('pnl, fee, is_win')
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('[SupabaseTradeService] Error getting analytics:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            return { totalTrades: 0, totalPnl: 0, winRate: 0, totalFees: 0 };
        }

        const totalTrades = data.length;
        const totalPnl = data.reduce((sum, t) => sum + Number(t.pnl), 0);
        const totalFees = data.reduce((sum, t) => sum + Number(t.fee), 0);
        const wins = data.filter(t => t.is_win).length;

        // Safe division (avoid division by zero)
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

        return {
            totalTrades,
            totalPnl,
            winRate,
            totalFees,
        };
    }
}

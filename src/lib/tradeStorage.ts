import { supabase } from './supabaseClient';
import type { Trade } from '../lib/types';

export async function persistTrades(walletAddress: string, trades: Trade[]) {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('trades')
            .upsert(
                trades.map(trade => ({
                    wallet_address: walletAddress,
                    tx_signature: trade.txSignature,
                    symbol: trade.symbol,
                    side: trade.side,
                    price: trade.price,
                    amount: trade.amount,
                    pnl: trade.pnl,
                    fee: trade.fee,
                    timestamp: trade.timestamp,
                    raw_data: trade
                })),
                { onConflict: 'wallet_address,tx_signature' }
            );

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error persisting trades:', error);
        return false;
    }
}

export async function fetchTrades(walletAddress: string): Promise<Trade[]> {
    if (!supabase) {
        console.error('Supabase client not initialized');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('trades')
            .select('raw_data')
            .eq('wallet_address', walletAddress)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return data?.map(item => item.raw_data) || [];
    } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
    }
}

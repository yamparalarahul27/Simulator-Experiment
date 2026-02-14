import { supabase } from '../lib/supabaseClient';
import { TradeAnnotation } from '../lib/types';

export class SupabaseAnnotationService {
    /**
     * Fetch annotation for a specific trade
     */
    async getAnnotation(tradeId: string): Promise<TradeAnnotation | null> {
        const { data, error } = await supabase
            .from('trade_annotations')
            .select('*')
            .eq('trade_id', tradeId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('[SupabaseAnnotationService] Error fetching annotation:', error);
            throw error;
        }

        return this.mapDbToAnnotation(data);
    }

    /**
     * Save/Update annotation for a trade
     */
    async saveAnnotation(annotation: TradeAnnotation, walletAddress?: string): Promise<TradeAnnotation> {
        const dbData = this.mapAnnotationToDb(annotation, walletAddress);

        const { data, error } = await supabase
            .from('trade_annotations')
            .upsert(dbData, { onConflict: 'trade_id' })
            .select()
            .single();

        if (error) {
            console.error('[SupabaseAnnotationService] Error saving annotation:', JSON.stringify(error, null, 2));
            throw error;
        }

        return this.mapDbToAnnotation(data);
    }

    /**
     * Get all annotations for a wallet's trades
     */
    async getAnnotationsForWallet(walletAddress: string): Promise<Record<string, TradeAnnotation>> {
        // We query by wallet_address directly if available for better reliability
        const { data, error } = await supabase
            .from('trade_annotations')
            .select('*')
            .eq('wallet_address', walletAddress);

        if (error) {
            console.error('[SupabaseAnnotationService] Error fetching annotations for wallet:', JSON.stringify(error, null, 2));
            throw error;
        }

        const annotations: Record<string, TradeAnnotation> = {};
        (data || []).forEach((item: any) => {
            const annotation = this.mapDbToAnnotation(item);
            annotations[annotation.tradeId] = annotation;
        });

        return annotations;
    }

    private mapDbToAnnotation(dbData: any): TradeAnnotation {
        return {
            id: dbData.id,
            tradeId: dbData.trade_id,
            notes: dbData.notes || '',
            tags: dbData.tags || [],
            lessonsLearned: dbData.lessons_learned || '',
            createdAt: new Date(dbData.created_at),
            updatedAt: new Date(dbData.updated_at),
        };
    }

    private mapAnnotationToDb(annotation: TradeAnnotation, walletAddress?: string): any {
        return {
            trade_id: annotation.tradeId,
            wallet_address: walletAddress,
            notes: annotation.notes,
            tags: annotation.tags,
            lessons_learned: annotation.lessonsLearned,
            updated_at: new Date().toISOString(),
        };
    }
}

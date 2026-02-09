/**
 * Helius RPC Service
 * 
 * Fetches and processes Solana transaction history using Helius RPC endpoint.
 * Provides transaction type detection and formatting utilities.
 */

import { PublicKey } from '@solana/web3.js';
import { getRpcConnection, formatTimestamp } from '../lib/utils';
import { PROGRAM_ID } from '../lib/constants';

export interface TransactionLog {
    signature: string;
    time: number;
    type: string;
    status: 'Confirmed' | 'Failed';
    fee: number;
}

export interface TransactionHistoryResponse {
    transactions: TransactionLog[];
}

export class HeliusService {
    /**
     * Fetch all transactions for a given wallet address
     * 
     * @param address - Solana wallet address
     * @returns Transaction history with details
     */
    async fetchAllTransactions(address: string): Promise<TransactionHistoryResponse> {
        console.log('[Helius] Fetching transactions for address:', address);
        const connection = getRpcConnection();

        try {
            const pubKey = new PublicKey(address);

            // Fetch last 50 transaction signatures
            const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 50 });
            console.log(`[Helius] Found ${signatures.length} transaction signatures`);

            const transactions: TransactionLog[] = [];

            // Fetch details for each transaction
            for (const sig of signatures) {
                try {
                    const tx = await connection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0,
                        commitment: 'confirmed'
                    });

                    if (tx && tx.meta) {
                        const txLog: TransactionLog = {
                            signature: sig.signature,
                            time: tx.blockTime || Date.now() / 1000,
                            status: tx.meta.err ? 'Failed' : 'Confirmed',
                            type: this.detectTransactionType(tx),
                            fee: tx.meta.fee || 0,
                        };

                        transactions.push(txLog);
                    }
                } catch (error) {
                    console.warn(`[Helius] Failed to fetch transaction ${sig.signature}:`, error);
                }
            }

            console.log(`[Helius] Successfully fetched ${transactions.length} transaction details`);
            return { transactions };
        } catch (error) {
            console.error('[Helius] Error fetching transactions:', error);
            throw new Error('Failed to fetch transactions. Please check the address and try again.');
        }
    }

    /**
     * Detect transaction type from log messages
     * 
     * @param tx - Parsed transaction object
     * @returns Human-readable transaction type
     */
    private detectTransactionType(tx: any): string {
        if (!tx.meta || !tx.meta.logMessages) return 'Unknown';

        const logs = tx.meta.logMessages.join(' ');

        // Detect common transaction types from program IDs in logs
        if (logs.includes('Program 11111111111111111111111111111111')) return 'System Transfer';
        if (logs.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) return 'Token Transfer';
        if (logs.includes('JUP')) return 'Jupiter Swap';
        if (logs.includes(PROGRAM_ID)) return 'Deriverse';

        return 'Transaction';
    }

    /**
     * Format Unix timestamp to localized string
     * 
     * @param timestamp - Unix timestamp in seconds
     * @returns Formatted date string
     */
    static formatTime(timestamp: number): string {
        return formatTimestamp(timestamp);
    }
}

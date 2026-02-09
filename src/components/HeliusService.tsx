import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

const HELIUS_RPC_URL = 'https://devnet.helius-rpc.com/?api-key=REMOVED';

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
    private connection: Connection;

    constructor() {
        this.connection = new Connection(HELIUS_RPC_URL, 'confirmed');
    }

    async fetchAllTransactions(address: string): Promise<TransactionHistoryResponse> {
        console.log('Fetching ALL transactions for address via Helius:', address);

        try {
            const pubKey = new PublicKey(address);

            // Fetch last 50 transaction signatures
            const signatures = await this.connection.getSignaturesForAddress(pubKey, { limit: 50 });

            console.log(`Found ${signatures.length} transaction signatures`);

            const transactions: TransactionLog[] = [];

            // Fetch details for each transaction
            for (const sig of signatures) {
                try {
                    const tx = await this.connection.getTransaction(sig.signature, {
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
                    console.warn(`Failed to fetch transaction ${sig.signature}:`, error);
                }
            }

            console.log(`Successfully fetched ${transactions.length} transaction details`);

            return { transactions };
        } catch (error) {
            console.error('Error fetching transactions from Helius:', error);
            throw new Error('Failed to fetch transactions. Please check the address and try again.');
        }
    }

    private detectTransactionType(tx: any): string {
        if (!tx.meta || !tx.meta.logMessages) return 'Unknown';

        const logs = tx.meta.logMessages.join(' ');

        // Detect common transaction types from program IDs in logs
        if (logs.includes('Program 11111111111111111111111111111111')) return 'System Transfer';
        if (logs.includes('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) return 'Token Transfer';
        if (logs.includes('JUP')) return 'Jupiter Swap';
        if (logs.includes('Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu')) return 'Deriverse';

        return 'Transaction';
    }

    // Helper method to format time
    static formatTime(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
    }
}

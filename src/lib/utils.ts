/**
 * Shared utility functions
 */

import { Connection } from '@solana/web3.js';
import { HELIUS_RPC_URL } from './constants';

let connectionInstance: Connection | null = null;

/**
 * Get or create a shared RPC connection instance
 * Reuses the same connection to avoid creating multiple instances
 * 
 * @returns Solana Connection instance
 */
export function getRpcConnection(): Connection {
    if (!connectionInstance) {
        connectionInstance = new Connection(HELIUS_RPC_URL, 'confirmed');
    }
    return connectionInstance;
}

/**
 * Format a Unix timestamp to a localized date string
 * 
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
}

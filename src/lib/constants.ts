/**
 * Shared constants used across the application
 */

// Application metadata
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://deriverse.app';

// Deriverse Program Configuration
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
export const DERIVERSE_VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION ?? '12', 10);

// RPC Configuration
// NOTE: Do not embed Helius API keys here — NEXT_PUBLIC_* vars ship to the browser.
// Set NEXT_PUBLIC_HELIUS_RPC_URL in your environment if you want to use Helius;
// otherwise the public Solana devnet RPC is used as a key-less fallback.
export const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? 'https://api.devnet.solana.com';
export const RPC_HTTP = process.env.NEXT_PUBLIC_RPC_HTTP ?? HELIUS_RPC_URL;

export type SupportedCluster = 'devnet' | 'mainnet-beta';

// Map of user-selectable clusters to their RPC endpoints. Keeps wallet adapters
// lightweight while still letting us flip between devnet and mainnet via envs.
export const WALLET_CLUSTER_CONFIG: Record<SupportedCluster, { rpcUrl: string }> = {
    'devnet': {
        rpcUrl: process.env.NEXT_PUBLIC_RPC_DEVNET ?? HELIUS_RPC_URL
    },
    'mainnet-beta': {
        rpcUrl: process.env.NEXT_PUBLIC_RPC_MAINNET ?? 'https://api.mainnet-beta.solana.com'
    }
};

export const DEFAULT_WALLET_CLUSTER: SupportedCluster = (process.env.NEXT_PUBLIC_WALLET_CLUSTER === 'mainnet-beta'
    ? 'mainnet-beta'
    : 'devnet');

// Deriverse Decimals
export const PRICE_DECIMALS = 1e9;
export const ASSET_DECIMALS = 1e9;
export const QUOTE_DECIMALS = 1e6;

// Instrument ID to Symbol Mapping (Devnet)
export const INSTRUMENT_ID_TO_SYMBOL: Record<number, string> = {
    0: 'SOL-USDC',
};

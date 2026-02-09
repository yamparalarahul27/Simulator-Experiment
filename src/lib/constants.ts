/**
 * Shared constants used across the application
 */

// Deriverse Program Configuration
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
export const DERIVERSE_VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION ?? '12', 10);

// RPC Configuration
export const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? 'https://devnet.helius-rpc.com/?api-key=REMOVED';
export const RPC_HTTP = process.env.NEXT_PUBLIC_RPC_HTTP ?? HELIUS_RPC_URL;

// Deriverse Decimals
export const PRICE_DECIMALS = 1e9;
export const ASSET_DECIMALS = 1e9;
export const QUOTE_DECIMALS = 1e6;

// Instrument ID to Symbol Mapping (Devnet)
export const INSTRUMENT_ID_TO_SYMBOL: Record<number, string> = {
    0: 'SOL-USDC',
};

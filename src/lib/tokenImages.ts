/**
 * Token image and metadata management
 * Uses local custom images from /public/assets/tokens/
 * Supports separate images for Spot and Perpetual pairs
 */

const SPOT_BASE = '/assets/tokens/spot';
const PERP_BASE = '/assets/tokens/perp';

export const PAIR_METADATA = {
    // Spot pairs
    'SOL-USDC': {
        name: 'Solana / USDC',
        image: `${SPOT_BASE}/sol-usdc.png`,
        type: 'spot' as const
    },
    'BTC-USDC': {
        name: 'Bitcoin / USDC',
        image: `${SPOT_BASE}/btc-usdc.png`,
        type: 'spot' as const
    },
    'ETH-USDC': {
        name: 'Ethereum / USDC',
        image: `${SPOT_BASE}/eth-usdc.png`,
        type: 'spot' as const
    },
    'JUP-USDC': {
        name: 'Jupiter / USDC',
        image: `${SPOT_BASE}/jup-usdc.png`,
        type: 'spot' as const
    },
    'JTO-USDC': {
        name: 'Jito / USDC',
        image: `${SPOT_BASE}/jto-usdc.png`, // NOTE: Image missing, will fallback
        type: 'spot' as const
    },
    'BONK-USDC': {
        name: 'Bonk / USDC',
        image: `${SPOT_BASE}/bonk-usdc.png`,
        type: 'spot' as const
    },
    'WIF-USDC': {
        name: 'Dogwifhat / USDC',
        image: `${SPOT_BASE}/wif-usdc.png`,
        type: 'spot' as const
    },
    'RNDR-USDC': {
        name: 'Render / USDC',
        image: `${SPOT_BASE}/rndr-usdc.png`,
        type: 'spot' as const
    },

    // Perpetual pairs
    'SOL-PERP': {
        name: 'Solana Perpetual',
        image: `${PERP_BASE}/sol-perp.png`,
        type: 'perp' as const
    },
    'BTC-PERP': {
        name: 'Bitcoin Perpetual',
        image: `${PERP_BASE}/btc-perp.png`,
        type: 'perp' as const
    },
    'ETH-PERP': {
        name: 'Ethereum Perpetual',
        image: `${PERP_BASE}/eth-perp.png`,
        type: 'perp' as const
    },
    'JUP-PERP': {
        name: 'Jupiter Perpetual',
        image: `${PERP_BASE}/jup-perp.png`,
        type: 'perp' as const
    },
    'JTO-PERP': {
        name: 'Jito Perpetual',
        image: `${PERP_BASE}/jto-perp.png`, // NOTE: Image missing, will fallback
        type: 'perp' as const
    },
    'BONK-PERP': {
        name: 'Bonk Perpetual',
        image: `${PERP_BASE}/bonk-perp.png`,
        type: 'perp' as const
    },
    'WIF-PERP': {
        name: 'Dogwifhat Perpetual',
        image: `${PERP_BASE}/wif-perp.png`,
        type: 'perp' as const
    },
    'RNDR-PERP': {
        name: 'Render Perpetual',
        image: `${PERP_BASE}/rndr-perp.png`,
        type: 'perp' as const
    },
};

/**
 * Get pair image URL
 * @param symbol - Trading pair symbol (e.g., 'SOL-USDC', 'BTC-PERP')
 * @returns Image URL path
 */
export function getPairImage(symbol: string): string {
    return PAIR_METADATA[symbol as keyof typeof PAIR_METADATA]?.image || `${SPOT_BASE}/sol-usdc.png`; // Fallback
}

/**
 * Get pair name
 * @param symbol - Trading pair symbol
 * @returns Full pair name
 */
export function getPairName(symbol: string): string {
    return PAIR_METADATA[symbol as keyof typeof PAIR_METADATA]?.name || symbol;
}

/**
 * Check if pair is perpetual
 * @param symbol - Trading pair symbol
 * @returns True if perpetual, false if spot
 */
export function isPerpetual(symbol: string): boolean {
    return symbol.endsWith('-PERP') || PAIR_METADATA[symbol as keyof typeof PAIR_METADATA]?.type === 'perp';
}

/**
 * Get all available pairs (for dropdowns, filters, etc.)
 */
export function getAllPairs(): Array<{
    symbol: string;
    name: string;
    image: string;
    type: 'spot' | 'perp';
}> {
    return Object.entries(PAIR_METADATA).map(([symbol, data]) => ({
        symbol,
        ...data,
    }));
}

/**
 * Get spot pairs only
 */
export function getSpotPairs() {
    return getAllPairs().filter(p => p.type === 'spot');
}

/**
 * Get perpetual pairs only
 */
export function getPerpPairs() {
    return getAllPairs().filter(p => p.type === 'perp');
}

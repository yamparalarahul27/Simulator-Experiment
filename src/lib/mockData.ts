/**
 * Centralized mock data generation and analytics
 * Generates realistic trading data for development and demo purposes
 */

import { Trade, FeeComposition, DailyPnL, SessionBucket, TimeOfDayBucket, OrderType } from './types';
import { format, subDays, startOfDay } from 'date-fns';

// Configuration
const TRADE_COUNT = 240;
const HISTORY_DAYS = 180;
const BASE_FEE_RATE = 0.0005; // 0.05%
const WIN_RATE = 0.60; // 60% win rate
const SEED = 123; // Fixed seed for deterministic generation

// Trading pairs with weighted distribution
const SYMBOLS = [
    { symbol: 'SOL-USDC', weight: 25, types: ['spot', 'perp'] },
    { symbol: 'BTC-USDC', weight: 20, types: ['spot', 'perp'] },
    { symbol: 'ETH-USDC', weight: 15, types: ['spot', 'perp'] },
    { symbol: 'JUP-USDC', weight: 12, types: ['spot', 'perp'] },
    { symbol: 'JTO-USDC', weight: 10, types: ['spot', 'perp'] },
    { symbol: 'BONK-USDC', weight: 8, types: ['spot', 'perp'] },
    { symbol: 'WIF-USDC', weight: 6, types: ['spot', 'perp'] },
    { symbol: 'RNDR-USDC', weight: 4, types: ['spot', 'perp'] },
];

const ORDER_TYPES: OrderType[] = ['limit', 'market', 'stop_limit', 'stop_market'];

// Leverage distribution for perpetuals (weighted)
const LEVERAGE_DISTRIBUTION = [
    { leverage: 1, weight: 10 },
    { leverage: 2, weight: 15 },
    { leverage: 3, weight: 15 },
    { leverage: 5, weight: 25 },
    { leverage: 8, weight: 20 },
    { leverage: 10, weight: 15 },
];

/**
 * Seeded random number generator for deterministic mock data
 * Uses a simple LCG (Linear Congruential Generator)
 */
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

/**
 * Weighted random selection
 */
function weightedRandom<T extends { weight: number }>(items: T[], rng: SeededRandom): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = rng.next() * totalWeight;

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
    }

    return items[items.length - 1];
}

/**
 * Generate a single mock trade
 */
function generateTrade(index: number, timestamp: Date, rng: SeededRandom): Trade {
    // Select symbol and type
    const symbolData = weightedRandom(SYMBOLS, rng);
    const isPerp = rng.next() > 0.4; // 60% perp, 40% spot
    const symbol = isPerp ? symbolData.symbol.replace('-USDC', '-PERP') : symbolData.symbol;

    // Order type and maker/taker
    const orderType = ORDER_TYPES[rng.nextInt(0, ORDER_TYPES.length - 1)];
    const isMaker = rng.next() > 0.6; // 40% makers, 60% takers

    // Trade side
    const side = isPerp
        ? (rng.next() > 0.5 ? 'long' : 'short')
        : (rng.next() > 0.5 ? 'buy' : 'sell');

    // Price and quantity (realistic ranges per token)
    const basePrice = getBasePrice(symbolData.symbol);
    const rawPrice = basePrice * (0.95 + rng.next() * 0.1); // ±5% variance
    const price = Math.round(rawPrice * 100) / 100; // Round to 2 decimals (xxx.xx format)
    const quantity = 1 + rng.next() * 4; // 1-5 units (reduced for smaller volume)
    const notional = price * quantity;

    // Fee calculation
    const feeRate = isMaker ? BASE_FEE_RATE * 0.5 : BASE_FEE_RATE;
    const totalFee = notional * feeRate;
    const protocolFee = totalFee * 0.75;
    const networkFee = totalFee * 0.25;

    const feeBreakdown: FeeComposition[] = [
        {
            type: isMaker ? 'Protocol (Maker)' : 'Protocol (Taker)',
            amount: protocolFee,
            percent: 75,
        },
        {
            type: 'Network',
            amount: networkFee,
            percent: 25,
        },
    ];

    // PnL calculation (capped at $1500 profit for realistic daily trading)
    const isWin = rng.next() < WIN_RATE;
    const pnlPercent = isWin
        ? 0.30 + rng.next() * 0.50 // 30-80% profit (increased significantly)
        : -(0.01 + rng.next() * 0.12); // 1-13% loss
    const rawPnl = notional * pnlPercent;

    // Cap profits at $1500 and losses at $600
    const pnl = isWin ? Math.min(rawPnl, 1500) : Math.max(rawPnl, -600);

    // Duration (5 minutes to 24 hours)
    const durationSeconds = Math.floor(300 + rng.next() * 86100);
    const closedAt = new Date(timestamp.getTime() + durationSeconds * 1000);

    // Leverage fields (for perpetuals only)
    let leverage: number | undefined;
    let liquidationPrice: number | undefined;
    let marginUsed: number | undefined;

    if (isPerp) {
        const leverageData = weightedRandom(LEVERAGE_DISTRIBUTION, rng);
        leverage = leverageData.leverage;
        marginUsed = notional / leverage;

        // Calculate liquidation price (simplified)
        const liquidationDistance = 1 / leverage;
        liquidationPrice = side === 'long'
            ? price * (1 - liquidationDistance * 0.9)
            : price * (1 + liquidationDistance * 0.9);
    }

    return {
        id: `mock-${index}-${timestamp.getTime()}`,
        symbol,
        quoteCurrency: 'USDC',
        side,
        orderType,
        quantity,
        price,
        notional,
        pnl,
        fee: totalFee,
        feeCurrency: 'USDC',
        openedAt: timestamp,
        closedAt,
        durationSeconds,
        isWin,
        txSignature: `mock-tx-${index}-${rng.nextInt(100000, 999999)}`,
        feeBreakdown,
        isMaker,
        leverage,
        liquidationPrice,
        marginUsed,
    };
}

/**
 * Get base price for a token (for realistic mock data)
 */
function getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
        'SOL-USDC': 100,
        'BTC-USDC': 45000,
        'ETH-USDC': 2500,
        'JUP-USDC': 0.75,
        'JTO-USDC': 2.5,
        'BONK-USDC': 0.000025,
        'WIF-USDC': 1.8,
        'RNDR-USDC': 7.5,
    };
    return prices[symbol] || 1;
}

/**
 * Generate mock trades
 */
export function generateMockTrades(): Trade[] {
    const trades: Trade[] = [];
    const rng = new SeededRandom(SEED);

    // Use a fixed base date for deterministic generation (Feb 10, 2026)
    const baseDate = new Date('2026-02-10T12:00:00Z');

    for (let i = 0; i < TRADE_COUNT; i++) {
        // Distribute trades over the history period
        const daysAgo = rng.nextInt(0, HISTORY_DAYS - 1);
        const timestamp = subDays(baseDate, daysAgo);

        // Random time of day
        timestamp.setHours(rng.nextInt(0, 23));
        timestamp.setMinutes(rng.nextInt(0, 59));

        trades.push(generateTrade(i, timestamp, rng));
    }

    // Sort by date (oldest first)
    return trades.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());
}

/**
 * Calculate daily PnL
 */
export function calculateDailyPnL(trades: Trade[]): DailyPnL[] {
    const dailyMap = new Map<string, DailyPnL>();

    trades.forEach(trade => {
        const dateKey = format(startOfDay(trade.closedAt), 'yyyy-MM-dd');

        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                date: dateKey,
                pnl: 0,
                trades: 0,
                wins: 0,
                losses: 0,
            });
        }

        const daily = dailyMap.get(dateKey)!;
        daily.pnl += trade.pnl;
        daily.trades += 1;
        if (trade.isWin) daily.wins += 1;
        else daily.losses += 1;
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate session performance (morning, afternoon, evening, night)
 */
export function calculateSessionPerformance(trades: Trade[]): SessionBucket[] {
    const sessions: Record<string, { pnl: number; trades: number; wins: number }> = {
        morning: { pnl: 0, trades: 0, wins: 0 },
        afternoon: { pnl: 0, trades: 0, wins: 0 },
        evening: { pnl: 0, trades: 0, wins: 0 },
        night: { pnl: 0, trades: 0, wins: 0 },
    };

    trades.forEach(trade => {
        const hour = trade.closedAt.getHours();
        let session: 'morning' | 'afternoon' | 'evening' | 'night';

        if (hour >= 6 && hour < 12) session = 'morning';
        else if (hour >= 12 && hour < 18) session = 'afternoon';
        else if (hour >= 18 && hour < 22) session = 'evening';
        else session = 'night';

        sessions[session].pnl += trade.pnl;
        sessions[session].trades += 1;
        if (trade.isWin) sessions[session].wins += 1;
    });

    return Object.entries(sessions).map(([session, data]) => ({
        session: session as 'morning' | 'afternoon' | 'evening' | 'night',
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? data.wins / data.trades : 0,
    }));
}

/**
 * Calculate time of day performance (hourly)
 */
export function calculateTimeOfDayPerformance(trades: Trade[]): TimeOfDayBucket[] {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        pnl: 0,
        trades: 0,
        wins: 0,
    }));

    trades.forEach(trade => {
        const hour = trade.closedAt.getHours();
        hourly[hour].pnl += trade.pnl;
        hourly[hour].trades += 1;
        if (trade.isWin) hourly[hour].wins += 1;
    });

    return hourly.map(data => ({
        hour: data.hour,
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? data.wins / data.trades : 0,
    }));
}

/**
 * Calculate fee breakdown
 */
export function calculateFeeBreakdown(trades: Trade[]): FeeComposition[] {
    const protocolMaker = trades
        .filter(t => t.isMaker)
        .reduce((sum, t) => sum + (t.feeBreakdown?.[0]?.amount || 0), 0);

    const protocolTaker = trades
        .filter(t => !t.isMaker)
        .reduce((sum, t) => sum + (t.feeBreakdown?.[0]?.amount || 0), 0);

    const network = trades
        .reduce((sum, t) => sum + (t.feeBreakdown?.[1]?.amount || 0), 0);

    const total = protocolMaker + protocolTaker + network;

    return [
        {
            type: 'Protocol (Maker)',
            amount: protocolMaker,
            percent: total > 0 ? (protocolMaker / total) * 100 : 0,
        },
        {
            type: 'Protocol (Taker)',
            amount: protocolTaker,
            percent: total > 0 ? (protocolTaker / total) * 100 : 0,
        },
        {
            type: 'Network',
            amount: network,
            percent: total > 0 ? (network / total) * 100 : 0,
        },
    ];
}

/**
 * Calculate average leverage
 */
export function calculateAverageLeverage(trades: Trade[]): number {
    const perpTrades = trades.filter(t => t.leverage !== undefined);
    if (perpTrades.length === 0) return 1;

    const totalLeverage = perpTrades.reduce((sum, t) => sum + (t.leverage || 1), 0);
    return totalLeverage / perpTrades.length;
}

/**
 * Calculate leverage vs win rate
 */
export function calculateLeverageVsWinRate(trades: Trade[]): Array<{ leverage: number; winRate: number; trades: number }> {
    const leverageMap = new Map<number, { wins: number; total: number }>();

    trades
        .filter(t => t.leverage !== undefined)
        .forEach(trade => {
            const lev = trade.leverage!;
            if (!leverageMap.has(lev)) {
                leverageMap.set(lev, { wins: 0, total: 0 });
            }
            const data = leverageMap.get(lev)!;
            data.total += 1;
            if (trade.isWin) data.wins += 1;
        });

    return Array.from(leverageMap.entries())
        .map(([leverage, data]) => ({
            leverage,
            winRate: data.total > 0 ? data.wins / data.total : 0,
            trades: data.total,
        }))
        .sort((a, b) => a.leverage - b.leverage);
}

// Generate and export mock trades
export const MOCK_TRADES = generateMockTrades();

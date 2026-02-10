/**
 * Trade filtering and analytics helper functions
 */

import { Trade } from './types';
import {
    isToday,
    isYesterday,
    isThisWeek,
    isThisMonth,
    isThisYear,
    subDays,
    isSameDay,
    startOfDay,
    endOfDay
} from 'date-fns';

export type FilterType = 'All' | 'Yesterday' | 'Today' | 'This Week' | 'This Month' | 'This Year';

/**
 * Filter trades by date range
 */
export function filterTradesByDate(trades: Trade[], filter: FilterType): Trade[] {
    switch (filter) {
        case 'Today':
            return trades.filter(t => isToday(t.closedAt));

        case 'Yesterday':
            return trades.filter(t => isYesterday(t.closedAt));

        case 'This Week':
            return trades.filter(t => isThisWeek(t.closedAt, { weekStartsOn: 1 }));

        case 'This Month':
            return trades.filter(t => isThisMonth(t.closedAt));

        case 'This Year':
            return trades.filter(t => isThisYear(t.closedAt));

        case 'All':
        default:
            return trades;
    }
}

/**
 * Get previous period trades for comparison
 */
export function getPreviousPeriodTrades(trades: Trade[], filter: FilterType): Trade[] {
    const now = new Date();

    switch (filter) {
        case 'Today': {
            const yesterday = subDays(now, 1);
            return trades.filter(t => isSameDay(t.closedAt, yesterday));
        }

        case 'Yesterday': {
            const twoDaysAgo = subDays(now, 2);
            return trades.filter(t => isSameDay(t.closedAt, twoDaysAgo));
        }

        case 'This Week': {
            // Previous 7 days before this week
            const weekStart = subDays(now, 14);
            const weekEnd = subDays(now, 7);
            return trades.filter(t =>
                t.closedAt >= startOfDay(weekStart) &&
                t.closedAt <= endOfDay(weekEnd)
            );
        }

        case 'This Month': {
            // Previous 30 days before this month
            const monthStart = subDays(now, 60);
            const monthEnd = subDays(now, 30);
            return trades.filter(t =>
                t.closedAt >= startOfDay(monthStart) &&
                t.closedAt <= endOfDay(monthEnd)
            );
        }

        case 'This Year': {
            // Previous 365 days before this year
            const yearStart = subDays(now, 730);
            const yearEnd = subDays(now, 365);
            return trades.filter(t =>
                t.closedAt >= startOfDay(yearStart) &&
                t.closedAt <= endOfDay(yearEnd)
            );
        }

        default:
            return [];
    }
}

/**
 * Calculate win rate stats
 */
export function calculateWinRate(trades: Trade[]) {
    if (trades.length === 0) {
        return { winRate: '0', wins: 0, losses: 0 };
    }

    const wins = trades.filter(t => t.isWin).length;
    const losses = trades.length - wins;
    const winRate = ((wins / trades.length) * 100).toFixed(1);

    return { winRate, wins, losses };
}

/**
 * Calculate average winning trade PnL
 */
export function calculateAvgWin(trades: Trade[]): number {
    const winningTrades = trades.filter(t => t.isWin);

    if (winningTrades.length === 0) return 0;

    const totalWinPnL = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    return totalWinPnL / winningTrades.length;
}

/**
 * Calculate average losing trade PnL
 */
export function calculateAvgLoss(trades: Trade[]): number {
    const losingTrades = trades.filter(t => t.pnl < 0);

    if (losingTrades.length === 0) return 0;

    const totalLossPnL = losingTrades.reduce((sum, t) => sum + t.pnl, 0);
    return totalLossPnL / losingTrades.length;
}

/**
 * Calculate trade streak for last 7 days
 * Returns a fixed pattern showing 5 out of 7 active days
 */
export function calculateTradeStreak(trades: Trade[]): boolean[] {
    // Fixed pattern: 5 active days out of 7 (true, true, false, true, true, true, false)
    return [true, true, false, true, true, true, false];
}

/**
 * Calculate total PnL
 */
export function calculateTotalPnL(trades: Trade[]): number {
    return trades.reduce((sum, t) => sum + t.pnl, 0);
}

/**
 * Calculate average PnL across all trades
 */
export function calculateAvgPnL(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalPnL = calculateTotalPnL(trades);
    return totalPnL / trades.length;
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(current: number, previous: number): string {
    if (previous === 0) return current >= 0 ? '+100.0%' : '-100.0%';

    const change = ((current - previous) / Math.abs(previous)) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
}

/**
 * Calculate total trading volume (sum of all notional values)
 */
export function calculateTradingVolume(trades: Trade[]): number {
    return trades.reduce((sum, t) => sum + t.notional, 0);
}

/**
 * Format large numbers with K/M abbreviations for compact display
 * Examples: $1,234 → $1.23K, $1,234,567 → $1.23M
 */
export function formatCompactNumber(value: number): string {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '' : '-';

    if (absValue >= 1_000_000) {
        // Millions
        return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
    } else if (absValue >= 1_000) {
        // Thousands
        return `${sign}$${(absValue / 1_000).toFixed(2)}K`;
    } else {
        // Less than 1000, show full value
        return `${sign}$${absValue.toFixed(2)}`;
    }
}

/**
 * Calculate Long/Short ratio from perpetual trades
 * Returns percentage of long positions
 */
export function calculateLongShortRatio(trades: Trade[]): { longPercent: number; shortPercent: number; longCount: number; shortCount: number } {
    // Filter only perpetual trades (they have side: 'long' or 'short')
    const perpTrades = trades.filter(t => t.side === 'long' || t.side === 'short');

    if (perpTrades.length === 0) {
        return { longPercent: 50, shortPercent: 50, longCount: 0, shortCount: 0 };
    }

    const longCount = perpTrades.filter(t => t.side === 'long').length;
    const shortCount = perpTrades.filter(t => t.side === 'short').length;

    const longPercent = Math.round((longCount / perpTrades.length) * 100);
    const shortPercent = 100 - longPercent;

    return { longPercent, shortPercent, longCount, shortCount };
}

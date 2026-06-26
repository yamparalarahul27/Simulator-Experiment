/**
 * futuresWallet.ts — Pure calculation layer for the Futures Wallet sandbox.
 *
 * Models a futures account that can hold multiple positions in two margin
 * modes:
 *
 *   - ISOLATED: each position locks its own margin. Loss is capped at that
 *     margin; the position liquidates on its own at a fixed liquidation price.
 *     The rest of the wallet is never touched.
 *
 *   - CROSS: all cross positions share the wallet's cross collateral pool.
 *     A losing cross position draws on free balance and on the unrealized
 *     PnL of other cross positions. Liquidation happens at the ACCOUNT level
 *     when cross equity falls to (or below) total cross maintenance margin.
 *
 * All functions here are pure and unit-testable (see futuresWallet.test.ts).
 * Liquidation-price formula is kept consistent with the existing single
 * LiquidationSimulator: Long = E·(1 − 1/L + MMR), Short = E·(1 + 1/L − MMR).
 */

export type DemoToken = 'SOL' | 'BTC' | 'ETH' | 'JUP' | 'BONK' | 'XRP';
export type PositionSide = 'long' | 'short';
export type MarginMode = 'cross' | 'isolated';

export interface Position {
    id: string;
    token: DemoToken;
    side: PositionSide;
    marginMode: MarginMode;
    quantity: number;     // token units
    entryPrice: number;   // captured at open
    leverage: number;     // e.g. 10 = 10x
    mmr: number;          // maintenance margin rate as a fraction, e.g. 0.005 = 0.5%
}

export type LiqStatus = 'safe' | 'ok' | 'warning' | 'negative' | 'liquidated';

// ─── Per-position primitives ──────────────────────────────────────────────

/** Margin reserved when the position is opened (entry notional / leverage). */
export function initialMargin(p: Pick<Position, 'quantity' | 'entryPrice' | 'leverage'>): number {
    return (p.quantity * p.entryPrice) / p.leverage;
}

/** Unrealized PnL of a position at a given mark price. */
export function positionPnl(p: Pick<Position, 'side' | 'quantity' | 'entryPrice'>, markPrice: number): number {
    return p.side === 'long'
        ? p.quantity * (markPrice - p.entryPrice)
        : p.quantity * (p.entryPrice - markPrice);
}

/** Maintenance margin required to keep the position open, on current notional. */
export function maintenanceMargin(p: Pick<Position, 'quantity' | 'mmr'>, markPrice: number): number {
    return p.quantity * markPrice * p.mmr;
}

/** Fixed liquidation price for an ISOLATED position (own margin only). */
export function isolatedLiqPrice(p: Pick<Position, 'entryPrice' | 'leverage' | 'mmr' | 'side'>): number {
    if (p.side === 'long') {
        return p.entryPrice * (1 - 1 / p.leverage + p.mmr);
    }
    return p.entryPrice * (1 + 1 / p.leverage - p.mmr);
}

/** Return on equity (PnL relative to the margin put up), as a percentage. */
export function returnOnEquity(pnl: number, margin: number): number {
    return margin > 0 ? (pnl / margin) * 100 : 0;
}

/**
 * How far price has travelled from entry toward the liquidation price, 0–100%.
 * 0 = at entry (or moving into profit), 100 = at/through liquidation.
 */
export function distanceConsumed(entry: number, mark: number, liq: number, side: PositionSide): number {
    const total = Math.abs(entry - liq);
    if (total === 0) return 100;
    const consumed = side === 'long' ? Math.max(0, entry - mark) : Math.max(0, mark - entry);
    return Math.min(100, (consumed / total) * 100);
}

export function statusFromConsumed(consumed: number): LiqStatus {
    if (consumed >= 100) return 'liquidated';
    if (consumed >= 75) return 'negative';
    if (consumed >= 50) return 'warning';
    if (consumed >= 25) return 'ok';
    return 'safe';
}

/** Map an account/cross margin ratio (maint ÷ equity, 0–1+) to a status. */
export function statusFromMarginRatio(ratio: number): LiqStatus {
    if (ratio >= 1) return 'liquidated';
    if (ratio >= 0.85) return 'negative';
    if (ratio >= 0.6) return 'warning';
    if (ratio >= 0.35) return 'ok';
    return 'safe';
}

// ─── Account-level aggregation ────────────────────────────────────────────

export interface PositionView {
    position: Position;
    markPrice: number;
    notional: number;
    initialMargin: number;
    pnl: number;
    roe: number;
    maintenanceMargin: number;
    /** Isolated only: equity backing this position (margin + pnl, floored at 0). */
    isolatedEquity: number | null;
    /** Isolated only: fixed liquidation price. */
    liqPrice: number | null;
    consumed: number;
    status: LiqStatus;
    liquidated: boolean;
}

export interface WalletSummary {
    walletBalance: number;          // total deposited
    isolatedMarginLocked: number;   // sum of isolated initial margins
    crossInitialMargin: number;     // sum of cross initial margins (reserved)
    freeBalance: number;            // funds not reserved by any position
    totalUnrealizedPnl: number;     // across all live positions
    totalEquity: number;            // balance + total uPnL (loss capped per isolated)

    // Cross account
    crossCollateral: number;        // wallet portion backing cross positions
    crossEquity: number;            // crossCollateral + cross uPnL
    crossMaintenanceMargin: number; // sum of cross maintenance margins
    crossMarginRatio: number;       // maint ÷ equity (>= 1 => account liquidation)
    crossStatus: LiqStatus;
    crossLiquidated: boolean;
    hasCross: boolean;
}

/** Build a per-position view at the given (possibly simulated) mark prices. */
export function buildPositionView(p: Position, markPrices: Record<string, number>): PositionView {
    const markPrice = markPrices[p.token] ?? p.entryPrice;
    const im = initialMargin(p);
    const pnl = positionPnl(p, markPrice);
    const mm = maintenanceMargin(p, markPrice);
    const notional = p.quantity * markPrice;
    const roe = returnOnEquity(pnl, im);

    if (p.marginMode === 'isolated') {
        const liqPrice = isolatedLiqPrice(p);
        const consumed = distanceConsumed(p.entryPrice, markPrice, liqPrice, p.side);
        const equity = Math.max(0, im + pnl);
        const status = statusFromConsumed(consumed);
        return {
            position: p, markPrice, notional, initialMargin: im, pnl, roe,
            maintenanceMargin: mm, isolatedEquity: equity, liqPrice,
            consumed, status, liquidated: consumed >= 100,
        };
    }

    // Cross: per-position status is reported by the account, but we still show
    // a per-position consumed bar relative to its own initial margin so the
    // user sees each position's contribution to account stress.
    const consumed = im > 0 ? Math.min(100, Math.max(0, (-pnl / im) * 100)) : 0;
    return {
        position: p, markPrice, notional, initialMargin: im, pnl, roe,
        maintenanceMargin: mm, isolatedEquity: null, liqPrice: null,
        consumed, status: statusFromConsumed(consumed), liquidated: false,
    };
}

export function buildWalletSummary(
    walletBalance: number,
    positions: Position[],
    markPrices: Record<string, number>,
): WalletSummary {
    const views = positions.map(p => buildPositionView(p, markPrices));

    const isolated = views.filter(v => v.position.marginMode === 'isolated');
    const cross = views.filter(v => v.position.marginMode === 'cross');

    const isolatedMarginLocked = isolated.reduce((s, v) => s + v.initialMargin, 0);
    const crossInitialMargin = cross.reduce((s, v) => s + v.initialMargin, 0);
    const freeBalance = Math.max(0, walletBalance - isolatedMarginLocked - crossInitialMargin);

    // Isolated PnL is floored at -margin (you can't lose more than the margin).
    const isolatedPnl = isolated.reduce((s, v) => s + Math.max(v.pnl, -v.initialMargin), 0);
    const crossPnl = cross.reduce((s, v) => s + v.pnl, 0);
    const totalUnrealizedPnl = isolatedPnl + crossPnl;
    const totalEquity = walletBalance + totalUnrealizedPnl;

    // Cross collateral = everything in the wallet not carved out by isolated margin.
    const crossCollateral = Math.max(0, walletBalance - isolatedMarginLocked);
    const crossEquity = crossCollateral + crossPnl;
    const crossMaintenanceMargin = cross.reduce((s, v) => s + v.maintenanceMargin, 0);
    const crossMarginRatio = crossEquity > 0 ? crossMaintenanceMargin / crossEquity : (crossMaintenanceMargin > 0 ? 1 : 0);
    const hasCross = cross.length > 0;
    const crossStatus = hasCross ? statusFromMarginRatio(crossMarginRatio) : 'safe';

    return {
        walletBalance,
        isolatedMarginLocked,
        crossInitialMargin,
        freeBalance,
        totalUnrealizedPnl,
        totalEquity,
        crossCollateral,
        crossEquity,
        crossMaintenanceMargin,
        crossMarginRatio,
        crossStatus,
        crossLiquidated: hasCross && crossMarginRatio >= 1,
        hasCross,
    };
}

/** Margin needed to open a prospective position (for affordability checks). */
export function requiredMargin(quantity: number, price: number, leverage: number): number {
    return leverage > 0 ? (quantity * price) / leverage : 0;
}

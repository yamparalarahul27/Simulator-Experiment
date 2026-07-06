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
    /** Isolated only: margin added on top of the initial margin (moves the liq price). */
    extraMargin?: number;
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

/** Total margin backing an isolated position: initial + anything added later. */
export function positionMargin(p: Pick<Position, 'quantity' | 'entryPrice' | 'leverage' | 'extraMargin'>): number {
    return initialMargin(p) + (p.extraMargin ?? 0);
}

/**
 * Isolated liquidation price generalized for added margin. Liquidation happens
 * when margin + uPnL = maintenance margin (maintenance taken at entry, which
 * keeps this exactly equal to `isolatedLiqPrice` when extraMargin is 0):
 *
 *   Long:  liq = entry − (margin − qty·entry·mmr) ÷ qty
 *   Short: liq = entry + (margin − qty·entry·mmr) ÷ qty
 */
export function isolatedLiqPriceWithMargin(
    p: Pick<Position, 'entryPrice' | 'leverage' | 'mmr' | 'side' | 'quantity' | 'extraMargin'>,
): number {
    if (p.quantity <= 0) return isolatedLiqPrice(p);
    const buffer = (positionMargin(p) - p.quantity * p.entryPrice * p.mmr) / p.quantity;
    return p.side === 'long'
        ? Math.max(0, p.entryPrice - buffer)
        : p.entryPrice + buffer;
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
    /** Isolated: initial + added margin. Cross: same as initialMargin. */
    totalMargin: number;
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

    if (p.marginMode === 'isolated') {
        const margin = positionMargin(p);
        const liqPrice = isolatedLiqPriceWithMargin(p);
        const consumed = distanceConsumed(p.entryPrice, markPrice, liqPrice, p.side);
        const equity = Math.max(0, margin + pnl);
        const status = statusFromConsumed(consumed);
        return {
            position: p, markPrice, notional, initialMargin: im, totalMargin: margin,
            pnl, roe: returnOnEquity(pnl, margin),
            maintenanceMargin: mm, isolatedEquity: equity, liqPrice,
            consumed, status, liquidated: consumed >= 100,
        };
    }

    // Cross: per-position status is reported by the account, but we still show
    // a per-position consumed bar relative to its own initial margin so the
    // user sees each position's contribution to account stress.
    const consumed = im > 0 ? Math.min(100, Math.max(0, (-pnl / im) * 100)) : 0;
    return {
        position: p, markPrice, notional, initialMargin: im, totalMargin: im,
        pnl, roe: returnOnEquity(pnl, im),
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

    const isolatedMarginLocked = isolated.reduce((s, v) => s + v.totalMargin, 0);
    const crossInitialMargin = cross.reduce((s, v) => s + v.initialMargin, 0);
    const freeBalance = Math.max(0, walletBalance - isolatedMarginLocked - crossInitialMargin);

    // Isolated PnL is floored at -margin (you can't lose more than the margin).
    const isolatedPnl = isolated.reduce((s, v) => s + Math.max(v.pnl, -v.totalMargin), 0);
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

// ─── Account state machine ────────────────────────────────────────────────
//
// Wraps balance + positions + an append-only ledger so that every balance
// change (fees, realized PnL, margin moves, liquidations) is recorded and
// auditable. All actions are pure: they take a state and return a new one.

export const DEFAULT_FEE_RATE = 0.0005; // 0.05% taker, applied on open & close notional

export type LedgerType =
    | 'deposit'
    | 'withdraw'
    | 'open'
    | 'close'
    | 'margin_add'
    | 'margin_remove'
    | 'isolated_liq'
    | 'cross_liq';

export interface LedgerEntry {
    id: number;
    type: LedgerType;
    token?: DemoToken;
    side?: PositionSide;
    marginMode?: MarginMode;
    quantity?: number;      // token units affected
    price?: number;         // execution / liquidation price
    realizedPnl?: number;   // PnL locked in by this event
    fee?: number;           // fee charged by this event
    /** e.g. close fraction (0–1), margin amount moved, positions wiped by cross liq */
    detail?: number;
    amount: number;         // signed wallet-balance delta
    balanceAfter: number;   // running balance after this event
}

export interface AccountState {
    balance: number;
    positions: Position[];
    ledger: LedgerEntry[];  // newest first
    feesPaid: number;       // cumulative
    realizedPnl: number;    // cumulative (excludes fees)
    nextId: number;
}

export function createAccount(balance: number): AccountState {
    return { balance, positions: [], ledger: [], feesPaid: 0, realizedPnl: 0, nextId: 1 };
}

function push(state: AccountState, entry: Omit<LedgerEntry, 'id' | 'balanceAfter'>, balance: number): AccountState {
    return {
        ...state,
        balance,
        ledger: [{ ...entry, id: state.nextId, balanceAfter: balance }, ...state.ledger],
        nextId: state.nextId + 1,
        feesPaid: state.feesPaid + (entry.fee ?? 0),
        realizedPnl: state.realizedPnl + (entry.realizedPnl ?? 0),
    };
}

/** Adjust the wallet balance directly (deposit if positive, withdraw if negative). */
export function adjustBalance(state: AccountState, delta: number): AccountState {
    if (delta === 0) return state;
    return push(
        state,
        { type: delta > 0 ? 'deposit' : 'withdraw', amount: delta },
        state.balance + delta,
    );
}

export interface OpenParams {
    token: DemoToken;
    side: PositionSide;
    marginMode: MarginMode;
    quantity: number;
    entryPrice: number;
    leverage: number;
    mmr: number; // fraction
}

/** Fee charged to open/close `quantity` at `price`. */
export function tradeFee(quantity: number, price: number, feeRate: number): number {
    return quantity * price * feeRate;
}

/**
 * Open a position: reserves margin (locked, not spent) and pays the open fee
 * from the wallet. Returns the unchanged state if it isn't affordable.
 */
export function openPosition(state: AccountState, params: OpenParams, feeRate: number): AccountState {
    const margin = requiredMargin(params.quantity, params.entryPrice, params.leverage);
    const fee = tradeFee(params.quantity, params.entryPrice, feeRate);
    const summary = buildWalletSummary(state.balance, state.positions, {});
    if (params.quantity <= 0 || params.entryPrice <= 0 || margin + fee > summary.freeBalance + 1e-9) {
        return state;
    }
    const position: Position = {
        id: `p${state.nextId}`,
        token: params.token,
        side: params.side,
        marginMode: params.marginMode,
        quantity: params.quantity,
        entryPrice: params.entryPrice,
        leverage: params.leverage,
        mmr: params.mmr,
        extraMargin: 0,
    };
    const next = push(
        state,
        {
            type: 'open',
            token: params.token,
            side: params.side,
            marginMode: params.marginMode,
            quantity: params.quantity,
            price: params.entryPrice,
            fee,
            amount: -fee,
        },
        state.balance - fee,
    );
    return { ...next, positions: [...next.positions, position] };
}

/**
 * Close `fraction` (0–1] of a position at the current mark price. Realizes
 * proportional PnL into the wallet and pays the close fee. Isolated losses are
 * floored at the margin backing the closed fraction.
 */
export function closePosition(
    state: AccountState,
    id: string,
    fraction: number,
    markPrices: Record<string, number>,
    feeRate: number,
): AccountState {
    const p = state.positions.find(x => x.id === id);
    if (!p || fraction <= 0) return state;
    const f = Math.min(1, fraction);
    const markPrice = markPrices[p.token] ?? p.entryPrice;
    const closeQty = p.quantity * f;

    let realized = positionPnl({ ...p, quantity: closeQty }, markPrice);
    if (p.marginMode === 'isolated') {
        realized = Math.max(realized, -positionMargin(p) * f);
    }
    const fee = tradeFee(closeQty, markPrice, feeRate);

    const positions = f >= 1 - 1e-9
        ? state.positions.filter(x => x.id !== id)
        : state.positions.map(x =>
            x.id === id
                ? { ...x, quantity: x.quantity * (1 - f), extraMargin: (x.extraMargin ?? 0) * (1 - f) }
                : x,
        );

    const next = push(
        state,
        {
            type: 'close',
            token: p.token,
            side: p.side,
            marginMode: p.marginMode,
            quantity: closeQty,
            price: markPrice,
            realizedPnl: realized,
            fee,
            detail: f,
            amount: realized - fee,
        },
        state.balance + realized - fee,
    );
    return { ...next, positions };
}

/**
 * Add or remove margin on an ISOLATED position (moves its liquidation price).
 * Margin is locked, not spent, so the wallet balance is unchanged — but adding
 * requires free balance, and removal is capped at what was previously added.
 */
export function adjustPositionMargin(
    state: AccountState,
    id: string,
    delta: number,
    markPrices: Record<string, number>,
): AccountState {
    const p = state.positions.find(x => x.id === id);
    if (!p || p.marginMode !== 'isolated' || delta === 0) return state;

    if (delta > 0) {
        const summary = buildWalletSummary(state.balance, state.positions, markPrices);
        if (delta > summary.freeBalance + 1e-9) return state;
    } else if (-delta > (p.extraMargin ?? 0) + 1e-9) {
        return state;
    }

    const updated = { ...p, extraMargin: (p.extraMargin ?? 0) + delta };
    const next = push(
        state,
        {
            type: delta > 0 ? 'margin_add' : 'margin_remove',
            token: p.token,
            side: p.side,
            marginMode: 'isolated',
            price: isolatedLiqPriceWithMargin(updated),
            detail: Math.abs(delta),
            amount: 0,
        },
        state.balance,
    );
    return { ...next, positions: next.positions.map(x => (x.id === id ? updated : x)) };
}

/**
 * Detect and settle liquidations at the given mark prices. Liquidation latches:
 * positions are removed and margin/collateral is deducted from the wallet.
 *
 *   - Isolated: each breached position is removed and its full margin is lost.
 *   - Cross: if cross equity ≤ cross maintenance margin, ALL cross positions
 *     are removed and the entire cross collateral is lost. Isolated positions
 *     (and their locked margin) survive.
 *
 * Returns the same state reference when nothing liquidates (safe for effects).
 */
export function settleLiquidations(state: AccountState, markPrices: Record<string, number>): AccountState {
    let next = state;

    // Isolated first — their margin leaving the wallet also shrinks cross collateral.
    for (const p of state.positions) {
        if (p.marginMode !== 'isolated') continue;
        const view = buildPositionView(p, markPrices);
        if (!view.liquidated) continue;
        const lost = positionMargin(p);
        next = push(
            next,
            {
                type: 'isolated_liq',
                token: p.token,
                side: p.side,
                marginMode: 'isolated',
                quantity: p.quantity,
                price: view.liqPrice ?? view.markPrice,
                realizedPnl: -lost,
                amount: -lost,
            },
            next.balance - lost,
        );
        next = { ...next, positions: next.positions.filter(x => x.id !== p.id) };
    }

    // Then the cross account, evaluated on whatever survived.
    const summary = buildWalletSummary(next.balance, next.positions, markPrices);
    if (summary.crossLiquidated) {
        const lost = summary.crossCollateral;
        const wiped = next.positions.filter(x => x.marginMode === 'cross').length;
        next = push(
            next,
            {
                type: 'cross_liq',
                realizedPnl: -lost,
                detail: wiped,
                amount: -lost,
            },
            next.balance - lost,
        );
        next = { ...next, positions: next.positions.filter(x => x.marginMode !== 'cross') };
    }

    return next;
}

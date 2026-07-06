import { describe, it, expect } from 'vitest';
import {
    initialMargin,
    positionPnl,
    isolatedLiqPrice,
    isolatedLiqPriceWithMargin,
    buildWalletSummary,
    createAccount,
    openPosition,
    closePosition,
    adjustBalance,
    adjustPositionMargin,
    settleLiquidations,
    type AccountState,
    type OpenParams,
    type Position,
} from './futuresWallet';

const base: Omit<Position, 'id' | 'token' | 'marginMode' | 'side'> = {
    quantity: 100,
    entryPrice: 2,
    leverage: 10,
    mmr: 0.005,
};

function pos(over: Partial<Position>): Position {
    return { id: 'x', token: 'XRP', side: 'long', marginMode: 'isolated', ...base, ...over };
}

describe('per-position primitives', () => {
    it('initial margin = notional / leverage', () => {
        expect(initialMargin(pos({}))).toBeCloseTo(20); // 100 * 2 / 10
    });

    it('long pnl rises with price, short pnl falls', () => {
        expect(positionPnl(pos({ side: 'long' }), 2.2)).toBeCloseTo(20);
        expect(positionPnl(pos({ side: 'short' }), 2.2)).toBeCloseTo(-20);
    });

    it('isolated liq price uses E·(1 − 1/L + MMR) for long', () => {
        // 2 * (1 - 0.1 + 0.005) = 2 * 0.905 = 1.81
        expect(isolatedLiqPrice(pos({ side: 'long' }))).toBeCloseTo(1.81);
        // 2 * (1 + 0.1 - 0.005) = 2 * 1.095 = 2.19
        expect(isolatedLiqPrice(pos({ side: 'short' }))).toBeCloseTo(2.19);
    });
});

describe('wallet summary — isolated loss is capped, wallet protected', () => {
    it('isolated position cannot drag down free balance beyond its margin', () => {
        const w = buildWalletSummary(10_000, [pos({ marginMode: 'isolated' })], { XRP: 0 });
        // price 0 => pnl = -200 but isolated margin only 20, so capped at -20
        expect(w.totalUnrealizedPnl).toBeCloseTo(-20);
        expect(w.totalEquity).toBeCloseTo(9_980);
        expect(w.isolatedMarginLocked).toBeCloseTo(20);
    });
});

describe('wallet summary — cross positions share collateral', () => {
    it('cross uPnL flows into account equity and margin ratio', () => {
        const positions = [
            pos({ id: 'a', marginMode: 'cross', side: 'long' }),
            pos({ id: 'b', marginMode: 'cross', side: 'long', quantity: 50 }),
        ];
        const w = buildWalletSummary(1_000, positions, { XRP: 1.8 });
        // pnl a: 100*(1.8-2) = -20; pnl b: 50*(1.8-2) = -10 => -30 total
        expect(w.totalUnrealizedPnl).toBeCloseTo(-30);
        expect(w.hasCross).toBe(true);
        // cross collateral = full wallet (no isolated) = 1000; equity = 970
        expect(w.crossEquity).toBeCloseTo(970);
        expect(w.crossMarginRatio).toBeGreaterThan(0);
        expect(w.crossMarginRatio).toBeLessThan(1);
    });

    it('account liquidates when cross equity falls to maintenance margin', () => {
        // Big leverage, tiny wallet => price drop wipes cross equity
        const positions = [pos({ id: 'a', marginMode: 'cross', side: 'long', leverage: 50, quantity: 1000 })];
        const w = buildWalletSummary(40, positions, { XRP: 1.9 });
        // pnl = 1000*(1.9-2) = -100; collateral 40 => equity -60 => liquidated
        expect(w.crossEquity).toBeLessThanOrEqual(w.crossMaintenanceMargin);
        expect(w.crossLiquidated).toBe(true);
        expect(w.crossStatus).toBe('liquidated');
    });
});

describe('free balance accounting', () => {
    it('reserves both isolated and cross initial margin', () => {
        const positions = [
            pos({ id: 'a', marginMode: 'isolated' }), // im 20
            pos({ id: 'b', marginMode: 'cross' }),    // im 20
        ];
        const w = buildWalletSummary(1_000, positions, { XRP: 2 });
        expect(w.isolatedMarginLocked).toBeCloseTo(20);
        expect(w.crossInitialMargin).toBeCloseTo(20);
        expect(w.freeBalance).toBeCloseTo(960);
    });

    it('added isolated margin is locked too', () => {
        const positions = [pos({ id: 'a', marginMode: 'isolated', extraMargin: 30 })];
        const w = buildWalletSummary(1_000, positions, { XRP: 2 });
        expect(w.isolatedMarginLocked).toBeCloseTo(50);
        expect(w.freeBalance).toBeCloseTo(950);
    });
});

describe('isolated liq price with added margin', () => {
    it('matches the classic formula when no margin is added', () => {
        expect(isolatedLiqPriceWithMargin(pos({ side: 'long' }))).toBeCloseTo(isolatedLiqPrice(pos({ side: 'long' })));
        expect(isolatedLiqPriceWithMargin(pos({ side: 'short' }))).toBeCloseTo(isolatedLiqPrice(pos({ side: 'short' })));
    });

    it('added margin pushes the liq price away from entry', () => {
        // extra 10 over qty 100 => liq moves 0.10 further away
        expect(isolatedLiqPriceWithMargin(pos({ side: 'long', extraMargin: 10 }))).toBeCloseTo(1.71);
        expect(isolatedLiqPriceWithMargin(pos({ side: 'short', extraMargin: 10 }))).toBeCloseTo(2.29);
    });
});

// ─── Account state machine ───────────────────────────────────

const FEE = 0.0005;
const openParams: OpenParams = {
    token: 'XRP',
    side: 'long',
    marginMode: 'isolated',
    quantity: 100,
    entryPrice: 2,
    leverage: 10,
    mmr: 0.005,
};

function openOne(over: Partial<OpenParams> = {}, balance = 10_000): AccountState {
    return openPosition(createAccount(balance), { ...openParams, ...over }, FEE);
}

describe('openPosition', () => {
    it('reserves margin and pays the open fee from the wallet', () => {
        const s = openOne();
        expect(s.positions).toHaveLength(1);
        expect(s.balance).toBeCloseTo(10_000 - 0.1); // fee = 200 * 0.0005
        expect(s.feesPaid).toBeCloseTo(0.1);
        expect(s.ledger[0].type).toBe('open');
        expect(s.ledger[0].balanceAfter).toBeCloseTo(s.balance);
    });

    it('rejects a position the free balance cannot cover (margin + fee)', () => {
        const s = openOne({}, 20); // margin 20 + fee 0.1 > 20
        expect(s.positions).toHaveLength(0);
        expect(s.balance).toBe(20);
    });
});

describe('closePosition', () => {
    it('realizes profit into the wallet minus the close fee', () => {
        const s = closePosition(openOne(), 'p1', 1, { XRP: 2.2 }, FEE);
        // pnl +20, close fee = 100 * 2.2 * 0.0005 = 0.11
        expect(s.positions).toHaveLength(0);
        expect(s.balance).toBeCloseTo(10_000 - 0.1 + 20 - 0.11);
        expect(s.realizedPnl).toBeCloseTo(20);
        expect(s.ledger[0].type).toBe('close');
    });

    it('partial close scales quantity and added margin proportionally', () => {
        let s = openOne();
        s = adjustPositionMargin(s, 'p1', 10, { XRP: 2 });
        s = closePosition(s, 'p1', 0.25, { XRP: 2.2 }, FEE);
        expect(s.positions[0].quantity).toBeCloseTo(75);
        expect(s.positions[0].extraMargin).toBeCloseTo(7.5);
        expect(s.realizedPnl).toBeCloseTo(5); // 25% of +20
    });

    it('isolated loss on close is floored at the margin backing the closed part', () => {
        const s = closePosition(openOne(), 'p1', 1, { XRP: 0.5 }, FEE);
        // raw pnl -150, floored at -margin (-20)
        expect(s.realizedPnl).toBeCloseTo(-20);
        expect(s.balance).toBeCloseTo(10_000 - 0.1 - 20 - 100 * 0.5 * FEE);
    });
});

describe('adjustPositionMargin', () => {
    it('adding margin locks free balance and moves the liq price', () => {
        const s = adjustPositionMargin(openOne(), 'p1', 10, { XRP: 2 });
        expect(s.positions[0].extraMargin).toBeCloseTo(10);
        expect(s.balance).toBeCloseTo(10_000 - 0.1); // locked, not spent
        const w = buildWalletSummary(s.balance, s.positions, { XRP: 2 });
        expect(w.isolatedMarginLocked).toBeCloseTo(30);
        expect(s.ledger[0].type).toBe('margin_add');
    });

    it('removal is capped at previously added margin', () => {
        let s = adjustPositionMargin(openOne(), 'p1', 10, { XRP: 2 });
        s = adjustPositionMargin(s, 'p1', -15, { XRP: 2 }); // more than added — rejected
        expect(s.positions[0].extraMargin).toBeCloseTo(10);
        s = adjustPositionMargin(s, 'p1', -10, { XRP: 2 });
        expect(s.positions[0].extraMargin).toBeCloseTo(0);
    });

    it('ignores cross positions', () => {
        const s = adjustPositionMargin(openOne({ marginMode: 'cross' }), 'p1', 10, { XRP: 2 });
        expect(s.positions[0].extraMargin).toBeCloseTo(0);
    });
});

describe('settleLiquidations', () => {
    it('returns the same reference when nothing liquidates', () => {
        const s = openOne();
        expect(settleLiquidations(s, { XRP: 2 })).toBe(s);
    });

    it('isolated liquidation removes the position and forfeits its margin', () => {
        const s = settleLiquidations(openOne(), { XRP: 1.5 }); // liq at 1.81
        expect(s.positions).toHaveLength(0);
        expect(s.balance).toBeCloseTo(10_000 - 0.1 - 20);
        expect(s.ledger[0].type).toBe('isolated_liq');
        expect(s.ledger[0].price).toBeCloseTo(1.81); // records the liq line, not the mark
    });

    it('cross liquidation wipes cross collateral but isolated margin survives', () => {
        let s = createAccount(100);
        s = openPosition(s, { ...openParams, marginMode: 'isolated', quantity: 10 }, FEE);  // margin 2
        s = openPosition(s, { ...openParams, marginMode: 'cross', quantity: 1000, leverage: 50 }, FEE);
        s = settleLiquidations(s, { XRP: 1.9 }); // cross pnl -100 vs tiny collateral
        expect(s.positions).toHaveLength(1);
        expect(s.positions[0].marginMode).toBe('isolated');
        const w = buildWalletSummary(s.balance, s.positions, { XRP: 1.9 });
        // everything except the isolated locked margin is gone
        expect(s.balance).toBeCloseTo(w.isolatedMarginLocked);
        expect(s.ledger[0].type).toBe('cross_liq');
    });
});

describe('adjustBalance ledger', () => {
    it('records deposits and withdrawals with a running balance', () => {
        let s = createAccount(1_000);
        s = adjustBalance(s, 500);
        s = adjustBalance(s, -200);
        expect(s.balance).toBe(1_300);
        expect(s.ledger.map(e => e.type)).toEqual(['withdraw', 'deposit']);
        expect(s.ledger[0].balanceAfter).toBe(1_300);
        expect(s.ledger[1].balanceAfter).toBe(1_500);
    });
});

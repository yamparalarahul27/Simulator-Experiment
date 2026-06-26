import { describe, it, expect } from 'vitest';
import {
    initialMargin,
    positionPnl,
    isolatedLiqPrice,
    buildWalletSummary,
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
});

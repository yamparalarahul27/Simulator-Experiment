import { describe, it, expect } from 'vitest';
import { computeOneWay, computeHedge, unrealizedPnl, type NetOrder } from './positionNetting';

function order(over: Partial<NetOrder> & Pick<NetOrder, 'side' | 'quantity' | 'entryPrice'>): NetOrder {
    return { id: over.id ?? `${over.side}-${over.quantity}`, tp: null, sl: null, ...over };
}

describe('one-way netting — reduce', () => {
    it('Long 20 + Short 10 → Net Long 10, realizes PnL on the 10 closed', () => {
        const r = computeOneWay([
            order({ id: 'a', side: 'long', quantity: 20, entryPrice: 1.0, tp: 1.2, sl: 0.9 }),
            order({ id: 'b', side: 'short', quantity: 10, entryPrice: 1.1 }),
        ]);
        expect(r.netSide).toBe('long');
        expect(r.netQty).toBe(10);
        expect(r.avgEntry).toBeCloseTo(1.0);
        // closing 10 of a long bought at 1.0, sold at 1.1 => +1.0
        expect(r.realizedPnl).toBeCloseTo(1.0);
        // long's TP/SL survive as the position TP/SL
        expect(r.positionTp).toBe(1.2);
        expect(r.positionSl).toBe(0.9);
        expect(r.positionTpOrderId).toBe('a');
        // short order's TP/SL (none) cancelled/dropped
        expect(r.statuses.find(s => s.orderId === 'b')?.tp).toBe('none');
        expect(r.statuses.find(s => s.orderId === 'a')?.tp).toBe('active');
    });
});

describe('one-way netting — flip', () => {
    it('Long 30 + Short 40 → Net Short 10, long TP/SL cancelled', () => {
        const r = computeOneWay([
            order({ id: 'a', side: 'long', quantity: 30, entryPrice: 1.0, tp: 1.3, sl: 0.8 }),
            order({ id: 'b', side: 'short', quantity: 40, entryPrice: 1.05, tp: 0.9, sl: 1.2 }),
        ]);
        expect(r.netSide).toBe('short');
        expect(r.netQty).toBe(10);
        expect(r.avgEntry).toBeCloseTo(1.05); // new short opened at short's price
        // realized closing 30 long from 1.0 -> 1.05 = +1.5
        expect(r.realizedPnl).toBeCloseTo(1.5);
        // position TP/SL now come from the short order
        expect(r.positionTp).toBe(0.9);
        expect(r.positionSl).toBe(1.2);
        // long order's TP/SL cancelled by the flip
        const a = r.statuses.find(s => s.orderId === 'a');
        expect(a?.tp).toBe('cancelled');
        expect(a?.sl).toBe('cancelled');
        // flip step is described
        expect(r.steps[1].effect).toMatch(/flip/i);
    });
});

describe('one-way netting — reduce with only the long carrying TP/SL', () => {
    it('Long 20 (TP/SL) + Short 10 → Net Long 10, keeps long TP/SL', () => {
        const r = computeOneWay([
            order({ id: 'a', side: 'long', quantity: 20, entryPrice: 2.0, tp: 2.5, sl: 1.8 }),
            order({ id: 'b', side: 'short', quantity: 10, entryPrice: 2.1 }),
        ]);
        expect(r.netSide).toBe('long');
        expect(r.netQty).toBe(10);
        expect(r.positionTp).toBe(2.5);
        expect(r.positionSl).toBe(1.8);
        expect(r.statuses.find(s => s.orderId === 'a')?.note).toMatch(/net position TP\/SL/i);
    });
});

describe('one-way netting — exact close and superseded TP', () => {
    it('Long 10 + Long 10 (both TP) → later TP wins, earlier superseded', () => {
        const r = computeOneWay([
            order({ id: 'a', side: 'long', quantity: 10, entryPrice: 1.0, tp: 1.5 }),
            order({ id: 'b', side: 'long', quantity: 10, entryPrice: 1.2, tp: 1.6 }),
        ]);
        expect(r.netQty).toBe(20);
        expect(r.avgEntry).toBeCloseTo(1.1);
        expect(r.positionTp).toBe(1.6);
        expect(r.statuses.find(s => s.orderId === 'a')?.tp).toBe('superseded');
        expect(r.statuses.find(s => s.orderId === 'b')?.tp).toBe('active');
    });

    it('Long 10 + Short 10 → flat, all TP/SL cancelled', () => {
        const r = computeOneWay([
            order({ id: 'a', side: 'long', quantity: 10, entryPrice: 1.0, tp: 1.5 }),
            order({ id: 'b', side: 'short', quantity: 10, entryPrice: 1.1 }),
        ]);
        expect(r.netSide).toBe('flat');
        expect(r.netQty).toBe(0);
        expect(r.realizedPnl).toBeCloseTo(1.0);
        expect(r.statuses.find(s => s.orderId === 'a')?.tp).toBe('cancelled');
    });
});

describe('hedge mode — both legs coexist', () => {
    it('Long 20 + Short 10 keeps both positions with their own TP/SL', () => {
        const r = computeHedge([
            order({ id: 'a', side: 'long', quantity: 20, entryPrice: 1.0, tp: 1.2, sl: 0.9 }),
            order({ id: 'b', side: 'short', quantity: 10, entryPrice: 1.1, tp: 0.95, sl: 1.25 }),
        ]);
        expect(r.long?.qty).toBe(20);
        expect(r.short?.qty).toBe(10);
        expect(r.long?.tp).toBe(1.2);
        expect(r.short?.tp).toBe(0.95);
        expect(r.netExposure).toBe(10);
        // both active, nothing cancelled
        expect(r.statuses.find(s => s.orderId === 'a')?.tp).toBe('active');
        expect(r.statuses.find(s => s.orderId === 'b')?.sl).toBe('active');
    });
});

describe('unrealizedPnl', () => {
    it('long gains as price rises, short gains as price falls', () => {
        expect(unrealizedPnl('long', 10, 1.0, 1.2)).toBeCloseTo(2.0);
        expect(unrealizedPnl('short', 10, 1.0, 0.8)).toBeCloseTo(2.0);
    });
});

/**
 * positionNetting.ts — Pure engine for position netting + TP/SL resolution.
 *
 * Models what happens when you place multiple Long/Short orders on ONE market
 * under two modes:
 *
 *   - ONE-WAY (netting): the market holds a single position. Opposing orders
 *     reduce it, and if they exceed it, flip the side. TP/SL is a property of
 *     the resulting net position (one TP, one SL). Orders on the losing side —
 *     including a flipped-away position — have their TP/SL cancelled.
 *
 *   - HEDGE: Long and Short are kept as two independent positions that do NOT
 *     net. Each side keeps its own position-level TP/SL and can trigger on its
 *     own. Net exposure (long − short) is shown for information only.
 *
 * All functions are pure and unit-tested (positionNetting.test.ts).
 */

export type Side = 'long' | 'short';
export type NettingMode = 'oneway' | 'hedge';

export interface NetOrder {
    id: string;
    side: Side;
    quantity: number;
    entryPrice: number;
    tp: number | null;
    sl: number | null;
}

export type TargetStatus = 'active' | 'superseded' | 'cancelled' | 'none';

export interface OrderStatus {
    orderId: string;
    tp: TargetStatus;
    sl: TargetStatus;
    note: string;
}

export interface LedgerStep {
    index: number;
    order: NetOrder;
    effect: string;        // human description of what this order did
    realizedPnl: number;   // PnL locked in by this step
    resultSide: Side | 'flat';
    resultQty: number;
    resultAvgEntry: number;
}

// ─── PnL primitives ───────────────────────────────────────────

/** Unrealized PnL of a position at a mark price. */
export function unrealizedPnl(side: Side, qty: number, avgEntry: number, mark: number): number {
    return side === 'long' ? qty * (mark - avgEntry) : qty * (avgEntry - mark);
}

/** PnL realized when closing `qty` of a `side` position (avgEntry) at `exit`. */
export function realizedOnClose(side: Side, qty: number, avgEntry: number, exit: number): number {
    return side === 'long' ? qty * (exit - avgEntry) : qty * (avgEntry - exit);
}

// ─── One-way (netting) ────────────────────────────────────────

export interface OneWayResult {
    steps: LedgerStep[];
    netSide: Side | 'flat';
    netQty: number;
    avgEntry: number;
    realizedPnl: number;
    positionTp: number | null;
    positionSl: number | null;
    positionTpOrderId: string | null;
    positionSlOrderId: string | null;
    statuses: OrderStatus[];
}

export function computeOneWay(orders: NetOrder[]): OneWayResult {
    let side: Side | 'flat' = 'flat';
    let qty = 0;
    let avgEntry = 0;
    let realizedPnl = 0;
    const steps: LedgerStep[] = [];

    orders.forEach((o, index) => {
        let effect: string;
        let stepRealized = 0;

        if (qty === 0) {
            side = o.side;
            qty = o.quantity;
            avgEntry = o.entryPrice;
            effect = `Open ${o.side} ${o.quantity}`;
        } else if (o.side === side) {
            // Same direction — increase and re-average.
            const newQty = qty + o.quantity;
            avgEntry = (qty * avgEntry + o.quantity * o.entryPrice) / newQty;
            qty = newQty;
            effect = `Add ${o.quantity} → ${side} ${qty}`;
        } else {
            // Opposite direction — reduce, close, or flip.
            const closeQty = Math.min(o.quantity, qty);
            stepRealized = realizedOnClose(side as Side, closeQty, avgEntry, o.entryPrice);
            realizedPnl += stepRealized;
            const remaining = o.quantity - closeQty;

            if (remaining === 0) {
                qty -= closeQty;
                if (qty === 0) {
                    effect = `Close ${closeQty} → flat`;
                    side = 'flat';
                    avgEntry = 0;
                } else {
                    effect = `Reduce ${closeQty} → ${side} ${qty}`;
                }
            } else {
                // Flip: fully close the old side, open the remainder on the new side.
                side = o.side;
                qty = remaining;
                avgEntry = o.entryPrice;
                effect = `Close ${closeQty} + flip → ${o.side} ${remaining}`;
            }
        }

        steps.push({
            index,
            order: o,
            effect,
            realizedPnl: stepRealized,
            resultSide: side,
            resultQty: qty,
            resultAvgEntry: avgEntry,
        });
    });

    // TP/SL resolution — position-level, only orders on the surviving side count.
    const netSide = side;
    let positionTp: number | null = null;
    let positionSl: number | null = null;
    let positionTpOrderId: string | null = null;
    let positionSlOrderId: string | null = null;

    if (netSide !== 'flat') {
        const survivors = orders.filter(o => o.side === netSide);
        for (const o of survivors) {
            if (o.tp != null) { positionTp = o.tp; positionTpOrderId = o.id; }
            if (o.sl != null) { positionSl = o.sl; positionSlOrderId = o.id; }
        }
    }

    const statuses: OrderStatus[] = orders.map(o => {
        if (netSide === 'flat') {
            return {
                orderId: o.id,
                tp: o.tp != null ? 'cancelled' : 'none',
                sl: o.sl != null ? 'cancelled' : 'none',
                note: 'Position closed — TP/SL cancelled',
            };
        }
        if (o.side !== netSide) {
            return {
                orderId: o.id,
                tp: o.tp != null ? 'cancelled' : 'none',
                sl: o.sl != null ? 'cancelled' : 'none',
                note: 'Closed by netting — TP/SL cancelled',
            };
        }
        const tp: TargetStatus = o.tp == null ? 'none' : o.id === positionTpOrderId ? 'active' : 'superseded';
        const sl: TargetStatus = o.sl == null ? 'none' : o.id === positionSlOrderId ? 'active' : 'superseded';
        const note =
            tp === 'active' || sl === 'active' ? 'Sets the net position TP/SL'
            : tp === 'superseded' || sl === 'superseded' ? 'Superseded — one TP/SL per net position'
            : 'On net side — no TP/SL set';
        return { orderId: o.id, tp, sl, note };
    });

    return {
        steps,
        netSide,
        netQty: qty,
        avgEntry,
        realizedPnl,
        positionTp,
        positionSl,
        positionTpOrderId,
        positionSlOrderId,
        statuses,
    };
}

// ─── Hedge (no netting) ───────────────────────────────────────

export interface HedgeLeg {
    side: Side;
    qty: number;
    avgEntry: number;
    tp: number | null;
    sl: number | null;
    tpOrderId: string | null;
    slOrderId: string | null;
}

export interface HedgeResult {
    long: HedgeLeg | null;
    short: HedgeLeg | null;
    netExposure: number; // long qty − short qty (informational)
    statuses: OrderStatus[];
}

function aggregateLeg(orders: NetOrder[], side: Side): HedgeLeg | null {
    const legOrders = orders.filter(o => o.side === side);
    if (legOrders.length === 0) return null;
    let qty = 0;
    let notional = 0;
    let tp: number | null = null;
    let sl: number | null = null;
    let tpOrderId: string | null = null;
    let slOrderId: string | null = null;
    for (const o of legOrders) {
        qty += o.quantity;
        notional += o.quantity * o.entryPrice;
        if (o.tp != null) { tp = o.tp; tpOrderId = o.id; }
        if (o.sl != null) { sl = o.sl; slOrderId = o.id; }
    }
    return { side, qty, avgEntry: qty > 0 ? notional / qty : 0, tp, sl, tpOrderId, slOrderId };
}

export function computeHedge(orders: NetOrder[]): HedgeResult {
    const long = aggregateLeg(orders, 'long');
    const short = aggregateLeg(orders, 'short');

    const statuses: OrderStatus[] = orders.map(o => {
        const leg = o.side === 'long' ? long : short;
        const tp: TargetStatus = o.tp == null ? 'none' : o.id === leg?.tpOrderId ? 'active' : 'superseded';
        const sl: TargetStatus = o.sl == null ? 'none' : o.id === leg?.slOrderId ? 'active' : 'superseded';
        const note =
            tp === 'active' || sl === 'active' ? `Sets the ${o.side} position TP/SL`
            : tp === 'superseded' || sl === 'superseded' ? `Superseded by a later ${o.side} order`
            : `${o.side} leg — no TP/SL set`;
        return { orderId: o.id, tp, sl, note };
    });

    return {
        long,
        short,
        netExposure: (long?.qty ?? 0) - (short?.qty ?? 0),
        statuses,
    };
}

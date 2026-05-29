'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { DemoOrderType } from '@/services/SupabaseDemoService';

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface SimConfig {
    orderType: DemoOrderType;
    side: 'buy' | 'sell';
    pair: string;
    entryPrice: number;
    price: number | null;       // limit price (limit, iceberg, trailing activation)
    stopPrice: number | null;   // stop trigger (stop_market, stop_limit, trailing percent)
    limitPrice: number | null;  // stop_limit's limit leg
    amount: number;
    tpPrice: number | null;
    slPrice: number | null;
    tpEnabled: boolean;
    slEnabled: boolean;
}

// ─── Internal Types ────────────────────────────────────────────────────────────

type NodeKind = 'start' | 'state' | 'terminal' | 'tp' | 'sl' | 'cancel';
type EdgeColor = 'neutral' | 'tp' | 'sl';
type NodeState = 'skeleton' | 'active' | 'completed' | 'future' | 'cancelled' | 'position' | 'filled_terminal';

interface FlowNode { id: string; label: string; sublabel?: string; kind: NodeKind; }
interface FlowEdge { from: string; to: string; label?: string; dashed?: boolean; color?: EdgeColor; }
interface FlowGraph { nodes: FlowNode[]; edges: FlowEdge[]; }

interface LayoutNode extends FlowNode { x: number; y: number; }
interface LayoutEdge extends FlowEdge { x1: number; y1: number; x2: number; y2: number; backward: boolean; }
interface ComputedLayout { nodes: LayoutNode[]; edges: LayoutEdge[]; width: number; height: number; }

// ─── Graph Constants ───────────────────────────────────────────────────────────

const NODE_W = 132;
const NODE_H = 66;
const DEPTH_GAP = 84;
const SIBLING_GAP = 56;
const PAD = 56;

// ─── Graph Data ────────────────────────────────────────────────────────────────

const MARKET_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'filled', label: 'FILLED', sublabel: 'at market price', kind: 'terminal' },
    ],
    edges: [{ from: 'placed', to: 'filled', label: 'instant' }],
};

const LIMIT_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'pending', label: 'PENDING', sublabel: 'resting on book', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'at limit price', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'pending', label: 'open' },
        { from: 'pending', to: 'filled', label: 'limit hit' },
        { from: 'pending', to: 'cancel', label: 'cancel' },
    ],
};

const STOP_MARKET_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'watching', label: 'WATCHING', sublabel: 'awaiting trigger', kind: 'state' },
        { id: 'triggered', label: 'TRIGGERED', sublabel: 'stop price hit', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'at market price', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'watching', label: 'submit' },
        { from: 'watching', to: 'triggered', label: 'stop hit' },
        { from: 'triggered', to: 'filled', label: 'filled' },
        { from: 'watching', to: 'cancel', label: 'cancel' },
    ],
};

const STOP_LIMIT_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'watching', label: 'WATCHING', sublabel: 'awaiting trigger', kind: 'state' },
        { id: 'triggered', label: 'TRIGGERED', sublabel: 'stop price hit', kind: 'state' },
        { id: 'pending', label: 'PENDING', sublabel: 'limit order open', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'at limit price', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'watching', label: 'submit' },
        { from: 'watching', to: 'triggered', label: 'stop hit' },
        { from: 'triggered', to: 'pending', label: 'limit →' },
        { from: 'pending', to: 'filled', label: 'limit hit' },
        { from: 'pending', to: 'cancel', label: 'cancel' },
        { from: 'watching', to: 'cancel', label: 'cancel', dashed: true },
    ],
};

const ICEBERG_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'partial', label: 'PARTIAL', sublabel: 'visible qty filled', kind: 'state' },
        { id: 'refill', label: 'REFRESHED', sublabel: 'new chunk shown', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'all slices done', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'partial', label: '1st fill' },
        { from: 'partial', to: 'refill', label: 'more qty' },
        { from: 'refill', to: 'partial', label: 'next fill', dashed: true },
        { from: 'partial', to: 'filled', label: 'complete' },
        { from: 'placed', to: 'cancel', label: 'cancel', dashed: true },
    ],
};

const TWAP_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'schedule starts', kind: 'start' },
        { id: 'interval', label: 'INTERVAL', sublabel: 'waiting for next', kind: 'state' },
        { id: 'partial', label: 'PARTIAL', sublabel: 'slice at market', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'all intervals done', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'interval', label: 'start' },
        { from: 'interval', to: 'partial', label: 'tick' },
        { from: 'partial', to: 'interval', label: 'more', dashed: true },
        { from: 'partial', to: 'filled', label: 'done' },
        { from: 'interval', to: 'cancel', label: 'cancel', dashed: true },
    ],
};

const TRAILING_STOP_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'tracking', label: 'TRACKING', sublabel: 'adjusting trigger', kind: 'state' },
        { id: 'triggered', label: 'TRIGGERED', sublabel: 'trail delta hit', kind: 'state' },
        { id: 'filled', label: 'FILLED', sublabel: 'at market price', kind: 'terminal' },
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'tracking', label: 'activate' },
        { from: 'tracking', to: 'tracking', label: 'trail', dashed: true }, // self-loop visually implies ongoing action
        { from: 'tracking', to: 'triggered', label: 'reversal' },
        { from: 'triggered', to: 'filled', label: 'filled' },
        { from: 'tracking', to: 'cancel', label: 'cancel' },
    ],
};

const OCO_FLOW: FlowGraph = {
    nodes: [
        { id: 'placed', label: 'PLACED', sublabel: 'order submitted', kind: 'start' },
        { id: 'oco_limit', label: 'TARGET LMT', sublabel: 'limit resting', kind: 'state' },
        { id: 'oco_stop', label: 'STOP TRIG', sublabel: 'watching trigger', kind: 'state' },
        { id: 'limit_filled', label: 'CASHED OUT', sublabel: 'target hit', kind: 'terminal' },
        { id: 'stop_filled', label: 'STOP FILLED', sublabel: 'stop limit parsed', kind: 'terminal' }, // Simplified stop-limit terminal
        { id: 'cancel', label: 'CANCELLED', kind: 'cancel' },
    ],
    edges: [
        { from: 'placed', to: 'oco_limit', label: 'leg a' },
        { from: 'placed', to: 'oco_stop', label: 'leg b' },
        { from: 'oco_limit', to: 'limit_filled', label: 'hit' },
        { from: 'oco_stop', to: 'stop_filled', label: 'trigger hit' },
        { from: 'limit_filled', to: 'oco_stop', label: 'kills', dashed: true, color: 'sl' },
        { from: 'stop_filled', to: 'oco_limit', label: 'kills', dashed: true, color: 'tp' },
        { from: 'oco_limit', to: 'cancel', label: 'cancel', dashed: true },
        { from: 'oco_stop', to: 'cancel', label: 'cancel', dashed: true },
    ],
};

const FLOW_MAP: Record<DemoOrderType, FlowGraph> = {
    market: MARKET_FLOW,
    limit: LIMIT_FLOW,
    stop_market: STOP_MARKET_FLOW,
    stop_limit: STOP_LIMIT_FLOW,
    iceberg: ICEBERG_FLOW,
    twap: TWAP_FLOW,
    trailing_stop: TRAILING_STOP_FLOW,
    oco: OCO_FLOW,
};

function buildTpSlExtension(tpEnabled: boolean, slEnabled: boolean): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    if (tpEnabled) {
        nodes.push({ id: 'tp_order', label: 'TP RESTING', sublabel: 'auto sell at target', kind: 'tp' });
        nodes.push({ id: 'tp_filled', label: 'TP FILLED', sublabel: 'profit secured', kind: 'tp' });
        edges.push({ from: 'filled', to: 'tp_order', label: 'auto-place', color: 'tp' });
        edges.push({ from: 'tp_order', to: 'tp_filled', label: 'target hit', color: 'tp' });
    }
    if (slEnabled) {
        nodes.push({ id: 'sl_order', label: 'SL RESTING', sublabel: 'auto sell at loss', kind: 'sl' });
        nodes.push({ id: 'sl_filled', label: 'SL FILLED', sublabel: 'loss capped', kind: 'sl' });
        edges.push({ from: 'filled', to: 'sl_order', label: 'auto-place', color: 'sl' });
        edges.push({ from: 'sl_order', to: 'sl_filled', label: 'stop hit', color: 'sl' });
    }
    if (tpEnabled && slEnabled) {
        // OCO: whichever fills first kills the other
        edges.push({ from: 'tp_filled', to: 'sl_order', label: 'cancels', dashed: true, color: 'sl' });
        edges.push({ from: 'sl_filled', to: 'tp_order', label: 'cancels', dashed: true, color: 'tp' });
    }
    return { nodes, edges };
}

function buildGraph(orderType: DemoOrderType, tpEnabled: boolean, slEnabled: boolean): FlowGraph {
    const base = FLOW_MAP[orderType];
    if (!tpEnabled && !slEnabled) return base;
    const ext = buildTpSlExtension(tpEnabled, slEnabled);
    return { nodes: [...base.nodes, ...ext.nodes], edges: [...base.edges, ...ext.edges] };
}

// ─── External State Trackers ───────────────────────────────────────────────────

// Trailing stop calculates a virtual 'watermark' limit as price moves
// We calculate this entirely deterministically based on entry vs simPrice
function calcVirtualTrailingStop(entry: number, act: number, pct: number, side: 'buy' | 'sell', maxExtremum: number): number | null {
    // If not activated yet
    if (side === 'buy' && act > 0 && maxExtremum > act) return null; // Needs to dip past act
    if (side === 'sell' && act > 0 && maxExtremum < act) return null; // Needs to rise past act

    const ratio = pct / 100;
    if (side === 'buy') {
        const nadir = Math.min(entry, maxExtremum); // The lowest price reached
        return nadir * (1 + ratio); // Virtual stop is above the lowest price
    } else {
        const apex = Math.max(entry, maxExtremum); // The highest price reached
        return apex * (1 - ratio); // Virtual stop is below highest price
    }
}

// ─── Sim Value Overlay ─────────────────────────────────────────────────────────

function applySimValues(graph: FlowGraph, snap: SimConfig, fp: (n: number) => string, maxExtremum: number, mainFilled: boolean): FlowGraph {
    const token = snap.pair.split('/')[0];
    const { orderType, side, price, stopPrice, limitPrice } = snap;

    return {
        ...graph,
        nodes: graph.nodes.map(n => {
            let sub = n.sublabel;
            const effectiveEntry = orderType === 'limit' && price ? price : snap.entryPrice;

            if (n.id === 'placed' && snap.amount > 0)
                sub = `${snap.amount.toFixed(4)} ${token}`;

            // Standard orders
            if (n.id === 'watching' && snap.stopPrice && orderType !== 'oco')
                sub = `trig ${fp(snap.stopPrice)}`;
            if (n.id === 'pending' && (snap.price || snap.limitPrice))
                sub = `@ ${fp(snap.price ?? snap.limitPrice!)}`;

            // OCO Legs
            if (n.id === 'oco_limit' && price)
                sub = `@ ${fp(price)}`;
            if (n.id === 'oco_stop' && stopPrice)
                sub = `trig ${fp(stopPrice)}`;
            if (n.id === 'stop_filled' && limitPrice)
                sub = `Limit @ ${fp(limitPrice)}`;

            // Trailing Stop tracking
            if (orderType === 'trailing_stop' && price && stopPrice) {
                if (n.id === 'tracking') {
                    const tv = calcVirtualTrailingStop(snap.entryPrice, price, stopPrice, side, maxExtremum);
                    sub = tv ? `virtual: ${fp(tv)}` : `wait ${fp(price)}`;
                }
            }

            // TP/SL resting orders — show price targets
            if (n.id === 'tp_order' && snap.tpPrice)
                sub = `sell @ ${fp(snap.tpPrice)}`;
            if (n.id === 'sl_order' && snap.slPrice)
                sub = `sell @ ${fp(snap.slPrice)}`;

            // Filled with TP/SL: show wallet context on the filled node
            if (n.id === 'filled' && mainFilled && (snap.tpEnabled || snap.slEnabled))
                sub = `${snap.amount.toFixed(4)} ${token} in wallet`;

            // TP/SL terminal nodes — show P&L
            if (n.id === 'tp_filled' && snap.tpPrice && effectiveEntry > 0) {
                const ppu = side === 'buy' ? snap.tpPrice - effectiveEntry : effectiveEntry - snap.tpPrice;
                const pct = ((ppu / effectiveEntry) * 100).toFixed(1);
                sub = `+${fp(Math.abs(ppu * snap.amount))} (+${pct}%)`;
            }
            if (n.id === 'sl_filled' && snap.slPrice && effectiveEntry > 0) {
                const ppu = side === 'buy' ? effectiveEntry - snap.slPrice : snap.slPrice - effectiveEntry;
                const pct = ((ppu / effectiveEntry) * 100).toFixed(1);
                sub = `-${fp(Math.abs(ppu * snap.amount))} (-${pct}%)`;
            }

            return sub !== n.sublabel ? { ...n, sublabel: sub } : n;
        }),
    };
}

// ─── Main Fill Detection (lightweight helper for post-fill extrema tracking) ──

function checkMainFilled(
    snap: SimConfig, simPrice: number, maxExtremum: number,
    sessionMin: number, sessionMax: number,
): boolean {
    const { orderType, side, price: lp, stopPrice: sp, limitPrice: slp, entryPrice: ep } = snap;
    switch (orderType) {
        case 'market': return true;
        case 'limit':
        case 'iceberg':
            return side === 'buy' ? sessionMin <= (lp ?? ep) : sessionMax >= (lp ?? ep);
        case 'stop_market':
            return side === 'buy' ? sessionMax >= (sp ?? ep) : sessionMin <= (sp ?? ep);
        case 'stop_limit': {
            const triggered = side === 'buy' ? sessionMax >= (sp ?? ep) : sessionMin <= (sp ?? ep);
            return triggered && (side === 'buy' ? sessionMin <= (slp ?? ep) : sessionMax >= (slp ?? ep));
        }
        case 'twap': return false;
        case 'trailing_stop': {
            const act = lp ?? ep;
            const activated = side === 'buy' ? sessionMin <= act : sessionMax >= act;
            if (!activated) return false;
            const pct = (sp ?? 0) / 100;
            const vt = side === 'buy' ? maxExtremum * (1 + pct) : maxExtremum * (1 - pct);
            return side === 'buy' ? simPrice >= vt : simPrice <= vt;
        }
        case 'oco': {
            const targetHit = side === 'buy' ? sessionMin <= (lp ?? ep) : sessionMax >= (lp ?? ep);
            const stopHit = side === 'buy' ? sessionMax >= (sp ?? ep) : sessionMin <= (sp ?? ep);
            return targetHit || stopHit;
        }
        default: return false;
    }
}

// ─── Active Node Logic ─────────────────────────────────────────────────────────

function computeActiveNode(
    snap: SimConfig,
    simPrice: number,
    maxExtremum: number,
    sessionMin: number,
    sessionMax: number,
    postFillMin: number,
    postFillMax: number,
): {
    activeIds: string[];
    completedIds: string[];
    cancelledIds: string[];
} {
    const { orderType, side, price, stopPrice, limitPrice, tpEnabled, slEnabled, tpPrice, slPrice, entryPrice } = snap;
    let activeIds: string[] = [];
    let completedIds: string[] = [];
    let cancelledIds: string[] = [];
    let mainFilled = false;

    const lp = price ?? entryPrice;
    const sp = stopPrice ?? entryPrice;
    const llp = limitPrice ?? sp;

    switch (orderType) {
        case 'market':
            mainFilled = true;
            completedIds = ['placed'];
            activeIds = ['filled'];
            break;

        case 'limit': {
            // Use session extrema so the fill latches once price crosses the limit
            const filled = side === 'buy' ? sessionMin <= lp : sessionMax >= lp;
            if (filled) {
                mainFilled = true;
                completedIds = ['placed', 'pending'];
                activeIds = ['filled'];
            } else {
                completedIds = ['placed'];
                activeIds = ['pending'];
            }
            break;
        }

        case 'iceberg': {
            // Use session extrema for latch behaviour
            const filled = side === 'buy' ? sessionMin <= lp : sessionMax >= lp;
            if (filled) {
                mainFilled = true;
                completedIds = ['placed', 'partial', 'refill'];
                activeIds = ['filled'];
            } else {
                completedIds = ['placed'];
                activeIds = ['partial'];
            }
            break;
        }

        case 'stop_market': {
            // Use session extrema: BUY stop triggers when price rises to stop (sessionMax), SELL when falls (sessionMin)
            const triggered = side === 'buy' ? sessionMax >= sp : sessionMin <= sp;
            if (triggered) {
                mainFilled = true;
                completedIds = ['placed', 'watching', 'triggered'];
                activeIds = ['filled'];
            } else {
                completedIds = ['placed'];
                activeIds = ['watching'];
            }
            break;
        }

        case 'stop_limit': {
            const stopTriggered = side === 'buy' ? sessionMax >= sp : sessionMin <= sp;
            const limitFilled = side === 'buy' ? sessionMax >= llp : sessionMin <= llp;
            if (!stopTriggered) {
                completedIds = ['placed'];
                activeIds = ['watching'];
            } else if (!limitFilled) {
                completedIds = ['placed', 'watching', 'triggered'];
                activeIds = ['pending'];
            } else {
                mainFilled = true;
                completedIds = ['placed', 'watching', 'triggered', 'pending'];
                activeIds = ['filled'];
            }
            break;
        }

        case 'twap':
            completedIds = ['placed'];
            activeIds = ['interval'];
            break;

        case 'trailing_stop': {
            const act = lp; // Activation
            const pct = sp; // Percent
            const vt = calcVirtualTrailingStop(entryPrice, act, pct, side, maxExtremum);

            if (vt === null) {  // Hasn't activated
                completedIds = ['placed'];
                activeIds = ['tracking'];
            } else {
                // Activated. Now check if price reversed into virtual trigger.
                const triggered = side === 'buy' ? simPrice >= vt : simPrice <= vt;
                if (triggered) {
                    mainFilled = true;
                    completedIds = ['placed', 'tracking', 'triggered'];
                    activeIds = ['filled'];
                } else {
                    completedIds = ['placed'];
                    activeIds = ['tracking']; // Keeps 'dragging'
                }
            }
            break;
        }

        case 'oco': {
            // Use session extrema for both legs
            const targetHit = side === 'buy' ? sessionMin <= lp : sessionMax >= lp;
            const stopHit = side === 'buy' ? sessionMax >= sp : sessionMin <= sp;

            if (targetHit) {
                mainFilled = true;
                completedIds = ['placed', 'oco_limit'];
                activeIds = ['limit_filled'];
                cancelledIds = ['oco_stop', 'stop_filled']; // Cancel opposite leg
            } else if (stopHit) {
                mainFilled = true;
                completedIds = ['placed', 'oco_stop'];
                activeIds = ['stop_filled'];
                cancelledIds = ['oco_limit', 'limit_filled']; // Cancel opposite leg
            } else {
                completedIds = ['placed'];
                activeIds = ['oco_limit', 'oco_stop']; // Both resting
            }
            break;
        }
    }

    // TP/SL logic: use post-fill extrema so TP/SL only trigger from price movement AFTER fill
    if ((mainFilled || orderType === 'twap') && (tpEnabled || slEnabled)) {
        const prevActive = activeIds;
        completedIds = [...completedIds];
        activeIds = [];

        // For TWAP (no single fill), use session extrema; otherwise use post-fill extrema
        const tpSlMin = orderType === 'twap' ? sessionMin : postFillMin;
        const tpSlMax = orderType === 'twap' ? sessionMax : postFillMax;

        // TP/SL hit = post-fill extremum ever reached the target
        const tpHit = tpEnabled && tpPrice !== null &&
            (side === 'buy' ? tpSlMax >= tpPrice : tpSlMin <= tpPrice);
        const slHit = slEnabled && slPrice !== null &&
            (side === 'buy' ? tpSlMin <= slPrice : tpSlMax >= slPrice);

        if (tpHit && !slHit) {
            // TP triggered: filled node = position (done), tp path = filled_terminal
            completedIds = [...completedIds, ...prevActive, 'tp_order'];
            activeIds = ['tp_filled'];  // will render as filled_terminal
            if (slEnabled) cancelledIds = ['sl_order', 'sl_filled'];
        } else if (slHit && !tpHit) {
            // SL triggered
            completedIds = [...completedIds, ...prevActive, 'sl_order'];
            activeIds = ['sl_filled'];  // will render as filled_terminal
            if (tpEnabled) cancelledIds = ['tp_order', 'tp_filled'];
        } else if (tpHit && slHit) {
            completedIds = [...completedIds, ...prevActive, 'tp_order'];
            activeIds = ['tp_filled'];
            cancelledIds = ['sl_order', 'sl_filled'];
        } else {
            // Neither hit yet: filled node shows as 'position' (assets in wallet)
            // TP/SL orders are resting and active
            activeIds = [...prevActive]; // 'filled' stays in activeIds but gets 'position' state below
            if (tpEnabled) activeIds = [...activeIds, 'tp_order'];
            if (slEnabled) activeIds = [...activeIds, 'sl_order'];
        }
    }

    return { activeIds, completedIds, cancelledIds };
}

// ─── Exported Utilities ────────────────────────────────────────────────────────

export function getSliderRange(simSnapshot: SimConfig | null, currentPrice: number): { min: number; max: number } {
    if (!simSnapshot || simSnapshot.entryPrice <= 0) return { min: currentPrice * 0.85, max: currentPrice * 1.15 };

    // For trailing stop, the % translates to a real price
    let trailProxy: number | null = null;
    if (simSnapshot.orderType === 'trailing_stop') {
        const act = simSnapshot.price ?? simSnapshot.entryPrice;
        const pct = (simSnapshot.stopPrice ?? 0) / 100;
        trailProxy = simSnapshot.side === 'buy' ? act * (1 + pct) : act * (1 - pct);
    }

    const prices = [
        simSnapshot.entryPrice,
        simSnapshot.price,
        simSnapshot.stopPrice,
        simSnapshot.limitPrice,
        simSnapshot.tpPrice,
        simSnapshot.slPrice,
        trailProxy,
    ].filter((p): p is number => p !== null && p > 0);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    return { min: lo * 0.85, max: hi * 1.15 };
}

export function computeKnobColor(snap: SimConfig | null, simPrice: number, maxExtremum: number, sessionMin: number, sessionMax: number, postFillMin: number, postFillMax: number): string {
    if (!snap) return 'bg-bs-border border-white/30';
    const { activeIds } = computeActiveNode(snap, simPrice, maxExtremum, sessionMin, sessionMax, postFillMin, postFillMax);

    if (activeIds.includes('tp_filled')) return 'bg-bs-buy border-bs-success';
    if (activeIds.includes('sl_filled')) return 'bg-bs-error border-bs-sell';
    if (activeIds.includes('filled') || activeIds.includes('limit_filled') || activeIds.includes('stop_filled')) return 'bg-bs-success border-bs-buy';
    if (activeIds.some(id => id === 'cancel')) return 'bg-bs-text-mute border-bs-border';
    return 'bg-bs-info border-bs-brand-ts';
}

// ─── Layout ────────────────────────────────────────────────────────────────────

function computeLayout(graph: FlowGraph): ComputedLayout {
    const depth: Record<string, number> = {};
    graph.nodes.forEach(n => { depth[n.id] = 0; });

    const forwardEdges = graph.edges.filter(e => !e.dashed);
    const queue = graph.nodes.filter(n => n.kind === 'start').map(n => n.id);
    const visited = new Set<string>(queue);

    while (queue.length > 0) {
        const cur = queue.shift()!;
        forwardEdges.filter(e => e.from === cur).forEach(e => {
            if (depth[e.to] <= depth[cur]) depth[e.to] = depth[cur] + 1;
            if (!visited.has(e.to)) { visited.add(e.to); queue.push(e.to); }
        });
    }

    const rows: Record<number, string[]> = {};
    graph.nodes.forEach(n => {
        const row = depth[n.id] ?? 0;
        if (!rows[row]) rows[row] = [];
        rows[row].push(n.id);
    });

    const maxDepth = Math.max(...Object.keys(rows).map(Number));
    const maxSiblings = Math.max(...Object.values(rows).map(r => r.length));

    const canvasH = (maxDepth + 1) * (NODE_H + DEPTH_GAP) - DEPTH_GAP + PAD * 2;
    const canvasW = maxSiblings * (NODE_W + SIBLING_GAP) - SIBLING_GAP + PAD * 2;

    const positions: Record<string, { x: number; y: number }> = {};
    Object.entries(rows).forEach(([rowStr, ids]) => {
        const row = parseInt(rowStr);
        const y = PAD + row * (NODE_H + DEPTH_GAP);
        const rowW = ids.length * (NODE_W + SIBLING_GAP) - SIBLING_GAP;
        const startX = (canvasW - rowW) / 2;
        ids.forEach((id, i) => { positions[id] = { x: startX + i * (NODE_W + SIBLING_GAP), y }; });
    });

    const layoutNodes: LayoutNode[] = graph.nodes.map(n => ({
        ...n, ...(positions[n.id] ?? { x: PAD, y: PAD }),
    }));

    const layoutEdges: LayoutEdge[] = graph.edges.map(e => {
        const f = positions[e.from] ?? { x: 0, y: 0 };
        const t = positions[e.to] ?? { x: 0, y: 0 };

        let backward = (depth[e.to] ?? 0) <= (depth[e.from] ?? 0);
        // Special logic for OCO visually crossing lines
        if (e.from === 'limit_filled' && e.to === 'oco_stop') backward = true;
        if (e.from === 'stop_filled' && e.to === 'oco_limit') backward = true;
        if (e.from === e.to) backward = true; // Self loops

        return {
            ...e,
            x1: backward ? f.x + NODE_W : f.x + NODE_W / 2,
            y1: backward ? f.y + NODE_H / 2 : f.y + NODE_H,
            x2: backward ? t.x + NODE_W : t.x + NODE_W / 2,
            y2: backward ? t.y + NODE_H / 2 : t.y,
            backward,
        };
    });

    return { nodes: layoutNodes, edges: layoutEdges, width: canvasW, height: canvasH };
}

function edgePath(e: LayoutEdge): string {
    if (e.from === e.to) { // Quick self loop curve
        return `M ${e.x1},${e.y1} C ${e.x1 + 60},${e.y1 - 30} ${e.x1 + 60},${e.y1 + 30} ${e.x2},${e.y2}`;
    }
    if (e.backward) {
        const arcX = Math.max(e.x1, e.x2) + 64;
        return `M ${e.x1},${e.y1} C ${arcX},${e.y1} ${arcX},${e.y2} ${e.x2},${e.y2}`;
    }
    const dy = Math.max(Math.abs(e.y2 - e.y1) * 0.45, 20);
    return `M ${e.x1},${e.y1} C ${e.x1},${e.y1 + dy} ${e.x2},${e.y2 - dy} ${e.x2},${e.y2}`;
}

function bezierMid(e: LayoutEdge): { x: number; y: number } {
    if (e.from === e.to) return { x: e.x1 + 45, y: e.y1 }; // Self loop label pos
    if (e.backward) return { x: Math.max(e.x1, e.x2) + 70, y: (e.y1 + e.y2) / 2 };

    // Straight down handling
    if (e.x1 === e.x2) return { x: e.x1, y: (e.y1 + e.y2) / 2 };

    const dy = Math.max(Math.abs(e.y2 - e.y1) * 0.45, 20);
    const cy1 = e.y1 + dy; const cy2 = e.y2 - dy;
    return {
        x: 0.125 * e.x1 + 0.375 * e.x1 + 0.375 * e.x2 + 0.125 * e.x2 + 8,
        y: 0.125 * e.y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * e.y2,
    };
}

// ─── Colours ───────────────────────────────────────────────────────────────────

// Vivid node palette — purple (start), blue (state), green (filled/tp), red (sl/sell), gray (cancel)
const NODE_STYLE: Record<NodeKind, { fill: string; activeFill: string; stroke: string; text: string; sub: string }> = {
    start: { fill: 'rgba(192,38,255,0.16)', activeFill: 'rgba(192,38,255,0.38)', stroke: 'rgba(192,38,255,0.85)', text: 'var(--bs-brand)', sub: 'var(--bs-brand-secondary)' },
    state: { fill: 'rgba(46,155,255,0.12)', activeFill: 'rgba(46,155,255,0.30)', stroke: 'rgba(46,155,255,0.75)', text: 'var(--bs-info)', sub: 'var(--bs-text-secondary)' },
    terminal: { fill: 'rgba(0,230,118,0.14)', activeFill: 'rgba(0,230,118,0.34)', stroke: 'rgba(0,230,118,0.80)', text: 'var(--bs-buy)', sub: 'var(--bs-success)' },
    tp: { fill: 'rgba(0,230,118,0.14)', activeFill: 'rgba(0,230,118,0.32)', stroke: 'rgba(0,230,118,0.75)', text: 'var(--bs-chart-green)', sub: 'var(--bs-success)' },
    sl: { fill: 'rgba(255,77,77,0.14)', activeFill: 'rgba(255,77,77,0.34)', stroke: 'rgba(255,77,77,0.80)', text: 'var(--bs-chart-red)', sub: 'var(--bs-error)' },
    cancel: { fill: 'rgba(140,140,140,0.07)', activeFill: 'rgba(140,140,140,0.16)', stroke: 'rgba(140,140,140,0.45)', text: 'var(--bs-text-mute)', sub: 'rgba(140,140,140,0.55)' },
};

function resolveNodeStyle(kind: NodeKind, side: 'buy' | 'sell') {
    if (side === 'sell' && kind === 'terminal') {
        return { fill: 'rgba(255,77,77,0.14)', activeFill: 'rgba(255,77,77,0.34)', stroke: 'rgba(255,77,77,0.80)', text: 'var(--bs-sell)', sub: 'var(--bs-error)' };
    }
    return NODE_STYLE[kind];
}

const EDGE_STROKE: Record<EdgeColor, string> = {
    neutral: 'var(--bs-text-subtle, var(--bs-text-tertiary))',
    tp: 'rgba(0,230,118,0.70)',
    sl: 'rgba(255,77,77,0.70)',
};

// ─── SVG Sub-components ────────────────────────────────────────────────────────

function NodeBox({ node, side, nodeState }: { node: LayoutNode; side: 'buy' | 'sell'; nodeState: NodeState }) {
    const s = resolveNodeStyle(node.kind, side);
    const midY = node.y + NODE_H / 2;
    const hasSub = !!node.sublabel;

    // Opacity mapping per state
    const opacity =
        nodeState === 'completed' ? 0.42 :
            nodeState === 'future' ? 0.26 :
                nodeState === 'cancelled' ? 0.32 : 1;

    // Fill: position and filled_terminal use the active fill (bright) but no glow ring
    const fill =
        nodeState === 'active' || nodeState === 'position' || nodeState === 'filled_terminal'
            ? s.activeFill : s.fill;

    const strokeW = nodeState === 'active' ? 1.5 : nodeState === 'filled_terminal' ? 2 : 1;

    return (
        <g opacity={opacity}>
            {/* Pulsing glow ring — only for active (in-progress) nodes */}
            {nodeState === 'active' && (
                <rect
                    x={node.x - 4} y={node.y - 4}
                    width={NODE_W + 8} height={NODE_H + 8}
                    fill="none" stroke={s.stroke} strokeWidth={1.5} rx={4} opacity={0.65}
                />
            )}
            {/* Solid double-border for filled_terminal — trade is DONE */}
            {nodeState === 'filled_terminal' && (
                <rect
                    x={node.x - 3} y={node.y - 3}
                    width={NODE_W + 6} height={NODE_H + 6}
                    fill="none" stroke={s.stroke} strokeWidth={2} rx={4} opacity={0.9}
                />
            )}
            <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H}
                fill={fill} stroke={s.stroke} strokeWidth={strokeW} rx={3} />
            <text
                x={node.x + NODE_W / 2} y={hasSub ? midY - 11 : midY}
                textAnchor="middle" dominantBaseline="middle"
                fill={s.text} fontSize={15} fontFamily="monospace" fontWeight="700"
                letterSpacing="0.06em"
            >{node.label}</text>
            {hasSub && (
                <text
                    x={node.x + NODE_W / 2} y={midY + 12}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={s.sub} fontSize={12} fontFamily="monospace"
                >{node.sublabel}</text>
            )}
        </g>
    );
}

function EdgeLine({ edge }: { edge: LayoutEdge }) {
    const color = edge.color ?? 'neutral';
    const stroke = EDGE_STROKE[color];
    const markerId = edge.dashed ? 'arr-dashed' : color === 'tp' ? 'arr-tp' : color === 'sl' ? 'arr-sl' : 'arr-neutral';
    const mid = bezierMid(edge);
    return (
        <g>
            <path d={edgePath(edge)} stroke={stroke} strokeWidth={1.5} fill="none"
                strokeDasharray={edge.dashed ? '4 3' : undefined}
                markerEnd={`url(#${markerId})`} />
            {edge.label && (() => {
                const labelW = edge.label.length * 7.5;
                return (
                    <g>
                        <rect x={mid.x - labelW / 2 - 4} y={mid.y - 10} width={labelW + 8} height={17}
                            fill="var(--color-surface-dim)" rx={3} />
                        <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle"
                            fill="var(--bs-text-secondary)" fontSize={12} fontFamily="monospace">
                            {edge.label}
                        </text>
                    </g>
                );
            })()}
        </g>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface Props {
    orderType: DemoOrderType;
    side: 'buy' | 'sell';
    tpEnabled: boolean;
    slEnabled: boolean;
    simSnapshot: SimConfig | null;
    simPrice: number;
    currentPrice: number;
    formatPrice: (n: number, d?: number) => string;
}

const ORDER_TYPE_LABELS: Record<DemoOrderType, string> = {
    market: 'Market',
    limit: 'Limit',
    stop_market: 'Stop Market',
    stop_limit: 'Stop Limit',
    iceberg: 'Iceberg',
    twap: 'TWAP',
    trailing_stop: 'Trailing Stop',
    oco: 'OCO',
};

const OrderFlowVisualiser = React.memo(function OrderFlowVisualiser({
    orderType, side, tpEnabled, slEnabled,
    simSnapshot, simPrice, formatPrice,
}: Props) {
    const [zoom, setZoom] = useState(1);

    // We need to track the max/min extremum seen during the simulation for Trailing Stop
    // Since the simulation allows stateless scrubbing backward and forward, the peak/dip
    // is simply the max/min between the entry point and the current scrubbed price.
    const maxExtremum = useMemo(() => {
        if (!simSnapshot) return simPrice;
        if (simSnapshot.side === 'buy') {
            return Math.min(simSnapshot.entryPrice, simPrice); // Buy trailing stop tracks the lowest dip
        } else {
            return Math.max(simSnapshot.entryPrice, simPrice); // Sell trailing stop tracks the highest peak
        }
    }, [simSnapshot, simPrice]);

    // ─── Session Extrema (latching price history for fill detection) ─────────────
    // Using inline useState updates (React-blessed pattern for deriving state from props)
    const [prevSnap, setPrevSnap] = useState<SimConfig | null>(null);
    const [savedMin, setSavedMin] = useState(simPrice);
    const [savedMax, setSavedMax] = useState(simPrice);

    // ─── Post-Fill Extrema (for TP/SL — only tracks price movement AFTER main fill) ──
    const [savedPostFillMin, setSavedPostFillMin] = useState(simPrice);
    const [savedPostFillMax, setSavedPostFillMax] = useState(simPrice);
    const [wasMainFilled, setWasMainFilled] = useState(false);

    let sessionMin = savedMin;
    let sessionMax = savedMax;
    let postFillMin = savedPostFillMin;
    let postFillMax = savedPostFillMax;

    if (simSnapshot !== prevSnap) {
        // New snapshot → reset all extrema
        setPrevSnap(simSnapshot);
        setSavedMin(simPrice);
        setSavedMax(simPrice);
        setSavedPostFillMin(simPrice);
        setSavedPostFillMax(simPrice);
        setWasMainFilled(false);
        sessionMin = simPrice;
        sessionMax = simPrice;
        postFillMin = simPrice;
        postFillMax = simPrice;
    } else {
        // Latch session extrema (for main order fill detection)
        let changed = false;
        if (simPrice < sessionMin) { sessionMin = simPrice; changed = true; }
        if (simPrice > sessionMax) { sessionMax = simPrice; changed = true; }
        if (changed) {
            setSavedMin(sessionMin);
            setSavedMax(sessionMax);
        }

        // Track post-fill extrema (for TP/SL detection)
        const mainFilled = simSnapshot
            ? checkMainFilled(simSnapshot, simPrice, maxExtremum, sessionMin, sessionMax)
            : false;

        if (mainFilled && !wasMainFilled) {
            // Main order just filled — start post-fill tracking from current price
            setWasMainFilled(true);
            postFillMin = simPrice;
            postFillMax = simPrice;
            setSavedPostFillMin(simPrice);
            setSavedPostFillMax(simPrice);
        } else if (mainFilled && wasMainFilled) {
            // Continue latching post-fill extrema
            let pfChanged = false;
            if (simPrice < postFillMin) { postFillMin = simPrice; pfChanged = true; }
            if (simPrice > postFillMax) { postFillMax = simPrice; pfChanged = true; }
            if (pfChanged) {
                setSavedPostFillMin(postFillMin);
                setSavedPostFillMax(postFillMax);
            }
        }
    }

    // ─── Drag-to-pan ─────────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null);
    // Use refs instead of state so that mouse events don't trigger re-renders
    const isPanning = useRef(false);
    const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        isPanning.current = true;
        containerRef.current.classList.add('cursor-grabbing');
        containerRef.current.classList.remove('cursor-grab');
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop,
        };
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isPanning.current || !containerRef.current || !dragStart.current) return;
            containerRef.current.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x);
            containerRef.current.scrollTop = dragStart.current.scrollTop - (e.clientY - dragStart.current.y);
        };
        const onUp = () => {
            if (!isPanning.current) return;
            isPanning.current = false;
            dragStart.current = null;
            if (containerRef.current) {
                containerRef.current.classList.remove('cursor-grabbing');
                containerRef.current.classList.add('cursor-grab');
            }
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []); // Mount/unmount only — refs are stable, no deps needed

    // Build graph — apply sim values only when snapshot exists
    const graph = useMemo(() => {
        const base = buildGraph(orderType, tpEnabled, slEnabled);
        if (!simSnapshot) return base;
        // Compute mainFilled to pass to applySimValues (needed for wallet context sublabels)
        const { activeIds } = computeActiveNode(simSnapshot, simPrice, maxExtremum, sessionMin, sessionMax, postFillMin, postFillMax);
        const mainFilled = activeIds.includes('filled') || activeIds.includes('tp_filled') || activeIds.includes('sl_filled')
            || activeIds.includes('limit_filled') || activeIds.includes('stop_filled');
        return applySimValues(base, simSnapshot, formatPrice, maxExtremum, mainFilled);
    }, [orderType, tpEnabled, slEnabled, simSnapshot, formatPrice, maxExtremum, simPrice, sessionMin, sessionMax, postFillMin, postFillMax]);

    const layout = useMemo(() => computeLayout(graph), [graph]);

    // Compute per-node states based on simPrice
    const nodeStates = useMemo((): Record<string, NodeState> => {
        if (!simSnapshot) return {};
        const { activeIds, completedIds, cancelledIds } = computeActiveNode(simSnapshot, simPrice, maxExtremum, sessionMin, sessionMax, postFillMin, postFillMax);
        const hasTpSl = simSnapshot.tpEnabled || simSnapshot.slEnabled;
        const states: Record<string, NodeState> = {};
        layout.nodes.forEach(n => {
            if (cancelledIds.includes(n.id)) {
                states[n.id] = 'cancelled';
            } else if (activeIds.includes(n.id)) {
                // Special states for filled + TP/SL scenarios
                if (n.id === 'filled' && hasTpSl) {
                    states[n.id] = 'position'; // Bright but no glow — assets in wallet
                } else if (n.id === 'tp_filled' || n.id === 'sl_filled') {
                    states[n.id] = 'filled_terminal'; // Solid double-border — trade completed
                } else {
                    states[n.id] = 'active'; // Normal pulsing active
                }
            } else if (completedIds.includes(n.id)) {
                states[n.id] = 'completed';
            } else {
                states[n.id] = 'future';
            }
        });
        return states;
    }, [simSnapshot, simPrice, maxExtremum, layout, sessionMin, sessionMax, postFillMin, postFillMax]);

    // Detect when the order flow has reached its terminal state
    const isFlowDone = useMemo(() => {
        if (!simSnapshot) return false;
        const hasTpSl = simSnapshot.tpEnabled || simSnapshot.slEnabled;
        if (hasTpSl) {
            return nodeStates['tp_filled'] === 'filled_terminal' || nodeStates['sl_filled'] === 'filled_terminal';
        }
        return nodeStates['filled'] === 'active' || nodeStates['limit_filled'] === 'active' || nodeStates['stop_filled'] === 'active';
    }, [simSnapshot, nodeStates]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="text-xs font-mono text-bs-text-mute uppercase tracking-wider">Order Flow</p>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-widest bg-bs-brand/15 text-bs-brand border border-bs-brand/30">
                    {ORDER_TYPE_LABELS[orderType]}
                </span>
                {side === 'buy'
                    ? <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-bs-buy/15 text-bs-buy border border-bs-buy/30">BUY</span>
                    : <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-bs-sell/15 text-bs-sell border border-bs-sell/30">SELL</span>
                }
                {tpEnabled && <span className="px-1.5 py-0.5 text-[11px] font-mono bg-bs-buy/10 text-bs-buy/80 border border-bs-buy/20">TP</span>}
                {slEnabled && <span className="px-1.5 py-0.5 text-[11px] font-mono bg-bs-sell/10 text-bs-sell/80 border border-bs-sell/20">SL</span>}
                {simSnapshot && (
                    <span className="px-2 py-0.5 text-[11px] font-mono bg-bs-brand/10 text-bs-brand/80 border border-bs-brand/20">
                        SIM RUNNING
                    </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                    {zoom === 1 && (
                        <span className="text-[9px] font-mono text-bs-text-tertiary italic mr-1">zoom in to pan</span>
                    )}
                    <button onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-mono text-bs-text-mute hover:text-bs-text-secondary bg-bs-card border border-bs-border hover:border-bs-border transition-colors">−</button>
                    <span className="text-[10px] font-mono text-bs-text-mute w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.25).toFixed(2))))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-mono text-bs-text-mute hover:text-bs-text-secondary bg-bs-card border border-bs-border hover:border-bs-border transition-colors">+</button>
                </div>
            </div>

            {/* Diagram (centered) */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className="flex-1 overflow-auto min-h-0 select-none cursor-grab custom-scrollbar"
            >
                <div style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: layout.width * zoom,
                    height: layout.height * zoom,
                    minWidth: '100%',
                    minHeight: '100%',
                }}>
                    <svg width="100%" height="100%"
                        viewBox={`0 0 ${layout.width} ${layout.height}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ display: 'block' }}>
                        <defs>
                            <marker id="arr-neutral" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="var(--bs-text-mute)" />
                            </marker>
                            <marker id="arr-tp" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="var(--bs-chart-green)" />
                            </marker>
                            <marker id="arr-sl" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="var(--bs-chart-red)" />
                            </marker>
                            <marker id="arr-dashed" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="var(--bs-text-mute)" />
                            </marker>
                        </defs>
                        {layout.edges.map((e, i) => <EdgeLine key={i} edge={e} />)}
                        {layout.nodes.map(n => (
                            <NodeBox
                                key={n.id}
                                node={n}
                                side={side}
                                nodeState={simSnapshot ? (nodeStates[n.id] ?? 'future') : 'skeleton'}
                            />
                        ))}
                    </svg>
                </div>
            </div>

            {/* Flow Done Banner */}
            {isFlowDone && (
                <div className="flex items-center justify-center gap-2 py-2 mt-1 border border-bs-buy/15 bg-bs-success/5">
                    <span className="text-[10px] font-mono text-bs-success/70">Order flow complete</span>
                    <span className="text-[10px] font-mono text-bs-text-mute">—</span>
                    <span className="text-[10px] font-mono text-bs-text-mute">Re-run Simulation to replay</span>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-bs-border flex-wrap">
                {([
                    { color: 'var(--bs-brand)', label: 'Start' },
                    { color: 'var(--bs-info)', label: 'State' },
                    { color: 'var(--bs-success)', label: 'Filled' },
                    { color: 'var(--bs-chart-green)', label: 'TP' },
                    { color: 'var(--bs-chart-red)', label: 'SL' },
                    { color: 'var(--bs-text-mute)', label: 'Cancelled' },
                ] as { color: string; label: string }[]).map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ borderColor: color, background: color }} />
                        <span className="text-[10px] font-mono text-bs-text-tertiary">{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3 ml-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-sm border-2 bg-bs-info/30 border-bs-info/60 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-bs-text-tertiary">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border flex-shrink-0 opacity-40" style={{ borderColor: 'var(--bs-border)', background: 'var(--bs-bg-primary)' }} />
                        <span className="text-[10px] font-mono text-bs-text-tertiary">Done</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
export default OrderFlowVisualiser;

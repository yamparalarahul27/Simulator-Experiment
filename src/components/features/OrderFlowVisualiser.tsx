'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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

const NODE_W = 108;
const NODE_H = 54;
const DEPTH_GAP = 80;
const SIBLING_GAP = 52;
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

// ─── Active Node Logic ─────────────────────────────────────────────────────────

function computeActiveNode(
    snap: SimConfig,
    simPrice: number,
    maxExtremum: number,
    sessionMin: number,
    sessionMax: number,
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

    // TP/SL logic: use session extrema so TP/SL stay fired even if price retraces
    if ((mainFilled || orderType === 'twap') && (tpEnabled || slEnabled)) {
        const prevActive = activeIds;
        completedIds = [...completedIds];
        activeIds = [];

        // TP/SL hit = session extremum ever reached the target (after fill)
        const tpHit = tpEnabled && tpPrice !== null &&
            (side === 'buy' ? sessionMax >= tpPrice : sessionMin <= tpPrice);
        const slHit = slEnabled && slPrice !== null &&
            (side === 'buy' ? sessionMin <= slPrice : sessionMax >= slPrice);

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

export function computeKnobColor(snap: SimConfig | null, simPrice: number, maxExtremum: number, sessionMin: number, sessionMax: number): string {
    if (!snap) return 'bg-white/20 border-white/30';
    const { activeIds } = computeActiveNode(snap, simPrice, maxExtremum, sessionMin, sessionMax);

    if (activeIds.includes('tp_filled')) return 'bg-emerald-400 border-emerald-300';
    if (activeIds.includes('sl_filled')) return 'bg-red-500 border-red-400';
    if (activeIds.includes('filled') || activeIds.includes('limit_filled') || activeIds.includes('stop_filled')) return 'bg-green-500 border-green-400';
    if (activeIds.some(id => id === 'cancel')) return 'bg-gray-600 border-gray-500';
    return 'bg-blue-500 border-blue-400';
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

const NODE_STYLE: Record<NodeKind, { fill: string; activeFill: string; stroke: string; text: string; sub: string }> = {
    start: { fill: 'rgba(139,92,246,0.15)', activeFill: 'rgba(139,92,246,0.40)', stroke: 'rgba(139,92,246,0.80)', text: '#c4b5fd', sub: 'rgba(196,181,253,0.55)' },
    state: { fill: 'rgba(255,255,255,0.04)', activeFill: 'rgba(255,255,255,0.14)', stroke: 'rgba(255,255,255,0.50)', text: '#e2e8f0', sub: 'rgba(226,232,240,0.55)' },
    terminal: { fill: 'rgba(34,197,94,0.12)', activeFill: 'rgba(34,197,94,0.38)', stroke: 'rgba(34,197,94,0.75)', text: '#86efac', sub: 'rgba(134,239,172,0.55)' },
    tp: { fill: 'rgba(34,197,94,0.10)', activeFill: 'rgba(34,197,94,0.34)', stroke: 'rgba(34,197,94,0.70)', text: '#4ade80', sub: 'rgba(74,222,128,0.55)' },
    sl: { fill: 'rgba(239,68,68,0.10)', activeFill: 'rgba(239,68,68,0.32)', stroke: 'rgba(239,68,68,0.70)', text: '#f87171', sub: 'rgba(248,113,113,0.55)' },
    cancel: { fill: 'rgba(255,255,255,0.02)', activeFill: 'rgba(255,255,255,0.08)', stroke: 'rgba(255,255,255,0.18)', text: '#6b7280', sub: 'rgba(107,114,128,0.45)' },
};

function resolveNodeStyle(kind: NodeKind, side: 'buy' | 'sell') {
    if (side === 'sell' && kind === 'terminal') {
        return { fill: 'rgba(239,68,68,0.12)', activeFill: 'rgba(239,68,68,0.38)', stroke: 'rgba(239,68,68,0.75)', text: '#fca5a5', sub: 'rgba(252,165,165,0.55)' };
    }
    return NODE_STYLE[kind];
}

const EDGE_STROKE: Record<EdgeColor, string> = {
    neutral: 'rgba(255,255,255,0.22)',
    tp: 'rgba(74,222,128,0.65)',
    sl: 'rgba(248,113,113,0.65)',
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
                fill={fill} stroke={s.stroke} strokeWidth={strokeW} rx={2} />
            <text
                x={node.x + NODE_W / 2} y={hasSub ? midY - 9 : midY}
                textAnchor="middle" dominantBaseline="middle"
                fill={s.text} fontSize={12} fontFamily="monospace" fontWeight="700"
                letterSpacing="0.06em"
            >{node.label}</text>
            {hasSub && (
                <text
                    x={node.x + NODE_W / 2} y={midY + 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={s.sub} fontSize={10} fontFamily="monospace"
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
                const labelW = edge.label.length * 6.5;
                return (
                    <g>
                        <rect x={mid.x - labelW / 2 - 3} y={mid.y - 9} width={labelW + 6} height={14}
                            fill="rgba(0,0,0,0.6)" rx={2} />
                        <text x={mid.x} y={mid.y} textAnchor="middle"
                            fill="rgba(255,255,255,0.45)" fontSize={10} fontFamily="monospace">
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

export default function OrderFlowVisualiser({
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

    let sessionMin = savedMin;
    let sessionMax = savedMax;

    if (simSnapshot !== prevSnap) {
        setPrevSnap(simSnapshot);
        setSavedMin(simPrice);
        setSavedMax(simPrice);
        sessionMin = simPrice;
        sessionMax = simPrice;
    } else {
        let changed = false;
        if (simPrice < sessionMin) { sessionMin = simPrice; changed = true; }
        if (simPrice > sessionMax) { sessionMax = simPrice; changed = true; }
        if (changed) {
            setSavedMin(sessionMin);
            setSavedMax(sessionMax);
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
        const { activeIds } = computeActiveNode(simSnapshot, simPrice, maxExtremum, sessionMin, sessionMax);
        const mainFilled = activeIds.includes('filled') || activeIds.includes('tp_filled') || activeIds.includes('sl_filled')
            || activeIds.includes('limit_filled') || activeIds.includes('stop_filled');
        return applySimValues(base, simSnapshot, formatPrice, maxExtremum, mainFilled);
    }, [orderType, tpEnabled, slEnabled, simSnapshot, formatPrice, maxExtremum, simPrice, sessionMin, sessionMax]);

    const layout = useMemo(() => computeLayout(graph), [graph]);

    // Compute per-node states based on simPrice
    const nodeStates = useMemo((): Record<string, NodeState> => {
        if (!simSnapshot) return {};
        const { activeIds, completedIds, cancelledIds } = computeActiveNode(simSnapshot, simPrice, maxExtremum, sessionMin, sessionMax);
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
    }, [simSnapshot, simPrice, maxExtremum, layout, sessionMin, sessionMax]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Order Flow</p>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    {ORDER_TYPE_LABELS[orderType]}
                </span>
                {side === 'buy'
                    ? <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/20">BUY</span>
                    : <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">SELL</span>
                }
                {tpEnabled && <span className="px-1.5 py-0.5 text-[9px] font-mono bg-green-500/8 text-green-400/70 border border-green-500/15">TP</span>}
                {slEnabled && <span className="px-1.5 py-0.5 text-[9px] font-mono bg-red-500/8 text-red-400/70 border border-red-500/15">SL</span>}
                {simSnapshot && (
                    <span className="px-2 py-0.5 text-[9px] font-mono bg-purple-500/10 text-purple-400/70 border border-purple-500/15">
                        SIM RUNNING
                    </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                    {zoom === 1 && (
                        <span className="text-[9px] font-mono text-white/20 italic mr-1">zoom in to pan</span>
                    )}
                    <button onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-mono text-white/40 hover:text-white/70 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">−</button>
                    <span className="text-[10px] font-mono text-white/30 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.25).toFixed(2))))}
                        className="w-6 h-6 flex items-center justify-center text-xs font-mono text-white/40 hover:text-white/70 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">+</button>
                </div>
            </div>

            {/* Diagram (centered) */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className={`flex-1 overflow-auto flex items-start justify-center min-h-0 select-none cursor-grab custom-scrollbar`}
            >
                <div style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: layout.width * zoom,
                    height: layout.height * zoom,
                }}>
                    <svg width={layout.width} height={layout.height}
                        viewBox={`0 0 ${layout.width} ${layout.height}`}
                        style={{ display: 'block' }}>
                        <defs>
                            <marker id="arr-neutral" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.35)" />
                            </marker>
                            <marker id="arr-tp" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="rgba(74,222,128,0.75)" />
                            </marker>
                            <marker id="arr-sl" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="rgba(248,113,113,0.75)" />
                            </marker>
                            <marker id="arr-dashed" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                                <path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.18)" />
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

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5 flex-wrap">
                {([
                    { color: 'rgba(139,92,246,0.55)', label: 'Start' },
                    { color: 'rgba(255,255,255,0.18)', label: 'State' },
                    { color: 'rgba(34,197,94,0.45)', label: 'Filled' },
                    { color: 'rgba(74,222,128,0.5)', label: 'TP' },
                    { color: 'rgba(248,113,113,0.5)', label: 'SL' },
                    { color: 'rgba(255,255,255,0.08)', label: 'Cancelled' },
                ] as { color: string; label: string }[]).map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 border flex-shrink-0" style={{ borderColor: color, background: color }} />
                        <span className="text-[8px] font-mono text-white/30">{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3 ml-2">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border-2 bg-blue-500/30 border-blue-400/60 flex-shrink-0" />
                        <span className="text-[8px] font-mono text-white/30">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 border flex-shrink-0 opacity-40" style={{ borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }} />
                        <span className="text-[8px] font-mono text-white/30">Done</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

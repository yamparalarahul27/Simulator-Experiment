'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { SimConfig } from './OrderFlowVisualiser';

interface Props {
    simSnapshot: SimConfig | null;
    simPrice: number;
    formatPrice: (n: number, d?: number) => string;
}

// ─── P&L Helpers ──────────────────────────────────────────────────────────────

interface PnlResult {
    pricePerUnit: number;
    total: number;
    pct: number;
}

type ResponseTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface ResponseRow {
    label: string;
    value: string;
    sub?: string;
    className?: string;
}

interface MarketResponse {
    tone: ResponseTone;
    status: string;
    headline: string;
    detail: string;
    rows: ResponseRow[];
}

function calcPnl(entry: number, exit: number, amount: number, side: 'buy' | 'sell'): PnlResult {
    const pricePerUnit = side === 'buy' ? exit - entry : entry - exit;
    const total = pricePerUnit * amount;
    const pct = (pricePerUnit / entry) * 100;
    return { pricePerUnit, total, pct };
}

function formatSignedPrice(value: number, formatPrice: (n: number, d?: number) => string) {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formatPrice(Math.abs(value))}`;
}

function formatSignedPct(value: number) {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function distanceTo(current: number, target: number, formatPrice: (n: number, d?: number) => string) {
    const diff = target - current;
    const pct = target > 0 ? (Math.abs(diff) / target) * 100 : 0;
    const direction = diff > 0 ? 'above market' : diff < 0 ? 'below market' : 'at market';
    return {
        value: formatPrice(Math.abs(diff)),
        sub: `${pct.toFixed(2)}% ${direction}`,
    };
}

function hitForSide(side: 'buy' | 'sell', current: number, target: number, mode: 'above' | 'below') {
    if (mode === 'above') return side === 'buy' ? current >= target : current <= target;
    return side === 'buy' ? current <= target : current >= target;
}

function getMarketResponse(
    snap: SimConfig,
    simPrice: number,
    effectiveEntry: number,
    formatPrice: (n: number, d?: number) => string,
): MarketResponse {
    const current = simPrice || snap.entryPrice;
    const side = snap.side;
    const amount = snap.amount;
    const movePct = snap.entryPrice > 0 ? ((current - snap.entryPrice) / snap.entryPrice) * 100 : 0;
    const livePnl = effectiveEntry > 0 ? calcPnl(effectiveEntry, current, amount, side) : null;
    const baseRows: ResponseRow[] = [
        {
            label: 'Sim market',
            value: formatPrice(current),
            sub: `${formatSignedPct(movePct)} from submitted price`,
            className: movePct >= 0 ? 'text-bs-success' : 'text-bs-error',
        },
        {
            label: 'Position value',
            value: formatPrice(current * amount),
            sub: `${amount.toFixed(4)} ${snap.pair.split('/')[0]}`,
        },
    ];

    if (livePnl) {
        baseRows.push({
            label: 'Live P&L',
            value: formatSignedPrice(livePnl.total, formatPrice),
            sub: `${formatSignedPrice(livePnl.pricePerUnit, formatPrice)} / unit, ${formatSignedPct(livePnl.pct)}`,
            className: livePnl.total >= 0 ? 'text-bs-success' : 'text-bs-error',
        });
    }

    const response = (
        tone: ResponseTone,
        status: string,
        headline: string,
        detail: string,
        rows: ResponseRow[] = [],
    ): MarketResponse => ({ tone, status, headline, detail, rows: [...rows, ...baseRows] });

    switch (snap.orderType) {
        case 'market':
            return response(
                'success',
                'Filled',
                'Market order is already filled.',
                'Moving the scale now shows mark-to-market value after the instant fill.',
                [{ label: 'Fill reference', value: formatPrice(snap.entryPrice), sub: 'Best available market price' }],
            );

        case 'limit': {
            const limit = snap.price ?? snap.entryPrice;
            const filled = hitForSide(side, current, limit, 'below');
            const distance = distanceTo(current, limit, formatPrice);
            return response(
                filled ? 'success' : 'warning',
                filled ? 'Filled' : 'Resting',
                filled ? 'Market touched the limit, so the exchange can fill it.' : 'Order is waiting on the book.',
                side === 'buy'
                    ? 'Buy limit fills when market trades at or below your limit price.'
                    : 'Sell limit fills when market trades at or above your limit price.',
                [
                    { label: 'Limit price', value: formatPrice(limit), sub: filled ? 'Fill condition met' : distance.sub },
                    { label: filled ? 'Fill gap' : 'Distance to fill', value: distance.value },
                ],
            );
        }

        case 'iceberg': {
            const limit = snap.price ?? snap.entryPrice;
            const filled = hitForSide(side, current, limit, 'below');
            const distance = distanceTo(current, limit, formatPrice);
            return response(
                filled ? 'success' : 'warning',
                filled ? 'Slicing fills' : 'Visible slice resting',
                filled ? 'The visible slice can fill; the system refreshes the next hidden slice.' : 'Only the visible quantity is posted until price reaches the limit.',
                'Iceberg behaves like a limit order, but it exposes the total size in smaller chunks.',
                [
                    { label: 'Slice limit', value: formatPrice(limit), sub: filled ? 'Current slice can execute' : distance.sub },
                    { label: 'Hidden total', value: `${amount.toFixed(4)} ${snap.pair.split('/')[0]}`, sub: 'Revealed in chunks' },
                ],
            );
        }

        case 'stop_market': {
            const stop = snap.stopPrice ?? snap.entryPrice;
            const triggered = hitForSide(side, current, stop, 'above');
            const distance = distanceTo(current, stop, formatPrice);
            return response(
                triggered ? 'success' : 'info',
                triggered ? 'Triggered' : 'Watching',
                triggered ? 'Stop is hit, so the system sends a market order.' : 'System is watching the stop trigger.',
                side === 'buy'
                    ? 'Buy stop triggers when market rises to or through the stop price.'
                    : 'Sell stop triggers when market falls to or through the stop price.',
                [
                    { label: 'Stop trigger', value: formatPrice(stop), sub: triggered ? 'Trigger condition met' : distance.sub },
                    { label: triggered ? 'Estimated market fill' : 'Distance to trigger', value: triggered ? formatPrice(current) : distance.value },
                ],
            );
        }

        case 'stop_limit': {
            const stop = snap.stopPrice ?? snap.entryPrice;
            const limit = snap.limitPrice ?? stop;
            const triggered = hitForSide(side, current, stop, 'above');
            const limitCanFill = triggered && (side === 'buy' ? current <= limit : current >= limit);
            const stopDistance = distanceTo(current, stop, formatPrice);
            const limitDistance = distanceTo(current, limit, formatPrice);
            return response(
                limitCanFill ? 'success' : triggered ? 'warning' : 'info',
                limitCanFill ? 'Triggered + fillable' : triggered ? 'Triggered + resting' : 'Watching',
                limitCanFill ? 'Stop is hit and market is inside your limit cap.' : triggered ? 'Stop is hit, but the limit leg is now resting.' : 'System is waiting for the stop trigger.',
                'Stop-limit is two steps: stop creates the order, then the limit controls the execution price.',
                [
                    { label: 'Stop trigger', value: formatPrice(stop), sub: triggered ? 'Trigger condition met' : stopDistance.sub },
                    { label: 'Limit cap', value: formatPrice(limit), sub: limitCanFill ? 'Limit condition met' : limitDistance.sub },
                ],
            );
        }

        case 'twap': {
            const sliceValue = amount > 0 ? current * (amount / 6) : 0;
            return response(
                'info',
                'Scheduling slices',
                'TWAP keeps splitting the order across time instead of reacting to one price tick.',
                'The market scale changes the estimated value of each slice, but the schedule still controls execution.',
                [
                    { label: 'Slice estimate', value: formatPrice(sliceValue), sub: 'Approx. 1 of 6 slices' },
                    { label: 'Total notional', value: formatPrice(current * amount), sub: 'At simulated market' },
                ],
            );
        }

        case 'trailing_stop': {
            const activation = snap.price ?? snap.entryPrice;
            const trailPct = snap.stopPrice ?? 0;
            const activated = side === 'buy' ? current <= activation : current >= activation;
            const trailLine = activated
                ? side === 'buy'
                    ? current * (1 + trailPct / 100)
                    : current * (1 - trailPct / 100)
                : side === 'buy'
                    ? activation * (1 + trailPct / 100)
                    : activation * (1 - trailPct / 100);
            const distance = distanceTo(current, activation, formatPrice);
            return response(
                activated ? 'warning' : 'info',
                activated ? 'Tracking trail' : 'Waiting activation',
                activated ? 'Activation is hit, so the trailing line now moves with favorable price.' : 'Trailing logic has not started yet.',
                side === 'buy'
                    ? 'Buy trailing stop activates after price dips, then triggers on a rebound by the trail delta.'
                    : 'Sell trailing stop activates after price rises, then triggers on a pullback by the trail delta.',
                [
                    { label: 'Activation', value: formatPrice(activation), sub: activated ? 'Activation condition met' : distance.sub },
                    { label: 'Trail line', value: formatPrice(trailLine), sub: `${trailPct.toFixed(2)}% trail delta` },
                ],
            );
        }

        case 'oco': {
            const limit = snap.price ?? snap.entryPrice;
            const stop = snap.stopPrice ?? snap.entryPrice;
            const limitHit = hitForSide(side, current, limit, 'below');
            const stopHit = hitForSide(side, current, stop, 'above');
            const limitDistance = distanceTo(current, limit, formatPrice);
            const stopDistance = distanceTo(current, stop, formatPrice);
            const status = limitHit ? 'Limit leg filled' : stopHit ? 'Stop leg filled' : 'Both legs resting';
            return response(
                limitHit || stopHit ? 'success' : 'warning',
                status,
                limitHit ? 'Limit leg wins; the stop leg is cancelled.' : stopHit ? 'Stop leg wins; the limit leg is cancelled.' : 'Both OCO legs remain live.',
                'OCO means whichever side is hit first executes, and the system cancels the other leg.',
                [
                    { label: 'Limit leg', value: formatPrice(limit), sub: limitHit ? 'Filled, stop leg cancelled' : limitDistance.sub },
                    { label: 'Stop leg', value: formatPrice(stop), sub: stopHit ? 'Filled, limit leg cancelled' : stopDistance.sub },
                ],
            );
        }
    }

    return response(
        'neutral',
        'Simulating',
        'Move the market price scale to inspect this order.',
        'The system response updates from the simulated market price.',
    );
}

// ─── Order-Type Info ───────────────────────────────────────────────────────────

function getOrderContext(snap: SimConfig): { headline: string; detail: string } {
    const { orderType, side, price, stopPrice, limitPrice } = snap;
    const S = side.toUpperCase();

    switch (orderType) {
        case 'market':
            return {
                headline: `${S} executes instantly at current market price.`,
                detail: 'Market orders fill immediately at the best available price. No price guarantee.',
            };
        case 'limit':
            return {
                headline: `${S} limit order rests until price reaches ${price ? `$${price.toFixed(4)}` : '—'}.`,
                detail: `Order only fills at ${price ? `$${price.toFixed(4)}` : 'your limit price'} or better. Will not fill if market never reaches that level.`,
            };
        case 'stop_market':
            return {
                headline: `Trigger at ${stopPrice ? `$${stopPrice.toFixed(4)}` : '—'} → instant market ${S}.`,
                detail: 'Once the stop price is hit, a market order fires immediately. Fill price may differ slightly from the trigger.',
            };
        case 'stop_limit':
            return {
                headline: `Trigger at ${stopPrice ? `$${stopPrice.toFixed(4)}` : '—'} → limit at ${limitPrice ? `$${limitPrice.toFixed(4)}` : '—'}.`,
                detail: 'Stop triggers the order. A limit order then rests at your limit price. Risk: the limit order may not fill if the market moves too fast.',
            };
        case 'iceberg':
            return {
                headline: 'Large order split into hidden chunks to reduce market impact.',
                detail: 'Only a small "visible quantity" is shown on the order book at a time. New chunks appear as each fills, masking the total size.',
            };
        case 'twap':
            return {
                headline: 'Order split into equal slices executed over time.',
                detail: 'TWAP (Time-Weighted Average Price) reduces timing risk by spreading fills over multiple intervals instead of all at once.',
            };
        case 'trailing_stop':
            return {
                headline: `Trailing stop locks in gains as price moves in your favour.`,
                detail: `The stop level adjusts dynamically as price improves. If price reverses by the trailing delta, the order triggers. Activation price: ${price ? `$${price.toFixed(4)}` : 'immediate'}, Trail: ${stopPrice ? `${stopPrice}%` : '—'}.`,
            };
        case 'oco':
            return {
                headline: 'Two orders — only one can fill. The other cancels automatically.',
                detail: `OCO (One-Cancels-Other): a limit leg at $${price?.toFixed(4) ?? '—'} and a stop leg at $${stopPrice?.toFixed(4) ?? '—'}. Whichever is hit first fills and cancels the other.`,
            };
        default:
            return { headline: '', detail: '' };
    }
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function Row({ label, value, sub, className = '' }: { label: string; value: string; sub?: string; className?: string }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-xs text-bs-text-mute">{label}</span>
            <div className="text-right">
                <span className={`text-xs font-mono font-semibold ${className}`}>{value}</span>
                {sub && <span className="block text-[10px] text-bs-text-mute">{sub}</span>}
            </div>
        </div>
    );
}

function Divider() {
    return <div className="border-t border-bs-border my-2" />;
}

const RESPONSE_STYLES: Record<ResponseTone, { badge: string; box: string }> = {
    success: {
        badge: 'border-bs-buy/20 bg-bs-success/10 text-bs-success',
        box: 'border-bs-buy/20 bg-bs-success/8',
    },
    warning: {
        badge: 'border-bs-warning/20 bg-bs-warning/10 text-bs-warning',
        box: 'border-bs-warning/20 bg-bs-warning/8',
    },
    error: {
        badge: 'border-bs-sell/20 bg-bs-error/10 text-bs-error',
        box: 'border-bs-sell/20 bg-bs-error/8',
    },
    info: {
        badge: 'border-bs-info/20 bg-bs-info/10 text-bs-brand-ts',
        box: 'border-bs-info/20 bg-bs-info/8',
    },
    neutral: {
        badge: 'border-bs-border bg-bs-card-fg text-bs-text-tertiary',
        box: 'border-bs-border bg-bs-card-fg',
    },
};

function MarketResponseBlock({ response }: { response: MarketResponse }) {
    const style = RESPONSE_STYLES[response.tone];
    const primaryRow = response.rows.find(row => row.label === 'Sim market') ?? response.rows[0];
    const metricRows = response.rows.filter(row => row !== primaryRow);

    return (
        <div className={`rounded-lg border p-3 ${style.box}`}>
            <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide ${style.badge}`}>
                        {response.status}
                    </span>
                    {primaryRow && (
                        <div className="min-w-0 text-right">
                            <div className={`font-mono text-sm font-bold ${primaryRow.className ?? 'text-bs-text-primary'}`}>
                                {primaryRow.value}
                            </div>
                            {primaryRow.sub && (
                                <div className="mt-0.5 text-[9px] leading-tight text-bs-text-mute">{primaryRow.sub}</div>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold leading-snug text-bs-text-primary">{response.headline}</p>
                    <p className="mt-1 text-xs leading-relaxed text-bs-text-secondary">{response.detail}</p>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {metricRows.map(row => (
                    <div
                        key={`${row.label}-${row.value}`}
                        className="min-w-0 rounded-md border border-bs-border/70 bg-bs-card/50 px-2.5 py-2"
                    >
                        <div className="text-[9px] uppercase tracking-wide text-bs-text-mute">{row.label}</div>
                        <div className={`mt-1 truncate font-mono text-xs font-semibold ${row.className ?? 'text-bs-text-primary'}`}>
                            {row.value}
                        </div>
                        {row.sub && <div className="mt-0.5 truncate text-[9px] text-bs-text-mute">{row.sub}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ScenarioBlock({
    type,
    price,
    pnl,
    formatPrice,
}: {
    type: 'tp' | 'sl';
    price: number;
    pnl: PnlResult;
    formatPrice: (n: number, d?: number) => string;
}) {
    const isProfit = type === 'tp';
    const color = isProfit ? 'text-bs-success' : 'text-bs-error';
    const bgColor = isProfit ? 'bg-bs-success/8 border-bs-buy/15' : 'bg-bs-error/8 border-bs-sell/15';
    const label = isProfit ? 'Take Profit' : 'Stop Loss';
    const sign = pnl.total >= 0 ? '+' : '';

    return (
        <div className={`rounded px-3 py-2 border ${bgColor} space-y-1`}>
            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${color}`}>
                    {isProfit ? '↑' : '↓'} {label}
                </span>
                <span className={`text-[9px] font-mono text-bs-text-mute`}>
                    {isProfit ? 'Auto sell at profit' : 'Auto sell to limit loss'}
                </span>
            </div>

            <Divider />

            <Row
                label="Trigger Price"
                value={formatPrice(price)}
                className={color}
            />
            <Row
                label="Per Unit"
                value={`${sign}${formatPrice(Math.abs(pnl.pricePerUnit))}`}
                sub={`${sign}${pnl.pct.toFixed(2)}%`}
                className={color}
            />
            <Row
                label="Total P&L"
                value={`${sign}${formatPrice(Math.abs(pnl.total))}`}
                className={`${color} text-sm`}
            />
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const TradeSummaryPanel = React.memo(function TradeSummaryPanel({ simSnapshot, simPrice, formatPrice }: Props) {
    const [eduOpen, setEduOpen] = useState(false);
    const [contextOpen, setContextOpen] = useState(false);

    const data = useMemo(() => {
        if (!simSnapshot) return null;

        const { side, amount, tpEnabled, slEnabled, tpPrice, slPrice, entryPrice, orderType, price } = simSnapshot;
        // For limit orders, use limit price as entry reference. For others, use entryPrice.
        const effectiveEntry = orderType === 'limit' && price ? price : entryPrice;

        const tp = tpEnabled && tpPrice && effectiveEntry > 0
            ? calcPnl(effectiveEntry, tpPrice, amount, side)
            : null;
        const sl = slEnabled && slPrice && effectiveEntry > 0
            ? calcPnl(effectiveEntry, slPrice, amount, side)
            : null;

        const rrRatio = tp && sl && Math.abs(sl.pricePerUnit) > 0
            ? (Math.abs(tp.pricePerUnit) / Math.abs(sl.pricePerUnit)).toFixed(2)
            : null;

        const context = getOrderContext(simSnapshot);
        const marketResponse = getMarketResponse(simSnapshot, simPrice, effectiveEntry, formatPrice);

        return { tp, sl, rrRatio, effectiveEntry, context, marketResponse };
    }, [formatPrice, simPrice, simSnapshot]);

    if (!simSnapshot || !data) return null;

    const { tp, sl, rrRatio, effectiveEntry, context, marketResponse } = data;
    const token = simSnapshot.pair.split('/')[0];
    const hasTpSl = tp || sl;

    return (
        <div className="space-y-3">
            {/* Order Snapshot */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border ${simSnapshot.side === 'buy'
                    ? 'bg-bs-buy/10 text-bs-buy border-bs-buy/20'
                    : 'bg-bs-sell/10 text-bs-sell border-bs-sell/20'
                    }`}>
                    {simSnapshot.side.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-bs-brand-tertiary/10 text-bs-brand border border-bs-brand-tertiary/20">
                    {simSnapshot.orderType.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs font-mono text-bs-text-tertiary">
                    {simSnapshot.amount.toFixed(4)} {token}
                </span>
                <span className="text-xs font-mono text-bs-text-mute">@</span>
                <span className="text-xs font-mono text-bs-text-primary font-bold">
                    {formatPrice(effectiveEntry)}
                </span>
            </div>

            <MarketResponseBlock response={marketResponse} />

            {/* Order Context */}
            <div className="overflow-hidden rounded-lg border border-bs-info/20 bg-bs-info/8">
                <button
                    type="button"
                    onClick={() => setContextOpen(v => !v)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bs-info/10"
                    aria-expanded={contextOpen}
                >
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-mono uppercase tracking-widest text-bs-text-mute">Order logic</div>
                        <div className="mt-0.5 truncate text-xs font-semibold text-bs-text-primary">{context.headline}</div>
                    </div>
                    <span className="shrink-0 text-bs-text-mute">
                        {contextOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                </button>
                {contextOpen && (
                    <div className="border-t border-bs-info/15 px-3 py-2">
                        <p className="text-xs leading-relaxed text-bs-text-secondary">{context.detail}</p>
                    </div>
                )}
            </div>

            {/* P&L Scenarios */}
            {hasTpSl && (
                <>
                    <Divider />
                    <div className="space-y-2">
                        {tp && simSnapshot.tpPrice && (
                            <ScenarioBlock type="tp" price={simSnapshot.tpPrice} pnl={tp} formatPrice={formatPrice} />
                        )}
                        {sl && simSnapshot.slPrice && (
                            <ScenarioBlock type="sl" price={simSnapshot.slPrice} pnl={sl} formatPrice={formatPrice} />
                        )}
                    </div>

                    {/* Risk/Reward */}
                    {rrRatio && (
                        <>
                            <Divider />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-bs-text-mute">Risk / Reward</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold text-bs-text-primary">
                                        1 : {rrRatio}
                                    </span>
                                    <span className={`text-[9px] font-mono ${parseFloat(rrRatio) >= 1.5 ? 'text-bs-success' : parseFloat(rrRatio) >= 1 ? 'text-bs-warning' : 'text-bs-error'}`}>
                                        {parseFloat(rrRatio) >= 2 ? '✓ Favourable' : parseFloat(rrRatio) >= 1 ? '~ Neutral' : '✗ Unfavourable'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-bs-text-tertiary">
                                For every $1 risked, potential gain is ${rrRatio}
                            </p>
                        </>
                    )}
                </>
            )}

            {/* No TP/SL message for limit orders */}
            {simSnapshot.orderType === 'limit' && !hasTpSl && (
                <p className="text-xs text-bs-text-secondary">
                    Enable TP and/or SL on the order form to see profit/loss projections.
                </p>
            )}

            {/* Educational Callout */}
            <Divider />
            <button
                onClick={() => setEduOpen(v => !v)}
                className="w-full flex items-center gap-2 text-[10px] font-mono text-bs-text-mute hover:text-bs-text-tertiary transition-colors"
            >
                <Info size={11} className="shrink-0 text-bs-text-mute" />
                <span>How does TP / SL work?</span>
                <span className="ml-auto">{eduOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</span>
            </button>

            {eduOpen && (
                <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                        <TrendingUp size={12} className="text-bs-success shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-mono text-bs-success font-bold">Take Profit = Auto Sell at Profit</p>
                            <p className="text-[9px] font-mono text-bs-text-primary/35 leading-relaxed mt-0.5">
                                When price reaches your target, the position is automatically sold to lock in the gain. The trade is then closed.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <TrendingDown size={12} className="text-bs-error shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-mono text-bs-error font-bold">Stop Loss = Auto Sell to Prevent Loss</p>
                            <p className="text-[9px] font-mono text-bs-text-primary/35 leading-relaxed mt-0.5">
                                If price drops to your stop level, the asset is sold automatically to prevent further loss. The trade is closed.
                            </p>
                        </div>
                    </div>
                    <div className="bg-bs-warning/5 border border-bs-warning/10 px-2 py-1.5 rounded">
                        <p className="text-[9px] font-mono text-bs-warning/70 leading-relaxed">
                            ⚠ Stop Loss does NOT rebuy the asset at a lower price. It <span className="font-bold">closes the position</span>. To re-enter, you must place a new order manually.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});
export default TradeSummaryPanel;

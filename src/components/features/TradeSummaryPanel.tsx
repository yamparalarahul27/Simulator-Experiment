'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { SimConfig } from './OrderFlowVisualiser';

interface Props {
    simSnapshot: SimConfig | null;
    formatPrice: (n: number, d?: number) => string;
}

// ─── P&L Helpers ──────────────────────────────────────────────────────────────

interface PnlResult {
    pricePerUnit: number;
    total: number;
    pct: number;
}

function calcPnl(entry: number, exit: number, amount: number, side: 'buy' | 'sell'): PnlResult {
    const pricePerUnit = side === 'buy' ? exit - entry : entry - exit;
    const total = pricePerUnit * amount;
    const pct = (pricePerUnit / entry) * 100;
    return { pricePerUnit, total, pct };
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
        <div className="flex items-center justify-between py-1">
            <span className="text-[10px] font-mono text-white/40">{label}</span>
            <div className="text-right">
                <span className={`text-[11px] font-mono font-semibold ${className}`}>{value}</span>
                {sub && <span className="block text-[9px] font-mono text-white/25">{sub}</span>}
            </div>
        </div>
    );
}

function Divider() {
    return <div className="border-t border-white/5 my-2" />;
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
    const color = isProfit ? 'text-green-400' : 'text-red-400';
    const bgColor = isProfit ? 'bg-green-500/8 border-green-500/15' : 'bg-red-500/8 border-red-500/15';
    const label = isProfit ? 'Take Profit' : 'Stop Loss';
    const sign = pnl.total >= 0 ? '+' : '';

    return (
        <div className={`rounded px-3 py-2 border ${bgColor} space-y-1`}>
            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${color}`}>
                    {isProfit ? '↑' : '↓'} {label}
                </span>
                <span className={`text-[9px] font-mono text-white/30`}>
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

const TradeSummaryPanel = React.memo(function TradeSummaryPanel({ simSnapshot, formatPrice }: Props) {
    const [eduOpen, setEduOpen] = useState(false);

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

        return { tp, sl, rrRatio, effectiveEntry, context };
    }, [simSnapshot]);

    if (!simSnapshot || !data) return null;

    const { tp, sl, rrRatio, effectiveEntry, context } = data;
    const token = simSnapshot.pair.split('/')[0];
    const hasTpSl = tp || sl;

    return (
        <div className="mt-3 bg-black/40 border border-white/8 p-3 space-y-3">
            {/* Header */}
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Trade Summary</p>

            {/* Order Snapshot */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border ${simSnapshot.side === 'buy'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {simSnapshot.side.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {simSnapshot.orderType.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-white/50">
                    {simSnapshot.amount.toFixed(4)} {token}
                </span>
                <span className="text-[10px] font-mono text-white/30">@</span>
                <span className="text-[10px] font-mono text-white font-bold">
                    {formatPrice(effectiveEntry)}
                </span>
            </div>

            {/* Order Context */}
            <div className="text-[10px] font-mono text-white/50 leading-relaxed border-l-2 border-white/10 pl-2">
                {context.headline}
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
                                <span className="text-[10px] font-mono text-white/40">Risk / Reward</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold text-white">
                                        1 : {rrRatio}
                                    </span>
                                    <span className={`text-[9px] font-mono ${parseFloat(rrRatio) >= 1.5 ? 'text-green-400' : parseFloat(rrRatio) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {parseFloat(rrRatio) >= 2 ? '✓ Favourable' : parseFloat(rrRatio) >= 1 ? '~ Neutral' : '✗ Unfavourable'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-white/50">
                                For every $1 risked, potential gain is ${rrRatio}
                            </p>
                        </>
                    )}
                </>
            )}

            {/* No TP/SL message for limit orders */}
            {simSnapshot.orderType === 'limit' && !hasTpSl && (
                <p className="text-[9px] font-mono text-white/25 italic">
                    Enable TP and/or SL on the order form to see profit/loss projections.
                </p>
            )}

            {/* Educational Callout */}
            <Divider />
            <button
                onClick={() => setEduOpen(v => !v)}
                className="w-full flex items-center gap-2 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors"
            >
                <Info size={11} className="shrink-0 text-white/25" />
                <span>How does TP / SL work?</span>
                <span className="ml-auto">{eduOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</span>
            </button>

            {eduOpen && (
                <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                        <TrendingUp size={12} className="text-green-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-mono text-green-400 font-bold">Take Profit = Auto Sell at Profit</p>
                            <p className="text-[9px] font-mono text-white/35 leading-relaxed mt-0.5">
                                When price reaches your target, the position is automatically sold to lock in the gain. The trade is then closed.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <TrendingDown size={12} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-mono text-red-400 font-bold">Stop Loss = Auto Sell to Prevent Loss</p>
                            <p className="text-[9px] font-mono text-white/35 leading-relaxed mt-0.5">
                                If price drops to your stop level, the asset is sold automatically to prevent further loss. The trade is closed.
                            </p>
                        </div>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/10 px-2 py-1.5 rounded">
                        <p className="text-[9px] font-mono text-yellow-400/70 leading-relaxed">
                            ⚠ Stop Loss does NOT rebuy the asset at a lower price. It <span className="font-bold">closes the position</span>. To re-enter, you must place a new order manually.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});
export default TradeSummaryPanel;

'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { DemoOrderType } from '@/services/SupabaseDemoService';
import { cn } from '@/lib/utils';

interface OrderInfoPanelProps {
    orderType: DemoOrderType;
    side: 'buy' | 'sell';
    currency: 'USD' | 'INR';
    embedded?: boolean;
}

interface OrderInfo {
    label: string;
    badge: string;
    accent: string;
    plain: string;
    flow: [string, string, string];
    buy: string;
    sell: string;
    watch: string;
}

function price(currency: 'USD' | 'INR', n: number) {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${n}`;
}

function buildInfo(currency: 'USD' | 'INR'): Record<DemoOrderType, OrderInfo> {
    const p = (n: number) => price(currency, n);

    return {
        market: {
            label: 'Market Order',
            badge: 'Now',
            accent: 'border-bs-info text-bs-info bg-bs-info/10',
            plain: 'Executes immediately at the best available market price. Fast, but the exact fill price can move.',
            flow: ['Submit now', 'Match best price', 'Fill immediately'],
            buy: `Buying example: price is ${p(10)} and you buy now. The simulator should jump from placed to filled.`,
            sell: `Selling example: you already hold the asset and sell now. There is no waiting state.`,
            watch: 'Watch execution speed and possible slippage, not a trigger price.',
        },
        limit: {
            label: 'Limit Order',
            badge: 'Waits',
            accent: 'border-bs-success text-bs-success bg-bs-success/10',
            plain: 'Places a resting order at your chosen price. It fills only at that price or better.',
            flow: ['Set limit price', 'Rest in book', 'Fill when reached'],
            buy: `Buying example: market is ${p(10)} and your buy limit is ${p(8)}. It waits for a dip.`,
            sell: `Selling example: you own from ${p(8)} and set a sell limit at ${p(14)}. It waits for your target.`,
            watch: 'Watch whether the simulated price crosses your limit. If it never crosses, the order stays pending.',
        },
        stop_market: {
            label: 'Stop Market',
            badge: 'Trigger',
            accent: 'border-bs-warning text-bs-warning bg-bs-warning/10',
            plain: 'A trigger watches the market. Once hit, it sends a market order immediately.',
            flow: ['Set stop price', 'Trigger watches', 'Market fills'],
            buy: `Buying example: market is ${p(10)} and buy stop is ${p(12)}. It enters only if price breaks upward.`,
            sell: `Selling example: you bought at ${p(10)} and sell stop is ${p(8)}. It exits if price breaks downward.`,
            watch: 'Watch the stop line. After it triggers, the flow should move straight to filled.',
        },
        stop_limit: {
            label: 'Stop Limit',
            badge: 'Trigger + cap',
            accent: 'border-bs-brand text-bs-brand bg-bs-brand/10',
            plain: 'A trigger watches first. After it is hit, a limit order is placed at your chosen limit price.',
            flow: ['Set trigger', 'Place limit', 'Fill or wait'],
            buy: `Buying example: trigger at ${p(12)}, limit at ${p(12.5)}. It reacts to breakout but caps max price.`,
            sell: `Selling example: trigger at ${p(8)}, limit at ${p(7.8)}. It exits only if a buyer meets your limit.`,
            watch: 'Watch the two-step behavior: trigger first, then pending limit, then filled or still waiting.',
        },
        iceberg: {
            label: 'Iceberg',
            badge: 'Hidden size',
            accent: 'border-bs-text-tertiary text-bs-text-tertiary bg-bs-card-fg',
            plain: 'Splits a large order into visible slices so the full size is not shown at once.',
            flow: ['Set total size', 'Show one slice', 'Refresh until done'],
            buy: `Buying example: you want 100 units at ${p(10)}, but only show 10 at a time.`,
            sell: `Selling example: you sell in small visible chunks so the whole size does not pressure the market.`,
            watch: 'Watch partial fill, refresh, and complete states rather than one single fill.',
        },
        twap: {
            label: 'TWAP',
            badge: 'Over time',
            accent: 'border-bs-info text-bs-info bg-bs-info/10',
            plain: 'Splits the order into equal slices over time to reduce timing and market impact.',
            flow: ['Set duration', 'Send slices', 'Average the fills'],
            buy: `Buying example: spend ${p(100)} across 10 minutes instead of all at once.`,
            sell: 'Selling example: exit in slices so one large sell does not dominate the simulated flow.',
            watch: 'Watch interval and partial states. The key idea is average execution over time.',
        },
        trailing_stop: {
            label: 'Trailing Stop',
            badge: 'Moves',
            accent: 'border-bs-warning text-bs-warning bg-bs-warning/10',
            plain: 'A moving trigger follows favorable price movement, then fires when price reverses by your trail.',
            flow: ['Activate trail', 'Follow good move', 'Trigger on reversal'],
            buy: `Buying example: it follows price down, then buys when price bounces by your trail distance.`,
            sell: 'Selling example: it follows price up, then sells when price falls back by your trail distance.',
            watch: 'Watch activation and the virtual trailing line. The trigger is dynamic, not fixed.',
        },
        oco: {
            label: 'OCO',
            badge: 'One wins',
            accent: 'border-bs-error text-bs-error bg-bs-error/10',
            plain: 'Creates two linked orders. When one fills, the other cancels automatically.',
            flow: ['Place two legs', 'First leg wins', 'Other leg cancels'],
            buy: `Buying example: limit buy at ${p(8)} or stop buy at ${p(12)}. First one hit wins.`,
            sell: `Selling example: target at ${p(14)} and protection at ${p(6)}. Profit or protection, not both.`,
            watch: 'Watch the cancel path. The simulator should make the losing branch visibly cancel.',
        },
    };
}

export default function OrderInfoPanel({ orderType, side, currency, embedded = false }: OrderInfoPanelProps) {
    const [open, setOpen] = useState(false);
    const info = useMemo(() => buildInfo(currency)[orderType], [currency, orderType]);

    if (embedded) {
        return (
            <div className="space-y-2">
                <div className="rounded-md border border-bs-border bg-bs-card/60 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-bs-text-primary">{info.label}</span>
                        <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', info.accent)}>
                            {info.badge}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-bs-text-secondary">{info.plain}</p>
                </div>
                <div className="grid gap-2 text-sm leading-relaxed md:grid-cols-2">
                    <div className="rounded-md border border-bs-brand-tertiary/20 bg-bs-brand-tertiary/8 p-2 md:col-span-2">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-bs-brand">Case path</div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {info.flow.map((step, index) => (
                                <div key={step} className="rounded border border-bs-border bg-bs-card/70 p-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-bs-text-mute">Step {index + 1}</div>
                                    <div className="mt-1 text-xs font-semibold text-bs-text-primary">{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cn(
                        'rounded-md border p-2',
                        side === 'buy' ? 'border-bs-buy/30 bg-bs-buy/8' : 'border-bs-border bg-bs-card/60',
                    )}>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-buy">If buying</div>
                        <p className="text-bs-text-secondary">{info.buy}</p>
                    </div>
                    <div className={cn(
                        'rounded-md border p-2',
                        side === 'sell' ? 'border-bs-sell/30 bg-bs-sell/8' : 'border-bs-border bg-bs-card/60',
                    )}>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-sell">If selling</div>
                        <p className="text-bs-text-secondary">{info.sell}</p>
                    </div>
                    <div className="rounded-md border border-bs-info/20 bg-bs-info/8 p-2 md:col-span-2">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-info">What to watch</div>
                        <p className="text-bs-text-secondary">{info.watch}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-bs-border bg-bs-bg/45">
            <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
                <BookOpen size={14} className="shrink-0 text-bs-brand" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-bs-text-primary">{info.label}</span>
                        <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', info.accent)}>
                            {info.badge}
                        </span>
                    </div>
                    <p className="mt-1 max-h-8 overflow-hidden text-xs leading-snug text-bs-text-secondary">{info.plain}</p>
                </div>
                {open ? <ChevronUp size={14} className="text-bs-text-mute" /> : <ChevronDown size={14} className="text-bs-text-mute" />}
            </button>

            {open && (
                <div className="grid gap-2 border-t border-bs-border px-3 pb-3 pt-2 text-sm leading-relaxed md:grid-cols-2">
                    <div className="rounded-md border border-bs-brand-tertiary/20 bg-bs-brand-tertiary/8 p-2 md:col-span-2">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-bs-brand">Case path</div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {info.flow.map((step, index) => (
                                <div key={step} className="rounded border border-bs-border bg-bs-card/70 p-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-bs-text-mute">Step {index + 1}</div>
                                    <div className="mt-1 text-xs font-semibold text-bs-text-primary">{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cn(
                        'rounded-md border p-2',
                        side === 'buy' ? 'border-bs-buy/30 bg-bs-buy/8' : 'border-bs-border bg-bs-card/60',
                    )}>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-buy">If buying</div>
                        <p className="text-bs-text-secondary">{info.buy}</p>
                    </div>
                    <div className={cn(
                        'rounded-md border p-2',
                        side === 'sell' ? 'border-bs-sell/30 bg-bs-sell/8' : 'border-bs-border bg-bs-card/60',
                    )}>
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-sell">If selling</div>
                        <p className="text-bs-text-secondary">{info.sell}</p>
                    </div>
                    <div className="rounded-md border border-bs-info/20 bg-bs-info/8 p-2 md:col-span-2">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-bs-info">What to watch</div>
                        <p className="text-bs-text-secondary">{info.watch}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

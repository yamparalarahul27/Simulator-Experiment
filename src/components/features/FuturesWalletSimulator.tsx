'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, X, Wallet, Layers, Lock, RotateCcw, TrendingUp, Info, ChevronDown, ChevronUp, Sigma, History, AlertTriangle } from 'lucide-react';
import type { PriceData } from '@/lib/hooks/useSpotTrade';
import {
    buildWalletSummary,
    buildPositionView,
    requiredMargin,
    isolatedLiqPrice,
    tradeFee,
    createAccount,
    openPosition,
    closePosition,
    adjustBalance,
    adjustPositionMargin,
    settleLiquidations,
    DEFAULT_FEE_RATE,
    type AccountState,
    type LedgerEntry,
    type LedgerType,
    type DemoToken,
    type PositionSide,
    type MarginMode,
    type LiqStatus,
} from '@/lib/futuresWallet';
import { cn } from '@/lib/utils';

/**
 * FuturesWalletSimulator — Multi-position futures sandbox.
 *
 * Fund a Futures Wallet, open multiple Cross and Isolated positions across the
 * six live-priced tokens, and use the per-token "Market Scale" sliders to push
 * prices and watch how each position — and the whole account — moves toward
 * liquidation.
 *
 * The wallet is honest: opening and closing pays trading fees, closing (fully
 * or partially) realizes PnL into the balance, isolated margin can be added or
 * removed to move the liq price, and liquidations actually settle — positions
 * are removed and their margin/collateral is deducted. Every balance change is
 * recorded in the Account Ledger. See /lib/futuresWallet.ts for the math.
 */

interface Props {
    livePrices: Record<string, PriceData>;
    currency: 'USD' | 'INR';
    usdInrRate: number;
}

const TOKENS: DemoToken[] = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'XRP'];

const STATUS_COLOR: Record<LiqStatus, { text: string; bg: string; dot: string; label: string }> = {
    safe: { text: 'text-bs-success', bg: 'bg-bs-success', dot: 'bg-bs-success', label: 'Safe' },
    ok: { text: 'text-bs-info', bg: 'bg-bs-info', dot: 'bg-bs-info', label: 'OK' },
    warning: { text: 'text-bs-warning', bg: 'bg-bs-warning', dot: 'bg-bs-warning', label: 'Warning' },
    negative: { text: 'text-bs-error', bg: 'bg-bs-error', dot: 'bg-bs-error', label: 'Danger' },
    liquidated: { text: 'text-bs-text-tertiary', bg: 'bg-white/30', dot: 'bg-white/40', label: 'Liquidated' },
};

const LEDGER_BADGE: Record<LedgerType, { label: string; cls: string }> = {
    deposit: { label: 'DEPOSIT', cls: 'bg-bs-success/15 text-bs-success' },
    withdraw: { label: 'WITHDRAW', cls: 'bg-bs-warning/15 text-bs-warning' },
    open: { label: 'OPEN', cls: 'bg-bs-brand-tertiary/15 text-bs-brand' },
    close: { label: 'CLOSE', cls: 'bg-bs-card-fg text-bs-text-secondary' },
    margin_add: { label: 'MARGIN +', cls: 'bg-bs-info/15 text-bs-info' },
    margin_remove: { label: 'MARGIN −', cls: 'bg-bs-info/15 text-bs-info' },
    isolated_liq: { label: 'LIQUIDATED', cls: 'bg-bs-error/20 text-bs-error' },
    cross_liq: { label: 'ACCOUNT LIQ', cls: 'bg-bs-error/20 text-bs-error' },
};

const DEFAULT_BALANCE = 10_000;

export default function FuturesWalletSimulator({ livePrices, currency, usdInrRate }: Props) {
    // ─── Account state (balance + positions + ledger) ─────────
    const [account, setAccount] = useState<AccountState>(() => createAccount(DEFAULT_BALANCE));
    // Explicit per-token price overrides set by dragging a Market Scale slider.
    // A token absent here simply tracks its live price.
    const [simPrices, setSimPrices] = useState<Record<string, number>>({});
    const [feePct, setFeePct] = useState<number>(DEFAULT_FEE_RATE * 100); // shown as %, e.g. 0.05
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [showMath, setShowMath] = useState(false);
    // Draft strings so typing doesn't spam ledger entries / engine actions.
    const [balanceDraft, setBalanceDraft] = useState<string | null>(null);
    const [adjustDrafts, setAdjustDrafts] = useState<Record<string, string>>({});
    const [dismissedLiqId, setDismissedLiqId] = useState(0);

    const feeRate = feePct / 100;

    // ─── New-position form ────────────────────────────────────
    const [fToken, setFToken] = useState<DemoToken>('XRP');
    const [fSide, setFSide] = useState<PositionSide>('long');
    const [fMode, setFMode] = useState<MarginMode>('cross');
    const [fQty, setFQty] = useState<number>(100);
    const [fLev, setFLev] = useState<number>(10);
    const [fMmr, setFMmr] = useState<number>(0.5); // shown as %, stored as % here

    const livePrice = useCallback((t: DemoToken) => livePrices[t]?.price ?? 0, [livePrices]);

    // Tokens that currently have an open position (for the Market Scale panel).
    const heldTokens = useMemo(
        () => TOKENS.filter(t => account.positions.some(p => p.token === t)),
        [account.positions],
    );

    // Mark prices used for all accounting: sim override if set, else live.
    const markPrices = useMemo(() => {
        const m: Record<string, number> = {};
        for (const t of heldTokens) m[t] = simPrices[t] ?? livePrice(t);
        return m;
    }, [heldTokens, simPrices, livePrice]);

    // Liquidations latch: when a mark price breaches a liq line the position is
    // settled for real — removed, margin lost, ledger entry written. Mark price
    // moves from the live feed (external) as well as the drag sliders, so this
    // synchronization belongs in an effect. It cannot cascade: settleLiquidations
    // returns the same state reference when nothing breaches, so once a position
    // has settled the next run is a no-op.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- external price-feed sync; idempotent (same ref when no breach)
        setAccount(prev => settleLiquidations(prev, markPrices));
    }, [markPrices]);

    const summary = useMemo(
        () => buildWalletSummary(account.balance, account.positions, markPrices),
        [account.balance, account.positions, markPrices],
    );

    const positionViews = useMemo(
        () => account.positions.map(p => buildPositionView(p, markPrices)),
        [account.positions, markPrices],
    );

    // ─── Formatting ───────────────────────────────────────────
    const isINR = currency === 'INR';
    const symbol = isINR ? '₹' : '$';
    const convert = (n: number) => (isINR ? n * usdInrRate : n);
    const fmt = (n: number, d = 2) =>
        `${n < 0 ? '-' : ''}${symbol}${Math.abs(convert(n)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
    const fmtPx = (n: number) => fmt(n, n < 1 ? 4 : 2);
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
    const fmtQty = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });
    const fmtSigned = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n)}`;

    // Plain-English narration for a ledger entry.
    const describeEntry = (e: LedgerEntry): string => {
        switch (e.type) {
            case 'deposit': return 'Deposited into the futures wallet';
            case 'withdraw': return 'Withdrew from the futures wallet';
            case 'open':
                return `Opened ${e.side} ${fmtQty(e.quantity ?? 0)} ${e.token} @ ${fmtPx(e.price ?? 0)} (${e.marginMode}) — fee ${fmt(e.fee ?? 0)}`;
            case 'close':
                return `Closed ${Math.round((e.detail ?? 1) * 100)}% of ${e.side} ${e.token} @ ${fmtPx(e.price ?? 0)} — realized ${fmtSigned(e.realizedPnl ?? 0)}, fee ${fmt(e.fee ?? 0)}`;
            case 'margin_add':
                return `Added ${fmt(e.detail ?? 0)} margin to ${e.token} ${e.side} — liq price now ${fmtPx(e.price ?? 0)}`;
            case 'margin_remove':
                return `Removed ${fmt(e.detail ?? 0)} margin from ${e.token} ${e.side} — liq price now ${fmtPx(e.price ?? 0)}`;
            case 'isolated_liq':
                return `${e.token} ${e.side} liquidated at ${fmtPx(e.price ?? 0)} — isolated margin lost`;
            case 'cross_liq':
                return `Cross account liquidated — ${e.detail ?? 0} position${(e.detail ?? 0) === 1 ? '' : 's'} closed, cross collateral lost`;
        }
    };

    const latestLiq = account.ledger.find(e => e.type === 'isolated_liq' || e.type === 'cross_liq');
    const showLiqBanner = latestLiq != null && latestLiq.id > dismissedLiqId;

    // ─── Open / close / margin handlers ───────────────────────
    // Positions open at the current MARK (dragged sim price if set, else live)
    // so a stressed market is also the market you enter at.
    const formPrice = simPrices[fToken] ?? livePrice(fToken);
    const formMargin = requiredMargin(fQty, formPrice, fLev);
    const formFee = tradeFee(fQty, formPrice, feeRate);
    const formNotional = fQty * formPrice;
    const formLiqPrice = formPrice > 0
        ? isolatedLiqPrice({ entryPrice: formPrice, leverage: fLev, mmr: fMmr / 100, side: fSide })
        : null;
    const formLiqDistance = formPrice > 0 && formLiqPrice != null
        ? Math.max(0, ((fSide === 'long' ? formPrice - formLiqPrice : formLiqPrice - formPrice) / formPrice) * 100)
        : 0;
    const canOpen = formPrice > 0 && fQty > 0 && formMargin + formFee <= summary.freeBalance + 1e-9;
    const formCaseSteps = [
        {
            label: 'Open',
            value: formPrice > 0 ? `${fSide} ${fQty} ${fToken} at ${fmtPx(formPrice)} — fee ${fmt(formFee)}` : 'Waiting for live price',
        },
        {
            label: 'Reserve margin',
            value: `${fMode === 'cross' ? 'Uses shared pool' : 'Locks isolated margin'}: ${fmt(formMargin)}`,
        },
        {
            label: 'Stress test',
            value: fMode === 'cross'
                ? 'Watch account Margin Ratio reach 100%'
                : `Watch Mark Price move toward ${formLiqPrice != null ? fmtPx(formLiqPrice) : 'liq price'}`,
        },
    ];

    // Plain handlers — the React Compiler memoizes these automatically.
    const handleOpen = () => {
        if (!canOpen) return;
        setAccount(prev => openPosition(prev, {
            token: fToken,
            side: fSide,
            marginMode: fMode,
            quantity: fQty,
            entryPrice: formPrice,
            leverage: fLev,
            mmr: fMmr / 100,
        }, feeRate));
    };

    const handleClose = (id: string, fraction: number) => {
        setAccount(prev => closePosition(prev, id, fraction, markPrices, feeRate));
    };

    const handleAdjustMargin = (id: string, delta: number) => {
        if (delta === 0) return;
        setAccount(prev => adjustPositionMargin(prev, id, delta, markPrices));
    };

    const commitBalance = () => {
        if (balanceDraft == null) return;
        const target = Math.max(0, parseFloat(balanceDraft) || 0);
        setBalanceDraft(null);
        setAccount(prev => {
            const s = buildWalletSummary(prev.balance, prev.positions, markPrices);
            let delta = target - prev.balance;
            // Can only withdraw what isn't locked as margin.
            if (delta < 0) delta = -Math.min(-delta, s.freeBalance);
            return adjustBalance(prev, delta);
        });
    };

    const resetSandbox = () => {
        setAccount(createAccount(DEFAULT_BALANCE));
        setSimPrices({});
        setBalanceDraft(null);
        setAdjustDrafts({});
        setDismissedLiqId(0);
    };

    const resetTokenToLive = useCallback((t: DemoToken) => {
        setSimPrices(prev => {
            if (prev[t] === undefined) return prev;
            const next = { ...prev };
            delete next[t];
            return next;
        });
    }, []);

    // Per-token slider range: span entry/liq/live prices for that token, padded.
    const tokenRange = useCallback((t: DemoToken) => {
        const pts: number[] = [];
        const lp = livePrice(t);
        if (lp > 0) pts.push(lp);
        for (const v of positionViews) {
            if (v.position.token !== t) continue;
            pts.push(v.position.entryPrice);
            if (v.liqPrice != null) pts.push(v.liqPrice);
        }
        if (pts.length === 0) return { min: 0, max: 1 };
        const lo = Math.min(...pts), hi = Math.max(...pts);
        const pad = (hi - lo) * 0.25 || hi * 0.1 || 1;
        return { min: Math.max(0, lo - pad), max: hi + pad };
    }, [livePrice, positionViews]);

    // ─── Render ───────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 mb-1">
                <h2 className="text-heading-16 text-bs-text-primary">Futures Wallet & Positions</h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-bs-brand-tertiary/15 text-bs-brand border border-bs-brand-tertiary/20 self-start">
                    Cross &amp; Isolated Sandbox
                </span>
            </div>

            {/* Liquidation banner — latches until dismissed */}
            {showLiqBanner && latestLiq && (
                <div className="flex items-start justify-between gap-3 border border-bs-error/40 bg-bs-error/10 p-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-bs-error shrink-0 mt-0.5" />
                        <div>
                            <div className="text-xs font-mono font-bold text-bs-error uppercase tracking-wider mb-0.5">
                                {latestLiq.type === 'cross_liq' ? 'Cross account liquidated' : 'Position liquidated'}
                            </div>
                            <div className="text-sm text-bs-text-secondary leading-relaxed">
                                {describeEntry(latestLiq)} · balance impact <span className="text-bs-error font-mono font-bold">{fmtSigned(latestLiq.amount)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissedLiqId(latestLiq.id)}
                        className="text-bs-text-mute hover:text-bs-text-primary transition-colors"
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ═══ Wallet & Margin Summary ═══ */}
            <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-bs-brand" />
                        <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Futures Wallet</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-bs-text-mute uppercase">Balance</span>
                        <input
                            type="number"
                            value={balanceDraft ?? account.balance}
                            onFocus={() => setBalanceDraft(String(account.balance))}
                            onChange={e => setBalanceDraft(e.target.value)}
                            onBlur={commitBalance}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            className="w-28 px-2 py-1 bg-bs-card border border-bs-border text-xs font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none"
                            min={0}
                            step={500}
                            title="Edit and press Enter — the difference is booked as a deposit/withdrawal"
                        />
                        <span className="text-[10px] font-mono text-bs-text-mute uppercase">Fee %</span>
                        <input
                            type="number"
                            value={feePct}
                            onChange={e => setFeePct(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                            className="w-16 px-2 py-1 bg-bs-card border border-bs-border text-xs font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none"
                            min={0}
                            max={1}
                            step={0.01}
                            title="Trading fee, % of notional, charged on open and close"
                        />
                        <button
                            onClick={resetSandbox}
                            className="text-[10px] font-mono text-bs-text-mute hover:text-bs-text-primary border border-bs-border px-2 py-1"
                            title="Reset sandbox"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Metric grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Metric label="Wallet Balance" value={fmt(summary.walletBalance)} />
                    <Metric label="Free Balance" value={fmt(summary.freeBalance)} hint="Available to open" />
                    <Metric label="Isolated Locked" value={fmt(summary.isolatedMarginLocked)} accent="text-bs-info" />
                    <Metric label="Cross Used" value={fmt(summary.crossInitialMargin)} accent="text-bs-brand-secondary" />
                    <Metric
                        label="Unrealized PnL"
                        value={fmtSigned(summary.totalUnrealizedPnl)}
                        accent={summary.totalUnrealizedPnl >= 0 ? 'text-bs-success' : 'text-bs-error'}
                    />
                    <Metric
                        label="Total Equity"
                        value={fmt(summary.totalEquity)}
                        accent={summary.totalEquity >= summary.walletBalance ? 'text-bs-success' : 'text-bs-error'}
                    />
                    <Metric
                        label="Realized PnL"
                        value={fmtSigned(account.realizedPnl)}
                        accent={account.realizedPnl >= 0 ? 'text-bs-success' : 'text-bs-error'}
                        hint="Locked in by closes & liqs"
                    />
                    <Metric label="Fees Paid" value={fmt(account.feesPaid)} accent="text-bs-warning" hint="Open + close fees" />
                </div>

                {/* Cross account health */}
                {summary.hasCross && (
                    <div className={cn('mt-3 p-3 border bg-bs-bg/40',
                        summary.crossStatus === 'liquidated' ? 'border-bs-sell/40' : 'border-bs-border')}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider">
                                Cross Account Health
                            </span>
                            <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2', STATUS_COLOR[summary.crossStatus].dot)} />
                                <span className={cn('text-xs font-mono font-bold', STATUS_COLOR[summary.crossStatus].text)}>
                                    {summary.crossLiquidated ? 'ACCOUNT LIQUIDATED' : STATUS_COLOR[summary.crossStatus].label}
                                </span>
                            </div>
                        </div>
                        {/* health bar: remaining buffer = 1 - marginRatio */}
                        <div className="relative h-3 bg-bs-card overflow-hidden mb-2">
                            <div
                                className={cn('absolute top-0 left-0 h-full transition-all duration-300', STATUS_COLOR[summary.crossStatus].bg)}
                                style={{
                                    width: `${Math.max(2, Math.min(100, (1 - summary.crossMarginRatio) * 100))}%`,
                                    opacity: summary.crossLiquidated ? 0.3 : 0.6,
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                            <div>
                                <div className="text-bs-text-mute uppercase">Cross Equity</div>
                                <div className="text-bs-text-primary font-bold">{fmt(summary.crossEquity)}</div>
                            </div>
                            <div>
                                <div className="text-bs-text-mute uppercase">Maint. Margin</div>
                                <div className="text-bs-text-primary font-bold">{fmt(summary.crossMaintenanceMargin)}</div>
                            </div>
                            <div>
                                <div className="text-bs-text-mute uppercase">Margin Ratio</div>
                                <div className={cn('font-bold', STATUS_COLOR[summary.crossStatus].text)}>
                                    {(summary.crossMarginRatio * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-bs-text-secondary mt-2">
                            All cross positions share this collateral. When margin ratio hits 100% the cross account liquidates for real — cross positions close and the collateral is lost.
                        </p>

                        {showMath && (
                            <div className="mt-2 p-2 bg-bs-bg border border-bs-border space-y-1 text-[9px] font-mono text-bs-text-mute leading-relaxed">
                                <div><span className="text-bs-text-tertiary">Cross Collateral</span> = Wallet − Isolated Locked = {fmt(summary.walletBalance)} − {fmt(summary.isolatedMarginLocked)} = <span className="text-bs-text-primary">{fmt(summary.crossCollateral)}</span></div>
                                <div><span className="text-bs-text-tertiary">Cross Equity</span> = Collateral + Cross uPnL = {fmt(summary.crossCollateral)} + {fmt(summary.crossEquity - summary.crossCollateral)} = <span className="text-bs-text-primary">{fmt(summary.crossEquity)}</span></div>
                                <div><span className="text-bs-text-tertiary">Margin Ratio</span> = Maint. Margin ÷ Cross Equity = {fmt(summary.crossMaintenanceMargin)} ÷ {fmt(summary.crossEquity)} = <span className={STATUS_COLOR[summary.crossStatus].text}>{(summary.crossMarginRatio * 100).toFixed(1)}%</span></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Open Position + Positions list ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Open Position form */}
                <div className="lg:col-span-4 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4 space-y-3">
                    <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider flex items-center gap-2">
                        <Plus size={12} /> Open Position
                    </span>

                    {/* Token */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Token</label>
                        <div className="grid grid-cols-3 gap-1">
                            {TOKENS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFToken(t)}
                                    className={cn(
                                        'py-1.5 text-[11px] font-mono font-bold border transition-all',
                                        fToken === t
                                            ? 'bg-bs-brand-tertiary/15 text-bs-brand border-bs-brand-tertiary/40'
                                            : 'bg-bs-card text-bs-text-mute border-bs-border hover:text-bs-text-secondary',
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="text-[9px] font-mono text-bs-text-mute mt-1">
                            {simPrices[fToken] !== undefined ? 'Mark (dragged)' : 'Live'}: {formPrice > 0 ? fmtPx(formPrice) : 'Loading…'}
                        </div>
                    </div>

                    {/* Margin mode */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Margin Mode</label>
                        <div className="grid grid-cols-2 gap-0 border border-bs-border">
                            <button
                                onClick={() => setFMode('cross')}
                                className={cn('py-2 text-xs font-mono font-bold border-r border-bs-border flex items-center justify-center gap-1',
                                    fMode === 'cross' ? 'bg-bs-brand-tertiary/15 text-bs-brand' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                            >
                                <Layers size={11} /> Cross
                            </button>
                            <button
                                onClick={() => setFMode('isolated')}
                                className={cn('py-2 text-xs font-mono font-bold flex items-center justify-center gap-1',
                                    fMode === 'isolated' ? 'bg-bs-info/15 text-bs-info' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                            >
                                <Lock size={11} /> Isolated
                            </button>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-bs-text-secondary">
                            {fMode === 'cross'
                                ? 'Cross shares the wallet pool. Liquidation is account-level when maintenance margin catches equity.'
                                : 'Isolated locks margin per position. Loss is capped to that margin and has a fixed liquidation price you can move by adding margin.'}
                        </p>
                    </div>

                    {/* Side */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Side</label>
                        <div className="grid grid-cols-2 gap-0 border border-bs-border">
                            <button
                                onClick={() => setFSide('long')}
                                className={cn('py-2 text-xs font-mono font-bold border-r border-bs-border',
                                    fSide === 'long' ? 'bg-bs-success/20 text-bs-success' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                            >
                                Long
                            </button>
                            <button
                                onClick={() => setFSide('short')}
                                className={cn('py-2 text-xs font-mono font-bold',
                                    fSide === 'short' ? 'bg-bs-error/20 text-bs-error' : 'bg-bs-card text-bs-text-mute hover:bg-bs-card-fg')}
                            >
                                Short
                            </button>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Quantity ({fToken})</label>
                        <input
                            type="number"
                            value={fQty}
                            onChange={e => setFQty(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none"
                            min={0}
                            step={1}
                        />
                    </div>

                    {/* Leverage */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider">Leverage</label>
                            <span className="text-xs font-mono font-bold text-bs-brand-secondary">{fLev}x</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={fLev}
                            onChange={e => setFLev(parseInt(e.target.value))}
                            className="w-full h-1.5 appearance-none bg-bs-card-fg rounded-lg cursor-pointer accent-bs-accent-cyan
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-bs-accent-cyan [&::-webkit-slider-thumb]:rounded-lg
                                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-bs-accent-cyan [&::-moz-range-thumb]:rounded-lg [&::-moz-range-thumb]:border-0"
                        />
                    </div>

                    {/* MMR */}
                    <div>
                        <label className="text-[10px] font-mono text-bs-text-mute uppercase tracking-wider block mb-1">Maint. Margin Rate (%)</label>
                        <input
                            type="number"
                            value={fMmr}
                            onChange={e => setFMmr(Math.max(0.01, Math.min(10, parseFloat(e.target.value) || 0.5)))}
                            className="w-full px-3 py-2 bg-bs-card border border-bs-border text-sm font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none"
                            min={0.01}
                            max={10}
                            step={0.1}
                        />
                    </div>

                    {/* Order impact */}
                    <div className="rounded-lg border border-bs-brand-tertiary/20 bg-bs-brand-tertiary/10 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-bs-text-primary">Order impact</span>
                            <span className={cn('text-xs font-mono font-bold', canOpen ? 'text-bs-success' : 'text-bs-error')}>
                                Free {fmt(summary.freeBalance)}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Position value</div>
                                <div className="mt-1 font-mono font-semibold text-bs-text-primary">{formNotional > 0 ? fmt(formNotional) : '-'}</div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Margin required</div>
                                <div className="mt-1 font-mono font-semibold text-bs-brand-secondary">{fmt(formMargin)}</div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">Open fee ({feePct}%)</div>
                                <div className="mt-1 font-mono font-semibold text-bs-warning">{formFee > 0 ? fmt(formFee) : '-'}</div>
                            </div>
                            <div className="rounded-md border border-bs-border bg-bs-card/70 p-2">
                                <div className="text-[10px] uppercase tracking-wide text-bs-text-mute">{fMode === 'cross' ? 'Trigger (account pool)' : 'Est. liq price'}</div>
                                <div className={cn('mt-1 font-mono font-semibold', fMode === 'cross' ? 'text-bs-warning' : 'text-bs-error')}>
                                    {fMode === 'cross' ? 'Ratio 100%' : (formLiqPrice != null ? fmtPx(formLiqPrice) : '-')}
                                </div>
                            </div>
                        </div>
                        {fMode === 'isolated' && (
                            <p className="mt-2 text-sm leading-relaxed text-bs-text-secondary">
                                About {formLiqDistance.toFixed(2)}% adverse move from entry reaches the liquidation line.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-bs-info/20 bg-bs-info/8 p-3">
                        <div className="mb-2 text-xs font-semibold text-bs-text-primary">Case path</div>
                        <div className="space-y-2">
                            {formCaseSteps.map((step, index) => (
                                <div key={step.label} className="flex gap-2 rounded-md border border-bs-border bg-bs-card/70 p-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-bs-info/30 text-[10px] font-bold text-bs-info">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-bs-text-mute">{step.label}</div>
                                        <div className="text-xs leading-relaxed text-bs-text-primary">{step.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleOpen}
                        disabled={!canOpen}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-mono font-bold
                            bg-bs-accent-cyan text-white hover:opacity-90
                            disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        <Plus size={14} />
                        {formPrice <= 0 ? 'PRICE LOADING…' : !canOpen ? 'INSUFFICIENT FREE BALANCE' : 'OPEN POSITION'}
                    </button>
                </div>

                {/* Positions list */}
                <div className="lg:col-span-8 bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">
                            Open Positions ({account.positions.length})
                        </span>
                        <button
                            onClick={() => setShowMath(p => !p)}
                            className={cn('flex items-center gap-1 text-[9px] font-mono border px-2 py-1 transition-colors',
                                showMath ? 'border-bs-brand-tertiary/40 text-bs-brand bg-bs-brand-tertiary/10' : 'border-bs-border text-bs-text-mute hover:text-bs-text-primary')}
                            title="Show the math behind every number"
                        >
                            <Sigma size={10} /> {showMath ? 'Hide' : 'Show'} calculations
                        </button>
                    </div>

                    {account.positions.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center">
                            <div className="text-bs-text-primary/15 text-xs font-mono mb-1">No open positions</div>
                            <div className="text-bs-text-primary/10 text-[10px] font-mono">
                                Open a Cross or Isolated position to begin
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {positionViews.map(v => {
                                const sc = STATUS_COLOR[v.status];
                                const isLong = v.position.side === 'long';
                                const isCross = v.position.marginMode === 'cross';
                                const extra = v.position.extraMargin ?? 0;
                                const defaultAdjust = Math.max(1, Math.round(v.initialMargin * 0.5 * 100) / 100);
                                const adjustRaw = adjustDrafts[v.position.id];
                                const adjustAmt = adjustRaw !== undefined ? (parseFloat(adjustRaw) || 0) : defaultAdjust;
                                return (
                                    <div key={v.position.id} className="bg-bs-card border border-bs-border p-3">
                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-mono font-bold text-bs-text-primary">{v.position.token}</span>
                                                <span className={cn('px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase',
                                                    isLong ? 'bg-bs-success/15 text-bs-success' : 'bg-bs-error/15 text-bs-error')}>
                                                    {v.position.side}
                                                </span>
                                                <span className={cn('px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase flex items-center gap-1',
                                                    isCross ? 'bg-bs-brand-tertiary/15 text-bs-brand' : 'bg-bs-info/15 text-bs-info')}>
                                                    {isCross ? <Layers size={9} /> : <Lock size={9} />}{v.position.marginMode}
                                                </span>
                                                <span className="text-[10px] font-mono text-bs-text-mute">{v.position.leverage}x</span>
                                                <span className="text-[10px] font-mono text-bs-text-mute">{fmtQty(v.position.quantity)} {v.position.token}</span>
                                            </div>
                                            {/* Close controls — realize PnL at the current mark */}
                                            <div className="flex items-center gap-1">
                                                {[0.25, 0.5, 0.75].map(f => (
                                                    <button
                                                        key={f}
                                                        onClick={() => handleClose(v.position.id, f)}
                                                        className="px-1.5 py-0.5 text-[9px] font-mono border border-bs-border text-bs-text-mute hover:text-bs-text-primary hover:border-bs-brand-tertiary/40 transition-colors"
                                                        title={`Close ${f * 100}% at ${fmtPx(v.markPrice)} — realizes ${fmtSigned(v.pnl * f)} minus fee`}
                                                    >
                                                        {f * 100}%
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => handleClose(v.position.id, 1)}
                                                    className="px-2 py-0.5 text-[9px] font-mono font-bold border border-bs-error/40 text-bs-error hover:bg-bs-error/10 transition-colors"
                                                    title={`Close 100% at ${fmtPx(v.markPrice)} — realizes ${fmtSigned(v.pnl)} minus fee`}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono mb-2">
                                            <div>
                                                <div className="text-bs-text-mute uppercase">Entry → Mark</div>
                                                <div className="text-bs-text-primary">
                                                    {fmtPx(v.position.entryPrice)} <span className="text-bs-text-mute">→</span> {fmtPx(v.markPrice)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-bs-text-mute uppercase">Margin</div>
                                                <div className="text-bs-text-primary">
                                                    {fmt(v.totalMargin)}
                                                    {extra > 0 && <span className="text-bs-info"> (+{fmt(extra)} added)</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-bs-text-mute uppercase">uPnL (ROE)</div>
                                                <div className={cn('font-bold', v.pnl >= 0 ? 'text-bs-success' : 'text-bs-error')}>
                                                    {v.pnl >= 0 ? '+' : ''}{fmt(v.pnl)} <span className="opacity-70">({fmtPct(v.roe)})</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-bs-text-mute uppercase">{isCross ? 'Account-backed' : 'Liq Price'}</div>
                                                <div className={cn(isCross ? 'text-bs-brand' : 'text-bs-error', 'font-bold')}>
                                                    {isCross ? 'Cross pool' : (v.liqPrice != null ? fmtPx(v.liqPrice) : '—')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Distance-to-liq bar */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative h-2 flex-1 bg-bs-bg overflow-hidden">
                                                <div
                                                    className={cn('absolute top-0 left-0 h-full transition-all duration-300', sc.bg)}
                                                    style={{ width: `${Math.max(2, 100 - v.consumed)}%`, opacity: v.liquidated ? 0.3 : 0.6 }}
                                                />
                                            </div>
                                            <span className={cn('text-[9px] font-mono font-bold w-20 text-right',
                                                isCross ? 'text-bs-text-mute' : sc.text)}>
                                                {isCross
                                                    ? `${v.consumed.toFixed(0)}% margin used`
                                                    : (v.liquidated ? 'LIQUIDATED' : `${(100 - v.consumed).toFixed(0)}% buffer`)}
                                            </span>
                                        </div>

                                        {/* Adjust isolated margin — moves the liq price */}
                                        {!isCross && (
                                            <div className="mt-2 pt-2 border-t border-bs-border flex items-center gap-2 flex-wrap">
                                                <span className="text-[9px] font-mono text-bs-text-mute uppercase tracking-wider">Adjust margin</span>
                                                <input
                                                    type="number"
                                                    value={adjustRaw ?? defaultAdjust}
                                                    onChange={e => setAdjustDrafts(prev => ({ ...prev, [v.position.id]: e.target.value }))}
                                                    className="w-20 px-2 py-1 bg-bs-bg border border-bs-border text-[10px] font-mono text-bs-text-primary focus:border-bs-brand-tertiary/50 focus:outline-none"
                                                    min={0}
                                                    step={1}
                                                />
                                                <button
                                                    onClick={() => handleAdjustMargin(v.position.id, adjustAmt)}
                                                    disabled={adjustAmt <= 0 || adjustAmt > summary.freeBalance + 1e-9}
                                                    className="px-2 py-1 text-[9px] font-mono font-bold border border-bs-info/40 text-bs-info hover:bg-bs-info/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Lock more free balance behind this position — pushes the liq price away"
                                                >
                                                    + Add
                                                </button>
                                                <button
                                                    onClick={() => handleAdjustMargin(v.position.id, -adjustAmt)}
                                                    disabled={adjustAmt <= 0 || adjustAmt > extra + 1e-9}
                                                    className="px-2 py-1 text-[9px] font-mono font-bold border border-bs-border text-bs-text-mute hover:text-bs-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="Release previously added margin — pulls the liq price closer"
                                                >
                                                    − Remove
                                                </button>
                                                <span className="text-[9px] font-mono text-bs-text-mute">moves the liq line</span>
                                            </div>
                                        )}

                                        {/* Math breakdown */}
                                        {showMath && (
                                            <div className="mt-2 pt-2 border-t border-bs-border space-y-1 text-[9px] font-mono text-bs-text-mute leading-relaxed">
                                                <div>
                                                    <span className="text-bs-text-tertiary">Initial Margin</span> = Qty × Entry ÷ Lev = {fmtQty(v.position.quantity)} × {fmtPx(v.position.entryPrice)} ÷ {v.position.leverage} = <span className="text-bs-text-primary">{fmt(v.initialMargin)}</span>
                                                    {extra > 0 && <> ; <span className="text-bs-text-tertiary">Total Margin</span> = Initial + Added = {fmt(v.initialMargin)} + {fmt(extra)} = <span className="text-bs-info">{fmt(v.totalMargin)}</span></>}
                                                </div>
                                                <div>
                                                    <span className="text-bs-text-tertiary">uPnL</span> = Qty × ({isLong ? 'Mark − Entry' : 'Entry − Mark'}) = {fmtQty(v.position.quantity)} × ({isLong ? `${fmtPx(v.markPrice)} − ${fmtPx(v.position.entryPrice)}` : `${fmtPx(v.position.entryPrice)} − ${fmtPx(v.markPrice)}`}) = <span className={v.pnl >= 0 ? 'text-bs-success' : 'text-bs-error'}>{v.pnl >= 0 ? '+' : ''}{fmt(v.pnl)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-bs-text-tertiary">Maint. Margin</span> = Qty × Mark × MMR = {fmtQty(v.position.quantity)} × {fmtPx(v.markPrice)} × {(v.position.mmr * 100).toFixed(2)}% = <span className="text-bs-text-primary">{fmt(v.maintenanceMargin)}</span>
                                                </div>
                                                {!isCross && v.liqPrice != null ? (
                                                    <>
                                                        {extra > 0 ? (
                                                            <div>
                                                                <span className="text-bs-text-tertiary">Liq Price</span> = Entry {isLong ? '−' : '+'} (Margin − Qty × Entry × MMR) ÷ Qty = {fmtPx(v.position.entryPrice)} {isLong ? '−' : '+'} ({fmt(v.totalMargin)} − {fmt(v.position.quantity * v.position.entryPrice * v.position.mmr)}) ÷ {fmtQty(v.position.quantity)} = <span className="text-bs-error">{fmtPx(v.liqPrice)}</span>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-bs-text-tertiary">Liq Price</span> = Entry × (1 {isLong ? '−' : '+'} 1/Lev {isLong ? '+' : '−'} MMR) = {fmtPx(v.position.entryPrice)} × (1 {isLong ? '−' : '+'} {(1 / v.position.leverage).toFixed(4)} {isLong ? '+' : '−'} {(v.position.mmr).toFixed(4)}) = <span className="text-bs-error">{fmtPx(v.liqPrice)}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-bs-text-tertiary">Position Equity</span> = Margin + uPnL = {fmt(v.totalMargin)} {v.pnl >= 0 ? '+' : '−'} {fmt(Math.abs(v.pnl))} = <span className="text-bs-text-primary">{fmt(v.isolatedEquity ?? 0)}</span>; liquidates when this hits Maint. Margin.
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-bs-brand/80">No fixed liq price — this position shares the cross pool; the whole account liquidates via the Margin Ratio above.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Account Ledger ═══ */}
            <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                <div className="flex items-center gap-2 mb-3">
                    <History size={14} className="text-bs-brand" />
                    <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Account Ledger</span>
                    <span className="text-[9px] font-mono text-bs-text-mute">— every balance change, newest first</span>
                </div>
                {account.ledger.length === 0 ? (
                    <div className="h-16 flex items-center justify-center text-bs-text-primary/15 text-xs font-mono">
                        No activity yet — open a position to see fees, PnL and margin flows here
                    </div>
                ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                        {account.ledger.map(e => (
                            <div key={e.id} className="flex items-center gap-2 bg-bs-card border border-bs-border px-2 py-1.5">
                                <span className={cn('px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase shrink-0 w-20 text-center', LEDGER_BADGE[e.type].cls)}>
                                    {LEDGER_BADGE[e.type].label}
                                </span>
                                <span className="flex-1 text-[10px] font-mono text-bs-text-secondary leading-relaxed min-w-0">
                                    {describeEntry(e)}
                                </span>
                                <span className={cn('text-[10px] font-mono font-bold shrink-0 w-24 text-right',
                                    e.amount > 0 ? 'text-bs-success' : e.amount < 0 ? 'text-bs-error' : 'text-bs-text-mute')}>
                                    {e.amount === 0 ? '—' : fmtSigned(e.amount)}
                                </span>
                                <span className="text-[9px] font-mono text-bs-text-mute shrink-0 w-28 text-right hidden sm:block">
                                    bal {fmt(e.balanceAfter)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ Market Scale (per-token price sliders) ═══ */}
            {heldTokens.length > 0 && (
                <div className="bg-bs-bg/60 backdrop-blur-xl border border-bs-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-bs-brand" />
                        <span className="text-label-12 text-bs-text-tertiary uppercase tracking-wider">Market Scale</span>
                        <span className="text-[9px] font-mono text-bs-text-mute">— drag a token&apos;s price to stress your positions. Cross the red line and the liquidation is real.</span>
                    </div>

                    <div className="space-y-4">
                        {heldTokens.map(t => {
                            const { min, max } = tokenRange(t);
                            const lp = livePrice(t);
                            const cur = simPrices[t] ?? lp;
                            const span = max - min || 1;
                            const pct = (p: number) => Math.max(0, Math.min(100, ((p - min) / span) * 100));
                            const liqMarks = positionViews.filter(v => v.position.token === t && v.liqPrice != null);
                            const entries = positionViews.filter(v => v.position.token === t);
                            const changePct = lp > 0 ? ((cur - lp) / lp) * 100 : 0;
                            return (
                                <div key={t} className="border border-bs-border bg-bs-card p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-bs-text-primary">{t}</span>
                                            <span className="text-sm font-mono text-bs-text-primary">{fmtPx(cur)}</span>
                                            <span className={cn('text-[10px] font-mono', changePct >= 0 ? 'text-bs-success' : 'text-bs-error')}>
                                                {changePct >= 0 ? '▲' : '▼'} {fmtPct(changePct)} vs live
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => resetTokenToLive(t)}
                                            className="flex items-center gap-1 text-[9px] font-mono text-bs-text-mute hover:text-bs-text-primary border border-bs-border px-2 py-1"
                                            title="Reset to live price"
                                        >
                                            <RotateCcw size={9} /> Live
                                        </button>
                                    </div>

                                    {/* Marker track */}
                                    <div className="relative h-5 mb-1">
                                        {/* entry markers */}
                                        {entries.map(v => (
                                            <div
                                                key={`e-${v.position.id}`}
                                                className="absolute top-0 h-3 w-px bg-white/40"
                                                style={{ left: `${pct(v.position.entryPrice)}%` }}
                                                title={`Entry ${fmtPx(v.position.entryPrice)}`}
                                            />
                                        ))}
                                        {/* liq markers (isolated) */}
                                        {liqMarks.map(v => (
                                            <div
                                                key={`l-${v.position.id}`}
                                                className="absolute top-0 h-5 w-0.5 bg-bs-error"
                                                style={{ left: `${pct(v.liqPrice as number)}%` }}
                                                title={`Liq ${fmtPx(v.liqPrice as number)}`}
                                            />
                                        ))}
                                        {/* live marker */}
                                        {lp > 0 && (
                                            <div
                                                className="absolute bottom-0 h-2 w-px bg-bs-success"
                                                style={{ left: `${pct(lp)}%` }}
                                                title={`Live ${fmtPx(lp)}`}
                                            />
                                        )}
                                    </div>

                                    <input
                                        type="range"
                                        min={min}
                                        max={max}
                                        step={(max - min) / 1000 || 0.0001}
                                        value={cur}
                                        onChange={e => setSimPrices(prev => ({ ...prev, [t]: parseFloat(e.target.value) }))}
                                        className="w-full h-1.5 appearance-none bg-bs-card-fg rounded-lg cursor-pointer accent-bs-accent-cyan
                                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-bs-accent-cyan [&::-webkit-slider-thumb]:rounded-lg
                                            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-bs-accent-cyan [&::-moz-range-thumb]:rounded-lg [&::-moz-range-thumb]:border-0"
                                    />
                                    <div className="flex justify-between text-[8px] font-mono text-bs-text-mute mt-0.5">
                                        <span>{fmtPx(min)}</span>
                                        <span className="text-bs-success">● live {lp > 0 ? fmtPx(lp) : '—'}</span>
                                        <span>{fmtPx(max)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[8px] font-mono text-bs-text-mute">
                                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-px bg-white/40" /> entry</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-bs-error" /> liq (isolated)</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-px h-2 bg-bs-success" /> live</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ Accordion: Cross vs Isolated explainer ═══ */}
            <div className="bg-bs-bg/40 backdrop-blur-xl border border-bs-border">
                <button
                    onClick={() => setAccordionOpen(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-bs-card transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-bs-brand" />
                        <span className="text-sm font-semibold text-bs-text-tertiary">Cross vs Isolated - how margin behaves</span>
                    </div>
                    {accordionOpen ? <ChevronUp size={14} className="text-bs-text-mute" /> : <ChevronDown size={14} className="text-bs-text-mute" />}
                </button>
                {accordionOpen && (
                    <div className="px-4 pb-4 border-t border-bs-border pt-3 space-y-3 text-sm text-bs-text-secondary leading-relaxed">
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 bg-bs-card border border-bs-info/20">
                                <div className="text-bs-info font-bold mb-1 flex items-center gap-1"><Lock size={11} /> Isolated</div>
                                <ul className="space-y-1 text-bs-text-secondary">
                                    <li>• Each position locks its own margin.</li>
                                    <li>• Loss is capped at that margin — the rest of your wallet is safe.</li>
                                    <li>• Liquidates alone at a fixed liq price.</li>
                                    <li>• Add margin to push the liq price further away.</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-bs-card border border-bs-brand-tertiary/20">
                                <div className="text-bs-brand font-bold mb-1 flex items-center gap-1"><Layers size={11} /> Cross</div>
                                <ul className="space-y-1 text-bs-text-secondary">
                                    <li>• All cross positions share the wallet&apos;s collateral.</li>
                                    <li>• Profits on one can support losses on another.</li>
                                    <li>• The whole account liquidates when margin ratio hits 100%.</li>
                                </ul>
                            </div>
                        </div>
                        <p>
                            Try it: open two cross longs and one isolated long, then drag a token down in <span className="text-bs-text-secondary">Market Scale</span>.
                            The isolated one hits its own liq line and settles — its margin leaves your wallet — while the cross pool absorbs the rest, until the
                            account-level health bar runs out and the whole cross account goes. Every step lands in the <span className="text-bs-text-secondary">Account Ledger</span>.
                        </p>

                        <div className="p-3 bg-bs-card border border-bs-border space-y-1.5 text-[10px] font-mono leading-relaxed text-bs-text-mute">
                            <div className="text-bs-text-tertiary font-bold flex items-center gap-1 mb-1"><Sigma size={11} /> Formulas (toggle “Show calculations” to see these with live numbers)</div>
                            <div>Initial Margin = Qty × Entry ÷ Leverage &nbsp;·&nbsp; Total Margin (isolated) = Initial + Added</div>
                            <div>Trading Fee = Qty × Price × Fee Rate — charged on open and on close</div>
                            <div>uPnL (long) = Qty × (Mark − Entry) &nbsp;·&nbsp; uPnL (short) = Qty × (Entry − Mark)</div>
                            <div>Close: Wallet Balance += Realized PnL − Fee (isolated loss floored at −Margin)</div>
                            <div>Maintenance Margin = Qty × Mark × MMR</div>
                            <div>Isolated Liq (long) = Entry − (Margin − Qty × Entry × MMR) ÷ Qty — more margin, lower liq</div>
                            <div>Isolated Liq (short) = Entry + (Margin − Qty × Entry × MMR) ÷ Qty</div>
                            <div>Cross Equity = (Wallet − Isolated Locked) + Σ Cross uPnL</div>
                            <div>Cross Margin Ratio = Σ Cross Maint. Margin ÷ Cross Equity &nbsp;→&nbsp; account liquidates at 100%</div>
                            <div>Liquidation settles: isolated loses its margin; cross wipes the whole cross collateral</div>
                            <div>Free Balance = Wallet − Isolated Locked − Cross Used (margin reserved by open positions)</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Small metric tile ────────────────────────────────────────
function Metric({ label, value, accent, hint }: { label: string; value: string; accent?: string; hint?: string }) {
    return (
        <div className="p-2.5 bg-bs-card border border-bs-border">
            <div className="text-[9px] font-mono text-bs-text-mute uppercase tracking-wider">{label}</div>
            <div className={cn('text-sm font-mono font-bold mt-0.5', accent ?? 'text-bs-text-primary')}>{value}</div>
            {hint && <div className="text-[8px] font-mono text-bs-text-mute mt-0.5">{hint}</div>}
        </div>
    );
}

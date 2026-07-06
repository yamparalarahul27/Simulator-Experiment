# Simulator Improvement Proposal

A review of the current trading-concept simulators and a concrete, phased proposal for what to improve and add — covering trailing stops, multiple positions, cross/isolated margin, hedge mode, wallet balance consumption, margin management, liquidation realism, and richer controls.

---

## 1. Where the simulators stand today

| Simulator | Teaches | Strengths | Key gaps |
|---|---|---|---|
| `LiquidationSimulator` | Single-position liquidation | Clear two-step flow, distance-to-liq bar | XRP-only, single position, entry locked to live price, static drag slider |
| `FuturesWalletSimulator` | Multi-position wallet, cross vs isolated | Real engine (`futuresWallet.ts`, tested), per-token price sliders, cross account health | Closing a position **discards** uPnL instead of realizing it; no hedge mode; no TP/SL; no fees/funding; flat MMR; no add/remove margin |
| `NettingSimulator` | One-way vs hedge netting, TP/SL precedence | Excellent ledger UX, tested engine (`positionNetting.ts`) | No margin/leverage/liquidation at all; TP/SL checked against current mark only (no path latching) |
| `SpotConcepts` + `OrderFlowVisualiser` | 8 order types incl. trailing stop, OCO, TP/SL | State-machine diagram, extrema latching so fills "stick" | Scrub-only price; trailing stop is illustrative; no partial fills |
| `InteractiveOrderBook` | Live depth/spread | Genuinely live Binance stream | View-only, 3 pairs |

Two structural observations drive most of this proposal:

1. **The three futures sims are silos.** Netting has no margin, the wallet has no TP/SL or hedge mode, and liquidation is single-position. Real perp trading is the *intersection* of these — a hedged pair of positions sharing cross collateral with a trailing stop on one leg. Learners can't currently experience that interaction anywhere.
2. **Price is a scrub slider, not a path.** Everything that makes derivatives interesting over time — trailing stops ratcheting, TP/SL latching, funding payments accruing, cross margin draining as one position bleeds — needs a price *path*, not a price *position*. `OrderFlowVisualiser` already fakes this with session-extrema latching; it should be promoted to a first-class engine.

---

## 2. Proposal overview

Build one **Unified Futures Sandbox** on top of the existing pure-engine pattern (`src/lib/*.ts` + vitest), replacing the three silos over time. Two new engine layers:

```
src/lib/sim/
  priceEngine.ts      // tick generator: scrub | play (random walk) | scenario presets
  futuresEngine.ts    // account state machine: orders, positions, margin, triggers, ledger
```

Everything below composes from those two. Keep each existing tab working while the sandbox matures, then fold them in as "guided views" of the same engine.

---

## 3. Phase 1 — Fix the account model (wallet balance consumption done right)

The highest-leverage fixes are in `futuresWallet.ts` and its UI. These make the wallet *feel* like a real account:

- **Realize PnL on close.** Today the ✕ button just removes the position. Closing must credit/debit the wallet: `balance += realizedPnl − closeFee`, with a toast/ledger row showing the flow. This is the core of "wallet balance consumption" and it's currently misleading.
- **Partial close.** Slider or % chips (25/50/75/100) on each position card; realizes proportional PnL and frees proportional margin.
- **Trading fees.** Taker/maker fee inputs (default 0.05%/0.02%, editable). Deduct open fee from free balance at open, close fee at close. Show cumulative fees paid in the wallet grid — connects to the fee-composition analytics the main app already teaches.
- **Add/remove margin on isolated positions.** The defining feature of isolated mode is that you can top up margin to push the liq price away. Add a per-position "Adjust margin" control and recompute liq price from margin rather than only from leverage: `liqPrice = entry ∓ (margin − maintMargin)/qty` style derivation. This single control teaches more about isolated mode than any explainer text.
- **Realized-PnL ledger.** Append-only event log (open, close, fee, margin add, funding, liquidation) with running balance — the "bank statement" of the sandbox. Makes every balance change auditable by the learner.
- **Account equity floor / bankruptcy.** When cross liquidates, actually zero the cross collateral and remove cross positions, leaving isolated ones intact — show the aftermath, not just a red badge.

Engine changes stay pure and unit-tested like the existing code.

## 4. Phase 2 — Price path engine (unlocks trailing stops & real triggers)

Add `priceEngine.ts` with three modes per token, plus global transport controls:

- **Scrub** — the current slider (keep it; it's great for "what if price were X").
- **Play** — geometric random walk with user controls: **drift** (−5%…+5%/min), **volatility** (calm → violent), **speed** (0.5×–10×), pause/step. Seeded RNG so runs are reproducible and shareable.
- **Scenario presets** — deterministic paths that teach specific lessons:
  - *Slow bleed* (grinding down — cross margin erosion)
  - *Flash wick* (spike down + recover — stop-hunt / why isolated liquidated but a wider SL survived)
  - *Pump & dump* (trailing stop showcase)
  - *Chop / whipsaw* (kills tight trailing stops — teaches callback-rate tradeoff)
  - *Trend* (funding accrual, pyramiding)

UI: a small candlestick/line chart per token (or one chart for the selected token) with horizontal lines for entry, liq, TP, SL, and the live trailing-stop watermark. The chart replaces "imagine the price moved" with "watch it move."

With a path, triggers become real: TP/SL/trailing/liquidation fire **when the path crosses them**, latch, and write to the ledger — replacing the current "evaluated against wherever the slider happens to be" model in NettingSimulator.

## 5. Phase 3 — Full order & position feature set

With engine + path in place, add the missing instruments and modes:

**Trailing stop (futures, first-class)**
- Controls: activation price (optional), **callback rate** (0.1%–10% slider) or absolute distance, quantity/reduce-only.
- Display: live watermark line on the chart, "distance to trigger" readout, ratchet animation as new extremes print.
- Pair with the *chop* scenario for the classic lesson: tight callback = shaken out, wide callback = gives back profit.

**Hedge mode with margin (merge NettingSimulator into the wallet)**
- Position-mode toggle on the account: **One-way / Hedge** (like Binance/Bybit — account-level setting, blocked while positions are open).
- Hedge mode: independent long and short legs per token, each with its own margin (isolated) or sharing cross collateral; net exposure shown. In one-way mode, opposing orders reduce/flip using the existing `positionNetting` engine — now with margin and realized PnL wired to the wallet.
- Keep the netting ledger UI; it's the best explainer in the app. It just gains margin columns.

**Order types on futures**
- Limit entries (rest on the path until touched), stop-market/stop-limit entries, reduce-only flag, post-only note. Reuse the `OrderFlowVisualiser` state machine to visualize each pending futures order.

**Position management controls**
- Adjust leverage on an open position (re-reserves margin, moves liq price).
- Switch a position cross ↔ isolated (with the real-exchange constraint messaging).
- Per-position TP/SL (one-way: position-level, hedge: per-leg) — reusing `positionNetting`'s precedence/superseded logic, which is already built and tested.

## 6. Phase 4 — Liquidation & realism upgrades

- **Tiered maintenance margin.** Replace the single MMR input with editable brackets (notional → MMR/deduction), defaulting to a Binance-like table. Show which tier the position sits in and how growing size raises the liq price — a non-obvious lesson current flat MMR can't teach. Keep a "simple mode" toggle for beginners.
- **Bankruptcy price vs liquidation price + insurance fund.** Show both lines; when liquidated, the gap funds/drains a visible insurance-fund meter. Optional **ADL** explainer: if the fund is empty, the profitable opposite side gets deleveraged (this is where the app's ADL story can live).
- **Partial liquidation** option for large positions (liquidate down to the next tier instead of full close).
- **Funding rate tab** (currently "soon"): funding countdown timer, editable funding rate (or derived from a premium slider), payments hitting the wallet ledger every interval in play mode; cumulative funding vs price PnL split. Scenario: "you were right on direction but funding ate the trade."
- **Slippage/fees on market orders**: simple impact model using a synthetic book, or reuse `InteractiveOrderBook` depth for realism.

## 7. Learning layer (what makes it a *learning* app, not a paper-trading clone)

- **Side-by-side compare mode.** Same positions, same path, rendered twice: cross vs isolated, or one-way vs hedge, or 5x vs 20x. Divergence between the two panels *is* the lesson. This is cheap once the engine is pure — run it twice with different configs.
- **Challenges.** Small goal-driven scenarios with pass/fail: "Survive the flash wick with ≥$9k equity", "Set a trailing stop that keeps ≥60% of the pump's peak profit", "Hedge this position so a 10% drop costs <$100". Store completion locally; surfaces in the existing roadmap/lessons shell.
- **Event narration.** The ledger doubles as a plain-English narrator: "Price crossed 2.31 → SL triggered → closed 20 XRP → realized −$14.20 → fee $0.46". Every state change explained in one line.
- **"Show calculations" everywhere** (already in the wallet sim — extend the pattern to triggers, funding, and tiered MMR).

## 8. Quick wins (independent of the phases)

1. Realize PnL on close in `FuturesWalletSimulator` (Phase 1 item, but small and high-impact).
2. Let `LiquidationSimulator` use any of the 6 tokens and a custom entry price.
3. Add the 3-preset pattern from `NettingSimulator` to the wallet sim (e.g., "two isolated longs", "cross long + isolated short", "cross pair near liquidation").
4. TP/SL latching in `NettingSimulator` using the session-extrema approach already proven in `OrderFlowVisualiser`.
5. Fees toggle (even a display-only "this would have cost $X in fees" line).

## 9. Suggested control inventory (target state)

**Account:** balance input · deposit/withdraw · position mode (one-way/hedge) · fee rates · simple/advanced MMR toggle
**Per order:** token · side · type (market/limit/stop/stop-limit) · qty (units, notional, or % of balance) · leverage 1–100x · margin mode · reduce-only · TP/SL · trailing (activation + callback %)
**Per position:** partial close % · add/remove margin · adjust leverage · switch margin mode · edit TP/SL/trailing
**Market:** per-token scrub slider · play/pause/step · speed · drift · volatility · scenario presets · seed
**Pedagogy:** show-calculations · compare mode · challenge select · event ledger filter

## 10. Sequencing summary

| Phase | Theme | Headline deliverables |
|---|---|---|
| 1 | Honest wallet | Realized PnL, fees, partial close, add/remove margin, ledger |
| 2 | Time | Price path engine, scenario presets, chart with liq/TP/SL/trail lines, real trigger latching |
| 3 | Full toolkit | Trailing stops, hedge mode with margin, limit/stop entries, position management |
| 4 | Realism | Tiered MMR, bankruptcy/insurance/ADL, funding tab, slippage |
| 5 | Pedagogy | Compare mode, challenges, narration |

Phases 1–2 are the foundation; everything else composes on top. All engine work follows the existing repo pattern: pure functions in `src/lib`, vitest coverage, UI as a thin view over engine state.

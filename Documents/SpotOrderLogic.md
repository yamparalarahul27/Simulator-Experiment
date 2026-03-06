# Spot Order Logic & Validation Rules

This document outlines the core logic, execution rules, and UI validation constraints for all Spot Order types within YDEX, sourced from Binance standard definitions.

## 1. Market Order
- **Description:** Executes immediately at the best available current market price.
- **Inputs:** Amount (Quantity).
- **Validation:** None (executes instantly).

## 2. Limit Order
- **Description:** Placed on the order book at a specific price. Only executes at that price or better.
- **Inputs:** Amount, Limit Price.
- **Validation (Spot Standard):**
  - **Buy:** Limit Price must be **<** Current Market Price. (If placed > Market, it acts like a Market Buy).
  - **Sell:** Limit Price must be **>** Current Market Price. (If placed < Market, it acts like a Market Sell).

## 3. Stop Market Order
- **Description:** A conditional trigger. Once the market hits the "Stop Price," a Market Order is instantly submitted.
- **Inputs:** Amount, Stop Price.
- **Validation (Crucial for UX):**
  - **Buy (Breakout):** Stop Price must be **>** Current Market Price.
  - **Sell (Stop Loss):** Stop Price must be **<** Current Market Price.
  - *Note: If users violate this, the condition is instantly met, causing an immediate, potentially unfavorable market execution.*

## 4. Stop Limit Order
- **Description:** A conditional trigger. Once the market hits the "Stop Price," a Limit Order is submitted at the "Limit Price."
- **Inputs:** Amount, Stop Price, Limit Price.
- **Validation:**
  - Same Stop Price rules as Stop Market (Buy > Market, Sell < Market).
  - **Best Practice Execution Rules:**
    - For Buy: Stop Price is usually placed *below* the Limit Price to ensure execution.
    - For Sell: Stop Price is usually placed *above* the Limit Price to ensure execution.

## 5. Iceberg Order (Variant of Limit / Stop Limit)
- **Description:** A large limit order sliced into smaller "Visible Quantities" on the public order book to hide the true size of the trade.
- **Inputs:** Amount, Limit Price, Visible Quantity.
- **Validation:** 
  - Visible Quantity must be **<** Total Amount.

## 6. Take Profit / Stop Loss (TP/SL Legs)
- **Description:** Additional conditional closing orders attached to a primary entry order.
- **UI Constraint:** Currently restricted strictly to **Limit Orders** to simplify user flow and prevent accidental market triggers.
- **Inputs:** TP Price, SL Price.
- **Validation (Relative to Entry ref, which is the Limit Price):**
  - **Buy:** TP Price must be **>** Limit Price. SL Price must be **<** Limit Price.
  - **Sell:** TP Price must be **<** Limit Price. SL Price must be **>** Limit Price.
- **Risk/Reward Feedback:**
  - Live calculation showing the ratio between potential gain `|TP - Limit Price|` and risk `|SL - Limit Price|`.
  - Inline UI states: **Favourable (≥ 1.5)**, **Neutral (≥ 1.0)**, and **Poor (< 1.0)**.

## 7. Trailing Stop Order
- **Description:** A Stop Market order where the Stop Price trails the market price by a specific percentage. It locks in profit and limits loss as the market moves favorably.
- **Inputs:** Amount, Activation Price, Trailing Percent.
- **Validation:**
  - **Buy:** Activation Price must be **>** Current Market Price.
  - **Sell:** Activation Price must be **<** Current Market Price.
  - Trailing Percent must be within exchange limits (e.g., 0.1% to 20%).

## 8. OCO (One-Cancels-the-Other) Order
- **Description:** Combines a Limit Maker order with a Stop-Limit order. If either order is partially or fully executed, the other is automatically canceled.
- **Inputs:** Amount, Limit Price (Target), Stop Price (Trigger), Stop-Limit Price.
- **Validation:**
  - **Buy:**
    - Limit Price must be **<** Current Market Price.
    - Stop Price must be **>** Current Market Price.
  - **Sell:**
    - Limit Price must be **>** Current Market Price.
    - Stop Price must be **<** Current Market Price.

---
---
## UI/UX Approach
To prevent "fat-finger" errors where users intend to place a conditional order but accidentally trigger an immediate market order (e.g., placing a Sell Stop *above* the current price), the Spot Order Form will deploy inline form validation enforcing the rules above.

---
## 9. Stateful Order Simulation (Visualiser)
The Order Flow Visualiser provides an interactive slider to scrub price and visualize execution paths.
- **Session Extrema Tracking (Latching):** The simulation is stateful over the current drag session. It records the lowest and highest prices visited (`sessionMin`, `sessionMax`).
- **Latching Execution:** Once the simulated market crosses an order's trigger (e.g., Limit Price, TP, or SL), the node execution state "latches." 
  - If a Limit buy order is hit, the simulation enters a `position` state (assets shown in wallet). Even if the user scrolls the price back up, the order remains filled.
  - If the price subsequently reaches the TP or SL target, the chain advances to a `filled_terminal` state displaying exact P&L, permanently closing the trade for the session.

---
## 10. Real-Time Price Matching Engine

The matching engine lives in `src/lib/hooks/useSpotTrade.ts` (lines 327–458). It is the **execution** counterpart to the visual simulation in Section 9.

### 10.1 Overview
- **Polling interval:** 2-second `setInterval`
- **Price source:** Live Binance WebSocket prices (`livePrices`)
- **Activation:** Only runs when the `useSpotTrade` hook is mounted **and** there are open orders (`openOrders.length > 0`)
- **Scope:** Iterates all orders with status `pending`, `partial`, or `triggered`. Skips `filled` and `cancelled`.
- **On change:** If any order transitions state, calls `refreshOrders()` to re-fetch all orders and balances from Supabase.

### 10.2 Order-Type Matching Rules

Each poll cycle checks every open order against the current live price:

| Order Type | Current Status | Buy Trigger | Sell Trigger | Result |
|---|---|---|---|---|
| **Limit** | `pending` | price ≤ limitPrice | price ≥ limitPrice | → `filled` |
| **Stop Market** | `pending` | price ≥ stopPrice | price ≤ stopPrice | → `filled` (at market) |
| **Stop Limit** (stage 1) | `pending` | price ≥ stopPrice | price ≤ stopPrice | → `triggered` |
| **Stop Limit** (stage 2) | `triggered` | price ≤ limitPrice | price ≥ limitPrice | → `filled` |
| **Iceberg** | `pending` / `partial` | price ≤ limitPrice | price ≥ limitPrice | → `partial` (one slice) or `filled` (last slice) |
| **TWAP** | `pending` / `partial` | time ≥ nextSliceAt | time ≥ nextSliceAt | → `partial` (one slice) or `filled` (last slice) |

**Iceberg** fills one `visibleQty` slice per cycle until `filledQuantity ≥ quantity`.
**TWAP** fills one slice per time interval (`twapDuration / twapIntervals`), price-independent.

### 10.3 Fill Process — `fillOrder()`

**Location:** `useSpotTrade.ts` lines 517–530

When an order meets its trigger condition:
1. **Update order** in Supabase: `status → 'filled'`, set `filledQuantity`, `fillPrice`, `filledAt`
2. **Settle balances** via `applyFill()`
3. **Spawn TP/SL child orders** via `createTpSlOrders()` (if attached)
4. **Toast notification:** `"Order Filled: BUY 5.2 SOL/USDC @ $145.75"`

### 10.4 Balance Settlement — `applyFill()`

**Location:** `useSpotTrade.ts` lines 474–515

| Side | USDC | Token |
|------|------|-------|
| **Buy** | `inOrder` decreases by `notional + fee` | `available` increases by `qty` |
| **Sell** | `available` increases by `notional - fee` | `inOrder` decreases by `qty` |

- **Fee rate:** 0.1% of notional (`qty × fillPrice × 0.001`)
- **Note:** For non-market orders, USDC/token was already reserved in `inOrder` at order creation time (lines 596–616). The fill moves funds from `inOrder` to their final destination.

### 10.5 TP/SL Child Orders — `createTpSlOrders()`

**Location:** `useSpotTrade.ts` lines 532–561

After a parent order fills, if it has TP or SL prices attached:
- **Take Profit** → spawns an opposite-side **Limit** order at `tpPrice`
- **Stop Loss** → spawns an opposite-side **Stop Market** order at `slPrice`
- Both carry `parentOrderId` referencing the filled parent
- These child orders enter the `openOrders` list and are picked up by the same matching engine on subsequent cycles

**Restriction:** TP/SL is only available on Limit orders (see Section 6), so child orders are only created for filled Limit parent orders.

### 10.6 Simulation vs Execution

These are **two independent systems** that should not be confused:

| | Section 9: Simulation | Section 10: Execution |
|---|---|---|
| **Where** | SpotConcepts page (Price Scale slider) | `useSpotTrade` hook (any page using it) |
| **Price source** | Manual slider drag | Live Binance WebSocket |
| **Persistence** | None — visual only | Supabase (orders + balances) |
| **Balance changes** | No | Yes |
| **Purpose** | Learn how order types behave | Execute demo trades against live prices |

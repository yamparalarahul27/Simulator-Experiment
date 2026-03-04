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

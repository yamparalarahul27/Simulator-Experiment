# Liquidation Simulator — Design Document

## Overview

An educational, interactive **Liquidation Simulator** inside the "Future Concepts" tab of the Demo Market page. Users configure a hypothetical perpetual futures position and simulate market price movements to visualize when and how liquidation occurs.

- **Default token**: XRP/USDC (live price from Binance WebSocket)
- **Client-side only** — no Supabase persistence
- **Entry price is read-only** (Market Order Simulation — fetched live from Binance)

---

## ASCII Layout

```
┌─ Future Concepts Tab ──────────────────────────────────────────────────────────────┐
│                                                                                    │
│  ┌─ Section Nav ───────────────────────────────────────────────────────────────┐   │
│  │  [● Liquidation]      [○ Funding Rate (soon)]      [○ Leverage (soon)]      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ┌─ Liquidation Simulator ─────────────────────────────────────────────────────┐   │
│  │                                                                              │   │
│  │  ┌─ Inputs ─────────────┐ ┌─ Results ───────────────────┐ ┌─ Price ──────┐  │   │
│  │  │                       │ │                               │ │  Slider      │  │   │
│  │  │  Token: XRP/USDC      │ │  (empty until Run Sim)        │ │              │  │   │
│  │  │                       │ │                               │ │ (appears     │  │   │
│  │  │  Entry Price          │ │ ── After Run Simulation ──   │ │  after Run)  │  │   │
│  │  │  ┌─────────────────┐  │ │                               │ │              │  │   │
│  │  │  │ $2.34  🔒 LIVE  │  │ │  XRP Change                  │ │  $2.80 ▲     │  │   │
│  │  │  └─────────────────┘  │ │  ┌─────────────────────────┐ │ │   ┃          │  │   │
│  │  │  ⓘ Market Order Sim  │ │  │ $2.34 → $2.50           │ │ │   ┃          │  │   │
│  │  │    Binance live feed  │ │  │ +$0.16  (+6.84%)        │ │ │   ●━ $2.50  │  │   │
│  │  │                       │ │  └─────────────────────────┘ │ │   ┃ (drag)   │  │   │
│  │  │  Quantity (XRP)       │ │                               │ │   ┃          │  │   │
│  │  │  ┌─────────────────┐  │ │  Position Value              │ │  ── $2.34   │  │   │
│  │  │  │  100             │  │ │  ┌─────────────────────────┐ │ │   ┃ Entry   │  │   │
│  │  │  └─────────────────┘  │ │  │ $250.00                  │ │ │   ┃          │  │   │
│  │  │                       │ │  │ (was $234.00 at entry)   │ │ │   ┃          │  │   │
│  │  │  Leverage             │ │  └─────────────────────────┘ │ │   ┃          │  │   │
│  │  │  ┌─────────────────┐  │ │                               │ │  ── $2.12   │  │   │
│  │  │  │ ◄━━━●━━━━━━━━► │  │ │  Margin Change               │ │   ┃ Liq 🔴  │  │   │
│  │  │  │ 1x 10x     100x│  │ │  ┌─────────────────────────┐ │ │   ┃          │  │   │
│  │  │  └─────────────────┘  │ │  │ $23.40 → $39.40         │ │ │   $1.80 ▼   │  │   │
│  │  │                       │ │  │ +$16.00  (+68.4%)        │ │ │              │  │   │
│  │  │  Maint. Margin (%)    │ │  └─────────────────────────┘ │ │  Drag to     │  │   │
│  │  │  ┌─────────────────┐  │ │                               │ │  simulate    │  │   │
│  │  │  │  0.5             │  │ │  Liquidation Status          │ │  price move  │  │   │
│  │  │  └─────────────────┘  │ │  ┌─────────────────────────┐ │ │              │  │   │
│  │  │                       │ │  │ ████████████░░░░░░░░░░░░ │ │ └──────────────┘  │   │
│  │  │  ┌─ Margin Req'd ──┐ │ │  │ 🟢 Safe  Position Open   │ │                    │   │
│  │  │  │ 💰 $23.40 USDC  │ │ │  └─────────────────────────┘ │                    │   │
│  │  │  │ (Qty×Price÷Lev) │ │ │                               │                    │   │
│  │  │  └──────────────────┘ │ └───────────────────────────────┘                    │   │
│  │  │                       │                                                      │   │
│  │  │  Position Side        │                                                      │   │
│  │  │  ┌──────┐ ┌───────┐  │                                                      │   │
│  │  │  │●Long │ │ Short │  │                                                      │   │
│  │  │  └──────┘ └───────┘  │                                                      │   │
│  │  │                       │                                                      │   │
│  │  │  ┌─────────────────┐  │                                                      │   │
│  │  │  │ ▶ RUN SIMULATION│  │                                                      │   │
│  │  │  └─────────────────┘  │                                                      │   │
│  │  │                       │                                                      │   │
│  │  └───────────────────────┘                                                      │   │
│  │                                                                                  │   │
│  │  ┌─ Accordion: What is Liquidation? ────────────────────────── [▼ expand] ───┐  │   │
│  │  │  (collapsed by default)                                                    │  │   │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Input Fields (Left Panel)

| Field | Type | Default | Editable? | Notes |
|-------|------|---------|-----------|-------|
| Token | Display | XRP/USDC | No | Fixed for initial version |
| Entry Price | Display | Live XRP | No (🔒) | Market Order Sim — from Binance WS |
| Quantity | Number Input | 100 | Yes | How many XRP to simulate |
| Leverage | Slider | 10x | Yes | Range: 1x – 100x |
| Maint. Margin Rate | Number Input | 0.5% | Yes | User can adjust |
| Margin Required | Display | Auto-calc | No | Shows margin consumed |
| Position Side | Toggle | Long (●) | Yes | Long / Short |

---

## Calculation Math

### Variables

```
P_entry    = Entry Price (live from Binance, read-only)
P_sim      = Simulated Market Price (from vertical slider)
Q          = Quantity (XRP)
L          = Leverage
MMR        = Maintenance Margin Rate (default 0.5% = 0.005)
```

### Core Calculations

#### 1. Margin Required (Initial Margin)

```
Margin = (Q × P_entry) / L
```

Example: `(100 × $2.34) / 10 = $23.40`

#### 2. Liquidation Price

```
For Long:   P_liq = P_entry × (1 - 1/L + MMR)
For Short:  P_liq = P_entry × (1 + 1/L - MMR)
```

Example (Long, 10x, 0.5% MMR):
```
P_liq = $2.34 × (1 - 1/10 + 0.005)
      = $2.34 × 0.905
      = $2.1177
```

Example (Short, 10x, 0.5% MMR):
```
P_liq = $2.34 × (1 + 1/10 - 0.005)
      = $2.34 × 1.095
      = $2.5623
```

#### 3. Position Value

```
Position Value = Q × P_sim
```

Example: `100 × $2.50 = $250.00` (was `100 × $2.34 = $234.00` at entry)

#### 4. XRP Change

```
Absolute Change = P_sim - P_entry
Percent Change  = ((P_sim - P_entry) / P_entry) × 100
```

Example: `$2.50 - $2.34 = +$0.16 (+6.84%)`

#### 5. Unrealized PnL

```
For Long:   PnL = Q × (P_sim - P_entry)
For Short:  PnL = Q × (P_entry - P_sim)
```

Example (Long): `100 × ($2.50 - $2.34) = +$16.00`

#### 6. Margin Change (Effective Margin = Initial Margin + PnL)

```
Effective Margin = Margin + PnL
```

Example: `$23.40 + $16.00 = $39.40 (+68.4%)`

#### 7. Margin Ratio

```
Margin Ratio = Effective Margin / (Q × P_sim)
```

This determines the liquidation status.

---

## Liquidation Status Bar

The status is determined by how much of the **distance from entry to liquidation** has been consumed by the current simulated price.

### Distance Consumed Calculation

```
For Long:
    Total Distance    = P_entry - P_liq
    Consumed Distance = P_entry - P_sim  (only when P_sim < P_entry)
    Consumed %        = max(0, Consumed Distance / Total Distance) × 100

For Short:
    Total Distance    = P_liq - P_entry
    Consumed Distance = P_sim - P_entry  (only when P_sim > P_entry)
    Consumed %        = max(0, Consumed Distance / Total Distance) × 100
```

If the price moves **favorably** (Long: price up, Short: price down), consumed = 0% → Safe.

### Status Thresholds

| Status | Color | Consumed % | Label | Meaning |
|--------|-------|------------|-------|---------|
| 🟢 **Safe** | Green | 0% – 25% | "Position Open" | Margin is healthy, price is favorable or minor dip |
| 🔵 **OK** | Blue | 25% – 50% | "Position Open" | Noticeable adverse move, but margin still adequate |
| 🟡 **Warning** | Yellow | 50% – 75% | "Near Liquidation" | Price approaching danger zone |
| 🔴 **Negative** | Red | 75% – 99% | "About to Liquidate" | Very close to liquidation price |
| ⚫ **Liquidated** | Black | ≥ 100% | "Liquidated" | Price hit or passed liquidation price |

### Status Math Examples (Long, Entry $2.34, Liq $2.12)

```
Total Distance = $2.34 - $2.12 = $0.22

Scenario 1: P_sim = $2.50 (price went UP)
  Consumed = max(0, $2.34 - $2.50) / $0.22 = 0%
  Status: 🟢 Safe

Scenario 2: P_sim = $2.30 (small dip)
  Consumed = ($2.34 - $2.30) / $0.22 = 18.2%
  Status: 🟢 Safe

Scenario 3: P_sim = $2.25 (moderate dip)
  Consumed = ($2.34 - $2.25) / $0.22 = 40.9%
  Status: 🔵 OK

Scenario 4: P_sim = $2.18 (approaching liq)
  Consumed = ($2.34 - $2.18) / $0.22 = 72.7%
  Status: 🟡 Warning

Scenario 5: P_sim = $2.13 (very close)
  Consumed = ($2.34 - $2.13) / $0.22 = 95.5%
  Status: 🔴 Negative

Scenario 6: P_sim = $2.10 (below liq)
  Consumed = ($2.34 - $2.10) / $0.22 = 109.1%
  Status: ⚫ Liquidated
```

### Status Bar Visual

```
🟢 Safe:        ████████████████████░░░░░░░░░░░░░░░  Position Open
🔵 OK:          ████████████████░░░░░░░░░░░░░░░░░░░  Position Open
🟡 Warning:     ██████████░░░░░░░░░░░░░░░░░░░░░░░░░  Near Liquidation
🔴 Negative:    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  About to Liquidate
⚫ Liquidated:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Liquidated
```

---

## Vertical Price Slider (Right Panel)

- **Range**: ±20% from entry price
- **Entry price** marked with a fixed horizontal line
- **Liquidation price** marked with a red horizontal line (🔴)
- **Knob** starts at entry price after "Run Simulation"
- Dragging the knob **updates all Results in real-time**
- Appears only after "Run Simulation" is clicked

---

## Files

```
src/components/features/
├── DemoMarket.tsx              ← MODIFY (replace "Coming Soon" placeholder)
├── FutureConcepts.tsx          ← NEW (section nav shell)
└── LiquidationSimulator.tsx    ← NEW (calculator + slider + results)
```

---

## Future Sections (code comments only for now)

- **Funding Rate** — Explain periodic funding payments between longs/shorts
- **Leverage** — Interactive leverage impact calculator

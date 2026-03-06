# Order Info Accordion — Feature Plan

## What It Is

A collapsible info panel inside `SpotOrderForm.tsx` that appears **just below the order type tabs**. When a user selects an order type (Market, Limit, etc.), the panel shows:

1. **What it is** — plain language, no jargon
2. **If you're Buying** — use case + tomato example with numbers
3. **If you're Selling** — separate use case + tomato example with numbers

Tomatoes are used as the example "asset" so users understand the mechanic without needing to know crypto terminology. Trigger-based orders (Stop Market, Stop Limit, Trailing Stop) use a **"Spy"** metaphor — a watcher stationed at a price that signals your order when the time is right.

---

## Placement

```
┌────────────────────────────────────────────────────────────┐
│   [ BUY ]   [ SELL ]                                       │
├────────────────────────────────────────────────────────────┤
│   Market │ Limit │ Stop Mkt │ Stop Lmt │ Iceberg │ TWAP   │
│   Trailing │ OCO                                           │
├────────────────────────────────────────────────────────────┤
│  ▼ ℹ LIMIT ORDER  [ Patient ]           [ ▾ collapse ]    │  ← NEW
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📌 What it is                                        │   │
│ │   You leave a note at the stall that says "I'll only │   │
│ │   buy at this price." Order waits until price matches│   │
│ │                                                      │   │
│ │ 🟢 If you're Buying                                  │   │
│ │   Tomatoes are at $10. You set Limit Buy at $8.     │   │
│ │   If they dip → you're in. Target $14, Stop $6.     │   │
│ │                                                      │   │
│ │ 🔴 If you're Selling                                 │   │
│ │   You bought at $8. Set Limit Sell at $14. Auto-    │   │
│ │   sells when tomatoes hit your price.                │   │
│ └──────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│  Entry Price: ___________                                   │
│  Amount:      ___________                                   │
│  [ ▶ Run Simulation ]                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation

### New File: `src/components/features/OrderInfoPanel.tsx`

**Props:**
```tsx
interface OrderInfoPanelProps {
    orderType: DemoOrderType;
    currency: 'USD' | 'INR';
}
```

**Currency-aware prices:**
```tsx
const sym = currency === 'INR' ? '₹' : '$';
// All examples use small round numbers: $10 / ₹10 base price
```

**Behaviour:**
- Default: **open** on first render
- Collapses/expands with chevron toggle
- When order type changes → panel re-opens to show the new type's info
- Smooth CSS height transition (`max-h` + `overflow-hidden`)

**Styling:** Matches the glassmorphic card style used across the app:
```
bg-black/40 border border-white/10 rounded-xl p-4
```

**Badge colours per order type:**
| Order Type | Badge Label | Colour |
|---|---|---|
| Market | `Buy/Sell Now` | Blue |
| Limit | `Set Your Price` | Green |
| Stop Market | `Spy Watches` | Orange |
| Stop Limit | `Spy + Price Cap` | Purple |
| Iceberg | `Hidden Order` | Slate |
| TWAP | `Spread Over Time` | Cyan |
| Trailing Stop | `Moving Spy` | Yellow |
| OCO | `Two Orders, One Wins` | Red |

Each section heading uses a `border-l-2` with the badge colour as its accent.

### Integration in `SpotOrderForm.tsx`

```tsx
// Import at top
import OrderInfoPanel from './OrderInfoPanel';

// In JSX, after the ORDER_TYPES tab row, before the input fields:
<OrderInfoPanel orderType={orderType} currency={settings?.currency ?? 'USD'} />
```

---

## Content — All 8 Order Types

> All examples use **$10** (USD) or **₹10** (INR) as base price. The component renders dynamically based on `currency` prop.

---

### 1. Market — `Buy/Sell Now`

**What it is:**
You buy or sell tomatoes right now at whatever price they're going for at this moment. No waiting, no conditions.

**🟢 Buying:**
You walk into the shop and buy tomatoes at the current price — simple as that.
*$10 tomatoes. You buy immediately. Set profit target $14, protection $8. R:R 1:2.*

**🔴 Selling:**
You sell your tomatoes right now at the current price. You've decided you've made enough.
*Bought at $8. They're now $12. You sell immediately and walk away with profit.*

---

### 2. Limit — `Set Your Price`

**What it is:**
You leave a note at the stall that says "I'll only buy (or sell) tomatoes at exactly this price." The order waits until the price matches yours — or it never fills.

**🟢 Buying:**
You think tomatoes are going to get cheaper before they get expensive again. You set a lower price and wait.
*Tomatoes at $10. Set Limit Buy at $8. If they dip → you're in. Target $14, protection $6. R:R 1:3.*

**🔴 Selling:**
You already have tomatoes. You believe prices will rise further. You set a higher sell price and wait.
*Bought at $8. Set Limit Sell at $14. When tomatoes hit $14 → sold automatically at your price.*

---

### 3. Stop Market — `Spy Watches, Then Buy/Sell Immediately`

**What it is:**
You station a spy at a price level. The spy watches all day. The moment tomato prices cross that level — the spy immediately buys or sells at whatever the current market price is.

**🟢 Buying:**
You only want to buy *if* the price rises past a point. Rising price means demand is growing — your spy signals you in.
*Tomatoes at $10. Tell spy: "If above $12, buy immediately." Spy waits. At $12 → buys. Target $16, protection $10. R:R 1:2.*

**🔴 Selling:**
You already hold tomatoes. Tell your spy: "If the price drops below $8, sell immediately — don't let me lose more."
*Bought at $10. Spy at $8. If tomatoes fall to $8 → spy sells immediately. Loss limited to -20%.*

---

### 4. Stop Limit — `Spy Watches, Then Set a Price`

**What it is:**
Same spy — but after the spy signals, instead of buying at any price, it places a Limit order at your chosen price. You control both *when to react* and the exact price you'll accept.

**🟢 Buying:**
Spy triggers at $12, but you won't pay more than $11.50. If prices jump too fast past $11.50 → no fill. You stay safe.
*Spy trigger: $12. Max pay: $11.50. Target $16, protection $10. R:R 1:3.*

**🔴 Selling:**
Spy triggers at $8, but you won't sell for less than $8.20. If prices crash below $8.20 instantly → order skipped entirely.
*Bought at $10. Spy trigger: $8. Min sell: $8.20. If it gaps below $8.20 → no fill.*

---

### 5. Iceberg — `Hidden Large Order`

**What it is:**
You want to buy (or sell) a huge amount of tomatoes — but you only show a small amount publicly at a time. Each small batch fills quietly, then the next appears automatically.

**🟢 Buying:**
If you show you want 100 tomatoes, sellers raise prices. You hide it and buy quietly.
*Want 100 tomatoes at $10. Show 10 at a time. Each fills, next 10 appears. Full 100 bought at $10.*

**🔴 Selling:**
If you show you're selling 100 tomatoes, buyers offer lower prices. You hide it.
*Have 100 tomatoes at $14. Show 10 for sale at a time. Each batch sells at $14 without crashing price.*

---

### 6. TWAP — `Spread Over Time`

**What it is:**
Your total order is automatically split into equal pieces and executed at regular time intervals — a little at a time, over the duration you set.

**🟢 Buying:**
Buying everything at once can push the price up against you. Spreading out means some pieces are cheaper, some pricier — a better average.
*Spend $100 on tomatoes over 10 mins → $10 per minute. Average price across all market movement.*

**🔴 Selling:**
Dumping everything at once can drop the price on yourself. Spread the sale to get a better average.
*Sell 100 tomatoes over 10 mins → 10 per minute. Steady exit without crashing your own sale price.*

---

### 7. Trailing Stop — `Spy That Moves With the Price`

**What it is:**
A moving spy. As prices move in your favour, the spy moves with them — always keeping a set distance behind. The moment prices reverse by that distance, the spy signals your order.

**🟢 Buying (catching the dip):**
The spy follows price *downward* and buys when it bounces back up by your set amount — tries to catch the lowest point.
*Tomatoes falling from $10. Gap: $1. Reach $7, bounce up $1 to $8 → spy buys at $8 on the way up.*

**🔴 Selling (protecting profit):**
The spy follows price *upward* as it rises. When it drops back by your set gap → spy sells and locks in profit.
*Bought tomatoes at $8. Gap: $1. Price rises to $14 → spy is at $13. Price drops to $13 → spy sells. $5 profit locked.*

---

### 8. OCO — `Two Orders, One Wins`

**What it is:**
Two orders placed at the same time — one above, one below the current price. When one fills, the other is cancelled automatically. You set both your hope and your protection at once.

**🟢 Buying:**
Place a limit buy below current price AND a stop buy above. Whichever direction the market moves first — you get in.
*Tomatoes at $10. Limit Buy at $8 (if dip) OR Stop Buy at $12 (if rise). One fills → other cancels.*

**🔴 Selling:**
You're already holding. Set your profit target and your protection at the same time — whichever price is hit first closes your position.
*Bought at $8. OCO: Sell at $14 (profit, +75%) and Sell at $6 (protection, -25%). If $14 hit → profit taken, protection gone. R:R 1:3.*

---

## UX Behaviour Detail

| Behaviour | Detail |
|---|---|
| First render | Panel open by default |
| Switching order type | Panel re-opens automatically to show new info |
| Manual collapse | User taps chevron → stays collapsed until next type switch |
| Currency switching | All example prices update immediately (USD ↔ INR) |
| Buy/Sell toggle | Section headers highlighted based on active side (`🟢` vs `🔴`) |

---

## Impact on Existing Code

| File | Change | Impact |
|---|---|---|
| `SpotOrderForm.tsx` | Add `<OrderInfoPanel>` below tabs | Minor — one import + one JSX line |
| `OrderInfoPanel.tsx` | New file | Self-contained, no side effects |
| `SpotConcepts.tsx` | Pass `settings?.currency` down to `SpotOrderForm` | `SpotOrderForm` props extended by 1 field |
| `SpotOrderForm` props | Add `currency: 'USD' \| 'INR'` | Non-breaking if defaulted to `'USD'` |

---

## Files to Create / Modify

| Action | File |
|---|---|
| **CREATE** | `src/components/features/OrderInfoPanel.tsx` |
| **MODIFY** | `src/components/features/SpotOrderForm.tsx` — add import + render |
| **MODIFY** | `src/components/features/SpotConcepts.tsx` — pass `currency` prop |

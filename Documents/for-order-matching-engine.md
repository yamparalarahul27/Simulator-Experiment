# YDEX Component & Spot Simulation Reference — For Order Matching Engine

> Extracted from the YDEX codebase (Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase).
> Purpose: Reusable patterns, logic, and component details for the Order Matching Engine project.

---

## Table of Contents

1. [Navbar](#1-navbar)
2. [Trade History](#2-trade-history)
3. [Order Book](#3-order-book)
4. [Place Order (Order Form)](#4-place-order--order-form)
5. [Open Orders](#5-open-orders)
6. [Market Stats](#6-market-stats)
7. [Footer](#7-footer)
8. [Spot Order Simulation — Complete Logic](#8-spot-order-simulation--complete-logic)

---

## 1. Navbar

### Files
- `src/components/layout/GlassmorphismNavbar.tsx` — Responsive glassmorphism nav bar
- `src/components/layout/TabNavigation.tsx` — SPA navigation controller + state manager
- `src/components/layout/HamburgerButton.tsx` — Animated hamburger/X toggle

### Architecture
YDEX uses a **custom-event-driven SPA** pattern (not file-based routing). `TabNavigation` manages active tab state and dispatches `CustomEvent`s for cross-component navigation.

### GlassmorphismNavbar Props

```typescript
interface NavItem {
    title: string;
    href: string;
    category?: 'main' | 'dropdown' | 'info';
    onClick?: (e: React.MouseEvent) => void;
}

interface NetworkStatus {
    name: string;
    variant: 'devnet' | 'mainnet' | 'mock';
    isActive: boolean;
}

interface GlassmorphismNavbarProps {
    logo: ReactNode | string;
    logoHref?: string;                    // default: '/'
    navItems: NavItem[];
    activePath?: string;                  // e.g., "#dashboard"
    networkStatus?: NetworkStatus;
    dropdownTitle?: string;               // default: 'More'
    onNetworkChange?: (network: 'devnet' | 'mainnet' | 'mock') => void;
    onProfileSettingsClick?: () => void;
    onExchangeManagerClick?: () => void;
    onSwitchMode?: () => void;
    userMode?: 'analytica' | 'pedia';
    className?: string;
}
```

### Internal State
```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
```

### Key Behaviors
- **Nav items categorized**: `main` (inline), `dropdown` (collapsible), `info` (inline secondary)
- **Click-outside detection**: `useEffect` + refs for all dropdowns
- **Mobile**: Full-screen overlay (`fixed inset-0 z-40`), body scroll locked, auto-closes on path change
- **Mode switching**: Analytica (analytics/journal) vs Pedia (web3/trading) — changes available tabs + navbar position
- **Active indicator**: Purple bottom border on active tab (`border-b-2 border-purple-500`)

### Styling Pattern (Glassmorphism)
```css
bg-black/80 backdrop-blur-xl border border-white/10 rounded-none
shadow-2xl shadow-black/20
/* Text: white/60 inactive → white active */
/* Hover: hover:text-white hover:bg-white/5 */
```

### Event System
```typescript
// Navigate to a tab from any component
window.dispatchEvent(new CustomEvent('deriverse:set-active-tab', { detail: 'dashboard' }));

// Switch app mode
window.dispatchEvent(new CustomEvent('deriverse:set-user-mode', { detail: 'analytica' }));
```

### Tab Configuration
```typescript
type TabType = 'dashboard' | 'market' | 'lookup' | 'journal' | 'web3' |
               'exchange-manager' | 'appdocs' | 'help' | 'roadmap' | 'profile-settings';

const ANALYTICA_TABS: TabType[] = ['dashboard', 'lookup', 'journal'];
const PEDIA_TABS: TabType[] = ['web3', 'lookup', 'market'];
```

### Persistence
- `localStorage('deriverse.activeTab')` — restores last active tab
- `localStorage('deriverse.userMode')` — restores analytica/pedia mode
- Legacy migration: `'settings' → 'profile-settings'`

### HamburgerButton
- Three-bar → X animation via CSS transforms
- Sizes: `sm | md | lg` — configurable bar heights and translate distances
- Colors: `white | black | gray | custom`
- Transition: `duration-300` on all bars

### LivePulseIndicator (Network Status)
```typescript
interface LivePulseIndicatorProps {
    variant?: 'devnet' | 'mainnet' | 'success' | 'mock' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    noPing?: boolean;
}
// Two-layer: expanding animate-ping circle + solid glowing dot
// Colors: devnet=emerald, mainnet=blue, mock=yellow, danger=red, info=cyan
```

---

## 2. Trade History

### Files
- `src/components/features/TradeHistory.tsx` — Main container (503 lines)
- `src/components/features/DeriverseTradesTable.tsx` — Trade display table (188 lines)
- `src/services/SupabaseTradeService.ts` — Trade persistence
- `src/services/SupabaseWalletService.ts` — Wallet metadata
- `src/services/DeriverseTradeService.ts` — On-chain trade parsing
- `src/services/HeliusService.ts` — RPC transaction history

### Props
```typescript
interface TradeHistoryProps {
    onSwitchToRealData?: (walletAddress: string) => void;
}
```

### State (11 core + 6 supporting)
```typescript
loading, error, transactions, deriverseTrades, hasSearched,
activeTab ('deriverse' | 'all'), loadingDeriverse, loadingHelius,
inputMode ('manual' | 'wallet'), howItWorksOpen, savingTrades,
showAnalyticsModal, savedTradeCount, dataSource ('cache' | 'fresh'),
hasCachedData, currentWalletAddress, walletInfo
```

### Data Flow
1. User enters wallet address (manual paste) or connects Jupiter wallet
2. System checks Supabase cache for existing trades
3. Parallel fetch: **Deriverse** on-chain trades + **Helius** RPC transactions
4. Results displayed in tabbed view (Deriverse Trades | All Transactions)
5. User can save trades to Supabase for analytics dashboard

### Deriverse Trade Fetching
- Engine: `@deriverse/kit` SDK
- Fetches up to 1000 signatures via `getSignaturesForAddress`
- Processes in batches of 5 with 600ms delay (rate limiting)
- Max 100 transactions processed
- Parses spot fills and perpetual fills from program logs
- Sorts by `closedAt` descending

### Helius Transaction Fetching
- Gets last 50 signatures
- Parallel transaction fetch with `maxSupportedTransactionVersion: 0`
- Type detection by program ID:
  - `11111...` → System Transfer
  - `Tokenkeg...` → Token Transfer
  - `JUP...` → Jupiter Swap
  - `PROGRAM_ID` → Deriverse

### Trade Type (shared)
```typescript
interface Trade {
    id: string;
    symbol: string;
    quoteCurrency: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    orderType: OrderType;
    quantity: number;
    price: number;
    notional: number;
    pnl: number;
    fee: number;
    feeCurrency: string;
    openedAt: Date;
    closedAt: Date;
    durationSeconds: number;
    isWin: boolean;
    txSignature: string;
    feeBreakdown?: FeeComposition[];
    isMaker?: boolean;
    leverage?: number;
    liquidationPrice?: number;
    marginUsed?: number;
}
```

### DeriverseTradesTable Columns (10)
| # | Column | Source | Alignment | Style |
|---|--------|--------|-----------|-------|
| 1 | Time | `closedAt.toLocaleString()` | Left | — |
| 2 | Symbol | `trade.symbol` | Left | — |
| 3 | Type | "Perpetual" / "Spot" | Left | Badge: purple / blue |
| 4 | Side | "BUY/LONG" / "SELL/SHORT" | Left | Badge: green / red |
| 5 | Quantity | `quantity.toFixed(4)` | Right | — |
| 6 | Price | `$price.toFixed(2)` | Right | `font-mono` |
| 7 | Notional | `$notional.toFixed(2)` | Right | `font-mono` |
| 8 | PnL | Colored +/- | Right | Bold, green/red/zinc |
| 9 | Fee | `fee.toFixed(4)` | Right | `font-mono` |
| 10 | Signature | Truncated link | Left | Solscan explorer link |

### Statistics Summary (6-column grid)
- Total Trades, Total PnL (colored), Win Rate (%), Total Fees, Save Button, Actions

### Styling Patterns
```css
/* Table container */
overflow-x-auto max-h-[60vh]

/* Sticky header */
bg-black/90 backdrop-blur-xl border-b border-white/10

/* Row animation */
animation: fadeIn 0.3s ease-in-out ${index * 0.05}s both  /* Staggered cascade */

/* Row hover */
hover:bg-white/5 transition-all duration-200

/* Badge pattern */
bg-{color}-500/20 text-{color}-300 border border-{color}-500/30
```

---

## 3. Order Book

### Files
- `src/components/features/SpotOrderBook.tsx` — UI component (React.memo)
- `src/lib/hooks/useSpotTrade.ts` — Order book generation (lines 55–104)
- `src/lib/context/LivePricesContext.tsx` — WebSocket price feed

### Props
```typescript
interface SpotOrderBookProps {
    orderBook: OrderBookData;
    formatPrice: (amount: number, decimals?: number) => string;
    onPriceClick: (price: number) => void;
}
```

### Data Structures
```typescript
interface OrderBookLevel {
    price: number;      // Individual price level
    size: number;       // Quantity at this level
    total: number;      // Cumulative quantity from best price
}

interface OrderBookData {
    asks: OrderBookLevel[];    // Sorted ascending (lowest first)
    bids: OrderBookLevel[];    // Sorted descending (highest first)
    spread: number;            // bestAsk - bestBid
    spreadPercent: number;     // (spread / midPrice) * 100
}
```

### Order Book Generation Algorithm
```typescript
function generateOrderBook(midPrice: number, seed: number = 42): OrderBookData {
    const rng = new SimpleRNG(seed + Math.floor(midPrice * 100));
    const spreadPct = 0.001 + rng.next() * 0.002;  // 0.1% - 0.3% spread

    const bestAsk = midPrice * (1 + spreadPct / 2);
    const bestBid = midPrice * (1 - spreadPct / 2);

    // 15 levels per side, increasing depth
    for (let i = 0; i < 15; i++) {
        askPrice = bestAsk * (1 + i * 0.0015 + rng.next() * 0.0005);
        askSize = (10 + rng.next() * 50) * (1 + i * 0.3);
        // Cumulative total tracked per level
    }
    // Same pattern for bids (descending)
}
```

**Seeded RNG** (Linear Congruential Generator):
```typescript
class SimpleRNG {
    private seed: number;
    next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}
```

### Update Strategy
- Regenerates only when price moves >= 0.05% from last update
- Seed derived from: `Math.floor(currentPrice * 1000) % 10000`
- Deterministic: same price = same book every time

### Layout
```
┌──────────────────────────────────┐
│  Price   │   Size   │   Total   │  ← Headers (9px mono, 30% opacity)
├──────────────────────────────────┤
│  ASK 15  │  12.5K   │  150.2K   │  ← Red, depth bar bg-red-500/8
│  ...     │  ...     │  ...      │
│  ASK 1   │  3.2K    │  3.2K     │  ← Closest to spread (reversed display)
├──────────────────────────────────┤
│  Spread: $0.05        0.111%    │  ← Border-y, mono
├──────────────────────────────────┤
│  BID 1   │  4.1K    │  4.1K     │  ← Green, depth bar bg-green-500/8
│  ...     │  ...     │  ...      │
│  BID 15  │  15.8K   │  160.3K   │  ← Deepest liquidity
└──────────────────────────────────┘
```

### Depth Bar Visualization
```typescript
// Width = cumulative total / max total across all levels
width: `${(level.total / maxTotal) * 100}%`
// Colors: red-500/8 for asks, green-500/8 for bids
```

### Price Formatting
```typescript
if (price > 10000)  → toLocaleString (thousands separator)
if (price < 0.001)  → toFixed(7)
if (price < 1)      → toFixed(4)
else                → toFixed(2)
```

### Interactivity
- Each price level is a `<button>` with `data-price` attribute
- Single click handler via `useCallback` (avoids N closures)
- `onPriceClick(price)` — populates order form with clicked price

### Real-Time Data Flow
```
Binance WebSocket (~500ms ticks)
  → LivePricesContext.onmessage (store in ref)
  → 500ms flush interval (batch to state)
  → useSpotTrade.currentPrice (useMemo)
  → obSeed check (0.05% threshold)
  → generateOrderBook(price, seed)
  → SpotOrderBook re-render (React.memo)
```

---

## 4. Place Order / Order Form

### Files
- `src/components/features/SpotOrderForm.tsx` — Form UI + validation (React.memo)
- `src/lib/hooks/useSpotTrade.ts` — Execution + matching engine
- `src/services/SupabaseDemoService.ts` — Order CRUD
- `src/components/features/OrderFlowVisualiser.tsx` — Visual state machine (1071 lines)

### Props
```typescript
interface SpotOrderFormProps {
    pair: string;
    currentPrice: number;
    formatPrice: (amount: number, decimals?: number) => string;
    orderType: DemoOrderType;
    onOrderTypeChange: (v: DemoOrderType) => void;
    side: 'buy' | 'sell';
    onSideChange: (v: 'buy' | 'sell') => void;
    onRunSimulation: (config: SimConfig) => void;
}
```

### Form State (Consolidated)
```typescript
interface FormState {
    price: string;                // Limit price
    stopPrice: string;            // Stop trigger
    limitPrice: string;           // Stop-limit's limit leg
    amount: string;               // Quantity
    visibleQty: string;           // Iceberg slice size
    tpEnabled: boolean;           // TP toggle
    slEnabled: boolean;           // SL toggle
    tpPrice: string;              // Take profit price
    slPrice: string;              // Stop loss price
    activationPrice: string;      // Trailing stop activation
    trailingPercent: string;      // Trailing stop delta %
    twapDuration: string;         // Default: '60' seconds
    twapIntervals: string;        // Default: '6' slices
}
```

### 8 Order Types — Summary

| # | Type | Fields | Trigger | TP/SL | Status Flow |
|---|------|--------|---------|-------|-------------|
| 1 | **Market** | Amount | Instant | Yes | `pending → filled` (instant) |
| 2 | **Limit** | Price, Amount, TP, SL | `price ≤/≥ limit` | Yes (only type) | `pending → filled` |
| 3 | **Stop Market** | Stop Price, Amount | `price ≥/≤ stop` | No | `pending → filled` |
| 4 | **Stop Limit** | Stop, Limit, Amount | Stop → Limit (2-stage) | No | `pending → triggered → filled` |
| 5 | **Iceberg** | Price, Visible Qty, Amount | `price ≤/≥ limit` per slice | No | `pending → partial* → filled` |
| 6 | **TWAP** | Amount, Duration, Intervals | Time-based slices | No | `pending → partial* → filled` |
| 7 | **Trailing Stop** | Activation, Trail %, Amount | Price reverses by trail % | No | `pending → filled` |
| 8 | **OCO** | Limit Price, Stop Price, Amount | Whichever hits first | No | `pending → filled` (other cancels) |

### Validation Rules Matrix

| Scenario | Condition | Block Type |
|----------|-----------|------------|
| Limit Buy > Market | `limitPrice > currentPrice` | Warning (fills as market) |
| Limit Sell < Market | `limitPrice < currentPrice` | Warning (fills as market) |
| Stop Market Buy < Market | `stopPrice < currentPrice` | **HARD BLOCK** |
| Stop Market Sell > Market | `stopPrice > currentPrice` | **HARD BLOCK** |
| Stop Limit Buy Limit < Stop | `limitPrice < stopPrice` | Warning |
| Trailing Buy activation >= Market | `activation >= currentPrice` | **HARD BLOCK** |
| Trailing Sell activation <= Market | `activation <= currentPrice` | **HARD BLOCK** |
| Trailing % out of range | `< 0.1% or > 20%` | **HARD BLOCK** |
| Iceberg visible >= total | `visibleQty >= amount` | **HARD BLOCK** |
| OCO Buy: limit >= market | `limitPrice >= currentPrice` | **HARD BLOCK** |
| OCO Buy: stop <= market | `stopPrice <= currentPrice` | **HARD BLOCK** |
| TP Buy <= entry | `tpPrice <= entryPrice` | **HARD BLOCK** |
| SL Buy >= entry | `slPrice >= entryPrice` | **HARD BLOCK** |
| Insufficient balance | `available < notional + fee` | **HARD BLOCK** |

### TP/SL Rules (Limit Orders Only)
- **Take Profit**: Spawns opposite-side **Limit** order at `tpPrice`
- **Stop Loss**: Spawns opposite-side **Stop Market** at `slPrice`
- **R:R Badge**: `|TP - Entry| / |SL - Entry|`
  - Green (>= 1.5): Favourable
  - Yellow (>= 1.0): Neutral
  - Red (< 1.0): Poor

### Balance Check Flow
```typescript
// Buy: Need USDC >= (quantity * price) + fee
// Sell: Need Token >= quantity
// Fee: 0.1% of notional (quantity * price * 0.001)
```

---

## 5. Open Orders

### Files
- `src/components/features/SpotTradeHistory.tsx` — Table display (286 lines)
- `src/lib/hooks/useSpotTrade.ts` — State + cancel logic

### Props
```typescript
interface SpotTradeHistoryProps {
    openOrders: DemoOrder[];      // status: pending | partial | triggered
    filledOrders: DemoOrder[];    // status: filled | cancelled
    balances: DemoBalance[];
    cancelOrder: (orderId: string) => Promise<void>;
    formatPrice: (amount: number, decimals?: number) => string;
}
```

### Open Orders Tab — Columns

| Column | Data | Style |
|--------|------|-------|
| Time | `formatTime(createdAt)` HH:MM:SS | — |
| Pair | `order.pair` | — |
| Type | `orderType.replace('_', ' ')` | Uppercase |
| Side | `BUY / SELL` | Green / Red |
| Price | `price || stopPrice || '—'` | Mono |
| Amount | `quantity.toFixed(4)` | — |
| Filled | Progress bar (partial) or dash | Width-based |
| Status | Status badge | Color-coded |
| TP/SL | Indicators | Green TP / Red SL |
| Action | Cancel button | Red text |

### Status Badge Styles
```typescript
const statusColors = {
    pending:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    partial:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    filled:    'text-green-400 bg-green-500/10 border-green-500/20',
    cancelled: 'text-white/30 bg-white/5 border-white/10',
    triggered: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};
// Badge: px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border
```

### Trade History Tab — Columns
| Column | Data |
|--------|------|
| Date | MMM DD |
| Time | HH:MM:SS |
| Pair | `order.pair` |
| Side | Colored BUY/SELL |
| Type | Order type |
| Price | `fillPrice || '—'` |
| Amount | `filledQuantity.toFixed(4)` |
| Total | `filledQty * fillPrice` |
| Fee | `formatPrice(fee)` |
| Status | Badge |

### Balances Tab — Columns
| Column | Data |
|--------|------|
| Token | `bal.token` |
| Available | Smart decimal formatting |
| In Order | Reserved amount or "—" |
| Total | `available + inOrder` |
| Value | USD equivalent via live prices |

### Cancellation Flow
1. User clicks "Cancel" → `setCancellingId(id)` (shows "...")
2. `cancelOrder(id)` → updates status to `'cancelled'` in Supabase
3. Calculates remaining: `quantity - filledQuantity`
4. Returns reserved balance: `inOrder → available`
   - Buy: Returns USDC (notional + fee)
   - Sell: Returns token (remaining qty)
5. `refreshOrders()` → UI updates
6. Toast: "Order cancelled"

### Filtering Strategy
```typescript
// Open Orders
service.getOrders(walletAddress, ['pending', 'partial', 'triggered'])

// Trade History
service.getOrders(walletAddress, ['filled', 'cancelled'])

// Both sorted: created_at DESC (newest first)
```

---

## 6. Market Stats

### Files
- `src/components/ui/MarketTicker.tsx` — Live scrolling ticker (9 tokens)
- `src/lib/context/LivePricesContext.tsx` — Global price context (6 tokens)
- `src/app/api/prices/route.ts` — CoinGecko fallback API

### MarketTicker — Supported Tokens (9)
BTC, ETH, SOL, JUP, PYTH, BONK, JTO, WIF, RAY (all USDT pairs)

### Data Sources

**Primary: Binance WebSocket**
```
wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/...
```
- Free, no API key required
- Multi-stream single connection
- Data: current price (`c`), 24h change % (`P`)

**Fallback: CoinGecko REST**
```
GET /api/prices → https://api.coingecko.com/api/v3/simple/price
?ids=solana,bitcoin,ethereum,...&vs_currencies=usd&include_24hr_change=true
```
- Polling interval: 5s (ticker) / 4s (context)
- Activates on WebSocket error

### Price Update Architecture
```
Binance WebSocket ticks (~500ms)
  → Store in latestDataRef (non-blocking)
  → 500ms setInterval flushes to React state
  → Only re-renders if prices actually changed
  → Prevents rendering thrashing
```

### Ticker Display Format
```
[Symbol] [Price] [Arrow] [Change%]
BTC/USDT  $42,567.89  ↑  2.35%
```

### Price Formatting
```typescript
if (price > 1000)   → toLocaleString (thousands separator, 2 decimals)
if (price < 0.01)   → toFixed(7)
else                → toFixed(4)
```

### Ticker Styling
```css
/* Container */
fixed top-0 left-0 right-0 z-[60] h-10 bg-black border-b border-white/10

/* Animation */
@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }
animation: marquee 60s linear infinite

/* Items duplicated 3x for seamless loop */

/* Edge fades */
bg-gradient-to-r from-black to-transparent  /* Left edge, 24px */
bg-gradient-to-l from-black to-transparent  /* Right edge, 24px */
```

### LivePricesContext (Trading Components)
```typescript
interface PriceData {
    price: number;
    change: number;
    isOverridden: boolean;  // Manual override via Control Panel
}

// Usage:
const { livePrices, wsSource } = useLivePrices();
// livePrices: Record<DemoToken, PriceData>
// wsSource: 'ws' | 'rest' | null
```

### 24h Stats Available
- **Displayed**: Price, 24h change %
- **Not displayed**: 24h volume, 24h high/low (would need different endpoint)

---

## 7. Footer

### Files
- `src/components/layout/Footer.tsx` — Main app footer
- `src/components/ui/WelcomeFooter.tsx` — Welcome/onboarding footer

### Main Footer
- Glassmorphism container: `border-white/10 bg-black/2`
- Corner accents: 3x3px purple borders at each corner
- Content: "Design & Engineered by [Name], (c) 2026 YDEX"
- Interactive: Click name → QR code modal (`bg-black/70` backdrop, `z-50`)
- Text: `text-white/60 text-sm font-mono`

### Welcome Footer
- "Powered by" + Solana Network logo
- Attribution link to Telegram
- Framer Motion animations: fade + Y-slide (staggered)
- Position: Absolute bottom-8, centered
- Used on: WelcomeScreen, NewUserModal, DeriverseWalletAsk

### Footer Position in Layout
```
TabNavigation.tsx
  → content wrapper (pt-44 p-4 max-w-7xl mx-auto)
  → renderTabContent()
  → <Footer />  ← Bottom of page content
```

---

## 8. Spot Order Simulation — Complete Logic

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                             │
│  SpotOrderForm → executeTrade() → SupabaseDemoService           │
│  SpotTradeHistory ← refreshOrders() ← useSpotTrade hook        │
│  SpotOrderBook ← generateOrderBook() ← LivePricesContext        │
│  OrderFlowVisualiser ← SimConfig (interactive simulation)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  MATCHING       │
                    │  ENGINE         │
                    │  (2s interval)  │
                    │  Price-based    │
                    │  per order type │
                    └───────┬────────┘
                            │
              ┌─────────────▼──────────────┐
              │     SUPABASE (PostgreSQL)    │
              │  demo_orders                │
              │  demo_balances              │
              │  demo_settings              │
              └────────────────────────────┘
```

### Database Schema

#### demo_orders
```sql
CREATE TABLE demo_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  TEXT NOT NULL,
    pair            TEXT NOT NULL,                      -- e.g., "SOL/USDC"
    side            TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type      TEXT NOT NULL CHECK (order_type IN (
        'market', 'limit', 'stop_market', 'stop_limit',
        'iceberg', 'twap', 'trailing_stop', 'oco'
    )),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'partial', 'filled', 'cancelled', 'triggered'
    )),
    price           NUMERIC,         -- Limit price
    stop_price      NUMERIC,         -- Stop trigger
    limit_price     NUMERIC,         -- Stop-limit's limit leg
    fill_price      NUMERIC,         -- Actual execution price
    quantity        NUMERIC NOT NULL,
    filled_quantity NUMERIC NOT NULL DEFAULT 0,
    tp_price        NUMERIC,
    sl_price        NUMERIC,
    visible_qty     NUMERIC,         -- Iceberg slice
    twap_duration   INTEGER,         -- Seconds
    twap_intervals  INTEGER,         -- Slice count
    twap_next_slice_at TIMESTAMPTZ,
    parent_order_id UUID REFERENCES demo_orders(id) ON DELETE SET NULL,
    fee             NUMERIC NOT NULL DEFAULT 0,
    fee_currency    TEXT NOT NULL DEFAULT 'USDC',
    pnl             NUMERIC,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filled_at       TIMESTAMPTZ
);

CREATE INDEX idx_demo_orders_wallet ON demo_orders(wallet_address);
CREATE INDEX idx_demo_orders_status ON demo_orders(status);
CREATE INDEX idx_demo_orders_wallet_status ON demo_orders(wallet_address, status);
CREATE INDEX idx_demo_orders_pair ON demo_orders(pair);
CREATE INDEX idx_demo_orders_parent ON demo_orders(parent_order_id);
CREATE INDEX idx_demo_orders_created ON demo_orders(created_at DESC);
```

#### demo_balances
```sql
CREATE TABLE demo_balances (
    wallet_address TEXT NOT NULL,
    token          TEXT NOT NULL,
    available      NUMERIC NOT NULL DEFAULT 0,
    in_order       NUMERIC NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (wallet_address, token)
);
```

#### demo_settings
```sql
CREATE TABLE demo_settings (
    wallet_address  TEXT PRIMARY KEY,
    currency        TEXT NOT NULL DEFAULT 'USD',
    usd_inr_rate    NUMERIC NOT NULL DEFAULT 90.98,
    price_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript Types
```typescript
type DemoOrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit' |
                     'iceberg' | 'twap' | 'trailing_stop' | 'oco';
type DemoOrderSide = 'buy' | 'sell';
type DemoOrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled' | 'triggered';

interface DemoOrder {
    id: string;
    walletAddress: string;
    pair: string;
    side: DemoOrderSide;
    orderType: DemoOrderType;
    status: DemoOrderStatus;
    price: number | null;
    stopPrice: number | null;
    limitPrice: number | null;
    fillPrice: number | null;
    quantity: number;
    filledQuantity: number;
    tpPrice: number | null;
    slPrice: number | null;
    visibleQty: number | null;
    twapDuration: number | null;
    twapIntervals: number | null;
    twapNextSliceAt: string | null;
    parentOrderId: string | null;
    fee: number;
    feeCurrency: string;
    pnl: number | null;
    createdAt: string;
    updatedAt: string;
    filledAt: string | null;
}

interface DemoBalance {
    walletAddress: string;
    token: string;
    available: number;
    inOrder: number;
    updatedAt: string;
}

const DEFAULT_BALANCES: Record<string, number> = {
    USDC: 10_000, SOL: 50, BTC: 0.1, ETH: 2,
    JUP: 500, BONK: 5_000_000, XRP: 1_000,
};
```

### Constants
```typescript
const FEE_RATE = 0.001;                    // 0.1% of notional
const MATCH_INTERVAL = 2000;               // 2 seconds
const ORDER_BOOK_LEVELS = 15;              // Per side
const SPREAD_RANGE = [0.001, 0.003];       // 0.1% - 0.3%
const OB_UPDATE_THRESHOLD = 0.0005;        // 0.05% price change
const DEMO_PAIRS = [
    { token: 'SOL',  pair: 'SOL/USDC',  binance: 'SOLUSDT' },
    { token: 'BTC',  pair: 'BTC/USDC',  binance: 'BTCUSDT' },
    { token: 'ETH',  pair: 'ETH/USDC',  binance: 'ETHUSDT' },
    { token: 'JUP',  pair: 'JUP/USDC',  binance: 'JUPUSDT' },
    { token: 'BONK', pair: 'BONK/USDC', binance: 'BONKUSDT' },
    { token: 'XRP',  pair: 'XRP/USDC',  binance: 'XRPUSDT' },
];
```

### Complete Order Lifecycle

#### Phase 1: Placement (`executeTrade`)

```
User submits form
  → Validate balance (USDC for buy, Token for sell)
  → Reserve balance:
      Market:  Deduct immediately + credit other side
      Pending: Move to inOrder (locked)
  → Insert into demo_orders via SupabaseDemoService
      Market:  status='filled', fillPrice=current, filledAt=now
      Others:  status='pending', fillPrice=null
  → Market orders: Create TP/SL children immediately
  → refreshOrders() → UI update
  → Toast notification
```

#### Phase 2: Matching Engine (2s polling)

```typescript
// Runs every 2 seconds while wallet connected + openOrders.length > 0

// LIMIT
if (order.orderType === 'limit' && order.status === 'pending') {
    const shouldFill = side === 'buy' ? price <= limitPrice : price >= limitPrice;
    if (shouldFill) → fillOrder(order, price);
}

// STOP MARKET
if (order.orderType === 'stop_market' && order.status === 'pending') {
    const triggered = side === 'buy' ? price >= stopPrice : price <= stopPrice;
    if (triggered) → fillOrder(order, price);
}

// STOP LIMIT — Stage 1 (trigger)
if (order.orderType === 'stop_limit' && order.status === 'pending') {
    const triggered = side === 'buy' ? price >= stopPrice : price <= stopPrice;
    if (triggered) → updateOrder({ status: 'triggered' });
}

// STOP LIMIT — Stage 2 (fill)
if (order.orderType === 'stop_limit' && order.status === 'triggered') {
    const shouldFill = side === 'buy' ? price <= limitPrice : price >= limitPrice;
    if (shouldFill) → fillOrder(order, price);
}

// ICEBERG (partial fills)
if (order.orderType === 'iceberg' && status in ['pending', 'partial']) {
    if (priceCondition) {
        sliceQty = min(visibleQty, remaining);
        newFilled = filledQuantity + sliceQty;
        isDone = newFilled >= quantity;
        → updateOrder({ status: isDone ? 'filled' : 'partial', filledQuantity: newFilled });
        → applyFill(order, sliceQty, price);
    }
}

// TWAP (time-based slices)
if (order.orderType === 'twap' && status in ['pending', 'partial']) {
    if (now >= nextSliceAt) {
        sliceQty = quantity / intervals;
        newFilled = filledQuantity + min(sliceQty, remaining);
        isDone = newFilled >= quantity * 0.999;
        nextSliceAt = now + (duration / intervals);
        → updateOrder({ status, filledQuantity, twapNextSliceAt });
        → applyFill(order, actualSlice, price);
    }
}
```

#### Phase 3: Fill (`fillOrder`)

```
Update order: status='filled', filledQuantity=quantity, fillPrice=price, filledAt=now
  → applyFill(): Settle balance (inOrder → available + received asset)
  → createTpSlOrders(): Spawn TP (Limit) + SL (Stop Market) if attached
  → Toast: "Order Filled: BUY 10 SOL/USDC @ $180.45"
```

#### Phase 4: Balance Settlement (`applyFill`)

```
Buy fill:
  USDC.inOrder   -= (notional + fee)     // Release reservation
  Token.available += qty                  // Receive purchased asset

Sell fill:
  Token.inOrder   -= qty                  // Release reservation
  USDC.available  += (notional - fee)     // Receive sale proceeds
```

#### Phase 5: TP/SL Child Orders (`createTpSlOrders`)

```
If tpPrice set:
  → Create Limit order (opposite side) at tpPrice
    parentOrderId = parent.id

If slPrice set:
  → Create Stop Market order (opposite side) at slPrice
    parentOrderId = parent.id

Both enter openOrders queue → matched by engine on next cycle
```

#### Phase 6: Cancellation (`cancelOrder`)

```
Set status = 'cancelled'
  → Calculate remaining: quantity - filledQuantity
  → Return reserved balance:
      Buy cancel:  USDC.available += (notional + fee), USDC.inOrder -= same
      Sell cancel: Token.available += remaining, Token.inOrder -= remaining
  → refreshOrders()
  → Toast: "Order cancelled"
```

### useSpotTrade Hook — Return Values

```typescript
return {
    // State
    selectedPair, setSelectedPair,
    balances: DemoBalance[],
    openOrders: DemoOrder[],       // pending | partial | triggered
    filledOrders: DemoOrder[],     // filled | cancelled
    settings: DemoSettings | null,
    isLoading: boolean,
    livePrices: Record<Token, PriceData>,
    currentPrice: PriceData,
    orderBook: OrderBookData,
    wsDisabled: Record<Token, boolean>,
    wsSource: 'ws' | 'rest',

    // Formatters
    formatPrice: (amount: number, decimals?: number) => string,

    // Actions
    executeTrade: (params: CreateOrderParams) => Promise<DemoOrder | null>,
    cancelOrder: (orderId: string) => Promise<void>,
    refreshOrders: () => Promise<void>,

    // Control Panel
    setPriceOverride, resetAllOverrides,
    updateCurrency, updateUsdInrRate,
    resetBalancesToDefault,
};
```

### Order Flow Visualiser — Session Extrema (Latching)

The visualiser tracks price history for interactive simulation:

```typescript
// Session-level price extrema
const [savedMin, setSavedMin] = useState(simPrice);
const [savedMax, setSavedMax] = useState(simPrice);

// Post-fill extrema (for TP/SL detection after main fill)
const [savedPostFillMin, setSavedPostFillMin] = useState(simPrice);
const [savedPostFillMax, setSavedPostFillMax] = useState(simPrice);
const [wasMainFilled, setWasMainFilled] = useState(false);
```

**Latching Behavior**: Once an order condition is met (e.g., limit price hit), that state "latches" — scrolling price backward doesn't undo the fill. Teaches trade irreversibility.

### Order Type State Machines (Visualiser)

```
MARKET:        PLACED → FILLED
LIMIT:         PLACED → PENDING → FILLED | CANCELLED
STOP_MARKET:   PLACED → WATCHING → TRIGGERED → FILLED | CANCELLED
STOP_LIMIT:    PLACED → WATCHING → TRIGGERED → PENDING → FILLED | CANCELLED
ICEBERG:       PLACED → PARTIAL → REFRESHED → PARTIAL (loop) → FILLED | CANCELLED
TWAP:          PLACED → INTERVAL → PARTIAL → INTERVAL (loop) → FILLED | CANCELLED
TRAILING_STOP: PLACED → TRACKING (self-loop) → TRIGGERED → FILLED | CANCELLED
OCO:           PLACED → (LIMIT + STOP parallel) → one FILLED, other CANCELLED
```

### Node States During Visualization
- `skeleton` — Not yet relevant
- `active` — Currently executing (pulsing glow ring)
- `position` — Filled with TP/SL attached
- `filled_terminal` — TP/SL completed (solid double border)
- `completed` — Done, not active
- `future` — Not yet reached
- `cancelled` — Order cancelled

### Trailing Stop Virtual Watermark
```typescript
function calcVirtualTrailingStop(entry, activation, percent, side, maxExtremum) {
    if (side === 'buy') {
        const nadir = Math.min(entry, maxExtremum);
        return nadir * (1 + percent / 100);
    } else {
        const apex = Math.max(entry, maxExtremum);
        return apex * (1 - percent / 100);
    }
}
```

---

## Source Files Index

| Category | File | Lines | Purpose |
|----------|------|-------|---------|
| **Layout** | `src/components/layout/GlassmorphismNavbar.tsx` | ~600 | Responsive nav bar |
| **Layout** | `src/components/layout/TabNavigation.tsx` | ~200 | SPA navigation controller |
| **Layout** | `src/components/layout/HamburgerButton.tsx` | ~80 | Mobile menu toggle |
| **Layout** | `src/components/layout/Footer.tsx` | ~100 | App footer + QR modal |
| **UI** | `src/components/ui/LivePulseIndicator.tsx` | ~80 | Status indicator |
| **UI** | `src/components/ui/MarketTicker.tsx` | ~250 | Live price ticker |
| **UI** | `src/components/ui/CardWithCornerShine.tsx` | ~165 | Glassmorphism card |
| **UI** | `src/components/ui/WelcomeFooter.tsx` | ~60 | Welcome footer |
| **Feature** | `src/components/features/TradeHistory.tsx` | 503 | Trade lookup container |
| **Feature** | `src/components/features/DeriverseTradesTable.tsx` | 188 | Trade data table |
| **Feature** | `src/components/features/SpotOrderForm.tsx` | ~500 | Order form + validation |
| **Feature** | `src/components/features/SpotOrderBook.tsx` | ~120 | Order book display |
| **Feature** | `src/components/features/SpotTradeHistory.tsx` | 286 | Open orders + history table |
| **Feature** | `src/components/features/OrderFlowVisualiser.tsx` | 1071 | Interactive state machine |
| **Hook** | `src/lib/hooks/useSpotTrade.ts` | 691 | Central trading hook |
| **Hook** | `src/lib/hooks/useWalletConnection.ts` | ~60 | Wallet abstraction |
| **Context** | `src/lib/context/LivePricesContext.tsx` | ~130 | WebSocket price feed |
| **Service** | `src/services/SupabaseDemoService.ts` | 441 | Order/Balance/Settings CRUD |
| **Service** | `src/services/SupabaseTradeService.ts` | ~115 | Trade persistence |
| **Service** | `src/services/DeriverseTradeService.ts` | ~175 | On-chain trade parsing |
| **Service** | `src/services/HeliusService.ts` | ~75 | RPC transaction history |
| **Service** | `src/services/SupabaseWalletService.ts` | ~100 | Wallet metadata |
| **API** | `src/app/api/prices/route.ts` | ~50 | CoinGecko fallback |
| **DB** | `supabase/migrations/003_create_demo_tables.sql` | 151 | Schema definition |

---

## 9. Spacing System

No custom Tailwind spacing config — uses the default Tailwind v4 scale throughout.

### Core Scale

| Value | px | Primary Usage |
|-------|-----|--------------|
| `0.5` | 2px | Minimal gaps (badges, inline elements) |
| `1` | 4px | Tight spacing (icon gaps) |
| `1.5` | 6px | Small elements (nav items py) |
| `2` | 8px | **Most common** — buttons py, table cells, flex gaps |
| `2.5` | 10px | Medium-compact inputs |
| `3` | 12px | Default horizontal padding, compact cards |
| `4` | 16px | **Standard container padding** (`p-4`) |
| `5` | 20px | Medium padding |
| `6` | 24px | Large card/modal padding (`p-6`) |
| `8` | 32px | Section spacing, large card padding |
| `12` | 48px | Major section gaps |
| `44` | 176px | Content top offset (fixed navbar clearance) |

### By Usage Area

| Area | Pattern |
|------|---------|
| **Page wrapper** | `pt-44 p-4 max-w-7xl mx-auto` |
| **Navbar container** | `px-3 sm:px-6 py-2 sm:py-3` |
| **Nav items** | `px-3 xl:px-4 py-1.5 xl:py-2` |
| **Cards (default)** | `p-4` |
| **Cards (large)** | `p-6` |
| **Cards (compact)** | `p-3` |
| **CardWithCornerShine xs** | `px-[4.4rem] py-[4.4rem]` (70.4px, custom) |
| **CardWithCornerShine sm** | `p-4` |
| **CardWithCornerShine md** | `p-6` (default) |
| **CardWithCornerShine lg** | `px-8 pt-8 pb-6` |
| **Buttons (default)** | `h-10 px-4 py-2` |
| **Buttons (sm)** | `h-9 px-3` |
| **Buttons (lg)** | `h-11 px-6` |
| **Table cells** | `px-3 py-2` |
| **Table headers** | `px-4 py-2.5` |
| **Form inputs** | `px-3 py-2` or `px-4 py-2` |
| **Dropdown items** | `px-4 py-2.5` |
| **Badges** | `px-1.5 py-0.5` |

### Flex/Grid Gaps

| Value | Usage |
|-------|-------|
| `gap-1` | Compact (icon rows, tight grids) |
| `gap-2` | **Most common** — default flex item spacing |
| `gap-3` | Standard flex spacing |
| `gap-4` | Larger flex/grid spacing |
| `gap-6` | Section-level spacing, grid layouts |
| `gap-8` | Major section spacing |

### Vertical Stack Spacing

| Value | Usage |
|-------|-------|
| `space-y-1` | Tight lists |
| `space-y-2` | Form fields |
| `space-y-3` | Medium stacks |
| `space-y-4` | Standard sections |
| `space-y-6` | Large section spacing |

### Margin Patterns

| Value | Usage |
|-------|-------|
| `mb-1` | Label-to-field (most common margin) |
| `mb-2` | Light bottom spacing |
| `mb-4` | Standard section bottom |
| `mb-6` / `mb-8` | Major section dividers |
| `mt-1` | Subtext below labels |
| `mt-2` / `mt-4` | Standard top spacing |
| `mt-6` / `mt-12` | Section-level top spacing |
| `mx-auto` | Center containers |

### Top 5 Most Used Values
1. **`gap-2`** (~99 uses) — default flex/grid spacing
2. **`px-3`** (~70 uses) — default horizontal padding
3. **`py-2`** (~69 uses) — default vertical padding
4. **`gap-3`** (~45 uses) — standard flex spacing
5. **`mb-1`** (~40 uses) — label-to-field margin

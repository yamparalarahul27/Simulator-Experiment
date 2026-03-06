# YDEX — Full Components Audit

> **Scanned:** All 79 `.tsx` files across `src/app/`, `src/components/features/`, `src/components/layout/`, `src/components/ui/`  
> **Date:** 2026-03-06  
> **Method:** Import graph analysis via grep across every file  

---

## 🔴 ORPHANED COMPONENTS (Not Used Anywhere)

> These components exist but are **never imported** in any other file. They are dead code.

| Component | File | What it Does | Why It's Orphaned |
|---|---|---|---|
| `SpotTradeHistory` | `features/SpotTradeHistory.tsx` | Full UI for open + filled spot demo orders with cancel capability. Has tabs, order rows, status badges, P&L display. | Built but never imported into `SpotConcepts.tsx`. Should be rendered below the Spot trading area. |
| `SpotTradeChart` | `features/SpotTradeChart.tsx` | Candlestick / price chart for the Spot trading page. | Built but never rendered in `SpotConcepts.tsx`. No integration. |
| `StatsRow` | `features/StatsRow.tsx` | A 3-card row showing Win Rate, Avg Win, and Avg Loss with `CardWithCornerShine`. Takes `trades` and `activeFilter` props. | Was designed for the Dashboard (Home) page but was replaced by individual cards (`PnLCard`, `LargestTradesCard`, etc.). |
| `LargestGainCard` | `features/LargestGainCard.tsx` | Dashboard card showing the single largest profitable trade from the trade history. | Not imported anywhere. Sibling to `LargestLossCard`. Appears to have been removed from Dashboard layout during a refactor. |
| `LargestLossCard` | `features/LargestLossCard.tsx` | Dashboard card showing the single largest losing trade. | Same as above — removed from Dashboard layout, never cleaned up from the codebase. |
| `DeriverseLogo` | `layout/DeriverseLogo.tsx` | SVG/image logo mark for the Deriverse brand. | Not imported anywhere currently — likely replaced inline with text or image element. |

---

## ✅ ACTIVE COMPONENTS — Full Audit

---

### 📄 APP PAGES (Entry Points)

---

#### `app/page.tsx`
- **Purpose:** Root page of the app (`/`). Entry point.
- **Function:** Imports and renders `TabNavigation`. The entire app lives inside this one shell.
- **Used by:** Next.js router (root route `/`)
- **Imports:** `TabNavigation`

---

#### `app/layout.tsx`
- **Purpose:** Root layout wrapper applied to all pages.
- **Function:** Sets up global font, metadata, providers, `LoadingScreen`, `AssistantModal`, and `MobileRestrictedView`.
- **Used by:** Next.js (wraps every page automatically)
- **Imports:** `LoadingScreen`, `AssistantModal`, `MobileRestrictedView`

---

#### `app/providers.tsx`
- **Purpose:** Wraps the app in `SWRConfig` and `Toaster` (sonner).
- **Function:** Provides global SWR cache configuration and toast notification context.
- **Used by:** `app/layout.tsx`

---

#### `app/assistant/page.tsx`
- **Purpose:** Standalone page at `/assistant` for the AI chat interface.
- **Function:** Full chat UI with message input, streaming response, code highlighting.
- **Used by:** Next.js router (`/assistant`)

---

#### `app/navbar-demo/page.tsx`
- **Purpose:** Demo/showcase page at `/navbar-demo` to preview UI components like `GlassmorphismNavbar`, `HamburgerButton`, `CardWithCornerShine`.
- **Function:** Renders visual demos of design system components. Development/review use only.
- **Used by:** Next.js router (`/navbar-demo`)
- **Imports:** `HamburgerButton`, `GlassmorphismNavbar`, `CardWithCornerShine`, `InfoTooltip`, `Tooltip`

---

#### `app/not-found.tsx`
- **Purpose:** Custom 404 page.
- **Function:** Shown when a route doesn't exist.
- **Used by:** Next.js (automatic 404 handler)

---

---

### 🗂 LAYOUT COMPONENTS

---

#### `components/layout/TabNavigation.tsx`
- **Purpose:** The main shell/router for the entire app. Controls which screen is visible.
- **Function:** Renders the bottom tab bar and conditionally shows the active screen. Manages wallet connection state via `useWalletConnection`.
- **Used by:** `app/page.tsx`
- **Imports:** `Home`, `Journal`, `ProfileSettings`, `AboutScreen`, `HelpScreen`, `RoadmapScreen`, `ExchangeManager`, `Market`, `Web3Hub`, `TradeHistory`, `Footer`, `GlassmorphismNavbar`, `MarketTicker`

---

#### `components/layout/GlassmorphismNavbar.tsx`
- **Purpose:** Top navigation bar with glassmorphism styling.
- **Function:** Shows app logo, wallet address, navigation actions, profile quick-access. Contains `HamburgerButton` for mobile menu.
- **Used by:** `TabNavigation`, `app/navbar-demo/page.tsx`
- **Imports:** `HamburgerButton`, `LivePulseIndicator`, `ProfileSettings`

---

#### `components/layout/HamburgerButton.tsx`
- **Purpose:** Animated hamburger icon button for mobile nav.
- **Function:** Renders a 3-line → X animated button. Accepts `isOpen`, `onClick`, and `size` props.
- **Used by:** `GlassmorphismNavbar`, `app/navbar-demo/page.tsx`

---

#### `components/layout/Footer.tsx`
- **Purpose:** App footer with branding, legal text, and social links.
- **Function:** Static content component. Shows Deriverse branding, copyright.
- **Used by:** `TabNavigation`, `WelcomeScreen`, `NewUserModal`, `DeriverseWalletAsk`, `CurrencySettingsModal`, `WelcomeFooter`, `drawer.tsx`

---

#### `components/layout/MobileRestrictedView.tsx`
- **Purpose:** Blocks the app on mobile viewports, showing a "desktop only" message.
- **Function:** Detects screen width. If too narrow, overlays a lock screen.
- **Used by:** `app/layout.tsx`, `WelcomeScreen`

---

#### `components/layout/DeriverseLogo.tsx`
- **Purpose:** Brand logo mark.
- **Function:** Renders the Deriverse SVG/image logo.
- **Used by:** ❌ **ORPHANED** — not imported anywhere

---

---

### 🖥 SCREEN-LEVEL FEATURES (Rendered as full tabs)

---

#### `components/features/Home.tsx`
- **Purpose:** Main Dashboard tab — the analytics overview page.
- **Function:** Loads trade history, renders stats cards (Win Rate, PnL, Drawdown, Fees, etc.), handles date range filters and wallet sync. The most data-heavy screen.
- **Used by:** `TabNavigation`
- **Imports:** `TableUI_Demo`, `FeeDistribution`, `CardWithCornerShine`, `TopBar`, `InfoTooltip`, `LargestTradesCard`, `MockDataBanner`, `SyncStatus`, `PnLCard`, `DrawdownCard`, `AverageTradeDurationCard`, `TimeBasedPerformanceCard`, `OrderTypeRatioCard`
- **Note:** Does NOT import `StatsRow`, `LargestGainCard`, `LargestLossCard` — these are orphaned siblings.

---

#### `components/features/Journal.tsx`
- **Purpose:** Trade Journal tab — log, view, and annotate past trades.
- **Function:** Lists trades with tag filters, pagination, streak counter, confetti on milestones. Opens `AnnotationModal` on each trade. Handles live + mock trade data.
- **Used by:** `TabNavigation`
- **Imports:** `TradeCard`, `AnnotationModal`, `JournalStreakCard`, `MockDataBanner`, `SkeletonNote`

---

#### `components/features/TradeHistory.tsx`
- **Purpose:** On-chain Trade History tab — fetch real Solana wallet trades via Helius + Deriverse APIs.
- **Function:** Wallet address input, live trade fetch, Deriverse-format trade table with real-time sync. Two modes: Deriverse Trades vs All Transactions.
- **Used by:** `TabNavigation`
- **Imports:** `CardWithCornerShine`, `AddressInput`, `DeriverseTradesTable`, `AnalyticsConfirmModal`, `SyncStatus`

---

#### `components/features/ProfileSettings.tsx`
- **Purpose:** Profile & Settings tab — user preferences.
- **Function:** Manages UI theme preferences, wallet display, and settings persistence. Accessible via tab and from `GlassmorphismNavbar`.
- **Used by:** `TabNavigation`, `GlassmorphismNavbar`

---

#### `components/features/AboutScreen.tsx`
- **Purpose:** About tab — info about the app, team.
- **Function:** Static content with donation QR code, copy-to-clipboard address, links.
- **Used by:** `TabNavigation`

---

#### `components/features/HelpScreen.tsx`
- **Purpose:** Help tab — documentation and guides.
- **Function:** FAQ-style expandable sections, keyboard shortcuts, copy support address.
- **Used by:** `TabNavigation`

---

#### `components/features/RoadmapScreen.tsx`
- **Purpose:** Roadmap tab — planned features list.
- **Function:** Static visual roadmap with status indicators (completed, in-progress, planned).
- **Used by:** `TabNavigation`

---

#### `components/features/ExchangeManager.tsx`
- **Purpose:** Exchange tab — manages exchange API key connections.
- **Function:** Form for connecting exchange APIs, displays connected exchanges.
- **Used by:** `TabNavigation`

---

#### `components/features/Web3Hub.tsx`
- **Purpose:** Web3 tab — multi-chain wallet and DeFi overview hub.
- **Function:** Shows connected wallet balances and on-chain information.
- **Used by:** `TabNavigation`

---

---

### 📊 MARKET & TRADING SYSTEM

---

#### `components/features/Market.tsx`
- **Purpose:** Market tab shell — container for the demo trading section.
- **Function:** Wraps `DemoMarket` with wallet connection check via `useWalletConnection`.
- **Used by:** `TabNavigation`
- **Imports:** `DemoMarket`

---

#### `components/features/DemoMarket.tsx`
- **Purpose:** Core trading workspace container.
- **Function:** Orchestrates the full demo trading experience. Manages between Spot (`SpotConcepts`) and Futures (`FutureConcepts`) tabs. Provides `useSpotTrade` data to children. Exposes `ControlPanel` and `CurrencySettingsModal`.
- **Used by:** `Market`
- **Imports:** `SpotConcepts`, `FutureConcepts`, `ControlPanel`, `CurrencySettingsModal`

---

#### `components/features/SpotConcepts.tsx`
- **Purpose:** Full Spot trading page — order form + flow visualiser + order book.
- **Function:** Renders the complete Spot trading interface. Hosts the price slider simulation, integrates `SpotOrderBook`, `SpotOrderForm`, `OrderFlowVisualiser`, and `TradeSummaryPanel`. Manages simulation state (`simSnapshot`, `simPrice`).
- **Used by:** `DemoMarket`
- **Imports:** `SpotOrderBook`, `SpotOrderForm`, `OrderFlowVisualiser`, `TradeSummaryPanel`
- **Note:** Does NOT import `SpotTradeHistory` or `SpotTradeChart` — both are orphaned siblings.

---

#### `components/features/SpotOrderForm.tsx`
- **Purpose:** Buy/Sell form for all 8 spot order types.
- **Function:** Renders the full order entry form. Handles all 8 order types (Market, Limit, Stop Market, Stop Limit, Iceberg, TWAP, Trailing Stop, OCO). Validates inputs, computes R:R, triggers simulation.
- **Used by:** `SpotConcepts`
- **Props received:** `pair`, `currentPrice`, `formatPrice`, `orderType`, `onOrderTypeChange`, `side`, `onSideChange`, `onRunSimulation`

---

#### `components/features/SpotOrderBook.tsx`
- **Purpose:** Live order book (bid/ask depth display).
- **Function:** Renders a 15-level ask + 15-level bid order book with depth bars. Clicking a price row populates the order form's price field.
- **Used by:** `SpotConcepts`
- **Props:** `orderBook`, `onPriceClick`, `formatPrice`

---

#### `components/features/SpotTradeChart.tsx` 🔴
- **Purpose:** Price chart for the Spot demo trading page.
- **Function:** Shows a candlestick or price line chart for the selected trading pair.
- **Used by:** ❌ **ORPHANED** — Not imported in `SpotConcepts` or anywhere else.
- **Should be used in:** `SpotConcepts.tsx`

---

#### `components/features/SpotTradeHistory.tsx` 🔴
- **Purpose:** Open & Filled Orders panel for the Spot demo page.
- **Function:** Shows a tabbed table of demo open orders (with cancel button) and filled order history. Displays order type, pair, quantity, fill price, status badge, time, and P&L.
- **Used by:** ❌ **ORPHANED** — Not imported anywhere. `TradeHistory.tsx` incorrectly shows up in grep because `SpotTradeHistory.tsx` imports from it by name string match.
- **Should be used in:** `SpotConcepts.tsx` below the trading area.
- **Props ready:** `openOrders`, `filledOrders`, `balances`, `cancelOrder`, `formatPrice`, `livePrices`

---

#### `components/features/OrderFlowVisualiser.tsx`
- **Purpose:** Interactive flow diagram showing the lifecycle of an order.
- **Function:** Renders a directed graph (DAG) of nodes (placed → pending → filled → tp/sl). Price slider scrubbing updates node states. Supports all 8 order types. Exports `computeKnobColor`, `getSliderRange`, `computeActiveNode`.
- **Used by:** `SpotConcepts`, `TradeSummaryPanel`, `SpotOrderForm` (type import)

---

#### `components/features/TradeSummaryPanel.tsx`
- **Purpose:** Trade summary and education card shown alongside the Order Flow diagram.
- **Function:** Shows computed trade details (entry, TP, SL, R:R, potential P&L, fees). Contains an expandable education section explaining order mechanics.
- **Used by:** `SpotConcepts`

---

#### `components/features/FutureConcepts.tsx`
- **Purpose:** Futures trading section placeholder.
- **Function:** Contains `LiquidationSimulator` for demonstrating liquidation mechanics. Marked sections as "coming soon" for other futures features.
- **Used by:** `DemoMarket`
- **Imports:** `LiquidationSimulator`

---

#### `components/features/LiquidationSimulator.tsx`
- **Purpose:** Interactive liquidation price simulator for futures.
- **Function:** Takes leverage, entry price, position size. Simulates how far price needs to move for liquidation. Has a draggable price slider like the Spot simulator.
- **Used by:** `FutureConcepts`

---

#### `components/features/ControlPanel.tsx`
- **Purpose:** Developer/demo control panel — override prices and settings.
- **Function:** A drawer panel allowing manual price override per token, currency switch (USD/INR), and reset. Used for demo testing.
- **Used by:** `DemoMarket`

---

#### `components/features/CurrencySettingsModal.tsx`
- **Purpose:** Modal to switch display currency (USD vs INR) and set the exchange rate.
- **Function:** Shows a modal with currency toggle and INR rate input. Fetches live USD/INR rate. 
- **Used by:** `DemoMarket`

---

---

### 📈 DASHBOARD STAT CARDS (used in Home)

---

#### `components/features/TopBar.tsx`
- **Purpose:** Date range picker and filter bar for the Dashboard.
- **Function:** Calendar-based date range selector with preset filters (7D, 30D, 90D, All). Syncs filter state to `Home.tsx`.
- **Used by:** `Home`

---

#### `components/features/PnLCard.tsx`
- **Purpose:** P&L summary card on the Dashboard.
- **Function:** Shows total realized PnL, daily change, trend line using `PnLChart`.
- **Used by:** `Home`
- **Imports:** `PnLChart`

---

#### `components/features/PnLChart.tsx`
- **Purpose:** Mini sparkline chart for P&L trend.
- **Function:** Recharts-powered area chart showing PnL over time. Used inside `PnLCard`.
- **Used by:** `PnLCard`

---

#### `components/features/DrawdownCard.tsx`
- **Purpose:** Max drawdown card on the Dashboard.
- **Function:** Calculates and displays the worst drawdown period from the trade history.
- **Used by:** `Home`

---

#### `components/features/AverageTradeDurationCard.tsx`
- **Purpose:** Avg trade duration metric card.
- **Function:** Computes mean holding period across trades. Displays in hours/minutes with pixel font.
- **Used by:** `Home`

---

#### `components/features/TimeBasedPerformanceCard.tsx`
- **Purpose:** Performance breakdown by session (Asia/Europe/US) or hour of day.
- **Function:** Shows which trading sessions are most profitable using a bar chart.
- **Used by:** `Home`

---

#### `components/features/OrderTypeRatioCard.tsx`
- **Purpose:** Ratio of Buy vs Sell orders visual card.
- **Function:** Donut/gauge chart showing the distribution of order type usage across the trade history.
- **Used by:** `Home`

---

#### `components/features/LargestTradesCard.tsx`
- **Purpose:** Shows the 3 largest trades (by notional) from history.
- **Function:** Ranked list of biggest trades with pair, size, and PnL.
- **Used by:** `Home`

---

#### `components/features/FeeDistribution.tsx`
- **Purpose:** Fee breakdown by token/exchange.
- **Function:** Pie chart + table showing how much fee was paid across different pairs.
- **Used by:** `Home`

---

#### `components/features/TableUI_Demo.tsx`
- **Purpose:** Trade table component shown on the Dashboard.
- **Function:** Full trades table with sorting, filtering, and pagination using `TableUI`.
- **Used by:** `Home`

---

#### `components/features/StatsRow.tsx` 🔴
- **Purpose:** Row of 3 stat cards: Win Rate, Avg Win, Avg Loss.
- **Function:** Fully built with `CardWithCornerShine` and `InfoTooltip`. Takes `activeFilter` and `trades` props.
- **Used by:** ❌ **ORPHANED** — not imported in `Home.tsx` or anywhere else. Was likely replaced by individual stat cards.
- **Should be used in:** `Home.tsx` above or below the existing stat cards.

---

#### `components/features/LargestGainCard.tsx` 🔴
- **Purpose:** Dashboard card for the single biggest winning trade.
- **Function:** Highlights the best trade with pair, date, R:R, and PnL.
- **Used by:** ❌ **ORPHANED** — Not in `Home.tsx`. Left over from an earlier Dashboard layout.

---

#### `components/features/LargestLossCard.tsx` 🔴
- **Purpose:** Dashboard card for the single biggest losing trade.
- **Function:** Mirror of `LargestGainCard` but for the worst trade.
- **Used by:** ❌ **ORPHANED** — Same situation as `LargestGainCard`.

---

---

### 📝 JOURNAL COMPONENTS

---

#### `components/features/TradeCard.tsx`
- **Purpose:** Individual trade card in the Journal list.
- **Function:** Renders one trade's summary — pair, side, PnL, tags, annotation status. Tappable to open `AnnotationModal`.
- **Used by:** `Journal`

---

#### `components/features/AnnotationModal.tsx`
- **Purpose:** Full annotation editor for a single trade.
- **Function:** Rich note editor with tags, rating, entry/exit reasoning. Has unsaved changes detection. Uses `UnsavedChangesModal`.
- **Used by:** `Journal`
- **Imports:** `UnsavedChangesModal`

---

#### `components/features/UnsavedChangesModal.tsx`
- **Purpose:** Confirmation dialog for unsaved annotation changes.
- **Function:** Small modal with "Discard" and "Stay" actions.
- **Used by:** `AnnotationModal`

---

#### `components/features/JournalStreakCard.tsx`
- **Purpose:** Streak tracker card in the Journal header.
- **Function:** Shows consecutive days of logging, current streak, best streak.
- **Used by:** `Journal`

---

---

### 📋 TRADE HISTORY COMPONENTS

---

#### `components/features/DeriverseTradesTable.tsx`
- **Purpose:** Table component for Deriverse-format on-chain trades.
- **Function:** Renders paginated, sortable trade rows fetched from the Deriverse protocol. Shows pair, size, PnL, timestamp, Solana tx link.
- **Used by:** `TradeHistory`

---

---

### 🧩 UI COMPONENTS (Shared/Reusable)

---

#### `components/ui/CardWithCornerShine.tsx`
- **Purpose:** Base card with decorative corner shimmer effect.
- **Function:** Glassmorphic card container with animated corner highlight. Used as a wrapper in 16 components.
- **Used by:** 16 components across Dashboard, Journal, and Demo pages.

---

#### `components/ui/InfoTooltip.tsx`
- **Purpose:** Contextual tooltip with information icon.
- **Function:** Uses a look-up map of `infoKey` → tooltip text. Shows a `?` icon that reveals the tooltip on hover.
- **Used by:** 16 components across the app.

---

#### `components/ui/MarketTicker.tsx`
- **Purpose:** Scrolling price ticker banner.
- **Function:** Horizontally scrolling live price strip showing all tracked pairs with 24h change. Runs a `setInterval` to update.
- **Used by:** `TabNavigation`

---

#### `components/ui/LoadingScreen.tsx`
- **Purpose:** Splash screen shown while the app initializes.
- **Function:** Animated loading UI. Wraps `DeriverseWalletAsk` for onboarding flow.
- **Used by:** `app/layout.tsx`

---

#### `components/ui/DeriverseWalletAsk.tsx`
- **Purpose:** Wallet connection onboarding modal.
- **Function:** Prompts user to enter a Solana wallet address. Part of the first-run onboarding flow.
- **Used by:** `LoadingScreen`

---

#### `components/ui/WelcomeScreen.tsx`
- **Purpose:** Welcome splash for first-time users.
- **Function:** Shows branding, feature highlights, and CTA to connect wallet.
- **Used by:** `LoadingScreen`

---

#### `components/ui/AssistantModal.tsx`
- **Purpose:** Global AI assistant modal accessible from any screen.
- **Function:** Floating assistant chat interface. Mounted at root layout level.
- **Used by:** `app/layout.tsx`

---

#### `components/ui/SyncStatus.tsx`
- **Purpose:** Live data sync indicator.
- **Function:** Shows connection status and last sync time for trade data.
- **Used by:** `Home`, `TradeHistory`

---

#### `components/ui/MockDataBanner.tsx`
- **Purpose:** Banner warning that mock/demo data is being shown.
- **Function:** Dismissable yellow/amber banner.
- **Used by:** `Home`, `Journal`

---

#### `components/ui/AddressInput.tsx`
- **Purpose:** Solana wallet address input field with validation.
- **Function:** Text input with copy/paste support and address format validation.
- **Used by:** `TradeHistory`

---

#### `components/ui/AnalyticsConfirmModal.tsx`
- **Purpose:** Confirmation modal before loading on-chain analytics for a wallet.
- **Function:** Warns user that fetching data for a wallet may take time. Shows confirm/cancel.
- **Used by:** `TradeHistory`

---

#### `components/ui/SkeletonNote.tsx`
- **Purpose:** Skeleton placeholder for Journal trade cards while loading.
- **Function:** Animated shimmer placeholder matching the `TradeCard` layout.
- **Used by:** `Journal`

---

#### `components/ui/TableUI.tsx`
- **Purpose:** Generic sortable/filterable table component.
- **Function:** Reusable table with column config, sorting, and pagination.
- **Used by:** `Home`, `TableUI_Demo`

---

#### `components/ui/LivePulseIndicator.tsx`
- **Purpose:** Animated green dot indicating live data connection.
- **Function:** Pulsing circle icon, used in the top nav to show WS status.
- **Used by:** `GlassmorphismNavbar`, `app/navbar-demo/page.tsx`

---

---

## Summary: Orphaned Components

| # | Component | Category | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | `SpotTradeHistory.tsx` | Spot Trading | 🔴 High | Import in `SpotConcepts.tsx` below the trading area |
| 2 | `SpotTradeChart.tsx` | Spot Trading | 🔴 High | Import in `SpotConcepts.tsx` above the order form |
| 3 | `StatsRow.tsx` | Dashboard | 🟡 Medium | Import in `Home.tsx` above or below existing stat cards |
| 4 | `LargestGainCard.tsx` | Dashboard | 🟡 Medium | Import in `Home.tsx` alongside `LargestTradesCard` |
| 5 | `LargestLossCard.tsx` | Dashboard | 🟡 Medium | Import in `Home.tsx` alongside `LargestGainCard` |
| 6 | `DeriverseLogo.tsx` | Layout | 🟢 Low | Check if branding design was updated, or delete |

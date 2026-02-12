# Deriverse UX State & Open Paths

This report summarizes the current user experience (UX) across the Deriverse app and identifies incomplete or open-ended flows. It also includes an ASCII map of the major UX surfaces.

## 1. Current UX Overview

### 1.1 Global Navigation
- Entry route (`/`) renders `TabNavigation`, a glassmorphic navbar with four tabs: Home, Journal, Lookup, About/Future. Network toggle (Devnet/Mainnet) is visual only.
- Content area is client-side; each tab switches between feature modules without changing route.

### 1.2 Onboarding Overlay
- `LoadingScreen` still shows multi-phase overlay: Welcome → Wallet Ask → Trade Import → Logo.
- Wallet Ask buttons no longer open a wallet modal; they immediately trigger the next phase (mock-only flow).
- Trade Import remains a placeholder spinner with TODO to integrate Helius/Deriverse services.

### 1.3 Home Dashboard (Home tab)
- Entirely powered by `MOCK_TRADES` filtered via TopBar (date + pairs) and wallet toggle (1/2/3).
- Cards/charts cover: win rate, avg win/loss, order types, time-based performance, fee distribution, PnL, etc.
- Lookup/integration points are referenced in tooltips but no real data populates these cards.

### 1.4 Journal Tab
- Uses `MOCK_TRADES` and localStorage-backed annotations (via `annotationStorage`).
- Users can annotate trades, view streak card, paginate, and export notes. Toggle for mock vs real data is TODO.

### 1.5 Lookup Tab
- `TradeHistory` lets users input any Solana wallet and fetch both Deriverse-trade logs (via `DeriverseTradeService`) and all transactions (via `HeliusService`).
- Includes loading states, Solscan links, and two-tab view (Deriverse vs All). This is the only active live-data surface now.

### 1.6 About/Future Tab
- Placeholder section (“About & Future”) with static text; no content yet.

## 2. Open-Ended / Incomplete Paths
1. **Wallet onboarding mismatch** – UI implies real wallet connection/import, but no adapter or data wiring remains. TRADE IMPORT is purely cosmetic.
2. **Dashboard vs live data** – Lookup fetches real trades but there’s no path to surface them in Home/Journal analytics; everything else uses `MOCK_TRADES`.
3. **Journal data source toggle** – TODO references ability to choose Deriverse/All trades, but only mock data + placeholder toggle state exists.
4. **Network selector** – Devnet/Mainnet switch modifies local state but doesn’t adjust RPC endpoints or content; user might assume it changes data.
5. **Supabase storage** – Persistence helpers were removed/stubbed; any future storage plan needs an alternate backend or reimplementation.
6. **Onboarding re-entry** – Once the overlay completes, there’s no UI to revisit/walk through onboarding; yet the Start flow promises features that don’t exist.
7. **About/Future page** – No content, likely intended for roadmap context.

## 3. ASCII UX Map
```
App Root /
│
└─ TabNavigation (client)
   ├─ GlassmorphismNavbar
   │   ├─ Tabs: Home | Journal | Lookup | About
   │   └─ Network selector (Devnet/Mainnet, visual only)
   │
   └─ Content area
       ├─ Home Dashboard (MOCK_TRADES analytics)
       │   ├─ TopBar filters (Date range, pairs, wallet selector)
       │   ├─ Cards (PnL, Win Rate, Avg Win/Loss, Fee Distribution, Order Types)
       │   ├─ Time-based cards (Largest Trades, TimeBasedPerformanceCard)
       │   └─ TableUI_Demo (mock trades table)
       │
       ├─ Journal
       │   ├─ Streak card
       │   ├─ Grid of TradeCard components (MOCK_TRADES)
       │   └─ Annotation modal + download/export (localStorage)
       │
       ├─ Lookup (TradeHistory)
       │   ├─ Address input
       │   ├─ Deriverse Trades tab (DeriverseTradeService via RPC)
       │   └─ All Transactions tab (HeliusService)
       │
       └─ About & Future (placeholder text)

Global overlay (mounted in layout)
└─ LoadingScreen phases
   ├─ WelcomeScreen
   ├─ DeriverseWalletAsk (mock-only path)
   ├─ TradeImport (placeholder spinner)
   └─ Logo reveal (DeriverseLogo)
```

## 4. Next Considerations
- Decide whether to keep or remove the onboarding overlay and wallet terminology now that adapters are gone.
- Connect Lookup’s real data to the Home/Journal experiences or clearly mark them as mock-only demos.
- Flesh out the Journal data source toggle and About/Future content.
- Clarify network toggle behavior (either wire it up to RPC selection or replace it with environment badges).
- If real wallet flow returns later, plan storage (Supabase or alternative) and update documentation accordingly.

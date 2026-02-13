# Deriverse Application Working Structure

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        DERIVERSE TRADING ANALYTICS PLATFORM                   ║
║                    Next.js 16 + React 19 + TypeScript + Solana                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │   Browser (User)        │
                        └─────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP ROUTER (src/app/)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  page.tsx ──────────► TabNavigation Component (Main Router)                 │
│  layout.tsx ────────► Root Layout + Font System (Geist)                     │
│  globals.css ───────► Global Styles + Design System                         │
│  providers.tsx ─────► Solana Wallet Adapter + Context                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NAVIGATION & LAYOUT (src/components/layout/)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  GlassmorphismNavbar.tsx                                      │          │
│  │  • Logo + Navigation Items                                    │          │
│  │  • Network Selector (Mock/Devnet/Mainnet)                    │          │
│  │  • Profile Settings Dropdown                                  │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                           │                                                  │
│                           ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  TabNavigation.tsx (State Manager)                            │          │
│  │  • Active Tab State Management                                │          │
│  │  • Network State (mock/devnet/mainnet)                       │          │
│  │  • LocalStorage Persistence                                   │          │
│  │  • Routes to Feature Components                               │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                           │                                                  │
│                           ▼                                                  │
│              ┌────────────┬────────────┬────────────┐                       │
│              │            │            │            │                        │
└──────────────┼────────────┼────────────┼────────────┼────────────────────────┘
               │            │            │            │
               ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FEATURE COMPONENTS (src/components/features/)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  Home.tsx        │  │  TradeHistory    │  │  Journal.tsx     │         │
│  │  (Analytics)     │  │  (Wallet Lookup) │  │  (Annotations)   │         │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤         │
│  │ • TopBar         │  │ • Wallet Input   │  │ • Trade List     │         │
│  │ • PnL Card       │  │ • Network Select │  │ • Annotation UI  │         │
│  │ • Stats Row      │  │ • Trade Table    │  │ • Markdown Export│         │
│  │ • Charts         │  │ • Real-time Data │  │ • LocalStorage   │         │
│  │ • Performance    │  │ • Deriverse SDK  │  │ • Trade Notes    │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│           │                      │                      │                    │
│           └──────────────────────┴──────────────────────┘                   │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW & STATE MANAGEMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  DATA SOURCES (Conditional)                                     │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │                                                                  │        │
│  │  IF network === 'mock':                                         │        │
│  │  ┌──────────────────────────────────────────────────────┐      │        │
│  │  │  src/lib/mockData.ts                                  │      │        │
│  │  │  • generateMockTrades() → 240 trades                 │      │        │
│  │  │  • Deterministic seeded RNG                          │      │        │
│  │  │  • 8 trading pairs (SOL, BTC, ETH, JUP, etc.)       │      │        │
│  │  │  • Spot + Perpetual markets                          │      │        │
│  │  │  • 60% win rate, realistic PnL                       │      │        │
│  │  └──────────────────────────────────────────────────────┘      │        │
│  │                                                                  │        │
│  │  IF network === 'devnet' OR 'mainnet':                         │        │
│  │  ┌──────────────────────────────────────────────────────┐      │        │
│  │  │  src/services/DeriverseTradeService.ts                │      │        │
│  │  │  • fetchTradesForWallet(connection, address)         │      │        │
│  │  │  • Uses @deriverse/kit Engine                        │      │        │
│  │  │  • Fetches Solana transactions                       │      │        │
│  │  │  • Decodes program logs → Trade objects              │      │        │
│  │  │  • Parses Spot & Perpetual fills                     │      │        │
│  │  └──────────────────────────────────────────────────────┘      │        │
│  │           │                                                      │        │
│  │           ▼                                                      │        │
│  │  ┌──────────────────────────────────────────────────────┐      │        │
│  │  │  Solana Blockchain (via RPC)                         │      │        │
│  │  │  • Transaction signatures                             │      │        │
│  │  │  • Program logs (Deriverse protocol)                 │      │        │
│  │  │  • Block timestamps                                   │      │        │
│  │  └──────────────────────────────────────────────────────┘      │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                  │                                           │
│                                  ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  DATA PROCESSING (src/lib/)                                     │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │  • tradeFilters.ts ──► Date filtering, time ranges             │        │
│  │  • drawdownCalculations.ts ──► Max drawdown analysis            │        │
│  │  • mockData.ts ──► PnL calculations, session performance        │        │
│  │  • types.ts ──► TypeScript interfaces (Trade, DailyPnL, etc.)  │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ANALYTICS & VISUALIZATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  METRIC CARDS (Feature Components)                            │          │
│  ├──────────────────────────────────────────────────────────────┤          │
│  │  • PnLCard.tsx ──────────► Total P&L, Win Rate, ROI           │          │
│  │  • StatsRow.tsx ─────────► Trades, Avg Win/Loss, Fees         │          │
│  │  • DrawdownCard.tsx ─────► Max Drawdown Analysis              │          │
│  │  • LargestGainCard.tsx ──► Best Trade                         │          │
│  │  • LargestLossCard.tsx ──► Worst Trade                        │          │
│  │  • TradeStreakCard.tsx ──► Current Win/Loss Streak            │          │
│  │  • OrderTypeRatioCard ───► Spot vs Perp Distribution          │          │
│  │  • TimeBasedPerformance ─► Session Analysis (AM/PM/Eve/Night) │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  CHARTS (Recharts + MUI Charts)                               │          │
│  ├──────────────────────────────────────────────────────────────┤          │
│  │  • PnLChart.tsx ─────────► Daily P&L Line Chart               │          │
│  │  • FeeDistribution.tsx ──► Protocol vs Network Fees           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ANNOTATION & PERSISTENCE LAYER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  src/lib/annotationStorage.ts                                 │          │
│  ├──────────────────────────────────────────────────────────────┤          │
│  │  • loadAnnotations() ──► Read from localStorage               │          │
│  │  • saveAnnotation() ───► Write to localStorage                │          │
│  │  • downloadAnnotations() ──► Export as Markdown               │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                           │                                                  │
│                           ▼                                                  │
│              ┌────────────────────────────┐                                 │
│              │  Browser LocalStorage       │                                 │
│              │  • Trade notes & tags       │                                 │
│              │  • Active tab persistence   │                                 │
│              └────────────────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend:                                                                   │
│  • Next.js 16 (App Router)                                                  │
│  • React 19 (Hooks: useState, useMemo, useEffect)                          │
│  • TypeScript 5                                                             │
│  • TailwindCSS 4 (Utility-first styling)                                   │
│                                                                              │
│  Blockchain:                                                                 │
│  • @solana/web3.js (Blockchain interaction)                                │
│  • @deriverse/kit (Trade log decoding)                                     │
│  • @jup-ag/wallet-adapter (Wallet connection)                              │
│                                                                              │
│  UI Libraries:                                                               │
│  • Recharts (Charts & graphs)                                               │
│  • MUI Material + MUI Charts (Data visualization)                          │
│  • Lucide React (Icons)                                                     │
│  • Framer Motion (Animations)                                               │
│  • Geist Fonts (Typography: Mono, Sans, Pixel)                             │
│                                                                              │
│  State Management:                                                           │
│  • React Hooks (Local state)                                                │
│  • LocalStorage (Persistence)                                               │
│  • No global state library (simple prop drilling)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User visits app → page.tsx renders TabNavigation                       │
│                                                                              │
│  2. TabNavigation loads:                                                    │
│     • Restores active tab from localStorage                                │
│     • Sets default network to 'mock'                                        │
│     • Renders GlassmorphismNavbar + active feature component               │
│                                                                              │
│  3. User selects "Analytics" tab → Home.tsx renders:                       │
│     • Loads MOCK_TRADES from mockData.ts                                   │
│     • Applies date filters via tradeFilters.ts                             │
│     • Calculates metrics (PnL, win rate, drawdown, etc.)                   │
│     • Renders metric cards + charts                                         │
│                                                                              │
│  4. User selects "Wallet(s)" tab → TradeHistory.tsx renders:               │
│     • Shows wallet input field                                              │
│     • User enters Solana address                                            │
│     • IF mock mode: shows mock data                                         │
│     • IF devnet/mainnet: calls DeriverseTradeService                       │
│       → Fetches transactions from Solana RPC                                │
│       → Decodes logs using @deriverse/kit Engine                           │
│       → Displays real trades in table                                       │
│                                                                              │
│  5. User selects "Journal" tab → Journal.tsx renders:                      │
│     • Loads trades (mock or real)                                           │
│     • Shows annotation modal for each trade                                 │
│     • User adds notes, tags, lessons learned                               │
│     • Saves to localStorage via annotationStorage.ts                       │
│     • Export button → downloads as Markdown file                            │
│                                                                              │
│  6. Network switching:                                                      │
│     • User clicks network badge in navbar                                   │
│     • Cycles: Mock → Devnet → Mainnet                                      │
│     • Components re-fetch data based on new network                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          KEY DATA STRUCTURES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Trade {                                                                     │
│    id: string                                                                │
│    symbol: string              // e.g., "SOL-USDC", "BTC-PERP"             │
│    side: 'buy'|'sell'|'long'|'short'                                        │
│    orderType: 'limit'|'market'|'stop_limit'|'stop_market'                  │
│    quantity: number                                                          │
│    price: number                                                             │
│    notional: number            // quantity × price                          │
│    pnl: number                 // profit/loss                               │
│    fee: number                                                               │
│    openedAt: Date                                                            │
│    closedAt: Date                                                            │
│    isWin: boolean                                                            │
│    leverage?: number           // for perpetuals                            │
│    txSignature: string         // Solana transaction ID                     │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              SUMMARY                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Deriverse is a trading analytics dashboard for Solana-based trading.        ║
║  It supports both MOCK data (for demos) and REAL blockchain data via the      ║
║  Deriverse SDK. Users can view analytics, look up wallet trades, and         ║
║  annotate trades in a journal. The app uses a modern Next.js stack with      ║
║  glassmorphism UI, comprehensive metrics, and local persistence.              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Key Highlights

1. **Three Modes**: Mock data (demo), Devnet (testnet), Mainnet (production)
2. **Main Features**: Analytics Dashboard, Wallet Lookup, Trade Journal
3. **Data Sources**: Mock generator OR real Solana blockchain via Deriverse SDK
4. **Architecture**: Clean separation of concerns (UI → Features → Services → Data)
5. **State**: Simple React hooks + localStorage (no complex state management)
6. **Real-time**: Fetches on-chain trades using `@deriverse/kit` Engine to decode program logs

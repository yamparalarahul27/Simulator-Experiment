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
│  globals.css ───────► Global Styles + Custom Spinner                        │
│  providers.tsx ─────► Jupiter Unified Wallet Provider + Supabase Context    │
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
│  │  • Network Selector (Mock / Devnet)                           │          │
│  │  • Connection Status Indicator                                 │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                           │                                                  │
│                           ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │  TabNavigation.tsx (Feature Orchestrator)                     │          │
│  │  • Active Tab State Management                                │          │
│  │  • Network State (mock vs devnet)                             │          │
│  │  • Render: Home | Journal | Trades | About | Roadmap          │          │
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
│  │ • PnL & Stats    │  │ • Wallet Input   │  │ • Trade Cards    │         │
│  │ • Time Charts    │  │ • Sync Status    │  │ • Lesson Editor  │         │
│  │ • Win Rate Donut │  │ • Save to DB     │  │ • Markdown Export│         │
│  │ • Mock Banner    │  │ • Real-time Logs │  │ • Tag System     │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│           │                      │                      │                    │
│           └──────────────────────┴──────────────────────┘                   │
│                                  │                                           │
└──────────────────────────────────┼───────────────────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE & SERVICES (src/services/)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  DATA SOURCES & PERSISTENCE                                     │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │                                                                  │        │
│  │  IF state.network === 'devnet':                                 │        │
│  │  ┌─────────────────────────────┐  ┌────────────────────────────┐│        │
│  │  │  SupabaseTradeService.ts    │  │  SupabaseWalletService.ts  ││        │
│  │  │  • Save/Load Trade Data     │  │  • Wallet Existence Checks  ││        │
│  │  │  • PnL Aggregations         │  │  • User Registration       ││        │
│  │  └─────────────────────────────┘  └────────────────────────────┘│        │
│  │                                                                  │        │
│  │  BLOCKCHAIN INTERACTION:                                         │        │
│  │  ┌─────────────────────────────┐  ┌────────────────────────────┐│        │
│  │  │  DeriverseTradeService.ts   │  │  HeliusService.ts          ││        │
│  │  │  • @deriverse/kit Engine    │  │  • Signature Fetching      ││        │
│  │  │  • Log Decoding             │  │  • Transaction Metadata    ││        │
│  │  └─────────────────────────────┘  └────────────────────────────┘│        │
│  │                                                                  │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                  │                                           │
│                                  ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  CORE UTILITIES (src/lib/)                                       │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │  • useWalletConnection.ts ─► Jupiter Adapter Wrapper            │        │
│  │  • supabaseClient.ts ─────► Database Connection                 │        │
│  │  • tradeFilters.ts ────────► Timezone-aware filtering           │        │
│  │  • mockData.ts ────────────► 240+ Deterministic trades           │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

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
│                          PROJECT DOCUMENTATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Documents/                                                                  │
│  ├── architecture_(update).md    ──► System design & flow diagrams           │
│  ├── ASCII_app_structure.md     ──► (This file)                              │
│  ├── product_prd.md             ──► Features & Roadmap                      │
│  ├── todo_rahul.md              ──► Active task tracking                    │
│  ├── multi_wallet_discussion.md ──► Database & Schema planning               │
│  └── ai_working_context.md       ──► Knowledge base for LLMs                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend: Next.js 16, React 19, TailwindCSS 4                              │
│  Blockchain: @deriverse/kit, @jup-ag/wallet-adapter, @solana/web3.js        │
│  Database/Auth: Supabase (PostgreSQL + RLS)                                 │
│  Charts: Recharts, Framer Motion                                            │
│  Typography: Geist (Sans/Mono/Pixel)                                        │
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

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              SUMMARY                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Deriverse bridge's the gap between mock exploration and real blockchain      ║
║  verification. It uses a Jupiter-powered connection flow, decodes Solana      ║
║  logs in real-time via the Deriverse SDK, and persists user context in        ║
║  Supabase. UI is built for performance with minimal global state.             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Key Highlights

1. **Dual Engines**: Seamless toggle between Mock (Simulation) and Devnet (Live).
2. **Unified Auth**: Jupiter Wallet Adapter integrated with Supabase RLS.
3. **Data Services**: High-performance log decoding via `@deriverse/kit`.
4. **State Strategy**: Local React hooks + Service layer (No heavy Redux/Zustand).
5. **Persistence**: Supabase for cross-device wallet and trade synchronization.

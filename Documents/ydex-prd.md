# YDEX — Product Requirements Document

> Make Decentralised Exchanges easy to understand for the New Age Traders on Solana.

---

## 1. Vision & Mission

**Vision:** Become the go-to platform where new traders learn, simulate, and eventually execute trades on Solana DEXes — all from one place.

**Mission:** Bridge the knowledge gap between centralised exchange UX and decentralised exchange complexity by combining real DEX data with interactive education tools.

### Two Pillars

| Pillar | Goal |
|--------|------|
| **Part 1 — DEX Integration & Insights** | Integrate Solana DEXes into the app and surface useful analytics from real on-chain trades |
| **Part 2 — Education & Simulation** | Make complex trading concepts simple so traders can simulate setups, and in future execute from the platform on their preferred DEX |

---

## 2. Feature Inventory

### Pillar 1 — DEX Integration & Insights

| Feature | Status | Details |
|---------|--------|---------|
| Wallet Lookup | ✅ Done | Enter/connect wallet, fetch trades via Helius RPC + Deriverse on-chain parsing |
| Analytics Dashboard | ✅ Done | PnL card, equity curve, drawdown, session performance, order type ratios, fee distribution, largest trades, win rate |
| Trade Journal | ✅ Done | Annotations, tags, lessons learned, streak tracking, pagination |
| Trade History Table | ✅ Done | Full sortable/filterable trade log with all fields |
| Mock / Devnet Modes | ✅ Done | Mock data for demo exploration, devnet for real trade analysis |
| Supabase Persistence | ✅ Done | Trades, wallets, annotations synced to cloud |
| Multi-DEX Support | 🔲 Next | Jupiter, Raydium, Orca — parse their on-chain trade formats |
| Mainnet Wallet Support | 🔲 Next | Switch from devnet-only to mainnet trade fetching |
| Multi-Wallet Aggregation | 🔲 Next | Combine trades across multiple wallets into one dashboard |
| Real-time Portfolio Tracking | 🔲 Next | Live token balances, unrealised PnL, portfolio allocation |
| Position-level PnL | 🔲 Next | Group trades into positions for accurate PnL (not just per-trade) |

### Pillar 2 — Education & Simulation

| Feature | Status | Details |
|---------|--------|---------|
| Spot Order Simulator | ✅ Done | 8 order types — Market, Limit, Stop Market, Stop Limit, Iceberg, TWAP, Trailing Stop, OCO |
| Order Flow Visualiser | ✅ Done | Interactive node-graph state machine showing order lifecycle for all 8 types, with drag-to-pan and zoom |
| Price Scale Slider | ✅ Done | Drag-to-simulate price movement, triggers TP/SL, color-coded knob feedback |
| Trade Summary Panel | ✅ Done | Entry, TP, SL, fees, notional value, R:R ratio breakdown |
| Order Book Display | ✅ Done | Deterministic order book with bid/ask spread and depth |
| Liquidation Simulator | ✅ Done | Margin, leverage, liquidation price calculator with visual gauge (Futures) |
| Live Price Feeds | ✅ Done | Binance WebSocket (real-time) + CoinGecko REST (4s fallback) |
| Manual Price Overrides | ✅ Done | Control panel to set custom prices for testing edge cases |
| 6 Spot Pairs | ✅ Done | SOL, BTC, ETH, JUP, BONK, XRP vs USDC |
| Funding Rate Explainer | 🔲 Next | Interactive simulator explaining perpetual funding rates |
| Leverage Mechanics Explainer | 🔲 Next | Visual explainer for margin, leverage tiers, position sizing |
| Slippage & Price Impact Simulator | 🔲 Next | Show how order size affects execution price against order book depth |
| Paper Trading Mode | 🔲 Future | Simulated order fills against real-time orderbooks, virtual portfolio |
| Live Trade Execution | 🔲 Future | Execute real trades via Jupiter aggregator from within the platform |

### Cross-cutting

| Feature | Status | Details |
|---------|--------|---------|
| Premium Dark UI | ✅ Done | Glassmorphism, Geist fonts, backdrop blur, consistent dark theme |
| AI Assistant | ✅ Done | Gemini-powered chat modal for trading Q&A |
| About / Help / Roadmap | ✅ Done | Product info, documentation, and future plans |
| Market Ticker | ✅ Done | Scrolling crypto price ticker at top |
| User Accounts & Auth | 🔲 Next | Supabase Auth or wallet-based authentication |
| Mobile Responsive | 🔲 Next | Adapt layout for mobile and tablet screens |
| Notifications & Alerts | 🔲 Future | Price alerts, trade execution notifications |
| Social Features | 🔲 Future | Share simulation setups, leaderboards, community |

---

## 3. Phased Roadmap

### Phase 0 — Foundation ✅
*Analytics, Journal, Wallet Lookup*

What was built: Trading analytics dashboard with PnL, drawdown, session performance, fee distribution. Trade journal with annotations and streak tracking. Wallet lookup with Helius + Deriverse integration. Mock and devnet data modes. Supabase cloud persistence. Premium glassmorphism UI.

### Phase 1 — Education Engine ✅
*Spot Simulator, Order Flow, Liquidation*

What was built: Spot order simulator supporting all 8 order types. Interactive order flow visualiser with state machine diagrams. Price scale slider with TP/SL simulation and post-fill extrema tracking. Liquidation simulator with visual margin gauge. Live price feeds from Binance WebSocket with CoinGecko fallback. Trade summary panel with R:R analysis.

### Phase 2 — Expand & Polish 🔲
*More concepts, more DEXes, mainnet*

Scope:
- Funding Rate interactive explainer
- Leverage Mechanics visual explainer
- Slippage & Price Impact simulator
- Multi-DEX integration (Jupiter, Raydium, Orca trade parsing)
- Mainnet wallet support
- User accounts (wallet-based auth)
- Mobile responsive layout
- Position-level PnL grouping

### Phase 3 — Execute & Scale 🔲
*From simulation to real trading*

Scope:
- Paper trading mode (simulated fills against real orderbooks)
- Live trade execution via Jupiter aggregator
- Multi-wallet portfolio aggregation
- Real-time portfolio tracking (balances, unrealised PnL)
- Push notifications and price alerts
- Social features (share setups, leaderboards)

---

## 4. Design Principles

1. **Education-first** — Every feature teaches something. No feature exists without an educational purpose.
2. **Simulate before you execute** — Traders build confidence through simulation before risking real capital.
3. **Progressive disclosure** — Simple on the surface, deep on demand. New traders aren't overwhelmed; experienced traders find depth.
4. **Solana-native** — Built for the Solana DeFi ecosystem. Fast, cheap, and integrated with Solana DEXes.
5. **Visual-first** — Complex concepts are shown, not told. Interactive diagrams, sliders, and gauges over walls of text.

---

## 5. Tech Summary

| Layer | Stack |
|-------|-------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Glassmorphism theme |
| Database | Supabase (PostgreSQL + Auth) |
| Blockchain | Solana Web3, Helius RPC, @deriverse/kit, @jup-ag/wallet-adapter |
| Charts | Recharts, MUI Charts |
| AI | Google Gemini API |
| Prices | Binance WebSocket, CoinGecko REST API |

Full architecture details: [architecture.md](architecture.md)

---

## 6. Related Documents

| Document | Purpose |
|----------|---------|
| [architecture.md](architecture.md) | System architecture, folder layout, data flow |
| [database.md](database.md) | Supabase schemas, caching strategy |
| [SpotOrderLogic.md](SpotOrderLogic.md) | Order type validation rules and execution logic |
| [liquidation-sim.md](liquidation-sim.md) | Liquidation simulator design and math |
| [design-uiux.md](design-uiux.md) | UI/UX guidelines, color palette, component patterns |
| [production-level-plan.md](production-level-plan.md) | Production readiness gaps and infrastructure roadmap |
| [multi-wallet-discussion.md](multi-wallet-discussion.md) | Wallet-centric vs user-centric design tradeoffs |

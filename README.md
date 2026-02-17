# Deriverse

## Live Apps
- Main app: [https://deriverse.vercel.app](https://deriverse.vercel.app)
- Supporting app (Concept DJ Playground): [https://conceptdj.vercel.app/playground](https://conceptdj.vercel.app/playground)
- Supporting app repo: [https://github.com/yamparalarahul27/ConceptDJ](https://github.com/yamparalarahul27/ConceptDJ)

## Demo Video
Watch the product walkthrough: [https://youtu.be/765plgw8Nfo](https://youtu.be/765plgw8Nfo)

## Overview
Deriverse is a trading analytics and journal experience for Solana Dex Traders. It supports devnet data for real trade analysis, with journaling, annotations, and fee/volume insights and mock data for exploration.

## Features
- Wallet lookup with mock/devnet modes
- Trading analytics: win rate, avg win/loss, volume, fee composition, long/short ratio
- Journaling with annotations, streak tracking, tag filters
- Premium/Vibrant UI components (CardWithCornerShine, GlassmorphismNavbar, LivePulseIndicator)

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn styles
- Supabase (PostgreSQL, auth) for persistence
- Solana Web3 + Helius/@deriverse/kit (planned/optional)

## Getting Started
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Scripts
- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — lint codebase

## Environment
Create `.env.local` with (examples):
```
NEXT_PUBLIC_RPC_HTTP=https://api.devnet.solana.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
Check deployment.md for production envs.

## Documentation
- `Documents/document-index.md` — index of all project docs
- `Documents/architecture.md` — system overview
- `Documents/design-uiux.md` / `frontend-uiux.md` — UI patterns and tokens
- `Documents/database.md` — Supabase schemas and caching
- `Documents/process.md` — workflow and agent skills

## Credits
- Designed & Engineered by **Yamparala Rahul**
- Telegram / X: **@yamparalarahul1**
- Made for Superteam Earn bounty: [Design trading analytics dashboard with journal and portfolio analysis](https://superteam.fun/earn/listing/design-trading-analytics-dashboard-with-journal-and-portfolio-analysis)

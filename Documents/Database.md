# Data & Persistence Strategy

## Current State (Feb 2026)
- **Mock-first experience**: The Home dashboard and Journal consume `MOCK_TRADES` bundled in the repo; no live persistence layer is wired in.
- **Live RPC lookups**: The Lookup tab fetches data directly from Solana via `HeliusService` and `DeriverseTradeService`, but results are ephemeral (kept in component state only).
- **No Supabase/storage**: Previous Supabase helpers were removed. There is no database connection, cache, or server-side persistence.

## In-Memory & Client State
- React state + localStorage (annotations) are the only persistence mechanisms.
- When TradeHistory runs, results live in state until the user navigates away; nothing is saved.

## Future Options
- If long-term storage becomes necessary (user settings, cached trades, app mode), reintroduce a backend (Supabase/Postgres, edge KV, etc.) and document it here.
- Consider lightweight caching (SWR, TanStack Query) once real RPC data powers the dashboard to avoid repeated fetches.

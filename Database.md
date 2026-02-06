# Database & Data Persistence

## Architecture
Deriverse is a **decentralized application (dApp)**. The "Database" is primarily the Solana Blockchain itself.

## On-Chain Data
- All trade data, order books, and account balances are stored on-chain in Solana accounts owned by the Deriverse program.
- Data fetching is performed via RPC calls using `@deriverse/kit`.

## Local State
- The application uses React State and Context for managing transient session data (e.g., currently connected wallet, fetched trade history).
- No persistent local database (like PostgreSQL or MongoDB) is currently integrated. 

## Caching
- Browser-side caching may be implemented for performance (e.g., `SWR` or `TanStack Query`) to reduce RPC load, though currently, direct fetches are used.

## Recommendations for AIs
- When asked to "query the database", strictly refer to fetching data from the Solana blockchain via `DeriverseService`.
- If a future requirement involves user settings or analytics that are too expensive for on-chain storage, a lightweight database (e.g., Supabase/PostgreSQL) may be introduced here.

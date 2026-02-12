# Backend Architecture

## Overview
Deriverse is presently a client-first experience. There is no dedicated server/API layer—pages call Solana RPC endpoints directly from the browser using lightweight services. The only live-data interaction today happens inside the Lookup tab, which fetches transaction history via two utility classes.

## Key Services
### `HeliusService` (`src/services/HeliusService.ts`)
- **Responsibility**: Wraps the Helius RPC API for fetching an address’s transaction signatures and metadata.
- **Usage**: `TradeHistory` calls `fetchAllTransactions(address)` to populate the “All Transactions” tab, including Solscan links and fees.

### `DeriverseTradeService` (`src/services/DeriverseTradeService.ts`)
- **Responsibility**: Uses `@deriverse/kit` + `@solana/web3.js` to decode on-chain logs for Deriverse-specific fills (spot + perp) from the same wallet history.
- **Usage**: `TradeHistory` calls `fetchTradesForWallet(connection, address)` to render the “Deriverse Trades” tab.

## API & RPC
- **RPC Provider**: Defaults to `https://api.devnet.solana.com` (configurable via `NEXT_PUBLIC_RPC_HTTP`).
- **Dependencies**: `@solana/web3.js`, `@deriverse/kit`, and the public Helius RPC endpoint. No Supabase/storage layer is active.

## Future Expansion
- If server-side logic is needed (e.g., caching decoded trades, user auth, long-term storage), Next.js Server Actions or API routes under `src/app/api/` should be introduced.
- Any reintroduction of persistence (Supabase or otherwise) should be documented here before implementation.

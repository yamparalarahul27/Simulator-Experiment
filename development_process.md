# Development Process: Wallet Connect, App Mode, Trade Import

## Overview
- Add Solana wallet adapter (client-only) triggered from “I have a wallet – continue”.
- Set app mode **REAL** when wallet connects; app mode **MOCK** when user chooses “Explore with mock data”.
- Default RPC to **devnet** (Dex runs there), allow env override; warn/block trade import on network mismatch.
- Replace localStorage with **Supabase** for wallet address, app mode, and imported trades.
- Add Trade Import step reusing Lookup (HeliusService + DeriverseTradeService) for the connected address.

## Flow
1) User clicks “I have a wallet – continue” → wallet connect modal opens (no auto-connect).
2) On connect, capture `publicKey.toBase58()`, persist to Supabase, set app mode REAL.
3) Move to Trade Import step; fetch latest trades via HeliusService + DeriverseTradeService (Lookup reuse) for that address.
4) Persist imported trades to Supabase for downstream screens.
5) If user chooses “Explore with mock data”, set app mode MOCK and skip wallet/import.

## Network / RPC Strategy
- Default: `NEXT_PUBLIC_SOLANA_RPC` fallback to `clusterApiUrl('devnet')`.
- Override: allow mainnet/custom RPC via env.
- Mismatch UX: if wallet network ≠ app network, show warning and block import until aligned.

## Data Persistence
- Supabase tables: `user_wallets` (address, timestamps, mode), `trades` (keyed by address + timestamp), matching Lookup shape.
- Client cache optional for session convenience; source of truth is Supabase.

## Implementation Order
1) Wallet adapter integration + REAL/MOCK mode wiring.
2) Network handling (devnet default, override, mismatch warning).
3) Supabase persistence for address/mode/trades.
4) Trade Import step (Lookup reuse) after connect.

## Testing Checklist
- Connect/disconnect flow; app mode switches correctly (REAL vs MOCK).
- Network mismatch warning and gating of trade import until aligned.
- Supabase writes for address, mode, trades.
- Trade fetch succeeds via HeliusService + DeriverseTradeService.
- Build passes; no SSR hydration warnings (wallet UI stays client-only).

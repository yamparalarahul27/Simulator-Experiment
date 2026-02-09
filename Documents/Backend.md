# Backend Architecture

## Overview
The backend logic for Deriverse is primarily client-side based, interacting directly with the Solana blockchain via `@deriverse/kit`. The application uses Next.js API routes (if any are added) as a thin layer, but the core business logic resides in the `DeriverseService` which communicates with on-chain programs.

## Key Services
### DeriverseService (`src/components/DeriverseService.tsx`)
- **Responsibility**: Manages connection to the Solana network and the Deriverse DEX protocol.
- **Functions**:
    - `initializeEngine()`: Sets up the `Engine` with the specific Program ID.
    - `fetchTradesForAddress(address)`: Retrieves trade history (spot and perp orders) for a given wallet address.
- **Dependencies**: 
    - `@deriverse/kit`: Core SDK for interacting with the Deriverse protocol.
    - `@solana/web3.js`: Solana interaction.

## API & RPC
- **RPC Provider**: Currently configured for `https://api.devnet.solana.com`.
- **Program ID**: `Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu` (Devnet).

## Future Expansion
- If server-side logic is needed (e.g., for indexing off-chain data or user authentication beyond wallets), Next.js Server Actions or API Routes in `src/app/api/` should be used.

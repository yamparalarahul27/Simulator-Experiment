# Solana Wallet Connect — Implementation Guide

> **Purpose**: Drop-in reference for implementing Solana wallet connectivity in a Next.js App Router project, using Jupiter's Unified Wallet Adapter. Extracted from a production codebase (YDEX).

---

## 1. Stack & Packages

| Package | Version | Role |
|---------|---------|------|
| `@jup-ag/wallet-adapter` | ^0.2.6 | **Only wallet adapter needed** — Jupiter's unified wrapper. Provides `UnifiedWalletProvider`, `useUnifiedWallet`, `useUnifiedWalletContext`. Replaces traditional `@solana/wallet-adapter-react` + `@solana/wallet-adapter-wallets`. |
| `@solana/web3.js` | ^1.98.4 | Solana blockchain types (`PublicKey`, `Connection`, `Cluster`) |
| `bs58` | ^6.0.0 | Base58 encoding/decoding (optional, for manual address work) |

```bash
npm install @jup-ag/wallet-adapter @solana/web3.js bs58
```

> **Note**: You do NOT need `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets`, or `@solana/wallet-adapter-react-ui`. Jupiter handles all of that.

---

## 2. Constants & RPC Configuration

**File**: `src/lib/constants.ts`

```typescript
// Application metadata
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com';

// RPC Configuration
export const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL
  ?? 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';
export const RPC_HTTP = process.env.NEXT_PUBLIC_RPC_HTTP ?? HELIUS_RPC_URL;

export type SupportedCluster = 'devnet' | 'mainnet-beta';

export const WALLET_CLUSTER_CONFIG: Record<SupportedCluster, { rpcUrl: string }> = {
  'devnet': {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_DEVNET ?? HELIUS_RPC_URL
  },
  'mainnet-beta': {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_MAINNET ?? 'https://api.mainnet-beta.solana.com'
  }
};

export const DEFAULT_WALLET_CLUSTER: SupportedCluster =
  process.env.NEXT_PUBLIC_WALLET_CLUSTER === 'mainnet-beta'
    ? 'mainnet-beta'
    : 'devnet';
```

**Environment variables** (`.env.local`):

```env
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_RPC_HTTP=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_RPC_DEVNET=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_WALLET_CLUSTER=devnet
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

---

## 3. Wallet Provider Setup (Root)

**File**: `src/app/providers.tsx`

Critical: The Jupiter `UnifiedWalletProvider` must be **lazy-loaded on the client** to avoid SSR hydration errors.

```typescript
'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import type { Cluster } from '@solana/web3.js';
import type { IUnifiedWalletConfig } from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider';
import { APP_BASE_URL, DEFAULT_WALLET_CLUSTER, SupportedCluster, WALLET_CLUSTER_CONFIG } from '@/lib/constants';

type UnifiedWalletProviderType = typeof import('@jup-ag/wallet-adapter')['UnifiedWalletProvider'];

export default function Providers({ children }: PropsWithChildren) {
    const [WalletProvider, setWalletProvider] = useState<UnifiedWalletProviderType | null>(null);
    const [cluster] = useState<SupportedCluster>(DEFAULT_WALLET_CLUSTER);

    // Lazy-load Jupiter's UnifiedWalletProvider on client to avoid SSR hydration issues
    useEffect(() => {
        let isMounted = true;
        import('@jup-ag/wallet-adapter').then(mod => {
            if (isMounted) {
                setWalletProvider(() => mod.UnifiedWalletProvider);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const walletConfig = useMemo(() => ({
        env: cluster as Cluster,
        autoConnect: false,       // User must explicitly connect
        theme: 'dark',            // 'dark' | 'light' | 'jupiter'
        metadata: {
            name: 'YourApp',
            description: 'Your app description',
            url: APP_BASE_URL,
            iconUrls: ['/Logo.png']
        }
    }) satisfies IUnifiedWalletConfig, [cluster]);

    // Fallback while wallet provider loads
    if (!WalletProvider) {
        return <>{children}</>;
    }

    return (
        <WalletProvider
            wallets={[]}  // Empty = auto-discover all standard wallets (Phantom, Solflare, Backpack, etc.)
            config={walletConfig}
            localStorageKey={`yourapp.wallet.${cluster}`}  // Persists selected wallet per cluster
        >
            {children}
        </WalletProvider>
    );
}
```

**File**: `src/app/layout.tsx` — Wrap your app:

```tsx
import Providers from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 4. Custom Wallet Hook

**File**: `src/lib/hooks/useWalletConnection.ts`

This is the **single interface** all components use. Never import Jupiter internals directly in feature components.

```typescript
'use client';

import { useMemo } from 'react';
import { useUnifiedWallet, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import type { PublicKey } from '@solana/web3.js';
import type { WalletName } from '@solana/wallet-adapter-base';
import type { Wallet } from '@solana/wallet-adapter-react';

export interface WalletConnectionState {
    publicKey: PublicKey | null;
    walletAddress: string | null;       // Full base58 address
    shortAddress: string | null;        // "7xKX…3k8s" format
    connected: boolean;
    connecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    selectWallet: (walletName: WalletName | null) => void;
    walletName: string | null;          // "Phantom", "Solflare", etc.
    wallets: Wallet[];                  // All available wallets
    openWalletModal: () => void;        // Show Jupiter's wallet picker UI
    isWalletModalOpen: boolean;
}

export function useWalletConnection(): WalletConnectionState {
    const {
        publicKey, connected, connecting,
        connect, disconnect, wallets, wallet, select
    } = useUnifiedWallet();

    const { setShowModal, showModal } = useUnifiedWalletContext();

    const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
    const shortAddress = useMemo(() => {
        if (!walletAddress) return null;
        return `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
    }, [walletAddress]);

    const selectWallet = (walletName: WalletName | null) => {
        select(walletName ?? null);
    };

    return {
        publicKey: publicKey ?? null,
        walletAddress,
        shortAddress,
        connected,
        connecting,
        connect,
        disconnect,
        selectWallet,
        walletName: wallet?.adapter.name ?? null,
        wallets,
        openWalletModal: () => setShowModal(true),
        isWalletModalOpen: showModal
    };
}
```

---

## 5. Using in Components

### Connect Button

```tsx
'use client';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';

export function ConnectWalletButton() {
    const { connected, walletAddress, shortAddress, openWalletModal, disconnect } = useWalletConnection();

    if (connected) {
        return (
            <div>
                <span>Connected: {shortAddress}</span>
                <button onClick={disconnect}>Disconnect</button>
            </div>
        );
    }

    return <button onClick={openWalletModal}>Connect Wallet</button>;
}
```

### Accessing Wallet in Any Component

```tsx
const { walletAddress, connected } = useWalletConnection();

if (!connected) return <p>Please connect your wallet</p>;
// walletAddress is guaranteed non-null when connected === true
```

### Getting the Wallet Provider Name

```tsx
const { walletName } = useWalletConnection();
// "Phantom" | "Solflare" | "Backpack" | etc.
```

---

## 6. RPC Connection Utility

**File**: `src/lib/utils.ts`

```typescript
import { Connection } from '@solana/web3.js';
import { RPC_HTTP } from './constants';

export function getRpcConnection(): Connection {
    return new Connection(RPC_HTTP, 'confirmed');
}
```

---

## 7. Wallet Persistence with Supabase (Optional)

If you want to store connected wallets server-side:

### Database Migration

```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  network TEXT NOT NULL,
  wallet_provider TEXT NOT NULL DEFAULT 'manual',
  connection_method TEXT NOT NULL DEFAULT 'manual',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX idx_user_wallets_last_synced ON user_wallets(last_synced_at DESC);
```

### Wallet Service

```typescript
import { supabase } from '@/lib/supabaseClient';

export interface UserWallet {
    id: string;
    wallet_address: string;
    network: string;
    wallet_provider: string;
    connection_method: string;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export class SupabaseWalletService {
    async saveWallet(params: {
        address: string;
        network: string;
        provider?: string;
        method?: 'manual' | 'wallet_connect';
    }): Promise<UserWallet> {
        const { data, error } = await supabase
            .from('user_wallets')
            .upsert({
                wallet_address: params.address,
                network: params.network,
                wallet_provider: params.provider || 'manual',
                connection_method: params.method || 'manual',
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'wallet_address' })
            .select()
            .single();
        if (error) throw error;
        return data as UserWallet;
    }

    async getWallet(address: string): Promise<UserWallet | null> {
        const { data, error } = await supabase
            .from('user_wallets')
            .select('*')
            .eq('wallet_address', address)
            .single();
        if (error?.code === 'PGRST116') return null; // not found
        if (error) throw error;
        return data as UserWallet;
    }
}
```

### Save on Connect

```tsx
const { walletAddress, connected, walletName } = useWalletConnection();

useEffect(() => {
    if (connected && walletAddress) {
        const svc = new SupabaseWalletService();
        svc.saveWallet({
            address: walletAddress,
            network: DEFAULT_WALLET_CLUSTER,
            provider: walletName ?? undefined,
            method: 'wallet_connect'
        });
    }
}, [connected, walletAddress]);
```

---

## 8. Architecture Diagram

```
layout.tsx
  └── Providers (providers.tsx)
        └── UnifiedWalletProvider (lazy-loaded, client-only)
              │
              │  Provides wallet state via React context
              │
              ├── useUnifiedWallet()     → publicKey, connect, disconnect, wallets
              └── useUnifiedWalletContext() → setShowModal, showModal
                    │
                    └── useWalletConnection()  [custom hook — USE THIS]
                          │
                          ├── walletAddress (string)
                          ├── shortAddress  ("XXXX…XXXX")
                          ├── connected / connecting (booleans)
                          ├── connect() / disconnect()
                          ├── openWalletModal()
                          └── walletName ("Phantom", etc.)
```

---

## 9. Key Design Decisions & Gotchas

1. **Jupiter over raw Solana adapter**: Jupiter's `UnifiedWalletProvider` handles wallet discovery, modal UI, and adapter management — no need to manually list wallet adapters.

2. **Lazy loading is mandatory**: The provider uses browser APIs. Importing it at module level breaks SSR. Always dynamic-import inside `useEffect`.

3. **`wallets={[]}`**: Empty array = auto-discover all Standard Wallet compliant wallets. This is intentional — don't pass specific adapters.

4. **`autoConnect: false`**: Forces explicit user interaction. Set to `true` if you want automatic reconnection on page reload (wallet must still be unlocked).

5. **`localStorageKey` per cluster**: Separates devnet/mainnet wallet selections so switching networks doesn't confuse state.

6. **No transaction signing in this setup**: The hook only provides connection state. To sign transactions, use `wallet.adapter.signTransaction()` or `wallet.adapter.signAllTransactions()` from the `useUnifiedWallet()` return value.

7. **Type imports**: `WalletName` comes from `@solana/wallet-adapter-base`, `Wallet` from `@solana/wallet-adapter-react` — these are peer dependencies of `@jup-ag/wallet-adapter`, not direct installs.

---

## 10. File Checklist

| # | File | What to create |
|---|------|----------------|
| 1 | `package.json` | Add `@jup-ag/wallet-adapter`, `@solana/web3.js`, `bs58` |
| 2 | `.env.local` | RPC URLs, cluster selection, app URL |
| 3 | `src/lib/constants.ts` | `WALLET_CLUSTER_CONFIG`, `DEFAULT_WALLET_CLUSTER`, `RPC_HTTP`, `APP_BASE_URL` |
| 4 | `src/app/providers.tsx` | Lazy-loaded `UnifiedWalletProvider` wrapper |
| 5 | `src/app/layout.tsx` | Wrap children in `<Providers>` |
| 6 | `src/lib/hooks/useWalletConnection.ts` | Custom hook (single wallet interface for all components) |
| 7 | `src/lib/utils.ts` | `getRpcConnection()` helper |
| 8 | *(Optional)* `src/services/SupabaseWalletService.ts` | Wallet persistence to Supabase |
| 9 | *(Optional)* Supabase migration | `user_wallets` table |
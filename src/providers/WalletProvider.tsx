'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    AlphaWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Client-only Solana wallet provider wrapper.
 * - Defaults to devnet (Dex runs there) via NEXT_PUBLIC_SOLANA_RPC or clusterApiUrl('devnet').
 * - Wallet list includes Phantom, Solflare, Torus, Alpha (extendable).
 * - autoConnect is false to avoid surprise wallet popups.
 */
export function WalletProviderWrapper({ children }: PropsWithChildren) {
    const endpoint = useMemo(
        () => process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl('devnet'),
        []
    );

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new AlphaWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
            <WalletProvider wallets={wallets} autoConnect={false}>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default WalletProviderWrapper;

'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import type { Cluster } from '@solana/web3.js';
import type { IUnifiedWalletConfig } from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider';
import { APP_BASE_URL, DEFAULT_WALLET_CLUSTER, SupportedCluster, WALLET_CLUSTER_CONFIG } from '@/lib/constants';
import { AppearanceProvider } from '@/lib/context/AppearanceContext';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';

type UnifiedWalletProviderType = typeof import('@jup-ag/wallet-adapter')['UnifiedWalletProvider'];

/**
 * Inner wrapper that reads the wallet address (requires WalletProvider above it)
 * and passes it to AppearanceProvider.
 */
function AppearanceWrapper({ children }: PropsWithChildren) {
    const { walletAddress } = useWalletConnection();
    return (
        <AppearanceProvider walletAddress={walletAddress}>
            {children}
        </AppearanceProvider>
    );
}

export default function Providers({ children }: PropsWithChildren) {
    const [WalletProvider, setWalletProvider] = useState<UnifiedWalletProviderType | null>(null);
    const [cluster, setCluster] = useState<SupportedCluster>(DEFAULT_WALLET_CLUSTER);

    useEffect(() => {
        // Lazy-load Jupiter's UnifiedWalletProvider on the client to avoid SSR hydration issues.
        let isMounted = true;
        import('@jup-ag/wallet-adapter').then(mod => {
            if (isMounted) {
                setWalletProvider(() => mod.UnifiedWalletProvider);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const walletConfig = useMemo(() => ({
        env: cluster as Cluster,
        autoConnect: false,
        theme: 'dark',
        metadata: {
            name: 'YDEX',
            description: 'YDEX wallet connectivity',
            url: APP_BASE_URL,
            iconUrls: ['/Logo.png']
        }
        // RPC URLs are configured per cluster via WALLET_CLUSTER_CONFIG.
    }) satisfies IUnifiedWalletConfig, [cluster]);

    if (!WalletProvider) {
        // Wallet not loaded yet — still provide AppearanceProvider with null wallet
        return (
            <AppearanceProvider walletAddress={null}>
                {children}
            </AppearanceProvider>
        );
    }

    return (
        <WalletProvider
            wallets={[]}
            config={walletConfig}
            localStorageKey={`deriverse.wallet.${cluster}`}
        >
            <AppearanceWrapper>{children}</AppearanceWrapper>
        </WalletProvider>
    );
}

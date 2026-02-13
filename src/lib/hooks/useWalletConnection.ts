'use client';

import { useMemo } from 'react';
import { useUnifiedWallet, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import type { PublicKey } from '@solana/web3.js';
import type { WalletName } from '@solana/wallet-adapter-base';
import type { Wallet } from '@solana/wallet-adapter-react';

export interface WalletConnectionState {
    publicKey: PublicKey | null;
    walletAddress: string | null;
    shortAddress: string | null;
    connected: boolean;
    connecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    selectWallet: (walletName: WalletName | null) => void;
    walletName: string | null;
    wallets: Wallet[];
    openWalletModal: () => void;
    isWalletModalOpen: boolean;
}

/**
 * Convenience hook that exposes the minimal Jupiter wallet state needed by Lookup.
 * Wraps `useUnifiedWallet` so screens can access the wallet address without
 * importing adapter internals.
 */
export function useWalletConnection(): WalletConnectionState {
    const {
        publicKey,
        connected,
        connecting,
        connect,
        disconnect,
        wallets,
        wallet,
        select
    } = useUnifiedWallet();
    const { setShowModal, showModal } = useUnifiedWalletContext();

    const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
    const shortAddress = useMemo(() => {
        if (!walletAddress) return null;
        return `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
    }, [walletAddress]);

    const selectWallet = (walletName: WalletName | null) => {
        if (!walletName) {
            select(null);
            return;
        }
        select(walletName);
    };

    const openWalletModal = () => setShowModal(true);

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
        openWalletModal,
        isWalletModalOpen: showModal
    };
}

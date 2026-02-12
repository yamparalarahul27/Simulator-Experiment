'use client';

import React, { PropsWithChildren } from 'react';
import WalletProviderWrapper from '@/providers/WalletProvider';

/**
 * Top-level client providers wrapper.
 * Currently: Solana wallet adapter context (devnet default, overrideable via env).
 */
export default function Providers({ children }: PropsWithChildren) {
    return <WalletProviderWrapper>{children}</WalletProviderWrapper>;
}

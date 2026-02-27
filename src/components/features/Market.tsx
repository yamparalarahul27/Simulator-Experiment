'use client';

import React from 'react';
import DemoMarket from './DemoMarket';
import { useWalletConnection } from '../../lib/hooks/useWalletConnection';

/**
 * Market Feature Component
 *
 * Renders the Demo Market trading terminal.
 */
export default function Market() {
    const { walletAddress } = useWalletConnection();

    return <DemoMarket walletAddress={walletAddress} />;
}

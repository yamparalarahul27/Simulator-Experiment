'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import WelcomeHeader from './WelcomeHeader';
import NewUserModal from './NewUserModal';
import { useWalletConnection } from '../../lib/hooks/useWalletConnection';
import { SupabaseWalletService } from '../../services/SupabaseWalletService';
import { toast } from 'sonner';
import type { TabType } from '../layout/TabNavigation';

// Custom spinner styles are now in globals.css

interface DeriverseWalletAskProps {
    onChoice: (choice: 'wallet' | 'mock') => void;
    onNavigateToDashboard?: () => void;
    onNavigateToLookup?: (walletAddress: string) => void;
    onReturnToWelcome?: () => void;
}

const WalletAskContent = {
    title: "Before we begin…",
    description1: "This app works best with wallets used on Deriverse DEX, but you can still explore without one.",
    description2: "Choose what works for you:",
    primaryButton: "I have a wallet — continue",
    secondaryOption: "Explore with mock data"
};

export default function DeriverseWalletAsk({
    onChoice,
    onNavigateToDashboard,
    onNavigateToLookup,
    onReturnToWelcome
}: DeriverseWalletAskProps) {
    // Wallet connection state
    const [isConnecting, setIsConnecting] = useState(false);
    const [isCheckingWallet, setIsCheckingWallet] = useState(false);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);

    // Wallet connection hook
    const {
        connected,
        connecting,
        walletAddress,
        openWalletModal,
        isWalletModalOpen,
        connect,
        disconnect
    } = useWalletConnection();

    const walletService = new SupabaseWalletService();

    // Handle wallet connection success
    useEffect(() => {
        if (connected && walletAddress && (isConnecting || isCheckingWallet === false)) {
            // Only trigger check if we were expecting a connection or if we just became connected
            // while in this component
            if (isConnecting) {
                setIsConnecting(false);
                checkWalletExists(walletAddress);
            }
        }
    }, [connected, walletAddress, isConnecting]);

    // Handle wallet connection cancellation or closure without connection
    useEffect(() => {
        // If we were connecting, the modal is now closed, and we aren't connected/connecting
        if (isConnecting && !isWalletModalOpen && !connected && !connecting) {
            // Small delay to let adapter states settle
            const timer = setTimeout(() => {
                if (!connected && !connecting && !isWalletModalOpen) {
                    setIsConnecting(false);
                    // Don't set error if they just closed it, unless we want to
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isWalletModalOpen, connected, connecting, isConnecting]);

    // Cleanup error state when starting a new connection
    useEffect(() => {
        if (isConnecting) {
            setWalletError(null);
        }
    }, [isConnecting]);
    const handleWalletConnect = async () => {
        try {
            setIsConnecting(true);
            setWalletError(null);
            openWalletModal();
        } catch (error) {
            setIsConnecting(false);
            setWalletError('Failed to open wallet selection. Please try again.');
            console.error('[Wallet] Connection error:', error);
        }
    };

    const checkWalletExists = async (address: string) => {
        try {
            setIsCheckingWallet(true);
            setWalletError(null);

            const existingWallet = await walletService.getWallet(address);

            if (existingWallet) {
                // Existing user - show success and navigate to dashboard
                toast.success('Login successful! Welcome back to Deriverse Journal.');
                setConnectedWalletAddress(address);

                // Smooth navigation to dashboard
                setTimeout(() => {
                    onNavigateToDashboard?.();
                }, 1000);
            } else {
                // New user - show modal
                setConnectedWalletAddress(address);
                setShowNewUserModal(true);
            }
        } catch (error) {
            setWalletError('Failed to verify wallet. Please try again.');
            console.error('[Supabase] Wallet check error:', error);
        } finally {
            setIsCheckingWallet(false);
        }
    };

    const handleNewUserChoice = async (choice: 'signup' | 'back') => {
        setShowNewUserModal(false);

        if (choice === 'signup' && connectedWalletAddress) {
            try {
                // Save new user wallet to Supabase
                await walletService.saveWallet({
                    address: connectedWalletAddress,
                    network: 'devnet',
                    method: 'wallet_connect'
                });

                toast.success('Welcome to Deriverse Journal! Your wallet has been registered.');

                // Navigate to lookup screen
                setTimeout(() => {
                    onNavigateToLookup?.(connectedWalletAddress);
                }, 1000);
            } catch (error) {
                setWalletError('Failed to register wallet. Please try again.');
                console.error('[Supabase] Save wallet error:', error);
            }
        } else if (choice === 'back') {
            // Disconnect wallet and return to welcome
            await disconnect();
            onReturnToWelcome?.();
        }
    };

    const handleMockData = () => {
        onChoice('mock');
    };

    return (
        <motion.div
            className="welcome-screen fixed inset-0 z-50 flex items-center justify-center"
            style={{
                backgroundImage: 'url(/assets/background_wallpaper_dot.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
        >
            {/* Header */}
            <WelcomeHeader />

            {/* Main Wallet Ask Card */}
            <div className="flex flex-col items-center gap-8">
                <WelcomeCard>
                    {/* Hero Logo */}
                    <motion.div
                        className="flex justify-center mb-8"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        <img
                            src="/assets/deriverse_j_hero_logo.png"
                            alt="Deriverse Journal"
                            className="h-auto"
                            style={{ width: '180px', height: 'auto' }}
                        />
                    </motion.div>

                    {/* Wallet Ask Content */}
                    <motion.div
                        className="text-center space-y-6 flex-1 flex flex-col justify-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    >
                        <h1 className="text-xl font-mono uppercase tracking-wider text-white/80 mb-6">
                            {WalletAskContent.title}
                        </h1>

                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                                {WalletAskContent.description1}
                            </p>

                            <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                                {WalletAskContent.description2}
                            </p>
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col items-center gap-4 mt-8">
                        {/* Error Message */}
                        {walletError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-orange-400 text-sm text-center max-w-md"
                            >
                                {walletError}
                            </motion.div>
                        )}


                        {/* Wallet Connect Button */}
                        <WelcomeButton
                            onClick={handleWalletConnect}
                            disabled={isConnecting || isCheckingWallet}
                        >
                            {(isConnecting || isCheckingWallet) ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div role="status" className="spinner small !border-white/30 !border-t-white"></div>
                                    <span>{isConnecting ? 'Opening...' : 'Verifying...'}</span>
                                </div>
                            ) : (
                                WalletAskContent.primaryButton
                            )}
                        </WelcomeButton>

                        <button
                            className="text-white text-sm font-mono hover:text-white/80 transition-colors cursor-pointer"
                            onClick={() => onChoice('mock')}
                            disabled={isConnecting || isCheckingWallet}
                        >
                            {WalletAskContent.secondaryOption}
                        </button>
                    </div>
                </WelcomeCard>
            </div>

            {/* Footer */}
            <WelcomeFooter />

            {/* New User Modal */}
            <NewUserModal
                isVisible={showNewUserModal}
                onChoice={handleNewUserChoice}
                walletAddress={connectedWalletAddress || ''}
            />
        </motion.div>
    );
}

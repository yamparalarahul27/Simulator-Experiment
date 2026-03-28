'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import NewUserModal from './NewUserModal';
import { useWalletConnection } from '../../lib/hooks/useWalletConnection';
import { SupabaseWalletService } from '../../services/SupabaseWalletService';

interface WelcomeScreenProps {
    onComplete: () => void;
    isVisible: boolean;
}

const HeroContent = {
    greeting: "Welcome to YDEX",
    description: "Learn DEX trading through interactive simulators and guided lessons. Master order types, risk management, and trading strategies — all in a safe, simulated environment.",
    primaryButton: "Get Started",
    walletOption: "Connect wallet (optional)",
};

export default function WelcomeScreen({ onComplete, isVisible }: WelcomeScreenProps) {
    // Wallet connection state
    const [isConnecting, setIsConnecting] = useState(false);
    const [isCheckingWallet, setIsCheckingWallet] = useState(false);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);

    const {
        connected,
        connecting,
        walletAddress,
        openWalletModal,
        isWalletModalOpen,
        disconnect
    } = useWalletConnection();

    const walletService = new SupabaseWalletService();

    // Handle wallet connection success
    useEffect(() => {
        if (connected && walletAddress && isConnecting) {
            setIsConnecting(false);
            checkWalletExists(walletAddress);
        }
    }, [connected, walletAddress, isConnecting]);

    // Handle wallet modal closed without connecting
    useEffect(() => {
        if (isConnecting && !isWalletModalOpen && !connected && !connecting) {
            const timer = setTimeout(() => {
                if (!connected && !connecting && !isWalletModalOpen) {
                    setIsConnecting(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isWalletModalOpen, connected, connecting, isConnecting]);

    // Clear error on new connection attempt
    useEffect(() => {
        if (isConnecting) setWalletError(null);
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
                toast.success('Welcome back to YDEX!');
                setConnectedWalletAddress(address);
                setTimeout(() => onComplete(), 1000);
            } else {
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
                await walletService.saveWallet({
                    address: connectedWalletAddress,
                    network: 'devnet',
                    method: 'wallet_connect'
                });
                toast.success('Welcome to YDEX! Your wallet has been registered.');
                setTimeout(() => onComplete(), 1000);
            } catch (error) {
                setWalletError('Failed to register wallet. Please try again.');
                console.error('[Supabase] Save wallet error:', error);
            }
        } else if (choice === 'back') {
            await disconnect();
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
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
                    {/* Hero Card */}
                    <div className="flex flex-col items-center gap-6 sm:gap-8 px-4 sm:px-0">
                        <WelcomeCard>
                            {/* Logo */}
                            <motion.div
                                className="flex justify-center mb-4 sm:mb-8"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            >
                                <img
                                    src="/Logo.png"
                                    alt="YDEX Logo"
                                    className="h-auto w-[140px] sm:w-[180px]"
                                />
                            </motion.div>

                            {/* Hero Content */}
                            <motion.div
                                className="text-center space-y-6 flex-1 flex flex-col justify-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            >
                                <h1 className="text-lg sm:text-xl font-mono uppercase tracking-wider text-white/80 mb-4 sm:mb-6">
                                    {HeroContent.greeting}
                                </h1>

                                <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                                    {HeroContent.description}
                                </p>
                            </motion.div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col items-center gap-4 mt-8">
                                {walletError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-orange-400 text-sm text-center max-w-md"
                                    >
                                        {walletError}
                                    </motion.div>
                                )}

                                {/* Primary: Get Started */}
                                <WelcomeButton onClick={onComplete}>
                                    {HeroContent.primaryButton}
                                </WelcomeButton>

                                {/* Secondary: Connect Wallet */}
                                <button
                                    className="text-white/50 text-sm font-mono hover:text-white/80 transition-colors cursor-pointer"
                                    onClick={handleWalletConnect}
                                    disabled={isConnecting || isCheckingWallet}
                                >
                                    {(isConnecting || isCheckingWallet) ? (
                                        <span>{isConnecting ? 'Opening wallet...' : 'Verifying...'}</span>
                                    ) : (
                                        HeroContent.walletOption
                                    )}
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
            )}
        </AnimatePresence>
    );
}

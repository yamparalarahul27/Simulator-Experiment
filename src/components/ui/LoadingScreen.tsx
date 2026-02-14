'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeriverseLogo } from '../layout/DeriverseLogo';
import type { TabType } from '../layout/TabNavigation';
import WelcomeScreen from './WelcomeScreen';
import DeriverseWalletAsk from './DeriverseWalletAsk';

type LoadingPhase = 'welcome' | 'wallet-ask' | 'logo' | 'complete';

// Navigation event types
type NavigationEvent = {
    navigateToDashboard?: () => void;
    navigateToLookup?: (walletAddress: string) => void;
    returnToWelcome?: () => void;
};

const dispatchShowWelcome = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent('deriverse:show-welcome')
    );
};

const dispatchTabChange = (tab: TabType) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<TabType>('deriverse:set-active-tab', {
            detail: tab,
        })
    );
};

/**
 * LoadingScreen Component
 * 
 * PURPOSE:
 * Manages the initial multi-phase app entry sequence.
 * Orchestrates transitions between the Welcome screen, Wallet connection prompt,
 * and the final Logo animation.
 * 
 * PHASES:
 * 1. 'welcome': Display branding and app introduction
 * 2. 'wallet-ask': Prompt user for network/wallet choice
 * 3. 'logo': Play the primary branding animation
 * 4. 'complete': Transition to the main dashboard
 */
export default function LoadingScreen() {
    const [currentPhase, setCurrentPhase] = useState<LoadingPhase>('welcome');
    const [isVisible, setIsVisible] = useState(true);
    const [navigationCallbacks, setNavigationCallbacks] = useState<NavigationEvent>({});

    useEffect(() => {
        // Only set up logo timer after welcome is completed by user
        // No automatic transition from welcome screen
    }, []);

    // This effect will be called when welcome screen is completed by user
    useEffect(() => {
        if (currentPhase === 'logo') {
            // Phase 2: Logo Animation (4.8 seconds)
            const logoTimer = setTimeout(() => {
                setCurrentPhase('complete');
                setIsVisible(false);
            }, 4800); // Logo animation time only

            return () => clearTimeout(logoTimer);
        }
    }, [currentPhase]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleShowWelcome = () => {
            setCurrentPhase('welcome');
            setIsVisible(true);
        };

        window.addEventListener('deriverse:show-welcome', handleShowWelcome);
        return () => {
            window.removeEventListener('deriverse:show-welcome', handleShowWelcome);
        };
    }, []);

    // Hide all body content while loading
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
            // Hide all children except the loading screen
            const bodyChildren = Array.from(document.body.children);
            bodyChildren.forEach((child) => {
                if (!child.classList.contains('loading-screen')) {
                    (child as HTMLElement).style.visibility = 'hidden';
                }
            });
        } else {
            // Add a small buffer before showing content to ensure smooth transition
            const bufferTimer = setTimeout(() => {
                document.body.style.overflow = '';
                const bodyChildren = Array.from(document.body.children);
                bodyChildren.forEach((child) => {
                    (child as HTMLElement).style.visibility = '';
                });
            }, 200);

            return () => clearTimeout(bufferTimer);
        }
    }, [isVisible]);

    const handleWelcomeComplete = () => {
        setCurrentPhase('wallet-ask');
    };

    const handleNavigateToDashboard = () => {
        // Navigate to dashboard tab
        dispatchTabChange('dashboard');
        setCurrentPhase('logo');
    };

    const handleNavigateToLookup = (walletAddress: string) => {
        // Navigate to lookup tab with wallet address
        dispatchTabChange('lookup');
        setCurrentPhase('logo');
    };

    const handleReturnToWelcome = () => {
        dispatchShowWelcome();
    };

    const handleWalletChoice = (choice: 'wallet' | 'mock') => {
        // Route users to lookup (wallet) or dashboard (mock) tabs
        const nextTab: TabType = choice === 'wallet' ? 'lookup' : 'dashboard';
        dispatchTabChange(nextTab);

        // Both choices now lead to the logo animation
        // The actual wallet connection/data fetching happens in the app
        setCurrentPhase('logo');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="loading-screen fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    {/* Welcome Screen Phase */}
                    <WelcomeScreen
                        isVisible={currentPhase === 'welcome'}
                        onComplete={handleWelcomeComplete}
                    />

                    {/* Wallet Ask Phase */}
                    {currentPhase === 'wallet-ask' && (
                        <DeriverseWalletAsk
                            onChoice={handleWalletChoice}
                            onNavigateToDashboard={handleNavigateToDashboard}
                            onNavigateToLookup={handleNavigateToLookup}
                            onReturnToWelcome={handleReturnToWelcome}
                        />
                    )}

                    {/* Logo Animation Phase */}
                    {currentPhase === 'logo' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            <DeriverseLogo />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

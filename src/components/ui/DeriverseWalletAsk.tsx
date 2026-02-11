'use client';

import React from 'react';
import { motion } from 'framer-motion';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import WelcomeHeader from './WelcomeHeader';

interface DeriverseWalletAskProps {
    onChoice: (choice: 'wallet' | 'mock') => void;
}

const WalletAskContent = {
    title: "Before we begin…",
    description1: "This app works best with wallets used on Deriverse DEX, but you can still explore without one.",
    description2: "Choose what works for you:",
    primaryButton: "I have a wallet — continue",
    secondaryOption: "Explore with mock data"
};

export default function DeriverseWalletAsk({ onChoice }: DeriverseWalletAskProps) {
    const handleWalletContinue = () => {
        // Primary button does nothing for now (placeholder for future wallet connection)
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
                        <WelcomeButton onClick={handleWalletContinue}>
                            {WalletAskContent.primaryButton}
                        </WelcomeButton>
                        
                        <button 
                            className="text-white text-sm font-mono hover:text-white/80 transition-colors cursor-pointer"
                            onClick={handleMockData}
                        >
                            {WalletAskContent.secondaryOption}
                        </button>
                    </div>
                </WelcomeCard>
            </div>

            {/* Footer */}
            <WelcomeFooter />
        </motion.div>
    );
}

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import WelcomeHeader from './WelcomeHeader';
import GeneratedBackground from './GeneratedBackground';

interface NewUserModalProps {
    isVisible: boolean;
    onChoice: (choice: 'signup' | 'back') => void;
    walletAddress: string;
}

const NewUserContent = {
    title: "Welcome to YDEX!",
    description: "It seems you are new here, as we didn't see your wallet being used on the app before. Would you like to continue with signup?",
    primaryButton: "Yes, continue to signup",
    secondaryOption: "No, go back"
};

export default function NewUserModal({ isVisible, onChoice, walletAddress }: NewUserModalProps) {
    const handleSignup = () => {
        onChoice('signup');
    };

    const handleGoBack = () => {
        onChoice('back');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="welcome-screen fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    <GeneratedBackground dotOverlay />
                    {/* Header */}
                    <WelcomeHeader />

                    {/* Main New User Card */}
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
                                    src="/Logo.png" 
                                    alt="YDEX Logo" 
                                    className="h-auto"
                                    style={{ width: '180px', height: 'auto' }}
                                />
                            </motion.div>

                            {/* New User Content */}
                            <motion.div
                                className="text-center space-y-6 flex-1 flex flex-col justify-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            >
                                <h1 className="text-xl font-mono uppercase tracking-wider text-[#ced5e4] mb-6">
                                    {NewUserContent.title}
                                </h1>
                                
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-[#adb9d2] max-w-md mx-auto">
                                        {NewUserContent.description}
                                    </p>
                                    
                                    {/* Wallet Address Display */}
                                    <div className="mt-4 p-3 bg-[#11141a] border border-[#1a1e26] rounded-lg">
                                        <p className="text-xs text-[#adb9d2] uppercase tracking-wider mb-1">Your Wallet</p>
                                        <p className="text-sm font-mono text-[#ced5e4]">
                                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col items-center gap-4 mt-8">
                                <WelcomeButton onClick={handleSignup}>
                                    {NewUserContent.primaryButton}
                                </WelcomeButton>
                                
                                <button 
                                    className="text-white text-sm font-mono hover:text-[#ced5e4] transition-colors cursor-pointer"
                                    onClick={handleGoBack}
                                >
                                    {NewUserContent.secondaryOption}
                                </button>
                            </div>
                        </WelcomeCard>
                    </div>

                    {/* Footer */}
                    <WelcomeFooter />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

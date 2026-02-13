'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import WelcomeHeader from './WelcomeHeader';

interface NewUserModalProps {
    isVisible: boolean;
    onChoice: (choice: 'signup' | 'back') => void;
    walletAddress: string;
}

const NewUserContent = {
    title: "Welcome to Deriverse Journal!",
    description: "It seems you are new here, as we didn't see your wallet being used on app before, would you like to continue with signup?",
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
                                    src="/assets/deriverse_j_hero_logo.png" 
                                    alt="Deriverse Journal" 
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
                                <h1 className="text-xl font-mono uppercase tracking-wider text-white/80 mb-6">
                                    {NewUserContent.title}
                                </h1>
                                
                                <div className="space-y-4">
                                    <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                                        {NewUserContent.description}
                                    </p>
                                    
                                    {/* Wallet Address Display */}
                                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-none">
                                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Your Wallet</p>
                                        <p className="text-sm font-mono text-white/80">
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
                                    className="text-white text-sm font-mono hover:text-white/80 transition-colors cursor-pointer"
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

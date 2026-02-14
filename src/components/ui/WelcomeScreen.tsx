'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileRestrictedView from '../layout/MobileRestrictedView';
import WelcomeCard from './WelcomeCard';
import WelcomeButton from './WelcomeButton';
import WelcomeFooter from './WelcomeFooter';
import WelcomeHeader from './WelcomeHeader';

/**
 * WelcomeScreen Component
 * 
 * PURPOSE:
 * Main welcome screen component that appears before the logo animation.
 * Features a centered card with hero logo, welcome message, descriptive text,
 * call-to-action button, and footer with branding elements.
 * 
 * DESIGN FEATURES:
 * - Background with wallpaper
 * - Centered card layout with corner shine effects
 * - Hero logo integration
 * - Typography hierarchy
 * - Custom-styled button
 * - Footer with logos and attribution
 */

interface WelcomeScreenProps {
    onComplete: () => void;
    isVisible: boolean;
}

const WelcomeContent = {
    greeting: "Hi, welcome to Deriverse Journal",
    description: "This app is made to help traders on Deriverse Dex to get in-depth analytics and journal their trades to become more discipline and profitable.",
    buttonText: "Awesome! Let's get started"
};

export const WelcomeScreen = ({ onComplete, isVisible }: WelcomeScreenProps) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleGetStarted = () => {
        onComplete();
    };

    if (isVisible && isMobile) {
        return <MobileRestrictedView />;
    }

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

                    {/* Main Welcome Card */}
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

                            {/* Welcome Text */}
                            <motion.div
                                className="text-center space-y-6 flex-1 flex flex-col justify-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            >
                                <h1 className="text-xl font-mono uppercase tracking-wider text-white/80 mb-6">
                                    {WelcomeContent.greeting}
                                </h1>

                                <p className="text-sm leading-relaxed text-white/60 max-w-md mx-auto">
                                    {WelcomeContent.description}
                                </p>
                            </motion.div>

                            {/* CTA Button */}
                            <div className="flex justify-center mt-8">
                                <WelcomeButton onClick={handleGetStarted}>
                                    {WelcomeContent.buttonText}
                                </WelcomeButton>
                            </div>
                        </WelcomeCard>
                    </div>

                    {/* Footer */}
                    <WelcomeFooter />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeScreen;

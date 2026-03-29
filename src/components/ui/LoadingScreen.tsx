'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import WelcomeScreen from './WelcomeScreen';
import GeneratedBackground from './GeneratedBackground';

type LoadingPhase = 'welcome' | 'logo' | 'complete';

const dispatchShowWelcome = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('deriverse:show-welcome'));
};

/**
 * LoadingScreen Component
 *
 * Manages the app entry sequence:
 * 1. 'welcome': Single hero landing page with Get Started + Connect Wallet
 * 2. 'logo': Branding animation
 * 3. 'complete': Transition to main app
 */
export default function LoadingScreen() {
    const [currentPhase, setCurrentPhase] = useState<LoadingPhase>('welcome');
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    // Logo animation timer
    useEffect(() => {
        if (currentPhase === 'logo') {
            const logoTimer = setTimeout(() => {
                setCurrentPhase('complete');
                setIsVisible(false);
            }, 4800);

            return () => clearTimeout(logoTimer);
        }
    }, [currentPhase]);

    // Listen for show-welcome event (e.g. from NewUserModal "go back")
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleShowWelcome = () => {
            setCurrentPhase('welcome');
            setIsVisible(true);
        };

        window.addEventListener('deriverse:show-welcome', handleShowWelcome);
        return () => window.removeEventListener('deriverse:show-welcome', handleShowWelcome);
    }, []);

    // Hide body content while loading
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
            const bodyChildren = Array.from(document.body.children);
            bodyChildren.forEach((child) => {
                if (!child.classList.contains('loading-screen')) {
                    (child as HTMLElement).style.visibility = 'hidden';
                }
            });
        } else {
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
        router.push('/lessons');
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
                    <GeneratedBackground />
                    {/* Welcome / Hero Landing */}
                    <WelcomeScreen
                        isVisible={currentPhase === 'welcome'}
                        onComplete={handleWelcomeComplete}
                    />

                    {/* Logo Animation */}
                    {currentPhase === 'logo' && (
                        <motion.div
                            className="flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            <Image
                                src="/assets/LogoPath.svg"
                                alt="YDEX logo"
                                width={280}
                                height={80}
                                priority
                                className="h-auto w-72"
                            />
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

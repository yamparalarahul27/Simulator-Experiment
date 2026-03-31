'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import GeneratedBackground from './GeneratedBackground';

/**
 * LoadingScreen Component — Logo Splash
 *
 * Shows a brief logo animation on app load, then fades out
 * to reveal the lessons page directly. No welcome screen.
 *
 * Sequence:
 * 1. Paper texture background appears
 * 2. Logo fades in + scales up
 * 3. Hold for a moment
 * 4. Everything fades out, app content revealed
 */
export default function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Total splash duration: ~2.5s
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Hide body content while splash is showing
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            const bufferTimer = setTimeout(() => {
                document.body.style.overflow = '';
            }, 800); // wait for exit animation
            return () => clearTimeout(bufferTimer);
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="loading-screen fixed inset-0 z-50 flex items-center justify-center bg-bs-bg"
                    style={{
                        top: 'calc(-1 * env(safe-area-inset-top, 0px))',
                        bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
                        left: 'calc(-1 * env(safe-area-inset-left, 0px))',
                        right: 'calc(-1 * env(safe-area-inset-right, 0px))',
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
                >
                    <GeneratedBackground />

                    {/* Logo animation */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-6"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Image
                            src="/Logo.png"
                            alt="YDEX"
                            width={180}
                            height={180}
                            priority
                            className="h-auto w-[120px] sm:w-[160px]"
                        />
                        <motion.p
                            className="text-sm font-mono uppercase tracking-[0.3em] text-bs-text-tertiary"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        >
                            Solving Y of DEX
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

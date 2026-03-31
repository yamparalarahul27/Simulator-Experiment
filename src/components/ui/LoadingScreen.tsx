'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import GeneratedBackground from './GeneratedBackground';

/**
 * LoadingScreen Component — Logo Splash
 *
 * Shows a brief logo animation on app load, then fades out
 * to reveal the lessons page directly. No welcome screen.
 *
 * Uses the SVG logo as a CSS mask so the fill color adapts to theme:
 * - Light: deep warm brown on cream
 * - Dark: warm gold on midnight navy
 */
export default function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === 'light';

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            const bufferTimer = setTimeout(() => {
                document.body.style.overflow = '';
            }, 800);
            return () => clearTimeout(bufferTimer);
        }
    }, [isVisible]);

    const logoColor = isLight ? '#2c1810' : '#d4a54a';

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
                        <div
                            aria-label="YDEX"
                            role="img"
                            className="w-[120px] sm:w-[160px]"
                            style={{
                                aspectRatio: '627 / 235',
                                backgroundColor: logoColor,
                                maskImage: 'url(/assets/LogoPath.svg)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskImage: 'url(/assets/LogoPath.svg)',
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                            }}
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

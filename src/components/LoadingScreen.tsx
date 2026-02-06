'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeriverseLogo } from './DeriverseLogo';

export default function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Total animation time: path draw (2s) + fill delay (1.5s) + fill duration (0.8s) + hold time (0.5s)
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 4800);

        return () => clearTimeout(timer);
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
            document.body.style.overflow = '';
            const bodyChildren = Array.from(document.body.children);
            bodyChildren.forEach((child) => {
                (child as HTMLElement).style.visibility = '';
            });
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="loading-screen fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    <DeriverseLogo />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

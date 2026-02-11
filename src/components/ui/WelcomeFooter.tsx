'use client';

import { motion } from 'framer-motion';
import WelcomeCard from './WelcomeCard';

/**
 * WelcomeFooter Component
 * 
 * PURPOSE:
 * Footer component for the welcome screen containing "Powered by" section
 * inside a WelcomeCard and attribution text outside the card.
 * 
 * DESIGN FEATURES:
 * - Reuses WelcomeCard for consistent styling
 * - "Powered by" section with 3 logos inside card
 * - Attribution text outside card
 * - Positioned at bottom of screen
 */

interface WelcomeFooterProps {
    className?: string;
}

export const WelcomeFooter = ({ className = '' }: WelcomeFooterProps) => {
    return (
        <div className={`
            absolute bottom-8 left-1/2 transform -translate-x-1/2
            w-full max-w-[600px]
            text-center
            ${className}
        `}>
            {/* Powered By Section - Inside WelcomeCard */}
            <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            >
                <WelcomeCard className="footer-card !min-h-[auto] !py-4 w-full">
                    <div className="powered-by flex items-center justify-between w-full mb-2">
                        <span className="text-white/40 text-sm font-mono uppercase tracking-wider">Powered by</span>
                        <img 
                            src="/assets/deriverse_dex_logo.png" 
                            alt="Deriverse Dex" 
                            className="h-4 w-auto opacity-80"
                        />
                        <span className="text-white/40 text-sm font-mono">,</span>
                        <img 
                            src="/assets/solana_network_logo.png" 
                            alt="Solana Network" 
                            className="h-4 w-auto opacity-80"
                        />
                        <span className="text-white/40 text-sm font-mono">&</span>
                        <img 
                            src="/assets/superteam_earn_logo.png" 
                            alt="Superteam Earn" 
                            className="h-[18px] w-auto opacity-80"
                        />
                    </div>
                </WelcomeCard>
            </motion.div>

            {/* Attribution - Outside Card */}
            <motion.div 
                className="attribution text-xs opacity-60 text-white/80 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
            >
                Designed & Engineered by Yamparala Rahul
            </motion.div>
        </div>
    );
};

export default WelcomeFooter;

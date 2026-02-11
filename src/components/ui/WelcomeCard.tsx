'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * WelcomeCard Component
 * 
 * PURPOSE:
 * A custom card component for the welcome screen, similar to CardWithCornerShine
 * but with fixed bg-black/40 styling and corner shine effects.
 * 
 * DESIGN FEATURES:
 * - Fixed 40% black background opacity
 * - Corner shine effects on hover
 * - Rounded corners (none)
 * - Smooth transitions
 */

interface WelcomeCardProps {
    children: ReactNode;
    className?: string;
}

/**
 * CornerAccents Component
 * 
 * Reuses the corner shine logic from CardWithCornerShine
 * Creates L-shaped glowing corners on hover
 */
const CornerAccents = () => {
    return (
        <>
            {/* Top-Left Corner */}
            <div className="absolute top-4 left-4 w-4 h-4">
                <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
                <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
            </div>

            {/* Top-Right Corner */}
            <div className="absolute top-4 right-4 w-4 h-4">
                <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
                <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
            </div>

            {/* Bottom-Left Corner */}
            <div className="absolute bottom-4 left-4 w-4 h-4">
                <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
            </div>

            {/* Bottom-Right Corner */}
            <div className="absolute bottom-4 right-4 w-4 h-4">
                <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
            </div>
        </>
    );
};

export const WelcomeCard = ({ children, className = '' }: WelcomeCardProps) => {
    return (
        <motion.div
            className={`
                group relative
                min-h-[400px]
                w-full max-w-[500px]
                rounded-none
                bg-black/40
                border border-white/10
                hover:border-white/20
                hover:shadow-lg hover:shadow-white/5
                transition-all duration-300
                p-8
                ${className}
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {/* Corner Accent Brackets */}
            <CornerAccents />

            {/* Card Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default WelcomeCard;

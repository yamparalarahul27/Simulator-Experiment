'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * WelcomeCard Component — Paper Texture UI
 *
 * Card with embossed paper feel, warm corner accents,
 * and subtle inset shadows for depth.
 */

interface WelcomeCardProps {
    children: ReactNode;
    className?: string;
}

const CornerAccents = () => {
    return (
        <>
            {/* Top-Left Corner */}
            <div className="absolute top-4 left-4 w-4 h-4">
                <div className="absolute top-0 left-0 w-2 h-px bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
                <div className="absolute top-0 left-0 w-px h-2 bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
            </div>

            {/* Top-Right Corner */}
            <div className="absolute top-4 right-4 w-4 h-4">
                <div className="absolute top-0 right-0 w-2 h-px bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
                <div className="absolute top-0 right-0 w-px h-2 bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
            </div>

            {/* Bottom-Left Corner */}
            <div className="absolute bottom-4 left-4 w-4 h-4">
                <div className="absolute bottom-0 left-0 w-2 h-px bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-px h-2 bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
            </div>

            {/* Bottom-Right Corner */}
            <div className="absolute bottom-4 right-4 w-4 h-4">
                <div className="absolute bottom-0 right-0 w-2 h-px bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-px h-2 bg-bs-border group-hover:bg-bs-brand group-hover:shadow-[0_0_8px_rgba(139,105,20,0.4)] dark:group-hover:shadow-[0_0_8px_rgba(212,165,74,0.4)] transition-all duration-300" />
            </div>
        </>
    );
};

export const WelcomeCard = ({ children, className = '' }: WelcomeCardProps) => {
    return (
        <motion.div
            className={`
                group relative
                min-h-0 sm:min-h-[400px]
                w-full max-w-[500px]
                rounded-lg
                bg-bs-card/80
                border border-bs-border
                hover:border-bs-brand/30
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]
                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)]
                transition-all duration-300
                p-5 sm:p-8
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

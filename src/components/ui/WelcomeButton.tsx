'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * WelcomeButton Component — Paper Texture UI
 *
 * Primary CTA button with warm brand styling.
 * Light: golden amber on cream
 * Dark (midnight): warm gold on deep navy
 */

interface WelcomeButtonProps {
    children: ReactNode;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export const WelcomeButton = ({
    children,
    onClick,
    className = '',
    disabled = false
}: WelcomeButtonProps) => {
    return (
        <motion.button
            className={`
                brand_button_primary
                px-8 py-4
                rounded-lg
                border-2
                bg-bs-brand
                border-bs-brand-secondary
                text-white
                dark:text-bs-bg
                font-semibold
                text-base
                inline-block
                text-center
                transition-all duration-300
                hover:shadow-[0_4px_16px_rgba(139,105,20,0.25)]
                dark:hover:shadow-[0_4px_16px_rgba(212,165,74,0.25)]
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer'}
                ${className}
            `}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.button>
    );
};

export default WelcomeButton;

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * WelcomeButton Component
 * 
 * PURPOSE:
 * Primary button component for the welcome screen with brand styling.
 * 
 * DESIGN FEATURES:
 * - Class name: "brand_button_primary"
 * - Background: #0A2260
 * - Stroke: #2651C2
 * - No hover effects (static styling)
 * - Rounded corners: none
 */

interface WelcomeButtonProps {
    children: ReactNode;
    onClick: () => void;
    className?: string;
}

export const WelcomeButton = ({ children, onClick, className = '' }: WelcomeButtonProps) => {
    return (
        <motion.button
            className={`
                brand_button_primary
                px-8 py-4
                rounded-none
                border-2
                bg-[#0A2260]
                border-[#2651C2]
                text-white
                font-semibold
                text-base
                cursor-pointer
                inline-block
                text-center
                transition-all duration-300
                ${className}
            `}
            onClick={onClick}
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

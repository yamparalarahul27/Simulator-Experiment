'use client';

import { ReactNode } from 'react';

/**
 * CardWithCornerShine Component
 * 
 * PURPOSE:
 * A premium dark-themed card component designed for the Deriverse trading platform.
 * Features glowing L-shaped corner brackets that animate on hover, creating a high-tech,
 * futuristic aesthetic suitable for financial dashboards and metric displays.
 * 
 * DESIGN PHILOSOPHY:
 * - Dark theme with semi-transparent backgrounds for layering
 * - Subtle corner accents that glow on interaction
 * - Smooth 300ms transitions for premium feel
 * - Highly configurable via TypeScript props
 * 
 * USAGE CONTEXT:
 * - Metric cards showing trading statistics
 * - Dashboard widgets displaying key performance indicators
 * - Interactive cards that trigger actions on click
 * - Content containers requiring visual emphasis
 * 
 * TECHNICAL NOTES:
 * - Uses Tailwind CSS v4 utility classes
 * - Client component ('use client') for hover interactions
 * - Group hover pattern for coordinated corner animations
 * - Z-index layering ensures content appears above decorative elements
 */

/**
 * Props interface for the CardWithCornerShine component
 */
export interface CardWithCornerShineProps {
    /** Content to be rendered inside the card */
    children: ReactNode;
    /** Additional CSS classes to extend styling */
    className?: string;
    /** Minimum height of the card (default: "min-h-[320px] sm:min-h-[340px]") */
    minHeight?: string;
    /** Whether to show shadow on hover (default: true) */
    showHoverShadow?: boolean;
    /** Padding size preset (default: 'md') */
    padding?: 'sm' | 'md' | 'lg';
    /** Background opacity percentage (default: 80) */
    bgOpacity?: number;
    /** Click handler to make the card interactive */
    onClick?: () => void;
}

/**
 * Internal component that renders the four corner accent brackets
 * Each corner has an L-shaped glow effect that activates on hover
 * 
 * STRUCTURE:
 * - 4 corners total (top-left, top-right, bottom-left, bottom-right)
 * - Each corner is a 16x16px container positioned absolutely
 * - Each corner contains 2 lines (horizontal and vertical) forming an L-shape
 * 
 * ANIMATION:
 * - Base state: white at 20% opacity
 * - Hover state: full white with soft glow shadow
 * - Transition: smooth 300ms duration
 * - Glow: shadow-[0_0_8px_rgba(255,255,255,0.6)]
 * 
 * POSITIONING:
 * - Inset 16px (4 in Tailwind units) from card edges
 * - Lines are 8px (w-2/h-2) long, 1px (w-px/h-px) thick
 */
const CornerAccents = () => {
    return (
        <>
            {/* Top-Left Corner: Horizontal line extending right, vertical line extending down */}
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

/**
 * CardWithCornerShine Component
 * 
 * A premium dark-themed card component with glowing corner accents and smooth hover effects.
 * Features customizable padding, background opacity, and optional click interactions.
 * 
 * @example
 * ```tsx
 * <CardWithCornerShine padding="lg" showHoverShadow>
 *   <h3 className="text-white/80 text-xs mb-2">METRIC</h3>
 *   <p className="text-blue-400 text-4xl font-mono">1,234</p>
 * </CardWithCornerShine>
 * ```
 */
export const CardWithCornerShine = ({
    children,
    className = '',
    minHeight = 'min-h-[320px] sm:min-h-[340px]',
    showHoverShadow = true,
    padding = 'md',
    bgOpacity = 0,
    onClick,
}: CardWithCornerShineProps) => {
    // Map padding preset to Tailwind classes
    const paddingClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    // Construct dynamic background opacity class
    const bgOpacityClass = `bg-black/${bgOpacity}`;

    // Build complete class string
    const containerClasses = [
        'group relative',
        minHeight,
        'rounded-[0px]',
        bgOpacityClass,
        'bg-black/10',
        'border border-white/10',
        'hover:border-white/20',
        showHoverShadow ? 'hover:shadow-lg hover:shadow-white/5' : '',
        'transition-all duration-300',
        onClick ? 'cursor-pointer' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClasses} onClick={onClick}>
            {/* Corner Accent Brackets */}
            <CornerAccents />

            {/* Card Content */}
            <div className={`relative z-10 ${paddingClasses[padding]}`}>
                {children}
            </div>
        </div>
    );
};

export default CardWithCornerShine;

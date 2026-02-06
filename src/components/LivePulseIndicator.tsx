'use client';

import { ReactNode } from 'react';

/**
 * LivePulseIndicator Component
 * 
 * PURPOSE:
 * An animated status indicator with a pulsing "ping" animation and a solid glowing dot.
 * Designed for showing live connection status, network indicators, or real-time activity.
 * Perfect for trading platforms, dashboards, and applications requiring visual status feedback.
 * 
 * DESIGN PHILOSOPHY:
 * - Two-layer design: expanding ping circle + solid glowing core
 * - Smooth, continuous animation for "live" feeling
 * - Color-coded variants for different status types
 * - Customizable glow effects for premium aesthetics
 * 
 * USAGE CONTEXT:
 * - Network status indicators (devnet/mainnet)
 * - Live data feed status
 * - Connection status badges
 * - Real-time activity indicators
 * 
 * TECHNICAL NOTES:
 * - Uses Tailwind's built-in animate-ping for the outer layer
 * - Absolute positioning for perfect layer alignment
 * - Custom shadow values for glow effects
 * - No external dependencies
 */

/**
 * Props interface for LivePulseIndicator component
 */
export interface LivePulseIndicatorProps {
    /** Color variant for predefined status types (default: 'info') */
    variant?: 'devnet' | 'mainnet' | 'success' | 'warning' | 'danger' | 'info';
    /** Size preset (default: 'md') */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Custom background color class (overrides variant) */
    customColor?: string;
    /** Custom glow shadow value (overrides variant) */
    customGlow?: string;
    /** Disable ping animation (default: false) */
    noPing?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * LivePulseIndicator Component
 * 
 * @example
 * ```tsx
 * // Basic usage with variant
 * <LivePulseIndicator variant="devnet" />
 * 
 * // Large size with custom color
 * <LivePulseIndicator size="lg" customColor="bg-purple-500" customGlow="0_0_12px_rgba(168,85,247,0.8)" />
 * 
 * // Without ping animation
 * <LivePulseIndicator variant="success" noPing />
 * ```
 */
export const LivePulseIndicator = ({
    variant = 'info',
    size = 'md',
    customColor,
    customGlow,
    noPing = false,
    className = '',
}: LivePulseIndicatorProps) => {
    // Size mappings for container and dot
    const sizeClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    };

    // Variant color and glow mappings
    const variantStyles = {
        devnet: {
            color: 'bg-emerald-400',
            glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        },
        mainnet: {
            color: 'bg-blue-400',
            glow: 'shadow-[0_0_8px_rgba(59,130,246,0.6)]',
        },
        success: {
            color: 'bg-green-400',
            glow: 'shadow-[0_0_8px_rgba(74,222,128,0.6)]',
        },
        warning: {
            color: 'bg-yellow-400',
            glow: 'shadow-[0_0_8px_rgba(250,204,21,0.6)]',
        },
        danger: {
            color: 'bg-red-400',
            glow: 'shadow-[0_0_8px_rgba(248,113,113,0.6)]',
        },
        info: {
            color: 'bg-cyan-400',
            glow: 'shadow-[0_0_8px_rgba(34,211,238,0.6)]',
        },
    };

    // Use custom or variant-based styles
    const bgColor = customColor || variantStyles[variant].color;
    const glowShadow = customGlow || variantStyles[variant].glow;

    return (
        <span className={`relative inline-flex ${sizeClasses[size]} ${className}`}>
            {/* Ping animation layer (expanding circle) */}
            {!noPing && (
                <span
                    className={`absolute inline-flex h-full w-full rounded-full ${bgColor} opacity-75 animate-ping`}
                />
            )}

            {/* Solid glowing dot */}
            <span
                className={`relative inline-flex rounded-full ${sizeClasses[size]} ${bgColor} ${glowShadow}`}
            />
        </span>
    );
};

/**
 * Props interface for LivePulseIndicatorWithLabel component
 */
export interface LivePulseIndicatorWithLabelProps extends LivePulseIndicatorProps {
    /** Label text to display next to the indicator */
    label: ReactNode;
    /** Position of label relative to indicator (default: 'right') */
    labelPosition?: 'left' | 'right';
    /** Gap between indicator and label (default: '2') */
    gap?: '1' | '2' | '3' | '4';
}

/**
 * LivePulseIndicatorWithLabel Component
 * 
 * Enhanced version of LivePulseIndicator with an accompanying text label.
 * 
 * @example
 * ```tsx
 * <LivePulseIndicatorWithLabel variant="devnet" label="Devnet" />
 * <LivePulseIndicatorWithLabel variant="mainnet" label="Connected" labelPosition="left" />
 * ```
 */
export const LivePulseIndicatorWithLabel = ({
    label,
    labelPosition = 'right',
    gap = '2',
    ...indicatorProps
}: LivePulseIndicatorWithLabelProps) => {
    const gapClass = `gap-${gap}`;
    const flexDirection = labelPosition === 'left' ? 'flex-row-reverse' : 'flex-row';

    return (
        <span className={`inline-flex items-center ${flexDirection} ${gapClass}`}>
            <LivePulseIndicator {...indicatorProps} />
            <span>{label}</span>
        </span>
    );
};

export default LivePulseIndicator;

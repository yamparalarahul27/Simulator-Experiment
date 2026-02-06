'use client';

/**
 * HamburgerButton Component
 * 
 * PURPOSE:
 * An animated hamburger menu button that transforms into an X icon when toggled.
 * Provides smooth transitions and clear visual feedback for mobile navigation states.
 * Essential for responsive navigation patterns in modern web applications.
 * 
 * DESIGN PHILOSOPHY:
 * - Clean three-bar design that's universally recognized
 * - Smooth 300ms transitions for all state changes
 * - X-shape rotation feels natural and intuitive
 * - Accessible with proper ARIA attributes
 * 
 * USAGE CONTEXT:
 * - Mobile navigation toggles
 * - Collapsible menu controls
 * - Responsive header components
 * - Sidebar toggles
 * 
 * TECHNICAL NOTES:
 * - Three <span> elements representing the bars
 * - CSS transforms for rotation and translation
 * - Middle bar fades out using opacity + scale
 * - Top/bottom bars rotate ±45deg to form X
 * - Origin-center ensures smooth rotation pivot
 */

/**
 * Props interface for HamburgerButton component
 */
export interface HamburgerButtonProps {
    /** Current open/closed state */
    isOpen: boolean;
    /** Click handler for toggle action */
    onClick: () => void;
    /** Size preset (default: 'md') */
    size?: 'sm' | 'md' | 'lg';
    /** Predefined color preset (default: 'white') */
    color?: 'white' | 'black' | 'gray' | 'custom';
    /** Custom color class when color='custom' */
    customColorClass?: string;
    /** Additional CSS classes for container */
    className?: string;
    /** Accessible label for screen readers (default: 'Toggle menu') */
    ariaLabel?: string;
    /** ID of the menu element this button controls */
    ariaControls?: string;
}

/**
 * HamburgerButton Component
 * 
 * Animated hamburger menu icon that transforms into an X when toggled.
 * Fully accessible with ARIA attributes and keyboard support.
 * 
 * ANIMATION STATES:
 * - Closed (Hamburger):
 *   - Three horizontal bars with equal spacing
 * - Open (X shape):
 *   - Top bar: rotates 45deg and translates down
 *   - Middle bar: fades out (opacity-0, scale-0)
 *   - Bottom bar: rotates -45deg and translates up
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <HamburgerButton 
 *   isOpen={isOpen} 
 *   onClick={() => setIsOpen(!isOpen)}
 *   size="md"
 *   ariaControls="mobile-menu"
 * />
 * ```
 */
export const HamburgerButton = ({
    isOpen,
    onClick,
    size = 'md',
    color = 'white',
    customColorClass,
    className = '',
    ariaLabel = 'Toggle menu',
    ariaControls,
}: HamburgerButtonProps) => {
    // Size configurations: [containerWidth, containerHeight, barHeight, translateY]
    const sizeConfigs = {
        sm: {
            container: 'w-4 h-3',
            barHeight: 'h-0.5',
            translate: '4px',
        },
        md: {
            container: 'w-5 h-4',
            barHeight: 'h-0.5',
            translate: '7px',
        },
        lg: {
            container: 'w-6 h-5',
            barHeight: 'h-1',
            translate: '8px',
        },
    };

    // Color mappings
    const colorClasses = {
        white: 'bg-white',
        black: 'bg-black',
        gray: 'bg-gray-400',
        custom: customColorClass || 'bg-white',
    };

    const config = sizeConfigs[size];
    const barColor = colorClasses[color];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${className}`}
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-controls={ariaControls}
        >
            {/* Container for the three bars */}
            <div className={`${config.container} flex flex-col justify-between relative`}>
                {/* Top bar - rotates 45deg and moves down when open */}
                <span
                    className={`w-full ${config.barHeight} ${barColor} rounded-full transition-all duration-300 origin-center ${isOpen ? `rotate-45 translate-y-[${config.translate}]` : ''
                        }`}
                    style={isOpen ? { transform: `rotate(45deg) translateY(${config.translate})` } : {}}
                />

                {/* Middle bar - fades out when open */}
                <span
                    className={`w-full ${config.barHeight} ${barColor} rounded-full transition-all duration-300 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                        }`}
                />

                {/* Bottom bar - rotates -45deg and moves up when open */}
                <span
                    className={`w-full ${config.barHeight} ${barColor} rounded-full transition-all duration-300 origin-center ${isOpen ? `-rotate-45 -translate-y-[${config.translate}]` : ''
                        }`}
                    style={isOpen ? { transform: `rotate(-45deg) translateY(-${config.translate})` } : {}}
                />
            </div>
        </button>
    );
};

export default HamburgerButton;

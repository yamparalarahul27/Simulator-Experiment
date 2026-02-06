'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { LivePulseIndicator } from './LivePulseIndicator';
import { HamburgerButton } from './HamburgerButton';

/**
 * GlassmorphismNavbar Component
 * 
 * PURPOSE:
 * A premium glassmorphism navigation bar with desktop/mobile responsive layouts.
 * Features a frosted-glass effect with backdrop blur, network status indicator,
 * dropdown menus, and a full-screen mobile navigation overlay.
 * Perfect for modern trading platforms, dashboards, and web applications.
 * 
 * DESIGN PHILOSOPHY:
 * - Glassmorphism aesthetic: semi-transparent with backdrop blur
 * - Mobile-first responsive design
 * - Smooth transitions and animations (300ms)
 * - Network status integration with LivePulseIndicator
 * - Accessibility-first with ARIA attributes
 * 
 * USAGE CONTEXT:
 * - Trading platform navigation
 * - Dashboard header bars
 * - Multi-network web3 applications
 * - Admin panels and control interfaces
 * 
 * TECHNICAL NOTES:
 * - Uses Tailwind's backdrop-blur-xl for glass effect
 * - Fixed positioning with z-50 for always-visible navigation
 * - Mobile menu prevents body scroll when open
 * - Dropdown closes on outside click (useRef + useEffect)
 * - Layout shift prevention with fixed-width network selector
 */

/**
 * Navigation item interface
 */
export interface NavItem {
    /** Display title */
    title: string;
    /** Navigation path */
    href: string;
    /** Category for organization (default: 'main') */
    category?: 'main' | 'dropdown' | 'info';
    /** Optional click handler for SPA navigation */
    onClick?: (e: React.MouseEvent) => void;
}

/**
 * Network status configuration
 */
export interface NetworkStatus {
    /** Network display name */
    name: string;
    /** Network variant for LivePulseIndicator */
    variant: 'devnet' | 'mainnet';
    /** Whether network is active/connected */
    isActive: boolean;
}

/**
 * Props interface for GlassmorphismNavbar component
 */
export interface GlassmorphismNavbarProps {
    /** Logo element (ReactNode or image URL string) */
    logo: ReactNode | string;
    /** Logo link destination (default: '/') */
    logoHref?: string;
    /** Array of navigation items */
    navItems: NavItem[];
    /** Currently active path for highlighting */
    activePath?: string;
    /** Network status configuration */
    networkStatus?: NetworkStatus;
    /** Title for dropdown section (default: 'More') */
    dropdownTitle?: string;
    /** Callback when network is changed */
    onNetworkChange?: (network: 'devnet' | 'mainnet') => void;
    /** Additional CSS classes for nav container */
    className?: string;
}

/**
 * GlassmorphismNavbar Component
 * 
 * A complete responsive navigation bar with glassmorphism styling,
 * network status indicator, and mobile menu overlay.
 * 
 * FEATURES:
 * - Desktop: Horizontal nav with hover dropdown
 * - Mobile: Full-screen overlay with categorized sections
 * - Network selector with visual indicators
 * - Glassmorphism: bg-black/80 + backdrop-blur-xl
 * - Auto-close mobile menu on route change
 * - Prevents body scroll when mobile menu open
 * 
 * @example
 * ```tsx
 * const navItems = [
 *   { title: 'Dashboard', href: '/', category: 'main' },
 *   { title: 'Trade', href: '/trade', category: 'main' },
 *   { title: 'Analytics', href: '/analytics', category: 'dropdown' },
 *   { title: 'Docs', href: '/docs', category: 'info' },
 * ];
 * 
 * <GlassmorphismNavbar
 *   logo={<img src="/logo.svg" alt="App" />}
 *   navItems={navItems}
 *   activePath="/dashboard"
 *   networkStatus={{ name: 'Devnet', variant: 'devnet', isActive: true }}
 *   onNetworkChange={(network) => console.log('Switched to:', network)}
 * />
 * ```
 */
export const GlassmorphismNavbar = ({
    logo,
    logoHref = '/',
    navItems,
    activePath = '',
    networkStatus,
    dropdownTitle = 'More',
    onNetworkChange,
    className = '',
}: GlassmorphismNavbarProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const networkDropdownRef = useRef<HTMLDivElement>(null);

    // Categorize nav items
    const mainItems = navItems.filter((item) => item.category === 'main' || !item.category);
    const dropdownItems = navItems.filter((item) => item.category === 'dropdown');
    const infoItems = navItems.filter((item) => item.category === 'info');

    // Close mobile menu when path changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activePath]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
                setIsNetworkDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render logo (ReactNode or image URL)
    const renderLogo = () => {
        if (typeof logo === 'string') {
            return <img src={logo} alt="Logo" className="h-6 sm:h-7 w-auto" />;
        }
        return logo;
    };

    // Check if a nav item is active
    const isActive = (href: string) => activePath === href;

    // Network change handler
    const handleNetworkChange = (network: 'devnet' | 'mainnet') => {
        setIsNetworkDropdownOpen(false);
        onNetworkChange?.(network);
    };

    return (
        <>
            {/* Fixed navigation bar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
                <div className="px-3 sm:px-6 py-2 sm:py-3">
                    {/* Glassmorphism container */}
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-2xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <a href={logoHref} className="flex-shrink-0">
                                {renderLogo()}
                            </a>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                                {/* Main navigation items */}
                                {mainItems.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) => {
                                            if (item.onClick) {
                                                e.preventDefault();
                                                item.onClick(e);
                                            }
                                        }}
                                        className={`px-3 xl:px-4 py-1.5 xl:py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 ${isActive(item.href)
                                            ? 'text-white bg-white/10'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {item.title}
                                    </a>
                                ))}

                                {/* Dropdown menu (desktop) */}
                                {dropdownItems.length > 0 && (
                                    <div
                                        ref={dropdownRef}
                                        className="relative"
                                        onMouseEnter={() => setIsDropdownOpen(true)}
                                        onMouseLeave={() => setIsDropdownOpen(false)}
                                    >
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="px-3 xl:px-4 py-1.5 xl:py-2 rounded-lg text-sm xl:text-base font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center gap-1"
                                        >
                                            {dropdownTitle}
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown panel */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full right-0 pt-2 min-w-[200px]">
                                                <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                                    {dropdownItems.map((item) => (
                                                        <a
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={(e) => {
                                                                if (item.onClick) {
                                                                    e.preventDefault();
                                                                    item.onClick(e);
                                                                    setIsDropdownOpen(false);
                                                                }
                                                            }}
                                                            className={`block px-4 py-2.5 text-sm transition-colors ${isActive(item.href)
                                                                ? 'text-white bg-white/10'
                                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {item.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info items */}
                                {infoItems.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) => {
                                            if (item.onClick) {
                                                e.preventDefault();
                                                item.onClick(e);
                                            }
                                        }}
                                        className={`px-3 xl:px-4 py-1.5 xl:py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 ${isActive(item.href)
                                            ? 'text-white bg-white/10'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {item.title}
                                    </a>
                                ))}
                            </div>

                            {/* Right side: Network status + Hamburger */}
                            <div className="flex items-center gap-2">
                                {/* Network status selector (hidden on mobile) */}
                                {networkStatus && (
                                    <div className="hidden sm:block relative">
                                        <div
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 transition-all duration-300 cursor-default"
                                        >
                                            <LivePulseIndicator
                                                variant={networkStatus.variant}
                                                size="sm"
                                                noPing={!networkStatus.isActive}
                                            />
                                            <span className="text-sm text-white/80 font-medium text-left">
                                                {networkStatus.name}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Hamburger button (mobile only) */}
                                <div className="lg:hidden">
                                    <HamburgerButton
                                        isOpen={isMobileMenuOpen}
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        size="md"
                                        ariaControls="mobile-menu"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile menu overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Menu panel */}
                    <div className="absolute top-14 bottom-4 left-3 right-3 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top duration-300">
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Network selector (mobile) */}
                            {networkStatus && (
                                <div className="pb-4 border-b border-white/10">
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Network</p>
                                    <button
                                        onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <LivePulseIndicator
                                                variant={networkStatus.variant}
                                                size="md"
                                                noPing={!networkStatus.isActive}
                                            />
                                            <span className="text-white font-medium">{networkStatus.name}</span>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-white/60 transition-transform duration-300 ${isNetworkDropdownOpen ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isNetworkDropdownOpen && (
                                        <div className="mt-2 space-y-1">
                                            <button
                                                onClick={() => handleNetworkChange('devnet')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                <LivePulseIndicator variant="devnet" size="sm" />
                                                <span>Devnet</span>
                                            </button>
                                            <button
                                                onClick={() => handleNetworkChange('mainnet')}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                <LivePulseIndicator variant="mainnet" size="sm" />
                                                <span>Mainnet</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Main navigation */}
                            {mainItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Main</p>
                                    <div className="space-y-1">
                                        {mainItems.map((item) => (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                        setIsMobileMenuOpen(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href)
                                                    ? 'text-white bg-white/10'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-white/20'}`} />
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dropdown items */}
                            {dropdownItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">{dropdownTitle}</p>
                                    <div className="space-y-1">
                                        {dropdownItems.map((item) => (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                        setIsMobileMenuOpen(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href)
                                                    ? 'text-white bg-white/10'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-white/20'}`} />
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info items */}
                            {infoItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Information</p>
                                    <div className="space-y-1">
                                        {infoItems.map((item) => (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                        setIsMobileMenuOpen(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href)
                                                    ? 'text-white bg-white/10'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-white/20'}`} />
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlassmorphismNavbar;

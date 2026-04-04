'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { LivePulseIndicator } from '../ui/LivePulseIndicator';
import { HamburgerButton } from './HamburgerButton';
import ThemeToggle from '../ui/ThemeToggle';

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
    variant: 'devnet' | 'mainnet' | 'mock';
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
    /** Optional handler when logo is clicked */
    onLogoClick?: () => void;
    /** Array of navigation items */
    navItems: NavItem[];
    /** Currently active path for highlighting */
    activePath?: string;
    /** Network status configuration */
    networkStatus?: NetworkStatus;
    /** Title for dropdown section (default: 'More') */
    dropdownTitle?: string;
    /** Callback when network is changed */
    onNetworkChange?: (network: 'devnet' | 'mainnet' | 'mock') => void;
    /** Callback for Profile & Settings button click */
    onProfileSettingsClick?: () => void;
    /** Callback for Exchange Manager click */
    onExchangeManagerClick?: () => void;
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
 * - Glassmorphism: bg-bs-bg/80 + backdrop-blur-xl
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
    onLogoClick,
    navItems,
    activePath = '',
    networkStatus,
    dropdownTitle = 'More',
    onNetworkChange,
    onProfileSettingsClick,
    onExchangeManagerClick,
    className = '',
}: GlassmorphismNavbarProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const networkDropdownRef = useRef<HTMLDivElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    // Categorize nav items
    const mainItems = navItems.filter((item) => item.category === 'main' || !item.category);
    const dropdownItems = navItems.filter((item) => item.category === 'dropdown');
    const infoItems = navItems.filter((item) => item.category === 'info');

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
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
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
    const handleNetworkChange = (network: 'devnet' | 'mainnet' | 'mock') => {
        setIsNetworkDropdownOpen(false);
        onNetworkChange?.(network);
    };

    // Helper for status text color
    const getStatusColor = (variant: string) => {
        switch (variant) {
            case 'mainnet': return 'text-bs-brand-ts';
            case 'mock': return 'text-bs-warning';
            case 'devnet':
            default: return 'text-bs-success';
        }
    };

    return (
        <>
            {/* Fixed navigation bar */}
            <nav className={`fixed left-0 right-0 top-3 z-50 ${className}`}>
                <div className="px-3 py-2 sm:px-6 sm:py-3">
                    {/* Navigation container */}
                    <div className="mx-auto max-w-6xl rounded-2xl border border-bs-border bg-bs-card/95 px-3 py-2 sm:px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <Link
                                href={logoHref}
                                onClick={(event) => {
                                    if (onLogoClick) {
                                        event.preventDefault();
                                        onLogoClick();
                                    }
                                }}
                                className="flex-shrink-0"
                            >
                                {renderLogo()}
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden items-center gap-1 lg:flex">
                                {/* Main navigation items */}
                                {mainItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) => {
                                            if (item.onClick) {
                                                e.preventDefault();
                                                item.onClick(e);
                                            }
                                        }}
                                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:px-4 ${isActive(item.href)
                                            ? 'bg-bs-card-fg text-bs-text-primary'
                                            : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                            }`}
                                    >
                                        {item.title}
                                    </Link>
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
                                            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-bs-text-tertiary transition-colors hover:bg-bs-card-fg hover:text-bs-text-primary xl:px-4"
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
                                            <div className="absolute right-0 top-full min-w-[200px] pt-2">
                                                <div className="overflow-hidden rounded-xl border border-bs-border bg-bs-card shadow-lg">
                                                    {dropdownItems.map((item) => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={(e) => {
                                                                if (item.onClick) {
                                                                    e.preventDefault();
                                                                    item.onClick(e);
                                                                }
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className={`block px-4 py-2.5 text-sm transition-colors ${isActive(item.href)
                                                                ? 'bg-bs-card-fg text-bs-text-primary'
                                                                : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                                }`}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info items */}
                                {infoItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) => {
                                            if (item.onClick) {
                                                e.preventDefault();
                                                item.onClick(e);
                                            }
                                        }}
                                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:px-4 ${isActive(item.href)
                                            ? 'bg-bs-card-fg text-bs-text-primary'
                                            : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                            }`}
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>

                            {/* Right side: Network status + Settings + Hamburger */}
                            <div className="flex items-center gap-2">
                                {/* Network status selector — temporarily hidden
                                {networkStatus && (
                                    <div className="hidden sm:block relative" ref={networkDropdownRef}>
                                        <button
                                            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-bs-border bg-bs-card px-3 py-1.5 transition-colors hover:bg-bs-card-fg"
                                        >
                                            <LivePulseIndicator
                                                variant={networkStatus.variant}
                                                size="sm"
                                                noPing={!networkStatus.isActive}
                                            />
                                            <span className={`text-sm ${getStatusColor(networkStatus.variant)} font-medium text-left uppercase`}>
                                                {networkStatus.name}
                                            </span>
                                            <svg
                                                className={`w-3 h-3 text-bs-text-mute transition-transform duration-300 ${isNetworkDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {isNetworkDropdownOpen && (
                                            <div className="absolute right-0 top-full min-w-[200px] pt-2">
                                                <div className="overflow-hidden rounded-xl border border-bs-border bg-bs-card shadow-lg">
                                                    <button
                                                        onClick={() => handleNetworkChange('mock')}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${networkStatus.variant === 'mock'
                                                            ? 'bg-bs-card-fg text-bs-text-primary'
                                                            : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                            }`}
                                                    >
                                                        <LivePulseIndicator variant="mock" size="sm" />
                                                        <span>On Mock Data</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleNetworkChange('devnet')}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${networkStatus.variant === 'devnet'
                                                            ? 'bg-bs-card-fg text-bs-text-primary'
                                                            : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                            }`}
                                                    >
                                                        <LivePulseIndicator variant="devnet" size="sm" />
                                                        <span>On Devnet</span>
                                                    </button>
                                                    <div
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-bs-text-mute cursor-not-allowed`}
                                                    >
                                                        <LivePulseIndicator variant="mainnet" size="sm" />
                                                        <span>On Mainnet (Coming Soon)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                */}

                                {/* Theme toggle — temporarily disabled while focusing on light theme
                                <div className="hidden sm:block">
                                    <ThemeToggle />
                                </div>
                                */}

                                {/* Profile dropdown — temporarily disabled, direct link instead */}
                                <div className="hidden sm:block">
                                    <Link
                                        href="/profile-settings"
                                        onClick={() => onProfileSettingsClick?.()}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-bs-border bg-bs-card-fg"
                                        aria-label="Profile &amp; Settings"
                                    >
                                        <img src="/assets/Profile_icon.png" alt="Profile &amp; Settings" className="h-5 w-5 opacity-85" />
                                    </Link>
                                </div>
                                {/* Original profile dropdown with Exchange Manager:
                                <div
                                    className="hidden sm:block relative"
                                    ref={profileDropdownRef}
                                    onMouseEnter={() => setIsProfileDropdownOpen(true)}
                                    onMouseLeave={() => setIsProfileDropdownOpen(false)}
                                >
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-bs-border bg-bs-card-fg"
                                        aria-label="Profile Options"
                                    >
                                        <img src="/assets/Profile_icon.png" alt="Profile &amp; Settings" className="h-5 w-5 opacity-85" />
                                    </button>

                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 top-full min-w-[200px] pt-2">
                                            <div className="flex flex-col overflow-hidden rounded-xl border border-bs-border bg-bs-card shadow-lg">
                                                <Link
                                                    href="/profile-settings"
                                                    onClick={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        onProfileSettingsClick?.();
                                                    }}
                                                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${activePath === '/profile-settings' ? 'bg-bs-card-fg text-bs-text-primary' : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'}`}
                                                >
                                                    Profile &amp; Settings
                                                </Link>
                                                <Link
                                                    href="/exchange-manager"
                                                    onClick={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        onExchangeManagerClick?.();
                                                    }}
                                                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${activePath === '/exchange-manager' ? 'bg-bs-card-fg text-bs-text-primary' : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'}`}
                                                >
                                                    Exchange Manager
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                */}

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
                    <div className="absolute inset-0 bg-black/55" onClick={() => setIsMobileMenuOpen(false)} />

                    {/* Menu panel */}
                    <div className="absolute bottom-4 left-3 right-3 top-24 flex flex-col overflow-hidden rounded-2xl border border-bs-border bg-bs-card shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.1)]">
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Main navigation */}
                            {mainItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-3">Main</p>
                                    <div className="space-y-1">
                                        {mainItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                    }
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                                                    ? 'bg-bs-card-fg text-bs-text-primary'
                                                    : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-bs-border'}`} />
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dropdown items */}
                            {dropdownItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-3">{dropdownTitle}</p>
                                    <div className="space-y-1">
                                        {dropdownItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                    }
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                                                    ? 'bg-bs-card-fg text-bs-text-primary'
                                                    : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-bs-border'}`} />
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info items */}
                            {infoItems.length > 0 && (
                                <div>
                                    <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-3">Information</p>
                                    <div className="space-y-1">
                                        {infoItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={(e) => {
                                                    if (item.onClick) {
                                                        e.preventDefault();
                                                        item.onClick(e);
                                                    }
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href)
                                                    ? 'bg-bs-card-fg text-bs-text-primary'
                                                    : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive(item.href) ? 'bg-white' : 'bg-bs-border'}`} />
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mobile specific extra items */}
                            <div>
                                <p className="text-xs text-bs-text-mute uppercase tracking-wider mb-3">Settings</p>
                                <div className="space-y-1">
                                    <Link
                                        href="/profile-settings"
                                        onClick={() => {
                                            onProfileSettingsClick?.();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${activePath === '/profile-settings' ? 'bg-bs-card-fg text-bs-text-primary' : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${activePath === '/profile-settings' ? 'bg-white' : 'bg-bs-border'}`} />
                                        Profile &amp; Settings
                                    </Link>
                                    {/* Exchange Manager — temporarily disabled
                                    <Link
                                        href="/exchange-manager"
                                        onClick={() => {
                                            onExchangeManagerClick?.();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${activePath === '/exchange-manager' ? 'bg-bs-card-fg text-bs-text-primary' : 'text-bs-text-tertiary hover:bg-bs-card-fg hover:text-bs-text-primary'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${activePath === '/exchange-manager' ? 'bg-white' : 'bg-bs-border'}`} />
                                        Exchange Manager
                                    </Link>
                                    */}
                                    {/* Theme toggle — temporarily disabled
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <ThemeToggle />
                                        <span className="text-bs-text-tertiary text-sm">Theme</span>
                                    </div>
                                    */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlassmorphismNavbar;

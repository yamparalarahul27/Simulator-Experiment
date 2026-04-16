'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';

const NAV_ITEMS: NavItem[] = [
    { title: 'Learn', href: '/lessons', category: 'main' },
    { title: 'Simulator', href: '/simulator', category: 'main' },
    // { title: 'Perks', href: '/perks', category: 'main' },
    { title: 'Changelog', href: '/changelog', category: 'main' },
    // { title: 'Help', href: '/help', category: 'main' },
    { title: 'About', href: '/about', category: 'main' },
    // { title: 'Roadmap', href: '/roadmap', category: 'dropdown' },
    // { title: 'Exchange Manager', href: '/exchange-manager', category: 'dropdown' },
];

function getNetworkName(net: 'devnet' | 'mainnet' | 'mock') {
    switch (net) {
        case 'mainnet': return 'On Mainnet';
        case 'devnet': return 'On Devnet';
        default: return 'On Mock Data';
    }
}

/**
 * Resolve the activePath for the navbar based on current pathname.
 * Maps sub-routes to their parent nav item.
 */
function resolveActivePath(pathname: string): string {
    if (pathname === '/' || pathname.startsWith('/lessons')) return '/lessons';
    if (pathname.startsWith('/simulator')) return '/simulator';
    if (pathname.startsWith('/perks')) return '/perks';
    if (pathname.startsWith('/help')) return '/help';
    if (pathname.startsWith('/about')) return '/about';
    if (pathname.startsWith('/roadmap')) return '/roadmap';
    if (pathname.startsWith('/exchange-manager')) return '/exchange-manager';
    if (pathname.startsWith('/profile-settings')) return '/profile-settings';
    if (pathname.startsWith('/challenges')) return '/challenges';
    return pathname;
}

export default function RouteBasedNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');

    const activePath = resolveActivePath(pathname);

    const navLogo = (
        <div
            aria-label="YDEX"
            className="h-6 sm:h-7"
            style={{
                aspectRatio: '627 / 235',
                backgroundColor: 'var(--bs-text-primary)',
                maskImage: 'url(/assets/LogoPath.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/LogoPath.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
            }}
        />
    );

    return (
        <GlassmorphismNavbar
            logo={navLogo}
            navItems={NAV_ITEMS}
            activePath={activePath}
            networkStatus={{
                name: getNetworkName(network),
                variant: network,
                isActive: true,
            }}
            onNetworkChange={setNetwork}
            onProfileSettingsClick={() => router.push('/profile-settings')}
            onExchangeManagerClick={() => router.push('/exchange-manager')}
            onLogoClick={() => router.push('/lessons')}
            className="mb-4"
        />
    );
}

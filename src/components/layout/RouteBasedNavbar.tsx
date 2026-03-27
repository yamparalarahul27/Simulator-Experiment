'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import { useRouter } from '@/i18n/navigation';

const NAV_ITEMS: NavItem[] = [
    { title: 'Learn', href: '/', category: 'main' },
    { title: 'About', href: '/about', category: 'dropdown' },
    { title: 'Help', href: '/help', category: 'dropdown' },
    { title: 'Roadmap', href: '/roadmap', category: 'dropdown' },
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
 * Lessons and sub-routes highlight "Learn" (/).
 */
function resolveActivePath(pathname: string): string {
    if (pathname === '/' || pathname.startsWith('/lessons')) return '/';
    if (pathname.startsWith('/about')) return '/about';
    if (pathname.startsWith('/help')) return '/help';
    if (pathname.startsWith('/roadmap')) return '/roadmap';
    if (pathname.startsWith('/profile-settings')) return '/profile-settings';
    if (pathname.startsWith('/exchange-manager')) return '/exchange-manager';
    return pathname;
}

export default function RouteBasedNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');

    const activePath = resolveActivePath(pathname);

    return (
        <GlassmorphismNavbar
            logo="/Logo.png"
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
            onLogoClick={() => router.push('/')}
            className="mb-8"
        />
    );
}

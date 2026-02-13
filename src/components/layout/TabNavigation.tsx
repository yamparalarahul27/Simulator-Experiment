'use client';

import { useEffect, useState } from 'react';
import TradeHistory from '../features/TradeHistory';
import Home from '../features/Home';
import Journal from '../features/Journal';
import Settings from '../features/Settings';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import Footer from './Footer';

export type TabType = 'dashboard' | 'lookup' | 'journal' | 'appdocs' | 'help' | 'roadmap' | 'settings';

export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        if (typeof window === 'undefined') return 'dashboard';
        const persisted = window.localStorage.getItem('deriverse.activeTab') as TabType | null;
        return persisted ?? 'dashboard';
    });
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleExternalTabChange = (event: Event) => {
            const nextTab = (event as CustomEvent<TabType>).detail;
            if (nextTab) {
                setActiveTab(nextTab);
            }
        };

        window.addEventListener('deriverse:set-active-tab', handleExternalTabChange as EventListener);
        return () => {
            window.removeEventListener('deriverse:set-active-tab', handleExternalTabChange as EventListener);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('deriverse.activeTab', activeTab);
    }, [activeTab]);

    // Clean navigation items configuration
    const navItems: NavItem[] = [
        {
            title: 'Analytics',
            href: '#dashboard',
            category: 'main',
            onClick: () => setActiveTab('dashboard')
        },
        {
            title: 'Journal',
            href: '#journal',
            category: 'main',
            onClick: () => setActiveTab('journal')
        },
        {
            title: 'Wallet(s)',
            href: '#lookup',
            category: 'main',
            onClick: () => setActiveTab('lookup')
        },
        {
            title: 'About',
            href: '#appdocs',
            category: 'dropdown',
            onClick: () => setActiveTab('appdocs')
        },
        {
            title: 'Help',
            href: '#help',
            category: 'dropdown',
            onClick: () => setActiveTab('help')
        },
        {
            title: 'Roadmap',
            href: '#roadmap',
            category: 'dropdown',
            onClick: () => setActiveTab('roadmap')
        },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Home />;
            case 'lookup':
                return <TradeHistory />;
            case 'journal':
                return <Journal />;
            case 'appdocs':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-white">About</h1>
                    </div>
                );
            case 'help':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-white">Help Center</h1>
                    </div>
                );
            case 'roadmap':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-white">Roadmap</h1>
                    </div>
                );
            case 'settings':
                return <Settings />;
            default:
                return null;
        }
    };

    const getNetworkName = (net: 'devnet' | 'mainnet' | 'mock') => {
        switch (net) {
            case 'mainnet': return 'On Mainnet';
            case 'devnet': return 'On Devnet';
            default: return 'On Mock Data';
        }
    };

    return (
        <div className="min-h-screen text-white">
            {/* New Glassmorphism Navigation */}
            <GlassmorphismNavbar
                logo="/assets/Deriverse_Journal_Logo.png"
                navItems={navItems}
                activePath={`#${activeTab}`}
                networkStatus={{
                    name: getNetworkName(network),
                    variant: network,
                    isActive: true
                }}
                onNetworkChange={setNetwork}
                onSettingsClick={() => setActiveTab('settings')}
                className="mb-8"
            />

            {/* Content Area - Padding top added to account for fixed navbar */}
            <div className="pt-24 p-4 max-w-7xl mx-auto">
                {renderTabContent()}

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}

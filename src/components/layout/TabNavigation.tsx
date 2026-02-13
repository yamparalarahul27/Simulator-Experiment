'use client';

import { useEffect, useState } from 'react';
import TradeHistory from '../features/TradeHistory';
import Home from '../features/Home';
import Journal from '../features/Journal';
import ProfileSettings from '../features/ProfileSettings';
import AboutScreen from '../features/AboutScreen';
import HelpScreen from '../features/HelpScreen';
import RoadmapScreen from '../features/RoadmapScreen';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import Footer from './Footer';

export type TabType = 'dashboard' | 'lookup' | 'journal' | 'appdocs' | 'help' | 'roadmap' | 'profile-settings';

const DEFAULT_TAB: TabType = 'dashboard';
const PERSISTABLE_TABS: TabType[] = ['dashboard', 'lookup', 'journal', 'appdocs', 'help', 'roadmap', 'profile-settings'];

export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_TAB);
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');
    const [analyzingWallet, setAnalyzingWallet] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const persistedRaw = window.localStorage.getItem('deriverse.activeTab');
        const migrated = persistedRaw === 'settings' ? 'profile-settings' : persistedRaw;
        if (migrated && (PERSISTABLE_TABS as string[]).includes(migrated)) {
            setActiveTab(migrated as TabType);
        }
    }, []);

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

    const handleSwitchToRealData = (walletAddress: string) => {
        setAnalyzingWallet(walletAddress);
        setNetwork('devnet');
        setActiveTab('dashboard');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Home network={network} analyzingWallet={analyzingWallet} onNavigateToLookup={() => setActiveTab('lookup')} />;
            case 'lookup':
                return <TradeHistory onSwitchToRealData={handleSwitchToRealData} />;
            case 'journal':
                return <Journal network={network} analyzingWallet={analyzingWallet} onNavigateToLookup={() => setActiveTab('lookup')} />;
            case 'appdocs':
                return <AboutScreen />;
            case 'help':
                return <HelpScreen />;
            case 'roadmap':
                return <RoadmapScreen />;
            case 'profile-settings':
                return <ProfileSettings />;
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
                onProfileSettingsClick={() => setActiveTab('profile-settings')}
                onLogoClick={() => setActiveTab('dashboard')}
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

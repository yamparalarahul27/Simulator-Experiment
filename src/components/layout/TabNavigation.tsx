'use client';

import { useEffect, useState } from 'react';
import TradeHistory from '../features/TradeHistory';
import Home from '../features/Home';
import Journal from '../features/Journal';
import ProfileSettings from '../features/ProfileSettings';
import AboutScreen from '../features/AboutScreen';
import HelpScreen from '../features/HelpScreen';
import RoadmapScreen from '../features/RoadmapScreen';
import ExchangeManager from '../features/ExchangeManager';
import Market from '../features/Market';
import Web3Hub from '../features/Web3Hub';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import Footer from './Footer';
import { MarketTicker } from '../ui/MarketTicker';
import { toast } from 'sonner';

export type TabType = 'dashboard' | 'market' | 'lookup' | 'journal' | 'web3' | 'exchange-manager' | 'appdocs' | 'help' | 'roadmap' | 'profile-settings';
export type UserMode = 'analytica' | 'pedia';

const PERSISTABLE_TABS: TabType[] = ['dashboard', 'market', 'lookup', 'journal', 'web3', 'exchange-manager', 'appdocs', 'help', 'roadmap', 'profile-settings'];

const ANALYTICA_TABS: TabType[] = ['dashboard', 'lookup', 'journal'];
const PEDIA_TABS: TabType[] = ['web3', 'lookup', 'market'];

function getDefaultTab(mode: UserMode): TabType {
    return mode === 'pedia' ? 'web3' : 'dashboard';
}

/**
 * TabNavigation Component
 * 
 * PURPOSE:
 * The primary navigation controller for the Deriverse application.
 * Manages the active tab state and coordinates between high-level views
 * like Dashboard, Journal, and Profile.
 * 
 * FEATURES:
 * - Persistent tab state across page refreshes via localStorage
 * - Global event listeners for cross-component navigation
 * - Network state management ('devnet' | 'mainnet' | 'mock')
 * - Dynamic rendering of feature screens based on selection
 */
export default function TabNavigation() {
    const [userMode, setUserMode] = useState<UserMode>('analytica');
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');
    const [analyzingWallet, setAnalyzingWallet] = useState<string | null>(null);

    // Restore userMode and activeTab from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const persistedMode = window.localStorage.getItem('deriverse.userMode') as UserMode | null;
        const mode = persistedMode === 'pedia' ? 'pedia' : 'analytica';
        setUserMode(mode);

        const persistedRaw = window.localStorage.getItem('deriverse.activeTab');
        const migrated = persistedRaw === 'settings' ? 'profile-settings' : persistedRaw;

        const allowedMain = mode === 'pedia' ? PEDIA_TABS : ANALYTICA_TABS;
        // Allow persisted tab if it's a valid tab (main, dropdown, or utility)
        if (migrated && (PERSISTABLE_TABS as string[]).includes(migrated)) {
            // If tab is a main tab that doesn't belong to current mode, redirect to default
            const isMainTab = [...ANALYTICA_TABS, ...PEDIA_TABS].includes(migrated as TabType);
            if (isMainTab && !allowedMain.includes(migrated as TabType)) {
                setActiveTab(getDefaultTab(mode));
            } else {
                setActiveTab(migrated as TabType);
            }
        } else {
            setActiveTab(getDefaultTab(mode));
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

        const handleUserModeChange = (event: Event) => {
            const mode = (event as CustomEvent<UserMode>).detail;
            if (mode) {
                setUserMode(mode);
                window.localStorage.setItem('deriverse.userMode', mode);
                setActiveTab(getDefaultTab(mode));
            }
        };

        window.addEventListener('deriverse:set-active-tab', handleExternalTabChange as EventListener);
        window.addEventListener('deriverse:set-user-mode', handleUserModeChange as EventListener);
        return () => {
            window.removeEventListener('deriverse:set-active-tab', handleExternalTabChange as EventListener);
            window.removeEventListener('deriverse:set-user-mode', handleUserModeChange as EventListener);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('deriverse.activeTab', activeTab);
    }, [activeTab]);

    // Persist userMode
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('deriverse.userMode', userMode);
    }, [userMode]);

    // Mode-conditional navigation items
    const navItems: NavItem[] = userMode === 'pedia'
        ? [
            { title: 'Web3', href: '#web3', category: 'main', onClick: () => setActiveTab('web3') },
            { title: 'Wallet(s)', href: '#lookup', category: 'main', onClick: () => setActiveTab('lookup') },
            { title: 'Trade', href: '#market', category: 'main', onClick: () => setActiveTab('market') },
            { title: 'About', href: '#appdocs', category: 'dropdown', onClick: () => setActiveTab('appdocs') },
            { title: 'Help', href: '#help', category: 'dropdown', onClick: () => setActiveTab('help') },
            { title: 'Roadmap', href: '#roadmap', category: 'dropdown', onClick: () => setActiveTab('roadmap') },
        ]
        : [
            { title: 'Analytics', href: '#dashboard', category: 'main', onClick: () => setActiveTab('dashboard') },
            { title: 'Wallet(s)', href: '#lookup', category: 'main', onClick: () => setActiveTab('lookup') },
            { title: 'Journal', href: '#journal', category: 'main', onClick: () => setActiveTab('journal') },
            { title: 'About', href: '#appdocs', category: 'dropdown', onClick: () => setActiveTab('appdocs') },
            { title: 'Help', href: '#help', category: 'dropdown', onClick: () => setActiveTab('help') },
            { title: 'Roadmap', href: '#roadmap', category: 'dropdown', onClick: () => setActiveTab('roadmap') },
        ];

    const handleSwitchToRealData = (walletAddress: string) => {
        setAnalyzingWallet(walletAddress);
        setNetwork('devnet');
        if (userMode === 'pedia') {
            toast.success('Trades saved! Switch to Analytica to view analytics.');
        } else {
            setActiveTab('dashboard');
        }
    };

    const handleSwitchMode = () => {
        const newMode: UserMode = userMode === 'analytica' ? 'pedia' : 'analytica';
        setUserMode(newMode);
        setActiveTab(getDefaultTab(newMode));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Home network={network} analyzingWallet={analyzingWallet} onNavigateToLookup={() => setActiveTab('lookup')} />;
            case 'market':
                return <Market />;
            case 'web3':
                return <Web3Hub />;
            case 'lookup':
                return <TradeHistory onSwitchToRealData={handleSwitchToRealData} />;
            case 'journal':
                return <Journal network={network} analyzingWallet={analyzingWallet} onNavigateToLookup={() => setActiveTab('lookup')} />;
            case 'exchange-manager':
                return <ExchangeManager />;
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
            {userMode === 'analytica' && <MarketTicker />}

            {/* New Glassmorphism Navigation */}
            <GlassmorphismNavbar
                logo="/Logo.png"
                navItems={navItems}
                activePath={`#${activeTab}`}
                networkStatus={{
                    name: getNetworkName(network),
                    variant: network,
                    isActive: true
                }}
                onNetworkChange={setNetwork}
                onProfileSettingsClick={() => setActiveTab('profile-settings')}
                onExchangeManagerClick={() => setActiveTab('exchange-manager')}
                onLogoClick={() => setActiveTab(getDefaultTab(userMode))}
                onSwitchMode={handleSwitchMode}
                userMode={userMode}
                className="mb-8"
            />

            {/* Content Area - Padding top added to account for fixed navbar */}
            <div className="pt-44 p-4 max-w-7xl mx-auto">
                {renderTabContent()}

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}

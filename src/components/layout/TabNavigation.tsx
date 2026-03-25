'use client';

import { useEffect, useState } from 'react';
import ProfileSettings from '../features/ProfileSettings';
import AboutScreen from '../features/AboutScreen';
import HelpScreen from '../features/HelpScreen';
import RoadmapScreen from '../features/RoadmapScreen';
import ExchangeManager from '../features/ExchangeManager';
import Web3Hub from '../features/Web3Hub';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import Footer from './Footer';

export type TabType = 'learn' | 'exchange-manager' | 'appdocs' | 'help' | 'roadmap' | 'profile-settings';

const DEFAULT_TAB: TabType = 'learn';

const VALID_TABS: TabType[] = ['learn', 'exchange-manager', 'appdocs', 'help', 'roadmap', 'profile-settings'];

/**
 * TabNavigation Component
 *
 * PURPOSE:
 * The primary navigation controller for YDEX — Solving Why of DEX.
 * Single educational platform navigation (no mode switching).
 */
export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_TAB);
    const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'mock'>('mock');

    // Restore activeTab from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const persistedRaw = window.localStorage.getItem('deriverse.activeTab');
        const migrated = persistedRaw === 'settings' ? 'profile-settings' : persistedRaw;

        if (migrated && (VALID_TABS as string[]).includes(migrated)) {
            setActiveTab(migrated as TabType);
        } else {
            setActiveTab(DEFAULT_TAB);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleExternalTabChange = (event: Event) => {
            const nextTab = (event as CustomEvent<TabType>).detail;
            if (nextTab && (VALID_TABS as string[]).includes(nextTab)) {
                setActiveTab(nextTab);
            } else {
                // Fallback for legacy tab names
                setActiveTab(DEFAULT_TAB);
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

    const navItems: NavItem[] = [
        { title: 'Learn', href: '#learn', category: 'main', onClick: () => setActiveTab('learn') },
        { title: 'About', href: '#appdocs', category: 'dropdown', onClick: () => setActiveTab('appdocs') },
        { title: 'Help', href: '#help', category: 'dropdown', onClick: () => setActiveTab('help') },
        { title: 'Roadmap', href: '#roadmap', category: 'dropdown', onClick: () => setActiveTab('roadmap') },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'learn':
                return <Web3Hub />;
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
                return <Web3Hub />;
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
                onLogoClick={() => setActiveTab(DEFAULT_TAB)}
                className="mb-8"
            />

            <div className="pt-44 p-4 max-w-7xl mx-auto">
                {renderTabContent()}
                <Footer />
            </div>
        </div>
    );
}

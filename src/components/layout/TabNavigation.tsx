'use client';

import { useState } from 'react';
import TradeHistory from '../features/TradeHistory';
import Home from '../features/Home';
import Journal from '../features/Journal';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';
import Footer from './Footer';

type TabType = 'dashboard' | 'lookup' | 'journal' | 'appdocs';

export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [network, setNetwork] = useState<'devnet' | 'mainnet'>('devnet');

    // Clean navigation items configuration
    const navItems: NavItem[] = [
        {
            title: 'Home',
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
            title: 'Lookup',
            href: '#lookup',
            category: 'main',
            onClick: () => setActiveTab('lookup')
        },
        {
            title: 'About & Future',
            href: '#appdocs',
            category: 'dropdown',
            onClick: () => setActiveTab('appdocs')
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
                        <h1 className="text-4xl font-bold text-foreground">About & Future</h1>
                    </div>
                );
            default:
                return null;
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
                    name: network === 'devnet' ? 'Devnet' : 'Mainnet',
                    variant: network,
                    isActive: true
                }}
                onNetworkChange={setNetwork}
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

'use client';

import { useState } from 'react';
import TradeHistory from './TradeHistory';
import TableUI_Demo from './TableUI_Demo';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';

type TabType = 'dashboard' | 'lookup' | 'tradedata' | 'assistant' | 'appdocs';

export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [network, setNetwork] = useState<'devnet' | 'mainnet'>('devnet');

    // Clean navigation items configuration
    const navItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '#dashboard',
            category: 'main',
            onClick: () => setActiveTab('dashboard')
        },
        {
            title: 'Lookup',
            href: '#lookup',
            category: 'main',
            onClick: () => setActiveTab('lookup')
        },
        {
            title: 'Trade Data',
            href: '#tradedata',
            category: 'main',
            onClick: () => setActiveTab('tradedata')
        },
        {
            title: 'Assistant',
            href: '#assistant',
            category: 'main',
            onClick: () => setActiveTab('assistant')
        },
        {
            title: 'App Docs',
            href: '#appdocs',
            category: 'dropdown',
            onClick: () => setActiveTab('appdocs')
        },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
                    </div>
                );
            case 'lookup':
                return <TradeHistory />;
            case 'tradedata':
                return <TableUI_Demo />;
            case 'assistant':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">Assistant</h1>
                    </div>
                );
            case 'appdocs':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">App Docs</h1>
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
            </div>
        </div>
    );
}

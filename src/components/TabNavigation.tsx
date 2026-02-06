'use client';

import { useState } from 'react';
import TradeHistory from './TradeHistory';
import { GlassmorphismNavbar, NavItem } from './GlassmorphismNavbar';

type TabType = 'dashboard' | 'lookup' | 'mockdata' | 'assistant' | 'devlogs';

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
            title: 'Mock Data',
            href: '#mockdata',
            category: 'dropdown',
            onClick: () => setActiveTab('mockdata')
        },
        {
            title: 'Assistant',
            href: '#assistant',
            category: 'dropdown',
            onClick: () => setActiveTab('assistant')
        },
        {
            title: 'Dev Logs',
            href: '#devlogs',
            category: 'dropdown',
            onClick: () => setActiveTab('devlogs')
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
            case 'mockdata':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">Mock Data</h1>
                    </div>
                );
            case 'assistant':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">Assistant</h1>
                    </div>
                );
            case 'devlogs':
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <h1 className="text-4xl font-bold text-foreground">Dev Logs</h1>
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

'use client';

import { useState } from 'react';
import TradeHistory from './TradeHistory';

type TabType = 'dashboard' | 'lookup' | 'mockdata' | 'assistant' | 'devlogs';

export default function TabNavigation() {
    const [activeTab, setActiveTab] = useState<TabType>('lookup');

    const tabs = [
        { id: 'dashboard' as TabType, label: 'Dashboard' },
        { id: 'lookup' as TabType, label: 'Look Up' },
        { id: 'mockdata' as TabType, label: 'Mock Data' },
        { id: 'assistant' as TabType, label: 'Assistant' },
        { id: 'devlogs' as TabType, label: 'Dev Logs' },
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
        <div className="min-h-screen">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex justify-center gap-2 px-4 py-3" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
              `}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {renderTabContent()}
            </div>
        </div>
    );
}

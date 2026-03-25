'use client';

import { useState } from 'react';
import type { LearningModule } from '@/lib/types';

// Lesson components (lazy loaded when needed)
import OrderTypesOverview from './lessons/OrderTypesOverview';

// ============================================
// Module Registry
// ============================================

const MODULES: LearningModule[] = [
    {
        moduleSlug: 'order-types',
        title: 'Order Types',
        description: 'Market, Limit, Stop, OCO — when and why to use each',
        icon: '⚡',
        difficulty: 'beginner',
        simulatorKind: 'spot',
        comingSoon: false,
        walletRequired: false,
        lessons: [
            { lessonSlug: 'overview', title: 'What are Order Types?', description: 'Overview of all 8 order types and when to use each' },
            { lessonSlug: 'market', title: 'Market Order', description: 'Execute immediately at best available price', simulatorPreset: { orderType: 'market' } },
            { lessonSlug: 'limit', title: 'Limit Order', description: 'Buy/sell at a specific price or better', simulatorPreset: { orderType: 'limit' } },
            { lessonSlug: 'stop-market', title: 'Stop Market', description: 'Trigger a market order when price hits your stop', simulatorPreset: { orderType: 'stop_market' } },
            { lessonSlug: 'stop-limit', title: 'Stop Limit', description: 'Trigger a limit order when price hits your stop', simulatorPreset: { orderType: 'stop_limit' } },
            { lessonSlug: 'iceberg', title: 'Iceberg Order', description: 'Hide large orders behind smaller visible quantities', simulatorPreset: { orderType: 'iceberg' } },
            { lessonSlug: 'twap', title: 'TWAP Order', description: 'Split orders across time intervals to reduce market impact', simulatorPreset: { orderType: 'twap' } },
            { lessonSlug: 'trailing-stop', title: 'Trailing Stop', description: 'Dynamic stop that follows price movement', simulatorPreset: { orderType: 'trailing_stop' } },
            { lessonSlug: 'oco', title: 'OCO Order', description: 'One-Cancels-Other — pair a take-profit with a stop-loss', simulatorPreset: { orderType: 'oco' } },
        ],
    },
    {
        moduleSlug: 'risk-management',
        title: 'Risk Management',
        description: 'Position sizing, stop losses, TP/SL, R:R ratios',
        icon: '🛡️',
        difficulty: 'intermediate',
        simulatorKind: 'futures',
        comingSoon: true,
        walletRequired: false,
        lessons: [],
    },
    {
        moduleSlug: 'what-is-a-dex',
        title: 'What is a DEX?',
        description: 'CEX vs DEX, how AMMs work, liquidity pools',
        icon: '🔄',
        difficulty: 'beginner',
        comingSoon: true,
        walletRequired: false,
        lessons: [],
    },
    {
        moduleSlug: 'wallets-and-keys',
        title: 'Wallets & Keys',
        description: 'Public/private keys, connecting to dApps, transaction signing',
        icon: '🔑',
        difficulty: 'beginner',
        comingSoon: true,
        walletRequired: false,
        lessons: [],
    },
    {
        moduleSlug: 'solana-ecosystem',
        title: 'Solana Ecosystem',
        description: 'Jupiter, Raydium, Orca — the DEX landscape',
        icon: '🌐',
        difficulty: 'beginner',
        comingSoon: true,
        walletRequired: false,
        lessons: [],
    },
    {
        moduleSlug: 'trading-psychology',
        title: 'Trading Psychology',
        description: 'FOMO, revenge trading, discipline, journaling',
        icon: '🧠',
        difficulty: 'intermediate',
        comingSoon: true,
        walletRequired: false,
        lessons: [],
    },
];

// ============================================
// Difficulty Badge
// ============================================

function DifficultyBadge({ level }: { level: LearningModule['difficulty'] }) {
    const config = {
        beginner: { label: 'Beginner', color: 'text-green-400/80 bg-green-500/10 border-green-500/20' },
        intermediate: { label: 'Intermediate', color: 'text-yellow-400/80 bg-yellow-500/10 border-yellow-500/20' },
        advanced: { label: 'Advanced', color: 'text-red-400/80 bg-red-500/10 border-red-500/20' },
    };
    const { label, color } = config[level];

    return (
        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border ${color}`}>
            {label}
        </span>
    );
}

// ============================================
// Module Card
// ============================================

function ModuleCard({ module, onClick }: { module: LearningModule; onClick?: () => void }) {
    const isActive = !module.comingSoon;

    return (
        <button
            onClick={isActive ? onClick : undefined}
            disabled={!isActive}
            className={`
                w-full text-left bg-black border p-6 flex flex-col gap-3 transition-all duration-200
                ${isActive
                    ? 'border-white/10 hover:border-white/25 hover:bg-white/[0.02] cursor-pointer'
                    : 'border-white/5 opacity-50 cursor-not-allowed'
                }
            `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{module.icon}</span>
                    <h2 className="text-base font-mono font-semibold text-white">{module.title}</h2>
                </div>
                {module.comingSoon ? (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400/70 bg-purple-500/10 px-2 py-0.5 border border-purple-500/20">
                        Coming Soon
                    </span>
                ) : (
                    <DifficultyBadge level={module.difficulty} />
                )}
            </div>
            <p className="text-xs font-mono text-white/40 leading-relaxed">{module.description}</p>
            {isActive && module.lessons.length > 0 && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-white/30">
                        {module.lessons.length} lessons
                    </span>
                    <span className="text-xs font-mono text-purple-400/70">
                        Start &rarr;
                    </span>
                </div>
            )}
        </button>
    );
}

// ============================================
// Hero Section
// ============================================

function HeroSection({ onStartLearning }: { onStartLearning: () => void }) {
    return (
        <div className="relative border border-white/10 bg-gradient-to-br from-purple-900/20 via-black to-black overflow-hidden">
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/80 bg-purple-500/10 px-2.5 py-1 border border-purple-500/20">
                                Featured Lab
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-mono font-bold text-white">
                            Order Types Lab
                        </h2>
                        <p className="text-sm font-mono text-white/50 max-w-lg leading-relaxed">
                            Learn all 8 order types with live simulation. Place orders, watch them execute
                            on an interactive state diagram, and understand exactly how each type works.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono text-white/30">
                            <span>9 lessons</span>
                            <span className="text-white/10">|</span>
                            <span>Interactive simulator</span>
                            <span className="text-white/10">|</span>
                            <span>Live prices</span>
                        </div>
                    </div>
                    <button
                        onClick={onStartLearning}
                        className="px-8 py-3 bg-purple-600/80 hover:bg-purple-600 border border-purple-500/30 text-white font-mono text-sm font-medium transition-all duration-200 whitespace-nowrap"
                    >
                        Start Learning &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Web3Hub (Learn Hub) — Main Component
// ============================================

export default function Web3Hub() {
    const [activeModule, setActiveModule] = useState<string | null>(null);

    // Find the active module config
    const currentModule = activeModule ? MODULES.find(m => m.moduleSlug === activeModule) : null;

    // Render lesson view if a module is selected
    if (currentModule && !currentModule.comingSoon) {
        switch (currentModule.moduleSlug) {
            case 'order-types':
                return (
                    <OrderTypesOverview
                        module={currentModule}
                        onBack={() => setActiveModule(null)}
                    />
                );
            default:
                setActiveModule(null);
                return null;
        }
    }

    // Hub view
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-mono font-bold text-white tracking-wide">Learn</h1>
                <p className="text-sm font-mono text-white/50 mt-1">
                    Solving Why of DEX — interactive lessons & simulators
                </p>
            </div>

            {/* Featured Hero */}
            <HeroSection onStartLearning={() => setActiveModule('order-types')} />

            {/* Module Grid */}
            <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">
                    Learning Modules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODULES.map((module) => (
                        <ModuleCard
                            key={module.moduleSlug}
                            module={module}
                            onClick={() => setActiveModule(module.moduleSlug)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

import type { LearningModule } from '@/lib/types';
import { MODULES } from '@/lib/modules';
import { useRouter } from '@/i18n/navigation';

// ============================================
// Difficulty Badge
// ============================================

function DifficultyBadge({ level }: { level: LearningModule['difficulty'] }) {
    const config = {
        beginner: { label: 'Beginner', color: 'text-[var(--bs-success)]/80 bg-[var(--bs-brand-success)]/10 border-[var(--bs-success)]/20' },
        intermediate: { label: 'Intermediate', color: 'text-yellow-400/80 bg-yellow-500/10 border-yellow-500/20' },
        advanced: { label: 'Advanced', color: 'text-[var(--bs-error)]/80 bg-[var(--bs-error)]/10 border-[var(--bs-error)]/20' },
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
                w-full text-left bg-[var(--bs-bg)] border p-6 flex flex-col gap-3 transition-all duration-200
                ${isActive
                    ? 'border-[var(--bs-border)] hover:border-[var(--bs-border)] hover:bg-[var(--bs-card-fg)] cursor-pointer'
                    : 'border-[var(--bs-border)] opacity-50 cursor-not-allowed'
                }
            `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{module.icon}</span>
                    <h2 className="text-base font-mono font-semibold text-[var(--bs-text-primary)]">{module.title}</h2>
                </div>
                {module.comingSoon ? (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--bs-brand)]/70 bg-[var(--bs-brand-tertiary)]/10 px-2 py-0.5 border border-[var(--bs-brand-tertiary)]/20">
                        Coming Soon
                    </span>
                ) : (
                    <DifficultyBadge level={module.difficulty} />
                )}
            </div>
            <p className="text-xs font-mono text-[var(--bs-text-mute)] leading-relaxed">{module.description}</p>
            {isActive && module.lessons.length > 0 && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-[var(--bs-text-mute)]">
                        {module.lessons.length} lessons
                    </span>
                    <span className="text-xs font-mono text-[var(--bs-brand)]/70">
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
        <div className="relative border border-[var(--bs-border)] bg-gradient-to-br from-[var(--bs-brand-tertiary)]/20 via-[var(--bs-bg)] to-[var(--bs-bg)] overflow-hidden">
            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative p-4 sm:p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--bs-brand)]/80 bg-[var(--bs-brand-tertiary)]/10 px-2.5 py-1 border border-[var(--bs-brand-tertiary)]/20">
                                Featured Lab
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-[var(--bs-text-primary)]">
                            Order Types Lab
                        </h2>
                        <p className="text-sm font-mono text-[var(--bs-text-tertiary)] max-w-lg leading-relaxed">
                            Learn all 8 order types with live simulation. Place orders, watch them execute
                            on an interactive state diagram, and understand exactly how each type works.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono text-[var(--bs-text-mute)]">
                            <span>9 lessons</span>
                            <span className="text-[var(--bs-text-primary)]/10">|</span>
                            <span>Interactive simulator</span>
                            <span className="text-[var(--bs-text-primary)]/10">|</span>
                            <span>Live prices</span>
                        </div>
                    </div>
                    <button
                        onClick={onStartLearning}
                        className="px-8 py-3 bg-[var(--bs-brand-tertiary)]/80 hover:bg-[var(--bs-brand-tertiary)] border border-[var(--bs-brand-tertiary)]/30 text-[var(--bs-text-primary)] font-mono text-sm font-medium transition-all duration-200 whitespace-nowrap"
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
    const router = useRouter();

    const navigateToModule = (slug: string) => {
        router.push(`/lessons/${slug}`);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-mono font-bold text-[var(--bs-text-primary)] tracking-wide">Learn</h1>
                <p className="text-sm font-mono text-[var(--bs-text-tertiary)] mt-1">
                    Solving Why of DEX — interactive lessons & simulators
                </p>
            </div>

            {/* Featured Hero */}
            <HeroSection onStartLearning={() => navigateToModule('order-types')} />

            {/* Module Grid */}
            <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--bs-text-mute)] mb-4">
                    Learning Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODULES.map((module) => (
                        <ModuleCard
                            key={module.moduleSlug}
                            module={module}
                            onClick={() => navigateToModule(module.moduleSlug)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

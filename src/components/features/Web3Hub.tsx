'use client';

import type { LearningModule } from '@/lib/types';
import { MODULES } from '@/lib/modules';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const LEARNING_PRINCIPLES = [
    {
        title: 'Understand The Why',
        description: 'Each lesson explains the market behavior before asking you to act.',
    },
    {
        title: 'Practice With Context',
        description: 'Interactive scenarios show what changes in real order flow and risk.',
    },
    {
        title: 'Trade With Discipline',
        description: 'Move from impulse to repeatable process through guided checkpoints.',
    },
] as const;

function DifficultyBadge({ level }: { level: LearningModule['difficulty'] }) {
    const config = {
        beginner: {
            label: 'Beginner',
            className: 'border-bs-success/30 bg-bs-success/10 text-bs-success',
        },
        intermediate: {
            label: 'Intermediate',
            className: 'border-bs-brand-rust/35 bg-bs-brand-rust/10 text-bs-brand-rust',
        },
        advanced: {
            label: 'Advanced',
            className: 'border-bs-error/30 bg-bs-error/10 text-bs-error',
        },
    };
    const { label, className } = config[level];

    return (
        <span
            className={cn(
                'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium',
                className
            )}
        >
            {label}
        </span>
    );
}

function ModuleCard({ module, onClick }: { module: LearningModule; onClick?: () => void }) {
    const isActive = !module.comingSoon;
    const lessonCount = module.lessons.length;

    return (
        <button
            type="button"
            onClick={isActive ? onClick : undefined}
            disabled={!isActive}
            className={cn(
                'stamp-card h-full w-full text-left transition-all duration-200',
                isActive
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-65'
            )}
        >
            <div className={cn(
                'stamp-card-inner flex flex-col gap-5 transition-colors duration-200',
                !isActive && 'pointer-events-none'
            )}>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                        <span className="inline-flex size-11 items-center justify-center rounded-full border border-bs-border bg-bs-card-fg text-lg">
                            {module.icon}
                        </span>
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-bs-text-primary text-balance">
                                {module.title}
                            </h2>
                            <p className="text-sm text-bs-text-tertiary text-pretty">{module.description}</p>
                        </div>
                    </div>

                    {module.comingSoon ? (
                        <span className="inline-flex rounded-full border border-bs-border px-2.5 py-1 text-[11px] text-bs-text-tertiary">
                            Coming Soon
                        </span>
                    ) : (
                        <DifficultyBadge level={module.difficulty} />
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-bs-border/80 pt-4 text-sm">
                    <span className="tabular-nums text-bs-text-secondary">
                        {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
                    </span>
                    <span className={cn('font-medium', isActive ? 'text-bs-text-primary' : 'text-bs-text-mute')}>
                        {isActive ? 'Open module' : 'Locked'}
                    </span>
                </div>
            </div>
        </button>
    );
}

function HeroSection({
    onStartLearning,
    onJumpToModules,
    totalLessons,
    activeModules,
}: {
    onStartLearning: () => void;
    onJumpToModules: () => void;
    totalLessons: number;
    activeModules: number;
}) {
    return (
        <section className="stamp-card">
            <div className="stamp-card-inner">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
                <div className="space-y-5">
                    <span className="inline-flex rounded-full border border-bs-border bg-bs-card-fg px-3 py-1 text-sm text-bs-text-secondary">
                        YDEX Academy
                    </span>
                    <h1 className="text-4xl font-semibold text-bs-text-primary text-balance sm:text-5xl">
                        Think before you trade.
                    </h1>
                    <p className="max-w-2xl text-base text-bs-text-secondary text-pretty sm:text-lg">
                        Learn how order flow, risk, and execution actually work, then practice inside guided
                        simulators built for Solana trading.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={onStartLearning}
                            className="rounded-xl bg-bs-brand-rust px-5 py-3 text-sm font-semibold text-black"
                        >
                            Start with Order Types
                        </button>
                        <button
                            type="button"
                            onClick={onJumpToModules}
                            className="rounded-xl border border-bs-border px-5 py-3 text-sm font-medium text-bs-text-primary"
                        >
                            Browse modules
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-bs-border bg-bs-card-fg p-5">
                    <p className="text-sm text-bs-text-tertiary">Learning snapshot</p>
                    <dl className="mt-5 space-y-4">
                        <div className="flex items-end justify-between border-b border-bs-border/80 pb-3">
                            <dt className="text-sm text-bs-text-secondary">Live modules</dt>
                            <dd className="text-2xl font-semibold tabular-nums text-bs-text-primary">
                                {activeModules}
                            </dd>
                        </div>
                        <div className="flex items-end justify-between border-b border-bs-border/80 pb-3">
                            <dt className="text-sm text-bs-text-secondary">Hands-on lessons</dt>
                            <dd className="text-2xl font-semibold tabular-nums text-bs-text-primary">
                                {totalLessons}
                            </dd>
                        </div>
                        <div className="flex items-end justify-between">
                            <dt className="text-sm text-bs-text-secondary">Format</dt>
                            <dd className="text-sm font-medium text-bs-text-primary">Interactive + concise</dd>
                        </div>
                    </dl>
                </div>
            </div>
            </div>
        </section>
    );
}

function PrinciplesSection() {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-bs-text-primary text-balance">How this academy teaches</h2>
            <div className="grid gap-4 md:grid-cols-3">
                {LEARNING_PRINCIPLES.map((item) => (
                    <article
                        key={item.title}
                        className="stamp-card"
                    >
                        <div className="stamp-card-inner">
                            <h3 className="text-base font-semibold text-bs-text-primary text-balance">{item.title}</h3>
                            <p className="mt-2 text-sm text-bs-text-secondary text-pretty">{item.description}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default function Web3Hub() {
    const router = useRouter();

    const navigateToModule = (slug: string) => {
        router.push(`/lessons/${slug}`);
    };

    const handleJumpToModules = () => {
        const modulesSection = document.getElementById('learning-modules');
        if (modulesSection) {
            modulesSection.scrollIntoView({ block: 'start' });
        }
    };

    const activeModules = MODULES.filter((module) => !module.comingSoon).length;
    const totalLessons = MODULES.reduce((count, module) => count + module.lessons.length, 0);

    return (
        <div className="space-y-10 pb-4">
            <HeroSection
                onStartLearning={() => navigateToModule('order-types')}
                onJumpToModules={handleJumpToModules}
                totalLessons={totalLessons}
                activeModules={activeModules}
            />

            <PrinciplesSection />

            <section id="learning-modules" className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-bs-text-primary text-balance">Modules</h2>
                    <p className="text-sm text-bs-text-secondary text-pretty">
                        Start with active tracks today, then continue with upcoming curriculum as it ships.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {MODULES.map((module) => (
                        <ModuleCard
                            key={module.moduleSlug}
                            module={module}
                            onClick={() => navigateToModule(module.moduleSlug)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

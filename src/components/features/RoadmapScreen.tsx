'use client';

import { cn } from '@/lib/utils';
import { useRoadmap } from '@/lib/hooks/useContent';
import { STATUS_COPY } from '@/lib/fallbacks/roadmap';
import type { RoadmapStatus } from '@/lib/types';

export default function RoadmapScreen() {
    const { data: phases = [] } = useRoadmap();

    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">YDEX Roadmap</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    From simulation to execution.
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    YDEX ships in phases so each release adds practical capability while keeping education and risk
                    clarity at the center.
                </p>
            </header>

            <div className="space-y-4">
                {phases.map((phase) => (
                    <article
                        key={phase.title}
                        className={cn(
                            'rounded-2xl border px-5 py-6',
                            phase.status === 'done' && 'border-bs-success/30 bg-bs-success/5',
                            phase.status === 'next' && 'border-bs-brand-rust/30 bg-bs-brand-rust/5',
                            phase.status === 'future' && 'border-bs-border bg-bs-card'
                        )}
                    >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-bs-text-primary text-balance">{phase.title}</h2>
                                <p className="mt-1 text-sm text-bs-text-tertiary">{phase.subtitle}</p>
                            </div>
                            <span
                                className={cn(
                                    'inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium',
                                    phase.status === 'done' && 'border-bs-success/30 bg-bs-success/10 text-bs-success',
                                    phase.status === 'next' &&
                                        'border-bs-brand-rust/35 bg-bs-brand-rust/10 text-bs-brand-rust',
                                    phase.status === 'future' && 'border-bs-border bg-bs-card-fg text-bs-text-secondary'
                                )}
                            >
                                {STATUS_COPY[phase.status as RoadmapStatus] ?? phase.status}
                            </span>
                        </div>

                        <ul className="mt-4 grid gap-2">
                            {phase.items.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span
                                        className={cn(
                                            'mt-2 size-1.5 rounded-full',
                                            phase.status === 'done' && 'bg-bs-success',
                                            phase.status === 'next' && 'bg-bs-brand-rust',
                                            phase.status === 'future' && 'bg-bs-text-mute'
                                        )}
                                    />
                                    <span className="text-sm text-bs-text-secondary text-pretty">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}

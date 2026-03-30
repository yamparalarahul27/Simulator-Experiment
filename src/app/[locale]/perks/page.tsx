'use client';

const UPCOMING_PERKS = [
    {
        title: 'Learning Streak Rewards',
        description: 'Unlock collectibles and profile boosts for consistent progress in lessons.',
    },
    {
        title: 'Simulation Milestones',
        description: 'Earn badges as you complete order-type scenarios and risk drills.',
    },
    {
        title: 'Member-Only Content',
        description: 'Advanced playbooks, case studies, and strategy sessions from the YDEX lab.',
    },
];

export default function PerksPage() {
    return (
        <div className="space-y-8">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-7 md:px-6">
                <p className="text-sm text-bs-text-tertiary">YDEX Perks</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Progress should pay back.
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Rewards and unlocks are shipping soon for traders who stay consistent with learning and simulation.
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
                {UPCOMING_PERKS.map((perk) => (
                    <article
                        key={perk.title}
                        className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6"
                    >
                        <h2 className="text-lg font-semibold text-bs-text-primary text-balance">{perk.title}</h2>
                        <p className="mt-2 text-sm text-bs-text-secondary text-pretty">{perk.description}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-bs-border bg-bs-card-fg px-5 py-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-lg font-semibold text-bs-text-primary text-balance">Perks are in active build.</p>
                        <p className="mt-1 text-sm text-bs-text-secondary text-pretty">
                            Continue using Learn and Simulator now so your future rewards are tied to real progress.
                        </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-bs-border bg-bs-card px-3 py-1 text-xs font-medium text-bs-text-secondary">
                        Coming Soon
                    </span>
                </div>
            </section>
        </div>
    );
}

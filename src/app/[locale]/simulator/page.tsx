'use client';

import dynamic from 'next/dynamic';
import HotDexTokensPanel from '@/components/features/HotDexTokensPanel';

const DemoMarket = dynamic(() => import('@/components/features/DemoMarket'), {
    ssr: false,
});

export default function SimulatorPage() {
    return (
        <div className="flex w-full flex-col gap-5">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-6 md:px-6">
                <p className="text-sm text-bs-text-tertiary">YDEX Simulator</p>
                <h1 className="mt-1 text-3xl font-semibold text-bs-text-primary text-balance md:text-4xl">
                    Practice execution before risking capital.
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-bs-text-secondary text-pretty md:text-base">
                    Simulate spot and futures behavior with live feeds, order-flow visuals, and configurable market
                    conditions.
                </p>
            </header>

            <HotDexTokensPanel />

            <section className="rounded-2xl border border-bs-border bg-bs-card px-3 py-3 md:px-4 md:py-4">
                <DemoMarket />
            </section>
        </div>
    );
}

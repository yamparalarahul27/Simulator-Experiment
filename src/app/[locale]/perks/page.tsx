'use client';

import { CardWithCornerShine } from '@/components/ui/CardWithCornerShine';

export default function PerksPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-mono font-bold text-[var(--bs-text-primary)] tracking-wide">Perks</h1>
                <p className="text-sm font-mono text-[var(--bs-text-tertiary)] mt-1">
                    Rewards and benefits for your learning journey
                </p>
            </div>

            <CardWithCornerShine>
                <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center px-4">
                    <span className="text-4xl mb-4">🎁</span>
                    <h2 className="text-lg font-mono font-semibold text-[var(--bs-text-primary)] mb-2">Coming Soon</h2>
                    <p className="text-sm font-mono text-[var(--bs-text-mute)] max-w-md">
                        Earn perks and rewards as you progress through lessons and complete challenges.
                        NFTs, badges, and exclusive content await.
                    </p>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

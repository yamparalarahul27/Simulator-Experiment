'use client';

import { CardWithCornerShine } from '@/components/ui/CardWithCornerShine';

export default function ChallengesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-mono font-bold text-white tracking-wide">Challenges</h1>
                <p className="text-sm font-mono text-white/50 mt-1">
                    Test your skills with real-world trading scenarios
                </p>
            </div>

            <CardWithCornerShine>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-4">🏆</span>
                    <h2 className="text-lg font-mono font-semibold text-white mb-2">Coming Soon</h2>
                    <p className="text-sm font-mono text-white/40 max-w-md">
                        Trading challenges with leaderboards, rewards, and real-world scenarios are being built.
                        Stay tuned for an exciting way to test your skills.
                    </p>
                </div>
            </CardWithCornerShine>
        </div>
    );
}

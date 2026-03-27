'use client';

import dynamic from 'next/dynamic';

const DemoMarket = dynamic(() => import('@/components/features/DemoMarket'), {
    ssr: false,
});

export default function SimulatorPage() {
    return (
        <div className="min-h-screen bg-[#0B0E14]">
            <DemoMarket />
        </div>
    );
}

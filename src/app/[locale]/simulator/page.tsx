'use client';

import dynamic from 'next/dynamic';

const DemoMarket = dynamic(() => import('@/components/features/DemoMarket'), {
    ssr: false,
});

export default function SimulatorPage() {
    return (
        <div className="min-h-screen bg-[#0B0E14] p-3 sm:p-4 md:p-6 overflow-x-hidden">
            <DemoMarket />
        </div>
    );
}

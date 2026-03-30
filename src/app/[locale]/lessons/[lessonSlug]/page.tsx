'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { MODULES } from '@/lib/modules';
import OrderTypesOverview from '@/components/features/lessons/OrderTypesOverview';
import OrderBookOverview from '@/components/features/lessons/OrderBookOverview';
import { useRouter } from '@/i18n/navigation';

export default function LessonPage({ params }: { params: Promise<{ lessonSlug: string }> }) {
    const { lessonSlug } = use(params);
    const router = useRouter();
    const module = MODULES.find(m => m.moduleSlug === lessonSlug);

    if (!module || module.comingSoon) {
        notFound();
    }

    switch (module.moduleSlug) {
        case 'order-types':
            return (
                <OrderTypesOverview
                    module={module}
                    onBack={() => router.push('/lessons')}
                />
            );
        case 'order-book':
            return (
                <OrderBookOverview
                    module={module}
                    onBack={() => router.push('/lessons')}
                />
            );
        default:
            notFound();
    }
}

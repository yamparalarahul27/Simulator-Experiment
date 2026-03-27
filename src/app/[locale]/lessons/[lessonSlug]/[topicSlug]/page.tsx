'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { MODULES } from '@/lib/modules';
import OrderTypeLesson from '@/components/features/lessons/OrderTypeLesson';
import { useRouter } from '@/i18n/navigation';

export default function TopicPage({
    params,
}: {
    params: Promise<{ lessonSlug: string; topicSlug: string }>;
}) {
    const { lessonSlug, topicSlug } = use(params);
    const router = useRouter();
    const module = MODULES.find(m => m.moduleSlug === lessonSlug);

    if (!module || module.comingSoon) {
        notFound();
    }

    const lesson = module.lessons.find(l => l.lessonSlug === topicSlug);

    if (!lesson) {
        notFound();
    }

    return (
        <OrderTypeLesson
            lesson={lesson}
            onBack={() => router.push(`/lessons/${lessonSlug}`)}
        />
    );
}

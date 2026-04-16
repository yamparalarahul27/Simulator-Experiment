'use client';

import { useModules, useChangelog, useRoadmap, useFAQ } from '@/lib/hooks/useContent';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: modules = [] } = useModules();
    const { data: productLog = [] } = useChangelog('product');
    const { data: designLog = [] } = useChangelog('design');
    const { data: devLog = [] } = useChangelog('dev');
    const { data: phases = [] } = useRoadmap();
    const { data: faqData } = useFAQ();

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalChangelog = productLog.length + designLog.length + devLog.length;

    const stats = [
        { label: 'Modules', value: modules.length, href: '/admin/modules' },
        { label: 'Lessons', value: totalLessons, href: '/admin/modules' },
        { label: 'Changelog Entries', value: totalChangelog, href: '/admin/changelog' },
        { label: 'Roadmap Phases', value: phases.length, href: '/admin/roadmap' },
        { label: 'FAQ Items', value: faqData?.faq.length ?? 0, href: '/admin/faq' },
        { label: 'Support Paths', value: faqData?.supportPaths.length ?? 0, href: '/admin/faq' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="rounded-xl border border-bs-border bg-bs-card px-5 py-4 transition-colors hover:border-bs-brand/30"
                    >
                        <p className="text-3xl font-semibold text-bs-text-primary">{stat.value}</p>
                        <p className="mt-1 text-sm text-bs-text-secondary">{stat.label}</p>
                    </Link>
                ))}
            </div>

            <div className="rounded-xl border border-bs-border bg-bs-card px-5 py-4">
                <h2 className="text-lg font-semibold text-bs-text-primary">Quick Actions</h2>
                <p className="mt-1 text-sm text-bs-text-secondary">
                    Content is fetched from Supabase with local fallbacks. Edit content in the sections above,
                    or manage directly in the Supabase dashboard.
                </p>
            </div>
        </div>
    );
}

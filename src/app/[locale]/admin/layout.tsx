'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';

const NAV_ITEMS = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/modules', label: 'Modules' },
    { href: '/admin/changelog', label: 'Changelog' },
    { href: '/admin/roadmap', label: 'Roadmap' },
    { href: '/admin/faq', label: 'FAQ' },
    { href: '/admin/presets', label: 'Presets' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (!ADMIN_ENABLED) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-bs-text-primary">Admin Disabled</h1>
                    <p className="text-sm text-bs-text-secondary">
                        Set <code className="bg-bs-card-fg px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_ADMIN_ENABLED=true</code> in your environment to enable.
                    </p>
                </div>
            </div>
        );
    }

    // Extract locale-independent path for matching
    const pathSegments = pathname.split('/');
    const adminPath = '/' + pathSegments.slice(pathSegments.indexOf('admin')).join('/');

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="rounded-2xl border border-bs-border bg-bs-card px-5 py-5">
                <h1 className="text-2xl font-semibold text-bs-text-primary">Content Admin</h1>
                <p className="mt-1 text-sm text-bs-text-secondary">Manage learning modules, changelog, roadmap, and FAQ content.</p>
            </header>

            <nav className="flex flex-wrap gap-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = adminPath === item.href || (item.href !== '/admin' && adminPath.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'border-bs-brand/30 bg-bs-brand/10 text-bs-brand'
                                    : 'border-bs-border bg-bs-card text-bs-text-secondary hover:text-bs-text-primary'
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div>{children}</div>
        </div>
    );
}

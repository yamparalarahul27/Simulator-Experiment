'use client';

import { usePathname } from '@/i18n/navigation';
import RouteBasedNavbar from './RouteBasedNavbar';
import Footer from './Footer';

const FULL_SCREEN_ROUTES: string[] = [];

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));

    if (isFullScreen) {
        return (
            <div className="min-h-dvh text-bs-text-primary">
                <RouteBasedNavbar />
                <div className="pt-20 md:pt-24">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh text-bs-text-primary">
            <RouteBasedNavbar />
            <div className="h-full">
                <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 md:px-6 md:pt-32">
                    {children}
                    <Footer />
                </div>
            </div>
        </div>
    );
}

'use client';

import { usePathname } from '@/i18n/navigation';
import RouteBasedNavbar from './RouteBasedNavbar';
import Footer from './Footer';

const FULL_SCREEN_ROUTES = ['/simulator'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));

    if (isFullScreen) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-dvh text-bs-text-primary paper-vignette">
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

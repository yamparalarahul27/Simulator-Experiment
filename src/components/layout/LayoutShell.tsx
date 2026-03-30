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
        <div className="min-h-screen text-bs-text-primary">
            <RouteBasedNavbar />
            <div className="h-full">
                <div className="pt-20 md:pt-44 px-4 pb-4 max-w-7xl mx-auto">
                    {children}
                    <Footer />
                </div>
            </div>
        </div>
    );
}

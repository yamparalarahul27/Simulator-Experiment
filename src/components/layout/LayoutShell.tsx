'use client';

import { usePathname } from '@/i18n/navigation';
import RouteBasedNavbar from './RouteBasedNavbar';
import Footer from './Footer';

const FULL_SCREEN_ROUTES = ['/simulator', '/assistant'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));

    if (isFullScreen) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen text-white">
            <RouteBasedNavbar />
            <div className="hidden md:block h-full">
                <div className="pt-44 p-4 max-w-7xl mx-auto">
                    {children}
                    <Footer />
                </div>
            </div>
        </div>
    );
}

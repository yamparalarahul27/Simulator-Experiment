'use client';

import { usePathname } from '@/i18n/navigation';
import Footer from './Footer';

const FULL_SCREEN_ROUTES: string[] = [];
const VIEWPORT_FITTED_ROUTES: string[] = ['/simulator'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));
    const isViewportFitted = VIEWPORT_FITTED_ROUTES.some(r => pathname.startsWith(r));

    if (isFullScreen) {
        return (
            <div className="min-h-dvh text-bs-text-primary">
                <div className="pt-6 md:pt-8">
                    {children}
                </div>
            </div>
        );
    }

    if (isViewportFitted) {
        return (
            <div className="h-dvh overflow-hidden text-bs-text-primary">
                <div className="mx-auto flex h-full max-w-screen-2xl flex-col px-4 pt-3 md:px-6 md:pt-4">
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        {children}
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh text-bs-text-primary">
            <div className="mx-auto flex min-h-dvh max-w-screen-2xl flex-col px-4 pt-3 md:px-6 md:pt-4">
                {children}
                <Footer />
            </div>
        </div>
    );
}

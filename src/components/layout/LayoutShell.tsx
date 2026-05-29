'use client';

import { usePathname } from '@/i18n/navigation';
import Footer from './Footer';

const FULL_SCREEN_ROUTES: string[] = [];

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => pathname.startsWith(r));

    if (isFullScreen) {
        return (
            <div className="min-h-dvh text-bs-text-primary">
                <div className="pt-6 md:pt-8">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh text-bs-text-primary">
            <div className="h-full">
                <div className="mx-auto max-w-screen-2xl px-4 pb-8 pt-8 md:px-6 md:pt-12">
                    {children}
                    <Footer />
                </div>
            </div>
        </div>
    );
}

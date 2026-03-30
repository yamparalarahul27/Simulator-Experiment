import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Providers from '../providers';
import AppBackground from '@/components/layout/AppBackground';
import LoadingScreen from '@/components/ui/LoadingScreen';
import AssistantModal from '@/components/ui/AssistantModal';
import { Toaster } from 'sonner';
import { LayoutShell } from '@/components/layout/LayoutShell';

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = (await import(`../../../messages/${locale}.json`)).default;

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
                <AppBackground />
                <LayoutShell>{children}</LayoutShell>
                <LoadingScreen />
                <AssistantModal />
            </Providers>
            <Toaster
                position="top-right"
                theme="system"
                closeButton
                expand={false}
                offset={24}
                toastOptions={{
                    style: {
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        color: 'white',
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '14px',
                        padding: '16px 20px',
                    },
                }}
            />
        </NextIntlClientProvider>
    );
}

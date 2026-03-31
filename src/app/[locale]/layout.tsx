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
                {/* <AssistantModal /> — temporarily disabled */}
            </Providers>
            <Toaster
                position="top-right"
                theme="system"
                closeButton
                expand={false}
                offset={24}
                toastOptions={{
                    style: {
                        background: 'var(--bs-card)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--bs-border)',
                        borderRadius: '0px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        color: 'var(--bs-text-primary)',
                        fontFamily: 'var(--font-geist-mono)',
                        fontSize: '14px',
                        padding: '16px 20px',
                    },
                }}
            />
        </NextIntlClientProvider>
    );
}

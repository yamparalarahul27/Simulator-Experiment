import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    matcher: [
        // Match all pathnames except:
        // - /api (API routes)
        // - /_next (Next.js internals)
        // - Static files (favicon, images, assets, etc.)
        '/((?!api|_next|assets|favicon\\.png|icon\\.png|Logo\\.png|.*\\..*).*)',
    ],
};

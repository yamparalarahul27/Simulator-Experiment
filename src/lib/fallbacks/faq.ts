import type { FAQItem, SupportPath } from '@/lib/types';

export const FALLBACK_FAQ_ITEMS: FAQItem[] = [
    {
        value: 'wallets',
        title: 'How do I switch between wallets?',
        body: 'Use the network selector in the navbar. You can connect multiple wallets and move between mock, devnet, or mainnet contexts while keeping your journal flow intact.',
    },
    {
        value: 'missing-trades',
        title: 'My trades are missing. What should I do?',
        body: 'Start with a re-sync from Trade History. If trades are still missing, import your CSV export and YDEX will normalize the records for analysis.',
    },
    {
        value: 'collaboration',
        title: 'Can I collaborate with teammates?',
        body: 'Shared workspaces are on the roadmap. For now, share exported snapshots or use read-only views for reviews.',
    },
];

export const FALLBACK_SUPPORT_PATHS: SupportPath[] = [
    {
        title: 'Quick Answers',
        description: 'Resolve common issues in seconds from FAQs and known fixes.',
    },
    {
        title: 'Guided Recovery',
        description: 'Get practical steps for sync, wallet, and simulator troubleshooting.',
    },
    {
        title: 'Direct Support',
        description: 'Reach out to Rahul directly when you need tailored help.',
    },
];
